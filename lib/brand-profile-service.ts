import { writeDataJson, dataStorePath, readDataJson } from "@/lib/serverless-store";
import { creators } from "@/lib/data";
import type { BrandProfileStore, BrandShowcaseAd, StoredBrandProfile } from "@/lib/brand-profile-types";
import { getDeliverables, listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

const STORE_PATH = dataStorePath("brand-profile-store.json");

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function brandProfileIdFromEmail(email: string): string {
  const local = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ?? "user";
  return `brand_${local}`;
}

function emptyStore(): BrandProfileStore {
  return { profiles: {} };
}

function parseBrandShowcaseAds(value: unknown): BrandShowcaseAd[] {
  if (!Array.isArray(value)) return [];
  const ads: BrandShowcaseAd[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const raw = item as Record<string, unknown>;
    const id = String(raw.id ?? "").trim();
    const title = String(raw.title ?? "").trim();
    const videoUrl = String(raw.video_url ?? "").trim();
    if (!id || !title || !videoUrl) continue;
    ads.push({
      id,
      title,
      video_url: videoUrl,
      thumbnail_url: String(raw.thumbnail_url ?? videoUrl),
      creator_id: String(raw.creator_id ?? "brand"),
      creator_name: String(raw.creator_name ?? "Brand"),
      project_id: typeof raw.project_id === "string" ? raw.project_id : null,
      order_id: typeof raw.order_id === "string" ? raw.order_id : null,
      platform: typeof raw.platform === "string" ? raw.platform : undefined,
      published_at: String(raw.published_at ?? nowIso()),
      visible: raw.visible !== false
    });
  }
  return ads;
}

async function readStore(): Promise<BrandProfileStore> {
  return readDataJson(STORE_PATH, () => emptyStore());
}

async function writeStore(store: BrandProfileStore) {
  await writeDataJson(STORE_PATH, store);
}

function mapPrismaBrandProfileToStored(input: {
  user: { email: string; fullName: string | null };
  profile: {
    id: string;
    companyName: string;
    website: string | null;
    logoUrl: string | null;
    industry: string | null;
    brandDescription: string | null;
    brandDnaJson: unknown;
    updatedAt: Date;
  };
}): StoredBrandProfile {
  const { user, profile } = input;
  const dna =
    typeof profile.brandDnaJson === "object" && profile.brandDnaJson !== null && !Array.isArray(profile.brandDnaJson)
      ? (profile.brandDnaJson as Record<string, unknown>)
      : {};
  const archive =
    typeof dna.profile_archive === "object" && dna.profile_archive !== null && !Array.isArray(dna.profile_archive)
      ? (dna.profile_archive as Record<string, unknown>)
      : {};
  return {
    id: profile.id,
    client_email: user.email.toLowerCase(),
    company_name: profile.companyName,
    display_name: String(archive.display_name ?? user.fullName ?? profile.companyName),
    headline: String(archive.headline ?? ""),
    bio: String(archive.bio ?? profile.brandDescription ?? ""),
    website: profile.website ?? "",
    industry: profile.industry ?? "",
    logo_url: profile.logoUrl ?? "",
    cover_url: String(archive.cover_url ?? ""),
    profile_completed_at: null,
    showcase_ads: parseBrandShowcaseAds(dna.showcase_ads),
    updated_at: profile.updatedAt.toISOString()
  };
}

async function getPrismaBrandProfileByEmail(email: string): Promise<StoredBrandProfile | null> {
  if (!hasDatabaseUrl()) return null;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { brandProfile: true }
  });
  const profile = user?.brandProfile;
  if (!user || !profile) return null;
  return mapPrismaBrandProfileToStored({ user, profile });
}

async function getPrismaBrandProfileById(id: string): Promise<StoredBrandProfile | null> {
  if (!hasDatabaseUrl()) return null;
  const profile = await prisma.brandProfile.findUnique({
    where: { id },
    include: { user: true }
  });
  if (!profile) return null;
  return mapPrismaBrandProfileToStored({ user: profile.user, profile });
}

