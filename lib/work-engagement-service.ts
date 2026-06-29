import path from "path";
import { unstable_cache } from "next/cache";
import { createSerializedStoreReader, readJsonFile, writeJsonFileAtomic } from "@/lib/json-file-store";
import {
  baseViewCount,
  type WorkEngagementSnapshot
} from "@/lib/work-engagement-utils";

export type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
export {
  baseViewCount,
  formatEngagementCount,
  seedWorkDuration,
  seedWorkViews
} from "@/lib/work-engagement-utils";

const STORE_PATH = path.join(process.cwd(), ".data", "work-engagement-store.json");

type WorkEngagementStore = {
  likes: Record<string, string[]>;
};

function emptyStore(): WorkEngagementStore {
  return { likes: {} };
}

async function readEngagementStoreInner(): Promise<WorkEngagementStore> {
  const parsed = await readJsonFile<WorkEngagementStore>(STORE_PATH);
  if (!parsed?.likes) {
    const seeded = emptyStore();
    await writeJsonFileAtomic(STORE_PATH, seeded);
    return seeded;
  }
  return parsed;
}

const readStore = createSerializedStoreReader(readEngagementStoreInner);

const readEngagementStoreCached = unstable_cache(
  async (): Promise<WorkEngagementStore> => {
    const parsed = await readJsonFile<WorkEngagementStore>(STORE_PATH);
    return parsed?.likes ? parsed : emptyStore();
  },
  ["work-engagement-store"],
  { revalidate: 30 }
);

export async function getWorksEngagement(
  workIds: string[],
  userEmail?: string | null
): Promise<Record<string, WorkEngagementSnapshot>> {
  const store = userEmail ? await readStore() : await readEngagementStoreCached();
  const normalizedEmail = userEmail?.trim().toLowerCase() ?? null;
  const result: Record<string, WorkEngagementSnapshot> = {};

  for (const workId of workIds) {
    const likers = store.likes[workId] ?? [];
    result[workId] = {
      likeCount: likers.length,
      likedByMe: normalizedEmail ? likers.includes(normalizedEmail) : false,
      views: baseViewCount(workId)
    };
  }

  return result;
}

export async function toggleWorkLike(
  workId: string,
  userEmail: string
): Promise<{ liked: boolean; likeCount: number }> {
  const store = await readStore();
  const email = userEmail.trim().toLowerCase();
  const current = store.likes[workId] ?? [];
  const liked = current.includes(email);
  const next = liked ? current.filter((item) => item !== email) : [...current, email];

  store.likes[workId] = next;
  await writeJsonFileAtomic(STORE_PATH, store);

  return {
    liked: !liked,
    likeCount: next.length
  };
}
