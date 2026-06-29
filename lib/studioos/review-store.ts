import { promises as fs } from "fs";
import path from "path";

export type ReviewCommentStatus = "open" | "resolved";

export type ReviewComment = {
  id: string;
  order_id: string;
  version: number;
  timestamp_sec: number;
  body: string;
  issue_type?: string | null;
  author: "brand" | "studio";
  status: ReviewCommentStatus;
  created_at: string;
  resolved_at: string | null;
};

type ReviewStore = {
  comments: ReviewComment[];
};

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "review-store.json");
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
    timestamp_sec: Number(raw.timestamp_sec ?? 0),
    body,
    issue_type: issueType,
    author: raw.author === "studio" ? "studio" : "brand",
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
        timestamp_sec: 4,
        body: "Logo should be larger.",
        issue_type: "Logo",
        author: "brand",
        status: "open",
        created_at: now,
        resolved_at: null
      },
      {
        id: "rev_demo_arc_2",
        order_id: orderId,
        version: 1,
        timestamp_sec: 12,
        body: "CTA should match the summer campaign lockup.",
        issue_type: "CTA",
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
      body: "Logo should be larger.",
      issue_type: "Logo",
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
      body: "Music feels too quiet under the voiceover.",
      issue_type: "Music",
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
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

async function readStore(): Promise<ReviewStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as { comments: Record<string, unknown>[] };
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
  } catch {
    const seeded = ensureDemoComments({ comments: seedComments() });
    await writeStore(seeded);
    return seeded;
  }
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
    .sort((a, b) => a.timestamp_sec - b.timestamp_sec || a.created_at.localeCompare(b.created_at));
}

export async function addReviewComment(input: {
  order_id: string;
  version: number;
  timestamp_sec: number;
  body: string;
  issue_type?: string | null;
  author?: ReviewComment["author"];
}): Promise<ReviewComment> {
  const store = await readStore();
  const comment: ReviewComment = {
    id: createId(),
    order_id: input.order_id,
    version: input.version,
    timestamp_sec: Math.max(0, Math.floor(input.timestamp_sec)),
    body: input.body.trim(),
    issue_type: input.issue_type?.trim() || inferIssueType(input.body),
    author: input.author ?? "brand",
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

export { formatTimestamp } from "@/lib/studioos/review-utils";
