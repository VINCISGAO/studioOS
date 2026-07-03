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
    profile_completed_at: null,
    showcase_ads: [],
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
    "company_name" | "display_name" | "headline" | "bio" | "website" | "industry" | "logo_url"
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
}): Promise<StoredBrandProfile> {
  const normalized = input.client_email.toLowerCase();
  const databaseProfile = await getPrismaBrandProfileByEmail(normalized);
  if (databaseProfile) {
    const updated = await syncPrismaBrandProfile(normalized, {
      ...databaseProfile,
      company_name: input.company_name || databaseProfile.company_name,
      display_name: input.display_name ?? databaseProfile.display_name,
      headline: input.headline || databaseProfile.headline,
      bio: input.bio || databaseProfile.bio,
      website: input.website ?? databaseProfile.website,
      industry: input.industry ?? databaseProfile.industry,
      logo_url: databaseProfile.logo_url
    });
    return updated ?? databaseProfile;
  }

  const store = await readStore();
  const existing = Object.values(store.profiles).find((item) => item.client_email === normalized);

  if (existing) {
    existing.company_name = input.company_name || existing.company_name;
    if (input.display_name) existing.display_name = input.display_name;
    if (input.industry) existing.industry = input.industry;
    if (input.website) existing.website = input.website;
    if (input.headline && !existing.headline) existing.headline = input.headline;
    if (input.bio && !existing.bio) existing.bio = input.bio;
    existing.updated_at = nowIso();
    store.profiles[existing.id] = existing;
    await writeStore(store);
    const updated = await syncPrismaBrandProfile(existing.client_email, existing);
    if (updated) return updated;
    return existing;
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
  const profile = await getOrCreateBrandProfile({
    client_email: clientEmail,
    company_name: input.company_name
  });

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

export async function syncBrandShowcaseFromOrders(clientEmail: string): Promise<StoredBrandProfile> {
  const profile = await getOrCreateBrandProfile({
    client_email: clientEmail,
    company_name: clientEmail.split("@")[0] ?? "Brand"
  });

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
  store.profiles[next.id] = next;
  await writeStore(store);
  return next;
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

  return getOrCreateBrandProfile({
    client_email: clientEmail,
    company_name: input.company_name,
    display_name: input.company_name,
    website: input.product_url ?? "",
    industry: input.industry ?? "",
    headline,
    bio: input.campaign_goal ?? ""
  });
}
