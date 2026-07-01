import "server-only";

import { unstable_cache } from "next/cache";
import { creatorWorks as seedWorks } from "@/lib/data";
import { getDeletedWorkIds, listPublishedWorks } from "@/lib/works-service";
import { getWorksForCreator } from "@/lib/works-catalog-core";
import type { CreatorWork } from "@/lib/types";

export { getWorksForCreator };

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
