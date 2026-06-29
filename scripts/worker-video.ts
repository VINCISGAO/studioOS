/**
 * Standalone video transcode worker — BullMQ + DB poll fallback
 * Run: npm run worker:video
 */
import { videoWorkerService } from "@/features/video/video-worker.service";
import { startVideoWorker, closeVideoQueue } from "@/features/video/video-queue.service";
import { isRedisConfigured } from "@/lib/core/config/video";

const POLL_MS = 3_000;

async function pollDbJobs() {
  for (;;) {
    const result = await videoWorkerService.processNextWaiting();
    if (!result) {
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

async function main() {
  console.log(
    `[worker:video] starting (redis=${isRedisConfigured() ? "yes" : "no"}, mode=${process.env.VIDEO_WORKER_MODE ?? "simulate"})`
  );

  if (isRedisConfigured()) {
    startVideoWorker(async (jobId) => {
      await videoWorkerService.processJob(jobId);
    });
  }

  await pollDbJobs();
}

main().catch(async (error) => {
  console.error("[worker:video] fatal", error);
  await closeVideoQueue();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await closeVideoQueue();
  process.exit(0);
});