async function syncPrismaBrandProfile(
  clientEmail: string,
  input: Pick<
    StoredBrandProfile,
    "company_name" | "display_name" | "headline" | "bio" | "website" | "industry" | "logo_url" | "cover_url"
  >
) {
  if (!hasDatabaseUrl()) return null;
  const user = await prisma.user.findUnique({
    where: { email: clientEmail.toLowerCase() },
    include: { brandProfile: true }
  });
  if (!user) return null;
  const current =
    typeof user.brandProfile?.brandDnaJson === "object" &&
    user.brandProfile.brandDnaJson !== null &&
    !Array.isArray(user.brandProfile.brandDnaJson)
      ? (user.brandProfile.brandDnaJson as Record<string, unknown>)
      : {};
  const profileArchive = {
    company_name: input.company_name,
    display_name: input.display_name,
    headline: input.headline,
    bio: input.bio,
    website: input.website,
    industry: input.industry,
    logo_url: input.logo_url,
    cover_url: input.cover_url,
    archived_at: nowIso()
  };
  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: input.display_name || input.company_name }
  });
  await prisma.brandProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: input.company_name,
      website: input.website || null,
      logoUrl: input.logo_url || null,
      industry: input.industry || null,
      brandDescription: input.bio || null,
      brandDnaJson: asInputJson({
        ...current,
        profile_archive: profileArchive
      })
    },
    update: {
      companyName: input.company_name,
      website: input.website || null,
      logoUrl: input.logo_url || null,
      industry: input.industry || null,
      brandDescription: input.bio || null,
      brandDnaJson: asInputJson({
        ...current,
        profile_archive: profileArchive
      })
    }
  });
  return getPrismaBrandProfileByEmail(clientEmail);
}

async function syncPrismaBrandLogoArchive(
  clientEmail: string,
  input: {
    logoUrl: string;
    fileKey?: string;
    storageProvider?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }
) {
  if (!hasDatabaseUrl()) return;
  const user = await prisma.user.findUnique({
    where: { email: clientEmail.toLowerCase() },
    include: { brandProfile: true }
  });
  const profile = user?.brandProfile;
  if (!user || !profile) return;
  const current =
    typeof profile.brandDnaJson === "object" && profile.brandDnaJson !== null && !Array.isArray(profile.brandDnaJson)
      ? (profile.brandDnaJson as Record<string, unknown>)
      : {};
  const currentArchive =
    typeof current.asset_archive === "object" && current.asset_archive !== null && !Array.isArray(current.asset_archive)
      ? (current.asset_archive as Record<string, unknown>)
      : {};
  const logoHistory = Array.isArray(currentArchive.logos)
    ? (currentArchive.logos as Record<string, unknown>[])
    : [];
  const logoArchive: Record<string, string | number> = {
    url: input.logoUrl,
    archived_at: nowIso()
  };
  if (input.fileKey) logoArchive.file_key = input.fileKey;
  if (input.storageProvider) logoArchive.storage_provider = input.storageProvider;
  if (input.fileName) logoArchive.file_name = input.fileName;
  if (input.mimeType) logoArchive.mime_type = input.mimeType;
  if (input.sizeBytes !== undefined) logoArchive.size_bytes = input.sizeBytes;

  await prisma.brandProfile.update({
    where: { userId: user.id },
    data: {
      logoUrl: input.logoUrl,
      brandDnaJson: asInputJson({
        ...current,
        asset_archive: {
          ...currentArchive,
          logo: logoArchive,
          logos: [logoArchive, ...logoHistory]
        }
      })
    }
  });
}

async function syncPrismaBrandCoverArchive(
  clientEmail: string,
  input: {
    coverUrl: string;
    fileKey?: string;
    storageProvider?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }
) {
  if (!hasDatabaseUrl()) return;
  const user = await prisma.user.findUnique({
    where: { email: clientEmail.toLowerCase() },
    include: { brandProfile: true }
  });
  const profile = user?.brandProfile;
  if (!user || !profile) return;
  const current =
    typeof profile.brandDnaJson === "object" && profile.brandDnaJson !== null && !Array.isArray(profile.brandDnaJson)
      ? (profile.brandDnaJson as Record<string, unknown>)
      : {};
  const currentArchive =
    typeof current.asset_archive === "object" && current.asset_archive !== null && !Array.isArray(current.asset_archive)
      ? (current.asset_archive as Record<string, unknown>)
      : {};
  const coverHistory = Array.isArray(currentArchive.covers)
    ? (currentArchive.covers as Record<string, unknown>[])
    : [];
  const coverArchive: Record<string, string | number> = {
    url: input.coverUrl,
    archived_at: nowIso()
  };
  if (input.fileKey) coverArchive.file_key = input.fileKey;
  if (input.storageProvider) coverArchive.storage_provider = input.storageProvider;
  if (input.fileName) coverArchive.file_name = input.fileName;
  if (input.mimeType) coverArchive.mime_type = input.mimeType;
  if (input.sizeBytes !== undefined) coverArchive.size_bytes = input.sizeBytes;

  const profileArchive =
    typeof current.profile_archive === "object" &&
    current.profile_archive !== null &&
    !Array.isArray(current.profile_archive)
      ? (current.profile_archive as Record<string, unknown>)
      : {};

  await prisma.brandProfile.update({
    where: { userId: user.id },
    data: {
      brandDnaJson: asInputJson({
        ...current,
        profile_archive: {
          ...profileArchive,
          cover_url: input.coverUrl
        },
        asset_archive: {
          ...currentArchive,
          cover: coverArchive,
          covers: [coverArchive, ...coverHistory]
        }
      })
    }
  });
}

