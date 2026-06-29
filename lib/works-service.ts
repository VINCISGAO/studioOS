import type { CreatorWork } from "@/lib/types";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";

type WorksStore = {
  works: CreatorWork[];
  deletedIds: string[];
};

const STORE_PATH = dataStorePath("works-store.json");

function emptyStore(): WorksStore {
  return { works: [], deletedIds: [] };
}

async function readStore(): Promise<WorksStore> {
  const parsed = await readDataJson<WorksStore | { works: CreatorWork[] }>(STORE_PATH, () => emptyStore());
  if (Array.isArray(parsed.works) && Array.isArray((parsed as WorksStore).deletedIds)) {
    return parsed as WorksStore;
  }
  return { works: parsed.works ?? [], deletedIds: [] };
}

async function writeStore(store: WorksStore) {
  await writeDataJson(STORE_PATH, store);
}

export async function publishWork(work: CreatorWork): Promise<CreatorWork> {
  const store = await readStore();
  store.deletedIds = store.deletedIds.filter((id) => id !== work.id);
  store.works = [{ ...work, hidden: work.hidden ?? false }, ...store.works.filter((item) => item.id !== work.id)];
  await writeStore(store);
  return work;
}

export async function listPublishedWorks(): Promise<CreatorWork[]> {
  const store = await readStore();
  return store.works;
}

export async function listPublishedWorksForCreator(creatorId: string): Promise<CreatorWork[]> {
  const store = await readStore();
  return store.works.filter((item) => item.creator_id === creatorId);
}

export async function setCreatorWorkHidden(
  creatorId: string,
  work: CreatorWork,
  hidden: boolean
): Promise<CreatorWork> {
  const store = await readStore();
  const index = store.works.findIndex((item) => item.id === work.id && item.creator_id === creatorId);
  if (index >= 0) {
    store.works[index] = { ...store.works[index], hidden };
    await writeStore(store);
    return store.works[index];
  }
  return work;
}

export async function deleteCreatorWork(creatorId: string, workId: string): Promise<void> {
  const store = await readStore();
  store.works = store.works.filter((item) => !(item.id === workId && item.creator_id === creatorId));
  if (!store.deletedIds.includes(workId)) {
    store.deletedIds.push(workId);
  }
  await writeStore(store);
}

export async function getDeletedWorkIds(): Promise<string[]> {
  const store = await readStore();
  return store.deletedIds;
}

export async function isWorkDeleted(workId: string): Promise<boolean> {
  const store = await readStore();
  return store.deletedIds.includes(workId);
}
