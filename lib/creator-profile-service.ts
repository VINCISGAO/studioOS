import type { Creator } from "@/lib/types";
import type { CreatorProfileStore, StoredCreatorProfile } from "@/lib/creator-profile-types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import { normalizeCountryCode } from "@/lib/geo/country";
import { generateCreatorAiTags } from "@/lib/studioos/creator-ai-tags";
import { normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import type { CreatorWork } from "@/lib/types";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";

const STORE_PATH = dataStorePath("creator-profile-store.json");

function emptyStore(): CreatorProfileStore {
  return { profiles: {} };
}

async function readStore(): Promise<CreatorProfileStore> {
  return readDataJson(STORE_PATH, () => emptyStore());
}

async function writeStore(store: CreatorProfileStore) {
  await writeDataJson(STORE_PATH, store);
}

function profileJson(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function getDatabaseCreatorProfile(creatorId: string): Promise<StoredCreatorProfile | null> {
  if (!hasDatabaseUrl()) return null;

  const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
  if (!profileId) return null;

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: profileId },
    include: { user: { select: { avatarUrl: true } } }
  });
  if (!profile) return null;

  const dna = profileJson(profile.creatorDnaJson);
  const minBudget = profile.minBudget == null ? 0 : Number(profile.minBudget);

  return {
    creator_id: creatorId,
    name: profile.displayName,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.user.avatarUrl ?? (typeof dna.avatar_url === "string" ? dna.avatar_url : undefined),
    cover_url: profile.portfolioCover ?? (typeof dna.cover_url === "string" ? dna.cover_url : undefined),
    country: normalizeCountryCode(profile.country ?? "") || "",
    city: profile.city ?? (typeof dna.city === "string" ? dna.city : ""),
    portfolio_url: profile.portfolioUrl ?? stringValue(dna.portfolio_url),
    specialties: stringList(profile.specialtiesJson ?? dna.specialties),
    expertise_domains: stringList(profile.expertiseDomainsJson ?? dna.expertise_domains),
    tools: stringList(profile.toolsJson ?? dna.tools),
    delivery_speed: stringValue(dna.delivery_speed),
    min_project_budget_usd: normalizeCreatorMinBudget(numberValue(dna.min_project_budget_usd, minBudget)),
    ai_tags: stringList(dna.ai_tags),
    profile_completed_at: profile.profileCompletedAt?.toISOString() ?? (typeof dna.profile_completed_at === "string" ? dna.profile_completed_at : null),
    updated_at: profile.updatedAt.toISOString()
  };
}

async function saveDatabaseCreatorProfile(
  creatorId: string,
  profile: StoredCreatorProfile
): Promise<StoredCreatorProfile | null> {
  if (!hasDatabaseUrl()) return null;

  const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
  if (!profileId) return null;

  const existing = await prisma.creatorProfile.findUnique({ where: { id: profileId } });
  const existingDna = profileJson(existing?.creatorDnaJson);
  const nextAvatarUrl =
    profile.avatar_url !== undefined
      ? profile.avatar_url
      : typeof existingDna.avatar_url === "string"
        ? existingDna.avatar_url
        : null;
  const creatorDnaJson = {
    ...existingDna,
    avatar_url: nextAvatarUrl,
    cover_url: profile.cover_url ?? (typeof existingDna.cover_url === "string" ? existingDna.cover_url : null),
    portfolio_url: profile.portfolio_url,
    specialties: profile.specialties,
    expertise_domains: profile.expertise_domains,
    tools: profile.tools,
    delivery_speed: profile.delivery_speed,
    min_project_budget_usd: profile.min_project_budget_usd,
    ai_tags: profile.ai_tags,
    profile_completed_at: profile.profile_completed_at,
    city: profile.city
  };

  const updated = await prisma.creatorProfile.update({
    where: { id: profileId },
    data: {
      displayName: profile.name,
      headline: profile.headline || null,
      bio: profile.bio || null,
      country: normalizeCountryCode(profile.country) || null,
      city: profile.city?.trim() || null,
      portfolioUrl: profile.portfolio_url || null,
      specialtiesJson: asInputJson(profile.specialties),
      toolsJson: asInputJson(profile.tools),
      expertiseDomainsJson: asInputJson(profile.expertise_domains),
      profileCompletedAt: profile.profile_completed_at ? new Date(profile.profile_completed_at) : null,
      minBudget: profile.min_project_budget_usd || null,
      portfolioCover: profile.cover_url || null,
      creatorDnaJson: asInputJson(creatorDnaJson)
    },
    include: { user: { select: { avatarUrl: true } } }
  });

  if (profile.avatar_url !== undefined) {
    await prisma.user.update({
      where: { id: updated.userId },
      data: { avatarUrl: profile.avatar_url || null }
    });
  }

  return {
    ...profile,
    avatar_url: nextAvatarUrl ?? undefined,
    updated_at: updated.updatedAt.toISOString()
  };
}

export async function getStoredCreatorProfile(creatorId: string): Promise<StoredCreatorProfile | null> {
  const databaseProfile = await getDatabaseCreatorProfile(creatorId);
  if (databaseProfile) return databaseProfile;

  const store = await readStore();
  return store.profiles[creatorId] ?? null;
}

export function isCreatorProfileComplete(profile: StoredCreatorProfile | null | undefined) {
  return Boolean(profile?.profile_completed_at);
}

