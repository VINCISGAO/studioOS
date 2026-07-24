function readPositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const generationStaleJobPolicy = {
  /** QUEUED jobs older than this are failed and credits released. Default: 12 hours. */
  queueTimeoutMs: readPositiveInt(process.env.AI_GENERATION_QUEUE_TIMEOUT_MS, 12 * HOUR_MS),
  /** SUBMITTING jobs older than this are re-queued (once) or failed. Default: 10 minutes. */
  dispatchTimeoutMs: readPositiveInt(process.env.AI_GENERATION_DISPATCH_TIMEOUT_MS, 10 * MINUTE_MS),
  /** PROCESSING jobs without completion after startedAt exceed this → FAILED. Default: 30 minutes. */
  processingTimeoutMs: readPositiveInt(process.env.AI_GENERATION_PROCESSING_TIMEOUT_MS, 30 * MINUTE_MS),
  sweepBatchLimit: readPositiveInt(process.env.AI_GENERATION_STALE_SWEEP_LIMIT, 50),
  maxDispatchRequeues: readPositiveInt(process.env.AI_GENERATION_DISPATCH_MAX_REQUEUES, 1)
} as const;
