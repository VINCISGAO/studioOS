import { promises as fs } from "fs";
import path from "path";
import type { CreatorWork } from "@/lib/types";

type WorksStore = {
  works: CreatorWork[];
  deletedIds: string[];
};

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "works-store.json");

function emptyStore(): WorksStore {
  return { works: [], deletedIds: [] };
}

async function readStore(): Promise<WorksStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as WorksStore | { works: CreatorWork[] };
    if (Array.isArray(parsed.works) && Array.isArray((parsed as WorksStore).deletedIds)) {
      return parsed as WorksStore;
    }
    return { works: parsed.works ?? [], deletedIds: [] };
  } catch {
    const seeded = emptyStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function writeStore(store: WorksStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
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
  const normalized = { ...work, creator_id: creatorId, hidden };
  const index = store.works.findIndex((item) => item.id === work.id && item.creator_id === creatorId);

  if (index >= 0) {
    store.works[index] = { ...store.works[index], ...normalized, hidden };
  } else {
    store.works = [normalized, ...store.works.filter((item) => item.id !== work.id)];
  }

  store.deletedIds = store.deletedIds.filter((id) => id !== work.id);
  await writeStore(store);
  return normalized;
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
