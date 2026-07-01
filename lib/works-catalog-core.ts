import { creatorWorks as seedWorks } from "@/lib/data";
import { getDeletedWorkIds, listPublishedWorksForCreator } from "@/lib/works-service";
import type { CreatorWork } from "@/lib/types";

type WorksQueryOptions = {
  /** Owner profile studio — includes hidden works. */
  ownerView?: boolean;
};

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
