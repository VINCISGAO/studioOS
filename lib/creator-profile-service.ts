import type { Creator } from "@/lib/types";
import type { CreatorProfileStore, StoredCreatorProfile } from "@/lib/creator-profile-types";
import { generateCreatorAiTags } from "@/lib/studioos/creator-ai-tags";
import { normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
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

export async function getStoredCreatorProfile(creatorId: string): Promise<StoredCreatorProfile | null> {
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
  const store = await readStore();
  const existing = store.profiles[creatorId];
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
    ai_tags,
    profile_completed_at: existing?.profile_completed_at ?? null,
    updated_at: new Date().toISOString()
  };

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
    country: profile.country,
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
