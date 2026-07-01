import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";

export type ReviewCommentStatus = "open" | "resolved";

export type ReviewComment = {
  id: string;
  order_id: string;
  version: number;
  /** Playback position in seconds (supports decimals). */
  timestamp_sec: number;
  body: string;
  /** Normalized click position on video frame, 0–1. */
  pos_x?: number | null;
  pos_y?: number | null;
  issue_type?: string | null;
  author: "brand" | "studio";
  created_by?: string | null;
  status: ReviewCommentStatus;
  created_at: string;
  resolved_at: string | null;
};

type ReviewStore = {
  comments: ReviewComment[];
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

  return {
    id: String(raw.id),
    order_id: String(raw.order_id),
    version: Number(raw.version ?? 1) || 1,
    timestamp_sec: Number(raw.timestamp_sec ?? raw.time_seconds ?? 0),
    body: String(raw.body ?? raw.content ?? ""),
    pos_x: raw.pos_x != null ? Number(raw.pos_x) : null,
    pos_y: raw.pos_y != null ? Number(raw.pos_y) : null,
    issue_type: issueType,
    author: raw.author === "studio" ? "studio" : "brand",
    created_by: raw.created_by != null ? String(raw.created_by) : null,
    status: raw.status === "resolved" ? "resolved" : "open",
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
        status: "open",
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
        status: "open",
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
        status: "open",
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
      status: "open",
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
  const parsed = await readDataJson<{ comments: Record<string, unknown>[] }>(STORE_PATH, () => ({
    comments: seedComments()
  }));
  let migrated = false;
  const comments = (parsed.comments ?? []).map((item) => {
    const next = migrateComment(item);
    if (JSON.stringify(item) !== JSON.stringify(next)) {
      migrated = true;
    }
    return next;
  });

  const store = ensureDemoComments({ comments });
  if (migrated || store.comments.length !== comments.length) {
    await writeStore(store);
  }
  return store;
}

function ensureDemoComments(store: ReviewStore): ReviewStore {
  for (const orderId of [DEMO_ORDER_ID, DEMO_ARC_ORDER_ID]) {
    if (!store.comments.some((item) => item.order_id === orderId)) {
      store.comments.push(...seedCommentsForOrder(orderId));
    }
  }
  return store;
}

export async function listReviewComments(orderId: string, version?: number): Promise<ReviewComment[]> {
  const store = await readStore();
  return store.comments
    .filter((item) => item.order_id === orderId && (version === undefined || item.version === version))
    .sort(
      (a, b) =>
        a.timestamp_sec - b.timestamp_sec ||
        String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
    );
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
}): Promise<ReviewComment> {
  const store = await readStore();
  const comment: ReviewComment = {
    id: createId(),
    order_id: input.order_id,
    version: input.version,
    timestamp_sec: Math.max(0, input.timestamp_sec),
    body: input.body.trim(),
    pos_x: input.pos_x ?? null,
    pos_y: input.pos_y ?? null,
    issue_type: input.issue_type?.trim() || inferIssueType(input.body),
    author: input.author ?? "brand",
    created_by: input.created_by ?? null,
    status: "open",
    created_at: new Date().toISOString(),
    resolved_at: null
  };
  store.comments.push(comment);
  await writeStore(store);
  return comment;
}

export async function resolveReviewComment(
  commentId: string,
  orderId: string
): Promise<ReviewComment | null> {
  const store = await readStore();
  const comment = store.comments.find((item) => item.id === commentId && item.order_id === orderId);
  if (!comment) {
    return null;
  }

  comment.status = "resolved";
  comment.resolved_at = new Date().toISOString();
  await writeStore(store);
  return comment;
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
  await writeStore(store);
  return removed;
}

export { formatTimestamp } from "@/lib/studioos/review-utils";