export async function saveCreatorProfileDraft(
  creatorId: string,
  input: Omit<StoredCreatorProfile, "creator_id" | "ai_tags" | "profile_completed_at" | "updated_at">,
  works: CreatorWork[]
): Promise<StoredCreatorProfile> {
  const existing = await getStoredCreatorProfile(creatorId);
  const ai_tags = generateCreatorAiTags({
    bio: input.bio,
    headline: input.headline,
    specialties: input.specialties,
    expertise_domains: input.expertise_domains,
    tools: input.tools,
    works
  });

  const profile: StoredCreatorProfile = {
    creator_id: creatorId,
    ...input,
    min_project_budget_usd: normalizeCreatorMinBudget(
      input.min_project_budget_usd ?? existing?.min_project_budget_usd ?? 0
    ),
    avatar_url: input.avatar_url ?? existing?.avatar_url,
    cover_url: input.cover_url ?? existing?.cover_url,
    ai_tags,
    profile_completed_at: existing?.profile_completed_at ?? null,
    updated_at: new Date().toISOString()
  };

  const databaseProfile = await saveDatabaseCreatorProfile(creatorId, profile);
  if (databaseProfile) {
    return databaseProfile;
  }

  const store = await readStore();
  store.profiles[creatorId] = profile;
  await writeStore(store);
  return profile;
}

export async function completeCreatorProfile(
  creatorId: string,
  input: Omit<StoredCreatorProfile, "creator_id" | "ai_tags" | "profile_completed_at" | "updated_at">,
  works: CreatorWork[]
): Promise<{ ok: true; profile: StoredCreatorProfile } | { ok: false; error: string }> {
  if (!input.name.trim() || !input.headline.trim() || !input.bio.trim()) {
    return { ok: false, error: "missing-core-fields" };
  }
  if (!input.specialties.length || !input.expertise_domains.length) {
    return { ok: false, error: "missing-expertise" };
  }

  const ai_tags = generateCreatorAiTags({
    bio: input.bio,
    headline: input.headline,
    specialties: input.specialties,
    expertise_domains: input.expertise_domains,
    tools: input.tools,
    works
  });

  const profile: StoredCreatorProfile = {
    creator_id: creatorId,
    ...input,
    min_project_budget_usd: normalizeCreatorMinBudget(input.min_project_budget_usd ?? 0),
    ai_tags,
    profile_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const databaseProfile = await saveDatabaseCreatorProfile(creatorId, profile);
  if (databaseProfile) {
    return { ok: true, profile: databaseProfile };
  }

  const store = await readStore();
  store.profiles[creatorId] = profile;
  await writeStore(store);
  return { ok: true, profile };
}

export async function updateCreatorAvatarUrl(
  creatorId: string,
  avatarUrl: string,
  base: Creator,
  works: CreatorWork[]
): Promise<StoredCreatorProfile> {
  const existing = await getStoredCreatorProfile(creatorId);
  return saveCreatorProfileDraft(
    creatorId,
    {
      name: existing?.name ?? base.name,
      headline: existing?.headline ?? base.headline ?? "",
      bio: existing?.bio ?? base.bio ?? "",
      avatar_url: avatarUrl,
      cover_url: existing?.cover_url ?? base.cover_url,
      country: existing?.country ?? base.country,
      portfolio_url: existing?.portfolio_url ?? base.portfolio_url,
      specialties: existing?.specialties ?? base.specialties,
      expertise_domains: existing?.expertise_domains ?? base.expertise_domains ?? [],
      tools: existing?.tools ?? base.tools,
      delivery_speed: existing?.delivery_speed ?? base.delivery_speed,
      min_project_budget_usd: normalizeCreatorMinBudget(
        existing?.min_project_budget_usd ?? base.min_project_budget_usd ?? 0
      )
    },
    works
  );
}

export async function updateCreatorCoverUrl(
  creatorId: string,
  coverUrl: string,
  base: Creator,
  works: CreatorWork[]
): Promise<StoredCreatorProfile> {
  const existing = await getStoredCreatorProfile(creatorId);
  return saveCreatorProfileDraft(
    creatorId,
    {
      name: existing?.name ?? base.name,
      headline: existing?.headline ?? base.headline ?? "",
      bio: existing?.bio ?? base.bio ?? "",
      avatar_url: existing?.avatar_url ?? base.avatar_url,
      cover_url: coverUrl,
      country: existing?.country ?? base.country,
      portfolio_url: existing?.portfolio_url ?? base.portfolio_url,
      specialties: existing?.specialties ?? base.specialties,
      expertise_domains: existing?.expertise_domains ?? base.expertise_domains ?? [],
      tools: existing?.tools ?? base.tools,
      delivery_speed: existing?.delivery_speed ?? base.delivery_speed,
      min_project_budget_usd: normalizeCreatorMinBudget(
        existing?.min_project_budget_usd ?? base.min_project_budget_usd ?? 0
      )
    },
    works
  );
}

export function applyStoredProfileToCreator(base: Creator, profile: StoredCreatorProfile | null): Creator {
  if (!profile) {
    return base;
  }

  return {
    ...base,
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    cover_url: profile.cover_url,
    country: profile.country,
    city: profile.city,
    portfolio_url: profile.portfolio_url,
    specialties: profile.specialties,
    tools: profile.tools,
    delivery_speed: profile.delivery_speed,
    min_project_budget_usd: normalizeCreatorMinBudget(profile.min_project_budget_usd ?? 0),
    ai_tags: profile.ai_tags,
    expertise_domains: profile.expertise_domains,
    profile_completed_at: profile.profile_completed_at
  };
}
