import type { CreatorWork } from "@/lib/types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import {
  resolveCreatorProfileIdForLegacyId,
  resolveLegacyCreatorIdForProfile
} from "@/features/matching/invitation-creator-bridge";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";

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

type PortfolioWorkWithCreator = Awaited<ReturnType<typeof prisma.creatorPortfolioWork.findFirst>> & {
  creator?: {
    displayName: string;
    user?: { email?: string | null } | null;
  } | null;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

async function toCreatorWork(work: NonNullable<PortfolioWorkWithCreator>): Promise<CreatorWork> {
  const legacyCreatorId =
    work.creator ? await resolveLegacyCreatorIdForProfile(work.creator) : null;

  return {
    id: work.id,
    creator_id: legacyCreatorId ?? work.creatorId,
    title: work.title,
    category: work.category ?? "",
    platform: work.platform ?? "",
    format: work.format ?? "",
    work_type: work.workType ?? "",
    country: work.country ?? "",
    city: work.city ?? "",
    thumbnail_url: work.thumbnailUrl ?? "",
    video_url: work.videoUrl ?? "",
    description: work.description ?? "",
    turnaround: "",
    tags: stringList(work.tagsJson),
    price_min: work.priceMin == null ? null : Number(work.priceMin),
    price_max: work.priceMax == null ? null : Number(work.priceMax),
    price_visible: work.priceVisible,
    sort_order: work.sortOrder,
    created_at: work.createdAt.toISOString(),
    hidden: !work.isPublic
  };
}

async function listDatabaseWorks(where: { creatorId?: string; includeHidden?: boolean } = {}) {
  if (!hasDatabaseUrl()) return null;

  const creatorProfileId = where.creatorId
    ? await resolveCreatorProfileIdForLegacyId(where.creatorId)
    : null;
  if (where.creatorId && !creatorProfileId) return null;

  const works = await prisma.creatorPortfolioWork.findMany({
    where: {
      ...(creatorProfileId ? { creatorId: creatorProfileId } : {}),
      deletedAt: null,
      ...(where.includeHidden ? {} : { isPublic: true })
    },
    include: {
      creator: {
        select: {
          displayName: true,
          user: { select: { email: true } }
        }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return Promise.all(works.map(toCreatorWork));
}

async function upsertDatabaseWork(work: CreatorWork): Promise<CreatorWork | null> {
  if (!hasDatabaseUrl()) return null;

  const creatorProfileId = await resolveCreatorProfileIdForLegacyId(work.creator_id);
  if (!creatorProfileId) return null;

  const saved = await prisma.creatorPortfolioWork.upsert({
    where: { id: work.id },
    update: {
      creatorId: creatorProfileId,
      title: work.title,
      category: work.category || null,
      platform: work.platform || null,
      format: work.format || null,
      workType: work.work_type || null,
      country: work.country || null,
      city: work.city || null,
      description: work.description || null,
      thumbnailUrl: work.thumbnail_url || null,
      videoUrl: work.video_url || null,
      tagsJson: asInputJson(work.tags),
      priceMin: work.price_min ?? null,
      priceMax: work.price_max ?? null,
      priceVisible: work.price_visible ?? false,
      sortOrder: work.sort_order ?? 0,
      isPublic: !(work.hidden ?? false),
      deletedAt: null
    },
    create: {
      id: work.id,
      creatorId: creatorProfileId,
      title: work.title,
      category: work.category || null,
      platform: work.platform || null,
      format: work.format || null,
      workType: work.work_type || null,
      country: work.country || null,
      city: work.city || null,
      description: work.description || null,
      thumbnailUrl: work.thumbnail_url || null,
      videoUrl: work.video_url || null,
      tagsJson: asInputJson(work.tags),
      priceMin: work.price_min ?? null,
      priceMax: work.price_max ?? null,
      priceVisible: work.price_visible ?? false,
      sortOrder: work.sort_order ?? 0,
      isPublic: !(work.hidden ?? false)
    },
    include: {
      creator: {
        select: {
          displayName: true,
          user: { select: { email: true } }
        }
      }
    }
  });

  return toCreatorWork(saved);
}

export async function publishWork(work: CreatorWork): Promise<CreatorWork> {
  const databaseWork = await upsertDatabaseWork(work);
  if (databaseWork) return databaseWork;

  const store = await readStore();
  store.deletedIds = store.deletedIds.filter((id) => id !== work.id);
  store.works = [{ ...work, hidden: work.hidden ?? false }, ...store.works.filter((item) => item.id !== work.id)];
  await writeStore(store);
  return work;
}

export async function listPublishedWorks(): Promise<CreatorWork[]> {
  const databaseWorks = await listDatabaseWorks();
  if (databaseWorks) return databaseWorks;

  const store = await readStore();
  return store.works;
}

export async function listPublishedWorksForCreator(creatorId: string): Promise<CreatorWork[]> {
  const databaseWorks = await listDatabaseWorks({ creatorId, includeHidden: true });
  if (databaseWorks) return databaseWorks;

  const store = await readStore();
  return store.works.filter((item) => item.creator_id === creatorId);
}

export async function setCreatorWorkHidden(
  creatorId: string,
  work: CreatorWork,
  hidden: boolean
): Promise<CreatorWork> {
  if (hasDatabaseUrl()) {
    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (creatorProfileId) {
      const updated = await prisma.creatorPortfolioWork.updateMany({
        where: { id: work.id, creatorId: creatorProfileId, deletedAt: null },
        data: { isPublic: !hidden }
      });
      if (updated.count > 0) {
        return { ...work, hidden };
      }
    }
  }

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
  if (hasDatabaseUrl()) {
    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(creatorId);
    if (creatorProfileId) {
      const updated = await prisma.creatorPortfolioWork.updateMany({
        where: { id: workId, creatorId: creatorProfileId, deletedAt: null },
        data: { deletedAt: new Date(), isPublic: false }
      });
      if (updated.count > 0) return;
    }
  }

  const store = await readStore();
  store.works = store.works.filter((item) => !(item.id === workId && item.creator_id === creatorId));
  if (!store.deletedIds.includes(workId)) {
    store.deletedIds.push(workId);
  }
  await writeStore(store);
}

export async function getDeletedWorkIds(): Promise<string[]> {
  if (hasDatabaseUrl()) return [];

  const store = await readStore();
  return store.deletedIds;
}

export async function isWorkDeleted(workId: string): Promise<boolean> {
  if (hasDatabaseUrl()) {
    const work = await prisma.creatorPortfolioWork.findUnique({
      where: { id: workId },
      select: { deletedAt: true }
    });
    return Boolean(work?.deletedAt);
  }

  const store = await readStore();
  return store.deletedIds.includes(workId);
}
