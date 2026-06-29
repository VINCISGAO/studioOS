import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { videoConfig, isRedisConfigured } from "@/lib/core/config/video";
import { logger } from "@/lib/core/logger";

let queue: Queue | null = null;
let worker: Worker | null = null;

function redisConnection(): ConnectionOptions | null {
  if (!isRedisConfigured()) return null;
  return { url: videoConfig.redisUrl! };
}

export function getVideoQueue() {
  const connection = redisConnection();
  if (!connection) return null;
  if (!queue) {
    queue = new Queue(videoConfig.queueName, { connection });
  }
  return queue;
}

export async function enqueueVideoJob(jobId: string) {
  const q = getVideoQueue();
  if (!q) return false;
  try {
    await q.add("transcode", { jobId }, { jobId, removeOnComplete: 100, removeOnFail: 50 });
    return true;
  } catch (error) {
    logger.warn("Redis enqueue failed — falling back to inline worker", {
      service: "VideoQueueService",
      jobId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export function startVideoWorker(processor: (jobId: string) => Promise<unknown>) {
  const connection = redisConnection();
  if (!connection || worker) return worker;

  worker = new Worker(
    videoConfig.queueName,
    async (job) => {
      const jobId = String(job.data?.jobId ?? "");
      if (!jobId) return;
      await processor(jobId);
    },
    { connection, concurrency: 1 }
  );

  worker.on("failed", (job, error) => {
    logger.error("Video queue job failed", {
      service: "VideoQueueService",
      jobId: job?.data?.jobId,
      error: error.message
    });
  });

  return worker;
}

export async function closeVideoQueue() {
  await worker?.close();
  await queue?.close();
  worker = null;
  queue = null;
}