async function syncPrismaBrandShowcaseAds(clientEmail: string, showcaseAds: BrandShowcaseAd[]) {
  if (!hasDatabaseUrl()) return;
  const user = await prisma.user.findUnique({
    where: { email: clientEmail.toLowerCase() },
    include: { brandProfile: true }
  });
  const profile = user?.brandProfile;
  if (!user || !profile) return;
  const current =
    typeof profile.brandDnaJson === "object" && profile.brandDnaJson !== null && !Array.isArray(profile.brandDnaJson)
      ? (profile.brandDnaJson as Record<string, unknown>)
      : {};

  await prisma.brandProfile.update({
    where: { userId: user.id },
    data: {
      brandDnaJson: asInputJson({
        ...current,
        showcase_ads: showcaseAds
      })
    }
  });
}

export function isBrandProfileComplete(profile: StoredBrandProfile | null | undefined) {
  return Boolean(profile?.profile_completed_at && profile.headline.trim() && profile.bio.trim());
}

export async function getBrandProfileByEmail(email: string): Promise<StoredBrandProfile | null> {
  const databaseProfile = await getPrismaBrandProfileByEmail(email);
  if (databaseProfile) return databaseProfile;

  const store = await readStore();
  const normalized = email.toLowerCase();
  return Object.values(store.profiles).find((item) => item.client_email === normalized) ?? null;
}

export async function getBrandProfileById(id: string): Promise<StoredBrandProfile | null> {
  const databaseProfile = await getPrismaBrandProfileById(id);
  if (databaseProfile) return databaseProfile;

  const store = await readStore();
  return store.profiles[id] ?? null;
}

export async function getOrCreateBrandProfile(input: {
  client_email: string;
  company_name: string;
  display_name?: string;
  industry?: string;
  website?: string;
  headline?: string;
  bio?: string;
  /** When true (default), keep saved profile fields over seed defaults like email local-part. */
  preferExisting?: boolean;
}): Promise<StoredBrandProfile> {
  const normalized = input.client_email.toLowerCase();
  const preferExisting = input.preferExisting !== false;
  const pick = (saved: string, incoming: string) =>
    preferExisting ? saved.trim() || incoming.trim() : incoming.trim() || saved.trim();

  const databaseProfile = await getPrismaBrandProfileByEmail(normalized);
  if (databaseProfile) {
    const merged = {
      ...databaseProfile,
      company_name: pick(databaseProfile.company_name, input.company_name),
      display_name: pick(databaseProfile.display_name, input.display_name ?? input.company_name),
      headline: pick(databaseProfile.headline, input.headline ?? ""),
      bio: pick(databaseProfile.bio, input.bio ?? ""),
      website: pick(databaseProfile.website, input.website ?? ""),
      industry: pick(databaseProfile.industry, input.industry ?? ""),
      logo_url: databaseProfile.logo_url,
      cover_url: databaseProfile.cover_url
    };
    const changed =
      merged.company_name !== databaseProfile.company_name ||
      merged.display_name !== databaseProfile.display_name ||
      merged.headline !== databaseProfile.headline ||
      merged.bio !== databaseProfile.bio ||
      merged.website !== databaseProfile.website ||
      merged.industry !== databaseProfile.industry;
    if (!changed) {
      return databaseProfile;
    }
    const updated = await syncPrismaBrandProfile(normalized, merged);
    return updated ?? merged;
  }

  const store = await readStore();
  const existing = Object.values(store.profiles).find((item) => item.client_email === normalized);

  if (existing) {
    const merged = {
      ...existing,
      company_name: pick(existing.company_name, input.company_name),
      display_name: pick(existing.display_name, input.display_name ?? input.company_name),
      industry: pick(existing.industry, input.industry ?? ""),
      website: pick(existing.website, input.website ?? ""),
      headline: pick(existing.headline, input.headline ?? ""),
      bio: pick(existing.bio, input.bio ?? "")
    };
    const changed =
      merged.company_name !== existing.company_name ||
      merged.display_name !== existing.display_name ||
      merged.industry !== existing.industry ||
      merged.website !== existing.website ||
      merged.headline !== existing.headline ||
      merged.bio !== existing.bio;
    if (changed) {
      merged.updated_at = nowIso();
      store.profiles[existing.id] = merged;
      await writeStore(store);
      const updated = await syncPrismaBrandProfile(merged.client_email, merged);
      if (updated) return updated;
    }
    return merged;
  }

  const profile: StoredBrandProfile = {
    id: brandProfileIdFromEmail(normalized),
    client_email: normalized,
    company_name: input.company_name,
    display_name: input.display_name ?? input.company_name,
    headline: input.headline ?? "",
    bio: input.bio ?? "",
    website: input.website ?? "",
    industry: input.industry ?? "",
    logo_url: "",
    cover_url: "",
    profile_completed_at: null,
    showcase_ads: [],
    updated_at: nowIso()
  };

  store.profiles[profile.id] = profile;
  await writeStore(store);
  const databaseCreated = await syncPrismaBrandProfile(profile.client_email, profile);
  if (databaseCreated) return databaseCreated;
  return profile;
}

