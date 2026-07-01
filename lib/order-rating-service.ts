import type { CreatorRatingStats, OrderRatingStore, OrderReview } from "@/lib/order-rating-types";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";

const STORE_PATH = dataStorePath("order-ratings-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): OrderRatingStore {
  return { reviews: [] };
}

async function readStore(): Promise<OrderRatingStore> {
  return readDataJson(STORE_PATH, () => emptyStore());
}

async function writeStore(store: OrderRatingStore) {
  await writeDataJson(STORE_PATH, store);
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
    id: createId("rating"),
    order_id: input.order_id,
    creator_id: input.creator_id,
    client_email: input.client_email.toLowerCase(),
    rating: input.rating,
    comment: input.comment?.trim() ?? "",
    created_at: new Date().toISOString()
  };

  store.reviews.push(review);
  await writeStore(store);
  return { ok: true, review };
}

export async function getCreatorRatingStats(creatorId: string): Promise<CreatorRatingStats> {
  const store = await readStore();
  const reviews = store.reviews.filter((item) => item.creator_id === creatorId);
  if (!reviews.length) {
    return { average: 0, count: 0 };
  }

  const sum = reviews.reduce((total, item) => total + item.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length
  };
}
