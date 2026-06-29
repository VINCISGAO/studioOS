import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { dataStorePath } from "@/lib/serverless-store";
import type { ReviewEngineStore, ReviewEvent, ReviewSession } from "@/lib/review-engine/types";

const STORE_PATH = dataStorePath("review-engine-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): ReviewEngineStore {
  return { sessions: [], events: [] };
}

async function readStoreInner(): Promise<ReviewEngineStore> {
  const { readDataJson } = await import("@/lib/serverless-store");
  return readDataJson<ReviewEngineStore>(STORE_PATH, emptyStore);
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: ReviewEngineStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
}

export async function listReviewSessionsForOrder(orderId: string): Promise<ReviewSession[]> {
  const store = await readStore();
  return store.sessions
    .filter((item) => item.order_id === orderId)
    .sort((a, b) => b.version_number - a.version_number);
}

export async function getLatestReviewSession(orderId: string): Promise<ReviewSession | null> {
  const sessions = await listReviewSessionsForOrder(orderId);
  return sessions[0] ?? null;
}

export async function getReviewSession(id: string): Promise<ReviewSession | null> {
  const store = await readStore();
  return store.sessions.find((item) => item.id === id) ?? null;
}

export async function getReviewSessionByAssetId(assetId: string): Promise<ReviewSession | null> {
  const store = await readStore();
  return store.sessions.find((item) => item.frame_asset_id === assetId) ?? null;
}

export async function createReviewSessionRecord(
  input: Omit<ReviewSession, "id" | "created_at" | "updated_at">
): Promise<ReviewSession> {
  const store = await readStore();
  const now = new Date().toISOString();
  const session: ReviewSession = {
    ...input,
    id: createId("rs"),
    created_at: now,
    updated_at: now
  };
  store.sessions.unshift(session);
  await writeStore(store);
  return session;
}

export async function updateReviewSession(
  id: string,
  patch: Partial<Omit<ReviewSession, "id" | "created_at">>
): Promise<ReviewSession | null> {
  const store = await readStore();
  const session = store.sessions.find((item) => item.id === id);
  if (!session) {
    return null;
  }

  Object.assign(session, patch, { updated_at: new Date().toISOString() });
  await writeStore(store);
  return session;
}

export async function appendReviewEvent(input: {
  review_session_id: string;
  frame_event_type: string;
  frame_payload: Record<string, unknown>;
}): Promise<ReviewEvent> {
  const store = await readStore();
  const event: ReviewEvent = {
    id: createId("re"),
    review_session_id: input.review_session_id,
    frame_event_type: input.frame_event_type,
    frame_payload: input.frame_payload,
    created_at: new Date().toISOString()
  };
  store.events.unshift(event);
  await writeStore(store);
  return event;
}

export async function listReviewEvents(reviewSessionId: string): Promise<ReviewEvent[]> {
  const store = await readStore();
  return store.events
    .filter((item) => item.review_session_id === reviewSessionId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function invalidateReviewEngineStore() {
  readStore.invalidate?.();
}
