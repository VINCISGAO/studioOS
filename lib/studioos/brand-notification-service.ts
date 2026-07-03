import "server-only";

import { createSerializedStoreReader } from "@/lib/json-file-store";
import { dataStorePath, invalidateDataJson, readDataJson, writeDataJson } from "@/lib/serverless-store";
import type { BrandNotification, BrandNotificationStore, BrandNotificationType } from "@/lib/studioos/brand-notification-types";

const STORE_PATH = dataStorePath("brand-notification-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): BrandNotificationStore {
  return { notifications: [] };
}

function cloneStore(store: BrandNotificationStore): BrandNotificationStore {
  return {
    notifications: store.notifications.map((item) => ({ ...item }))
  };
}

async function readStoreInner(): Promise<BrandNotificationStore> {
  const parsed = await readDataJson(STORE_PATH, emptyStore);
  return cloneStore(parsed);
}

const readStore = createSerializedStoreReader(readStoreInner);

async function readStoreForMutation(): Promise<BrandNotificationStore> {
  invalidateDataJson(STORE_PATH);
  readStore.invalidate?.();
  const parsed = await readDataJson(STORE_PATH, emptyStore);
  return cloneStore(parsed);
}

async function writeStore(store: BrandNotificationStore) {
  await writeDataJson(STORE_PATH, store);
  readStore.invalidate?.();
}

export async function listNotificationsForBrand(brandEmail: string): Promise<BrandNotification[]> {
  const store = await readStore();
  return store.notifications
    .filter((item) => item.brand_email === brandEmail.toLowerCase())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function countUnreadBrandNotifications(brandEmail: string): Promise<number> {
  const items = await listNotificationsForBrand(brandEmail);
  return items.filter((item) => !item.read_at).length;
}

export async function hasBrandNotification(input: {
  brand_email: string;
  project_id: string;
  creator_id: string;
  type: BrandNotificationType;
  order_id?: string | null;
  deliverable_version?: number | null;
  comment_id?: string | null;
}): Promise<boolean> {
  const store = await readStore();
  return store.notifications.some(
    (item) =>
      item.brand_email === input.brand_email.toLowerCase() &&
      item.project_id === input.project_id &&
      item.creator_id === input.creator_id &&
      item.type === input.type &&
      (input.order_id == null || item.order_id === input.order_id) &&
      (input.deliverable_version == null || item.deliverable_version === input.deliverable_version) &&
      (input.comment_id == null || item.comment_id === input.comment_id)
  );
}

export async function createBrandNotification(input: {
  brand_email: string;
  type: BrandNotificationType;
  title: string;
  body: string;
  project_id: string;
  creator_id: string;
  creator_name: string;
  order_id?: string | null;
  deliverable_version?: number | null;
  comment_id?: string | null;
}): Promise<BrandNotification> {
  const store = await readStoreForMutation();
  const notification: BrandNotification = {
    id: createId("bntf"),
    brand_email: input.brand_email.toLowerCase(),
    type: input.type,
    title: input.title,
    body: input.body,
    project_id: input.project_id,
    creator_id: input.creator_id,
    creator_name: input.creator_name,
    order_id: input.order_id ?? null,
    deliverable_version: input.deliverable_version ?? null,
    comment_id: input.comment_id ?? null,
    read_at: null,
    created_at: new Date().toISOString()
  };
  store.notifications.unshift(notification);
  await writeStore(store);
  return notification;
}

export async function markBrandNotificationRead(id: string, brandEmail: string): Promise<boolean> {
  const store = await readStoreForMutation();
  const item = store.notifications.find(
    (row) => row.id === id && row.brand_email === brandEmail.toLowerCase()
  );
  if (!item) return false;
  item.read_at = new Date().toISOString();
  await writeStore(store);
  return true;
}

export async function markBrandNotificationsRead(ids: string[], brandEmail: string): Promise<number> {
  if (!ids.length) {
    return 0;
  }
  const store = await readStoreForMutation();
  const normalized = brandEmail.toLowerCase();
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  let count = 0;

  for (const item of store.notifications) {
    if (item.brand_email === normalized && idSet.has(item.id) && !item.read_at) {
      item.read_at = now;
      count += 1;
    }
  }

  if (count) {
    await writeStore(store);
  }

  return count;
}

export async function deleteBrandNotification(id: string, brandEmail: string): Promise<boolean> {
  const store = await readStoreForMutation();
  const normalized = brandEmail.toLowerCase();
  const index = store.notifications.findIndex(
    (item) => item.id === id && item.brand_email === normalized
  );
  if (index < 0) {
    return false;
  }
  store.notifications.splice(index, 1);
  await writeStore(store);
  return true;
}

export async function deleteBrandNotifications(ids: string[], brandEmail: string): Promise<number> {
  if (!ids.length) {
    return 0;
  }
  const store = await readStoreForMutation();
  const normalized = brandEmail.toLowerCase();
  const idSet = new Set(ids);
  const before = store.notifications.length;
  store.notifications = store.notifications.filter(
    (item) => !(item.brand_email === normalized && idSet.has(item.id))
  );
  const deleted = before - store.notifications.length;
  if (deleted) {
    await writeStore(store);
  }
  return deleted;
}

export async function deleteAllNotificationsForBrand(brandEmail: string): Promise<number> {
  const store = await readStoreForMutation();
  const normalized = brandEmail.toLowerCase();
  const before = store.notifications.length;
  store.notifications = store.notifications.filter((item) => item.brand_email !== normalized);
  const deleted = before - store.notifications.length;
  if (deleted) {
    await writeStore(store);
  }
  return deleted;
}
