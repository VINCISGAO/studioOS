import "server-only";

import { promises as fs } from "fs";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { clearDeliverableVideoFile, getDeliverables, getOrder, listDeliverablesForUpload } from "@/lib/order-service";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import { dataStorePath, readDataJson } from "@/lib/serverless-store";
import {
  isDeliverableVideoPurged,
  RETENTION_DAYS_AFTER_BRAND_DOWNLOAD
} from "@/lib/studioos/deliverable-video-policy-shared";
import { reviewVideoFilePath } from "@/lib/studioos/video-upload";

export {
  deliverableDownloadHref,
  deliverableVideoPolicyNotice,
  isDeliverableVideoPurged,
  MAX_DELIVERABLE_VIDEO_BYTES,
  maxDeliverableVideoLabel,
  retentionPeriodLabel,
  RETENTION_DAYS_AFTER_BRAND_DOWNLOAD
} from "@/lib/studioos/deliverable-video-policy-shared";

const RETENTION_STORE_PATH = dataStorePath("deliverable-video-retention.json");

export type DeliverableVideoRetentionRecord = {
  id: string;
  order_id: string;
  deliverable_id: string;
  version: number;
  file_path: string;
  downloaded_by: string;
  downloaded_at: string;
  delete_after: string;
  deleted_at: string | null;
};

type RetentionStore = {
  records: DeliverableVideoRetentionRecord[];
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyRetentionStore(): RetentionStore {
  return { records: [] };
}

async function readRetentionStoreInner(): Promise<RetentionStore> {
  return readDataJson(RETENTION_STORE_PATH, emptyRetentionStore);
}

const readRetentionStore = createSerializedStoreReader(readRetentionStoreInner);

async function writeRetentionStore(store: RetentionStore) {
  await writeJsonFileAtomic(RETENTION_STORE_PATH, store);
}

export async function recordBrandFinalDeliverableDownload(input: {
  order: StoredOrder;
  deliverable: StoredDeliverable;
  clientEmail: string;
}) {
  if (input.order.status !== "completed") {
    return null;
  }

  const deliverables = await getDeliverables(input.order.id);
  const latest = deliverables.reduce<StoredDeliverable | null>(
    (current, item) => (!current || item.version > current.version ? item : current),
    null
  );
  if (!latest || latest.id !== input.deliverable.id) {
    return null;
  }

  const store = await readRetentionStore();
  const existing = store.records.find(
    (item) => item.deliverable_id === input.deliverable.id && !item.deleted_at
  );
  if (existing) {
    return existing;
  }

  const downloadedAt = new Date();
  const deleteAfter = new Date(downloadedAt);
  deleteAfter.setDate(deleteAfter.getDate() + RETENTION_DAYS_AFTER_BRAND_DOWNLOAD);

  const record: DeliverableVideoRetentionRecord = {
    id: createId("vret"),
    order_id: input.order.id,
    deliverable_id: input.deliverable.id,
    version: input.deliverable.version,
    file_path: reviewVideoFilePath(input.order.id, input.deliverable.version),
    downloaded_by: input.clientEmail.toLowerCase(),
    downloaded_at: downloadedAt.toISOString(),
    delete_after: deleteAfter.toISOString(),
    deleted_at: null
  };

  store.records.unshift(record);
  await writeRetentionStore(store);
  return record;
}

export async function purgeExpiredDeliverableVideos(): Promise<number> {
  const store = await readRetentionStore();
  const now = Date.now();
  let purged = 0;

  for (const record of store.records) {
    if (record.deleted_at) {
      continue;
    }
    if (new Date(record.delete_after).getTime() > now) {
      continue;
    }

    try {
      await fs.unlink(record.file_path);
    } catch {
      // File may already be removed manually.
    }

    await clearDeliverableVideoFile(record.deliverable_id);
    record.deleted_at = new Date().toISOString();
    purged += 1;
  }

  if (purged) {
    await writeRetentionStore(store);
  }

  return purged;
}

export async function getDeliverableRetentionDeleteAfter(
  deliverableId: string
): Promise<string | null> {
  const store = await readRetentionStore();
  const record = store.records.find((item) => item.deliverable_id === deliverableId && !item.deleted_at);
  return record?.delete_after ?? null;
}

export async function assertDeliverableVideoAccess(input: {
  orderId: string;
  version: number;
  clientEmail: string | null;
  creatorId: string | null;
}) {
  const order = await getOrder(input.orderId);
  if (!order) {
    return { ok: false as const, code: "NOT_FOUND" as const };
  }

  const deliverables = await listDeliverablesForUpload(input.orderId);
  const deliverable = deliverables.find((item) => item.version === input.version) ?? null;
  if (!deliverable) {
    return { ok: false as const, code: "NOT_FOUND" as const };
  }

  if (isDeliverableVideoPurged(deliverable)) {
    return { ok: false as const, code: "PURGED" as const, order, deliverable };
  }

  const brandOk =
    input.clientEmail && order.client_email.toLowerCase() === input.clientEmail.toLowerCase();
  const creatorOk = input.creatorId && order.creator_id === input.creatorId;
  if (!brandOk && !creatorOk) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  return { ok: true as const, order, deliverable, isBrand: Boolean(brandOk) };
}
