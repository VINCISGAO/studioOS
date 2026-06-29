import { promises as fs } from "fs";
import path from "path";
import type { CreatorRatingStats, OrderRatingStore, OrderReview } from "@/lib/order-rating-types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "order-ratings-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): OrderRatingStore {
  return { reviews: [] };
}

async function readStore(): Promise<OrderRatingStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as OrderRatingStore;
  } catch {
    const seeded = emptyStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function writeStore(store: OrderRatingStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getOrderReview(orderId: string): Promise<OrderReview | null> {
  const store = await readStore();
  return store.reviews.find((item) => item.order_id === orderId) ?? null;
}

export async function createOrderReview(input: {
  order_id: string;
  creator_id: string;
  client_email: string;
  rating: number;
  comment?: string;
}): Promise<{ ok: true; review: OrderReview } | { ok: false; code: "INVALID" | "EXISTS" }> {
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, code: "INVALID" };
  }

  const store = await readStore();
  if (store.reviews.some((item) => item.order_id === input.order_id)) {
    return { ok: false, code: "EXISTS" };
  }

  const review: OrderReview = {
    id: createId("rev"),
    order_id: input.order_id,
    creator_id: input.creator_id,
    client_email: input.client_email.toLowerCase(),
    rating: Math.round(input.rating * 10) / 10,
    comment: input.comment?.trim() ?? "",
    created_at: new Date().toISOString()
  };

  store.reviews.unshift(review);
  await writeStore(store);
  return { ok: true, review };
}

export async function getCreatorRatingStats(creatorId: string): Promise<CreatorRatingStats> {
  const store = await readStore();
  const reviews = store.reviews.filter((item) => item.creator_id === creatorId);
  if (!reviews.length) {
    return { average: 0, count: 0 };
  }

  const average = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
  return {
    average: Math.round(average * 10) / 10,
    count: reviews.length
  };
}

export async function listReviewsForCreator(creatorId: string): Promise<OrderReview[]> {
  const store = await readStore();
  return store.reviews
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
