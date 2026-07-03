import "server-only";

import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";
import { getOrder } from "@/lib/order-service";
import { reviewPortalService } from "@/features/review/review-portal.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { normalizeReviewCommentTimestampSec } from "@/lib/studioos/review-comment-time";
import { enrichReviewCommentAnnotations } from "@/lib/studioos/review-annotation-json";
import {
  parseReviewCommentAnnotations,
  type ReviewComment,
  type ReviewCommentAnnotation,
  type ReviewCommentStatus
} from "@/lib/studioos/review-comment-types";
import { normalizeReviewCommentStatus } from "@/lib/studioos/review-comment-status";

export type { ReviewComment, ReviewCommentAnnotation, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
export {
  coerceReviewCommentAnnotation,
  parseReviewCommentAnnotations
} from "@/lib/studioos/review-comment-types";
export {
  countUnresolvedReviewComments,
  normalizeReviewCommentStatus
} from "@/lib/studioos/review-comment-status";

type ReviewStore = {
  comments: ReviewComment[];
  dismissed_demo_order_ids?: string[];
};

const STORE_PATH = dataStorePath("review-store.json");
const DEMO_ORDER_ID = "ord_demo_nova_active";
const DEMO_ARC_ORDER_ID = "ord_demo_arc_nova";

function createId() {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function inferIssueType(body: string): string | null {
  const match = body.match(/^\[(Logo|Music|Ending|CTA)\]\s*/i);
  return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : null;
}

function migrateComment(raw: Record<string, unknown>): ReviewComment {
  const body = String(raw.body ?? "");
  const issueType =
    raw.issue_type != null && String(raw.issue_type).trim()
      ? String(raw.issue_type)
      : inferIssueType(body);

  const annotations = parseReviewCommentAnnotations(
    raw.annotations,
    `ann_${String(raw.id ?? "comment")}`
  );

  return {
    id: String(raw.id),
    order_id: String(raw.order_id),
    version: Number(raw.version ?? 1) || 1,
    timestamp_sec: normalizeReviewCommentTimestampSec(raw.timestamp_sec ?? raw.time_seconds),
    body: String(raw.body ?? raw.content ?? ""),
    pos_x: raw.pos_x != null ? Number(raw.pos_x) : null,
    pos_y: raw.pos_y != null ? Number(raw.pos_y) : null,
    issue_type: issueType,
    author: raw.author === "studio" ? "studio" : "brand",
    created_by: raw.created_by != null ? String(raw.created_by) : null,
    author_display_name:
      raw.author_display_name != null ? String(raw.author_display_name) : undefined,
    annotations,
    status: normalizeReviewCommentStatus(raw.status),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    resolved_at: raw.resolved_at ? String(raw.resolved_at) : null
  };
}

function seedCommentsForOrder(orderId: string): ReviewComment[] {
  const now = new Date().toISOString();
  if (orderId === DEMO_ARC_ORDER_ID) {
    return [
      {
        id: "rev_demo_arc_1",
        order_id: orderId,
        version: 1,
        timestamp_sec: 2,
        body: "Logo 放大一点",
        pos_x: 0.38,
        pos_y: 0.22,
        issue_type: null,
        author: "brand",
        status: "todo",
        created_at: now,
        resolved_at: null
      },
      {
        id: "rev_demo_arc_2",
        order_id: orderId,
        version: 1,
        timestamp_sec: 8,
        body: "产品镜头切慢一点",
        pos_x: 0.55,
        pos_y: 0.48,
        issue_type: null,
        author: "brand",
        status: "todo",
        created_at: now,
        resolved_at: null
      },
      {
        id: "rev_demo_arc_3",
        order_id: orderId,
        version: 1,
        timestamp_sec: 21,
        body: "字幕颜色太浅",
        pos_x: 0.42,
        pos_y: 0.72,
        issue_type: null,
        author: "brand",
        status: "todo",
        created_at: now,
        resolved_at: null
      }
    ];
  }

  return [
    {
      id: "rev_demo_1",
      order_id: orderId,
      version: 1,
      timestamp_sec: 2,
      body: "Logo 放大一点",
      pos_x: 0.35,
      pos_y: 0.18,
      issue_type: null,
      author: "brand",
      status: "todo",
      created_at: now,
      resolved_at: null
    },
    {
      id: "rev_demo_2",
      order_id: orderId,
      version: 1,
      timestamp_sec: 7,
      body: "音乐再响一点",
      pos_x: 0.62,
      pos_y: 0.55,
      issue_type: null,
      author: "brand",
      status: "resolved",
      created_at: now,
      resolved_at: now
    }
  ];
}

function seedComments(): ReviewComment[] {
  return seedCommentsForOrder(DEMO_ORDER_ID);
}

async function writeStore(store: ReviewStore) {
  await writeDataJson(STORE_PATH, store);
}

async function readStore(): Promise<ReviewStore> {
  const parsed = await readDataJson<{
    comments: Record<string, unknown>[];
    dismissed_demo_order_ids?: string[];
  }>(STORE_PATH, seedReviewStore);
  let migrated = false;
  const comments = (parsed.comments ?? []).map((item) => {
    const next = migrateComment(item);
    if (JSON.stringify(item) !== JSON.stringify(next)) {
      migrated = true;
    }
    return next;
  });

  const store: ReviewStore = {
    comments,
    dismissed_demo_order_ids: parsed.dismissed_demo_order_ids ?? []
  };

  if (migrated) {
    await writeStore(store);
  }
  return store;
}

function ensureDemoComments(store: ReviewStore): ReviewStore {
  const dismissed = new Set(store.dismissed_demo_order_ids ?? []);
  for (const orderId of [DEMO_ORDER_ID, DEMO_ARC_ORDER_ID]) {
    if (dismissed.has(orderId)) continue;
    if (!store.comments.some((item) => item.order_id === orderId)) {
      store.comments.push(...seedCommentsForOrder(orderId));
    }
  }
  return store;
}

function seedReviewStore(): ReviewStore {
  return ensureDemoComments({ comments: seedComments() });
}

function sortReviewComments(items: ReviewComment[]) {
  return [...items].sort(
    (a, b) =>
      a.timestamp_sec - b.timestamp_sec ||
      String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  );
}

export async function listReviewComments(orderId: string, version?: number): Promise<ReviewComment[]> {
  const matchesVersion = (item: ReviewComment) =>
    version === undefined || item.version === version;

  const store = await readStore();
  const jsonComments = store.comments.filter(
    (item) => item.order_id === orderId && matchesVersion(item)
  );

  if (hasDatabaseUrl()) {
    const order = await getOrder(orderId);
    if (order?.project_id) {
      const fromPrisma = await reviewPortalService.listCommentsForLegacyOrder(
        orderId,
        order.project_id
      );
      if (fromPrisma !== null) {
        const prismaComments = fromPrisma.filter(matchesVersion);
        const localById = new Map(jsonComments.map((item) => [item.id, item]));
        const prismaWithLocalStatus = prismaComments.map((item) => {
          const local = localById.get(item.id);
          return local
            ? {
                ...item,
                status: local.status,
                resolved_at: local.resolved_at
              }
            : item;
        });
        const prismaIds = new Set(prismaComments.map((item) => item.id));
        return sortReviewComments([
          ...prismaWithLocalStatus,
          ...jsonComments.filter((item) => !prismaIds.has(item.id))
        ]);
      }
    }
  }

  return sortReviewComments(jsonComments);
}

export async function addReviewComment(input: {
  order_id: string;
  version: number;
  timestamp_sec: number;
  body: string;
  pos_x?: number | null;
  pos_y?: number | null;
  issue_type?: string | null;
  author?: ReviewComment["author"];
  created_by?: string | null;
  author_display_name?: string;
  annotations?: ReviewCommentAnnotation[];
}): Promise<ReviewComment> {
  const store = await readStore();
  const comment: ReviewComment = {
    id: createId(),
    order_id: input.order_id,
    version: input.version,
    timestamp_sec: Math.max(0, normalizeReviewCommentTimestampSec(input.timestamp_sec)),
    body: input.body.trim(),
    pos_x: input.pos_x ?? null,
    pos_y: input.pos_y ?? null,
    issue_type: input.issue_type?.trim() || inferIssueType(input.body),
    author: input.author ?? "brand",
    created_by: input.created_by ?? null,
    author_display_name: input.author_display_name,
    annotations: enrichReviewCommentAnnotations(input.annotations ?? [], input.timestamp_sec, {
      x: input.pos_x,
      y: input.pos_y
    }),
    status: "todo",
    created_at: new Date().toISOString(),
    resolved_at: null
  };
  store.comments.push(comment);
  await writeStore(store);
  return comment;
}

export async function inheritOpenReviewComments(input: {
  orderId: string;
  fromVersion: number;
  toVersion: number;
}): Promise<ReviewComment[]> {
  void input;
  return [];
}

export async function resolveReviewComment(
  commentId: string,
  orderId: string
): Promise<ReviewComment | null> {
  return setReviewCommentStatus(commentId, orderId, "resolved");
}

export async function setReviewCommentStatus(
  commentId: string,
  orderId: string,
  status: ReviewCommentStatus
): Promise<ReviewComment | null> {
  const store = await readStore();
  const comment = store.comments.find((item) => item.id === commentId && item.order_id === orderId);
  if (!comment) {
    return null;
  }

  comment.status = normalizeReviewCommentStatus(status);
  comment.resolved_at = comment.status === "resolved" ? new Date().toISOString() : null;
  await writeStore(store);
  return comment;
}

export async function upsertReviewCommentStatusOverride(
  comment: ReviewComment,
  status: ReviewCommentStatus
): Promise<ReviewComment> {
  const store = await readStore();
  const existing = store.comments.find((item) => item.id === comment.id && item.order_id === comment.order_id);
  const nextStatus = normalizeReviewCommentStatus(status);
  const nextResolvedAt = nextStatus === "resolved" ? new Date().toISOString() : null;

  if (existing) {
    existing.status = nextStatus;
    existing.resolved_at = nextResolvedAt;
    await writeStore(store);
    return existing;
  }

  const shadow: ReviewComment = {
    ...comment,
    status: nextStatus,
    resolved_at: nextResolvedAt
  };
  store.comments.push(shadow);
  await writeStore(store);
  return shadow;
}

export async function deleteReviewComment(
  commentId: string,
  orderId: string
): Promise<ReviewComment | null> {
  const store = await readStore();
  const index = store.comments.findIndex((item) => item.id === commentId && item.order_id === orderId);
  if (index < 0) {
    return null;
  }

  const [removed] = store.comments.splice(index, 1);
  if ([DEMO_ORDER_ID, DEMO_ARC_ORDER_ID].includes(orderId)) {
    const dismissed = new Set(store.dismissed_demo_order_ids ?? []);
    dismissed.add(orderId);
    store.dismissed_demo_order_ids = [...dismissed];
  }
  await writeStore(store);
  return removed;
}

export { formatTimestamp } from "@/lib/studioos/review-utils";
