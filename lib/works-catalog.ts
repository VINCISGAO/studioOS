import { unstable_cache } from "next/cache";
import { creatorWorks as seedWorks } from "@/lib/data";
import { getDeletedWorkIds, listPublishedWorks, listPublishedWorksForCreator } from "@/lib/works-service";
import type { CreatorWork } from "@/lib/types";

type WorksQueryOptions = {
  /** Owner profile studio — includes hidden works. */
  ownerView?: boolean;
};

function mergeWorks(published: CreatorWork[], deletedIds: Set<string>) {
  const publishedIds = new Set(published.map((work) => work.id));
  const seedRest = seedWorks.filter((work) => !publishedIds.has(work.id) && !deletedIds.has(work.id));

  return [...published, ...seedRest].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function loadAllCreatorWorks(): Promise<CreatorWork[]> {
  const [published, deletedIds] = await Promise.all([listPublishedWorks(), getDeletedWorkIds()]);
  return mergeWorks(
    published.filter((work) => !work.hidden),
    new Set(deletedIds)
  );
}

const getCachedCreatorWorks = unstable_cache(loadAllCreatorWorks, ["all-creator-works-v2"], {
  revalidate: 60
});

export async function getAllCreatorWorks(): Promise<CreatorWork[]> {
  return getCachedCreatorWorks();
}

export async function getFeaturedWorks(limit = 6): Promise<CreatorWork[]> {
  const works = await getAllCreatorWorks();
  return works.slice(0, limit);
}

export async function getWorksForCreator(
  creatorId: string,
  options: WorksQueryOptions = {}
): Promise<CreatorWork[]> {
  const [published, deletedIds] = await Promise.all([
    listPublishedWorksForCreator(creatorId),
    getDeletedWorkIds()
  ]);
  const deleted = new Set(deletedIds);
  const byId = new Map(
    seedWorks.filter((work) => work.creator_id === creatorId && !deleted.has(work.id)).map((work) => [work.id, work])
  );

  for (const work of published) {
    if (!deleted.has(work.id)) {
      byId.set(work.id, work);
    }
  }

  let works = [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (!options.ownerView) {
    works = works.filter((work) => !work.hidden);
  }

  return works;
}