export async function saveBrandProfile(
  clientEmail: string,
  input: {
    company_name: string;
    display_name: string;
    headline: string;
    bio: string;
    website: string;
    industry: string;
    markComplete?: boolean;
  }
): Promise<StoredBrandProfile> {
  const existing = await getBrandProfileByEmail(clientEmail);
  const profile =
    existing ??
    (await getOrCreateBrandProfile({
      client_email: clientEmail,
      company_name: input.company_name,
      preferExisting: false
    }));

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    company_name: input.company_name.trim() || profile.company_name,
    display_name: input.display_name.trim() || input.company_name.trim() || profile.display_name,
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    website: input.website.trim(),
    industry: input.industry.trim(),
    profile_completed_at: input.markComplete ? profile.profile_completed_at ?? nowIso() : profile.profile_completed_at,
    updated_at: nowIso()
  };

  const updated = await syncPrismaBrandProfile(next.client_email, next);
  if (updated) return updated;

  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
}

export async function updateBrandLogoUrl(
  clientEmail: string,
  logoUrl: string,
  asset?: {
    fileKey?: string;
    storageProvider?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }
): Promise<StoredBrandProfile | null> {
  const profile = await getBrandProfileByEmail(clientEmail);
  if (!profile) return null;

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    logo_url: logoUrl,
    updated_at: nowIso()
  };
  const updated = await syncPrismaBrandProfile(next.client_email, next);
  await syncPrismaBrandLogoArchive(next.client_email, {
    logoUrl,
    fileKey: asset?.fileKey,
    storageProvider: asset?.storageProvider,
    fileName: asset?.fileName,
    mimeType: asset?.mimeType,
    sizeBytes: asset?.sizeBytes
  });
  if (updated) return updated;

  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
}

export async function updateBrandCoverUrl(
  clientEmail: string,
  coverUrl: string,
  asset?: {
    fileKey?: string;
    storageProvider?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }
): Promise<StoredBrandProfile | null> {
  const profile = await getBrandProfileByEmail(clientEmail);
  if (!profile) return null;

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    cover_url: coverUrl,
    updated_at: nowIso()
  };
  const updated = await syncPrismaBrandProfile(next.client_email, next);
  await syncPrismaBrandCoverArchive(next.client_email, {
    coverUrl,
    fileKey: asset?.fileKey,
    storageProvider: asset?.storageProvider,
    fileName: asset?.fileName,
    mimeType: asset?.mimeType,
    sizeBytes: asset?.sizeBytes
  });
  if (updated) return { ...updated, cover_url: coverUrl };

  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
}

