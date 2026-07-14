import type { Creator, CreatorWork } from "@/lib/types";

export type CreatorProfileDraft = Pick<
  Creator,
  | "name"
  | "headline"
  | "bio"
  | "avatar_url"
  | "cover_url"
  | "country"
  | "city"
  | "portfolio_url"
  | "specialties"
  | "tools"
  | "delivery_speed"
  | "min_project_budget_usd"
>;

export function profileStorageKey(creatorId: string) {
  return `studioos:creator:${creatorId}:profile`;
}

export function worksStorageKey(creatorId: string) {
  return `studioos:creator:${creatorId}:works`;
}

export function readProfileDraft(creatorId: string): Partial<CreatorProfileDraft> | null {
  if (typeof window === "undefined") {
    return null;
  }
  window.localStorage.removeItem(profileStorageKey(creatorId));
  return null;

}

export function writeProfileDraft(creatorId: string, _profile: CreatorProfileDraft) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(profileStorageKey(creatorId));
  }
}

export function readWorksDraft(creatorId: string): CreatorWork[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  window.localStorage.removeItem(worksStorageKey(creatorId));
  return null;

}

export function writeWorksDraft(creatorId: string, _works: CreatorWork[]) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(worksStorageKey(creatorId));
  }
}

export function mergeCreatorProfile(base: Creator, draft: Partial<CreatorProfileDraft> | null): Creator {
  if (!draft) {
    return base;
  }

  return {
    ...base,
    ...draft,
    specialties: draft.specialties ?? base.specialties,
    tools: draft.tools ?? base.tools,
    avatar_url: draft.avatar_url ?? base.avatar_url,
    cover_url: draft.cover_url ?? base.cover_url
  };
}

export function mergeCreatorWorks(baseWorks: CreatorWork[], draftWorks: CreatorWork[] | null) {
  if (!draftWorks?.length) {
    return baseWorks;
  }

  const byId = new Map(baseWorks.map((work) => [work.id, work]));
  for (const work of draftWorks) {
    byId.set(work.id, work);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createWorkId() {
  return `work_${Date.now()}`;
}
