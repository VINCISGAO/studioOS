import "server-only";

import { appError } from "@/lib/core/errors";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function assertKnowledgeAiRateLimit(adminUserId: string) {
  const now = Date.now();
  const current = buckets.get(adminUserId);
  if (!current || now >= current.resetAt) {
    buckets.set(adminUserId, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (current.count >= MAX_REQUESTS) {
    throw appError("RATE_LIMIT", "Knowledge AI assistant rate limit exceeded. Try again later.");
  }
  current.count += 1;
}