export async function syncBrandShowcaseFromOrders(clientEmail: string): Promise<StoredBrandProfile> {
  const existing = await getBrandProfileByEmail(clientEmail);
  const profile =
    existing ??
    (await getOrCreateBrandProfile({
      client_email: clientEmail,
      company_name: clientEmail.split("@")[0] ?? "Brand"
    }));

  const orders = await listOrdersForClient(clientEmail);
  const projects = await listProjectsForClient(clientEmail);
  const projectById = Object.fromEntries(projects.map((item) => [item.id, item]));
  const existingKeys = new Set(
    profile.showcase_ads.map((item) => `${item.order_id ?? ""}:${item.video_url}`)
  );

  const additions: BrandShowcaseAd[] = [];

  for (const order of orders) {
    if (!["review", "revision", "completed"].includes(order.status)) continue;
    const deliverables = await getDeliverables(order.id);
    const latest = deliverables[deliverables.length - 1];
    if (!latest) continue;

    const key = `${order.id}:${latest.file_url}`;
    if (existingKeys.has(key)) continue;

    const creator = creators.find((item) => item.id === order.creator_id);
    const project = order.project_id ? projectById[order.project_id] : null;

    additions.push({
      id: createId("bad"),
      title: project?.title ?? order.title ?? order.company_name,
      video_url: latest.file_url,
      thumbnail_url: latest.thumbnail_url || latest.file_url,
      creator_id: order.creator_id,
      creator_name: creator?.name ?? "Studio",
      project_id: order.project_id,
      order_id: order.id,
      platform: project?.target_platform,
      published_at: latest.created_at,
      visible: order.status === "completed"
    });
    existingKeys.add(key);
  }

  if (!additions.length) {
    return profile;
  }

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    showcase_ads: [...additions, ...profile.showcase_ads],
    updated_at: nowIso()
  };
  await syncPrismaBrandShowcaseAds(next.client_email, next.showcase_ads);
  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
}

export async function addBrandShowcaseVideo(
  clientEmail: string,
  input: {
    title: string;
    video_url: string;
    thumbnail_url?: string;
    platform?: string;
  }
): Promise<{ profile: StoredBrandProfile; ad: BrandShowcaseAd }> {
  const profile =
    (await getBrandProfileByEmail(clientEmail)) ??
    (await getOrCreateBrandProfile({
      client_email: clientEmail,
      company_name: clientEmail.split("@")[0] ?? "Brand"
    }));

  const ad: BrandShowcaseAd = {
    id: createId("bad"),
    title: input.title.trim() || "Brand showcase video",
    video_url: input.video_url,
    thumbnail_url: input.thumbnail_url?.trim() || input.video_url,
    creator_id: "brand",
    creator_name: profile.display_name || profile.company_name,
    project_id: null,
    order_id: null,
    platform: input.platform?.trim() || undefined,
    published_at: nowIso(),
    visible: true
  };

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    showcase_ads: [ad, ...profile.showcase_ads.filter((item) => item.video_url !== ad.video_url)],
    updated_at: nowIso()
  };
  await syncPrismaBrandShowcaseAds(next.client_email, next.showcase_ads);
  store.profiles[next.id] = next;
  await writeStore(store);
  return { profile: next, ad };
}

export async function setBrandShowcaseVisibility(
  clientEmail: string,
  adId: string,
  visible: boolean
): Promise<StoredBrandProfile | null> {
  const profile = await getBrandProfileByEmail(clientEmail);
  if (!profile) return null;

  const store = await readStore();
  const next: StoredBrandProfile = {
    ...profile,
    showcase_ads: profile.showcase_ads.map((item) => (item.id === adId ? { ...item, visible } : item)),
    updated_at: nowIso()
  };
  await syncPrismaBrandShowcaseAds(next.client_email, next.showcase_ads);
  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
}

export async function upsertBrandProfileFromBrief(
  clientEmail: string,
  input: {
    company_name: string;
    product_name?: string;
    product_url?: string;
    industry?: string;
    campaign_goal?: string;
  }
): Promise<StoredBrandProfile> {
  const headline =
    input.campaign_goal?.slice(0, 120) ??
    (input.product_name ? `${input.product_name} 广告推广` : "");

  // Brand identity is owned by the profile editor — campaign brief must never overwrite saved names.
  return getOrCreateBrandProfile({
    client_email: clientEmail,
    company_name: input.company_name,
    display_name: input.company_name,
    website: input.product_url ?? "",
    industry: input.industry ?? "",
    headline,
    bio: input.campaign_goal ?? "",
    preferExisting: true
  });
}
