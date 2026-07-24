import type { GenerationJob } from "@prisma/client";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { generationDispatcherService } from "@/features/generation/concurrency/generation-dispatcher.service";
import { generationStaleJobPolicy } from "@/features/generation/concurrency/generation-stale-job-policy";
import { prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { scheduleGenerationJob } from "@/lib/canvas/schedule-generation-job";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type GenerationStaleSweepResult = {
  queueTimedOut: number;
  dispatchRequeued: number;
  dispatchFailed: number;
  processingTimedOut: number;
};

export class GenerationStaleJobService {
  private async failStaleJob(job: GenerationJob, errorCode: string, errorMessage: string) {
    const updated = await prisma.generationJob.updateMany({
      where: {
        id: job.id,
        status: { in: ["QUEUED", "SUBMITTING", "PROCESSING"] }
      },
      data: {
        status: "FAILED",
        progress: 100,
        errorCode,
        errorMessage,
        completedAt: new Date()
      }
    });
    if (updated.count === 0) return;

    const settled = await prisma.generationJob.findUnique({ where: { id: job.id } });
    if (!settled) return;

    await creditGenerationBillingService.syncJobBilling(settled);

    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: settled.ownerId,
      projectId: settled.creativeProjectId,
      scheduleJob: scheduleGenerationJob
    });

    logger.warn("Generation job failed by stale reaper", {
      service: "GenerationStaleJobService",
      jobId: settled.id,
      errorCode,
      status: job.status
    });
  }

  private async requeueStaleDispatchJob(job: GenerationJob): Promise<"requeued" | "failed"> {
    const input = isRecord(job.input) ? job.input : {};
    const priorRequeues =
      typeof input.staleRequeueCount === "number" && Number.isInteger(input.staleRequeueCount)
        ? input.staleRequeueCount
        : 0;

    if (priorRequeues >= generationStaleJobPolicy.maxDispatchRequeues) {
      await this.failStaleJob(
        job,
        "DISPATCH_TIMEOUT",
        "任务调度超时，已自动取消并释放 Token。"
      );
      return "failed";
    }

    const updated = await prisma.generationJob.updateMany({
      where: { id: job.id, status: "SUBMITTING" },
      data: {
        status: "QUEUED",
        progress: 0,
        startedAt: null,
        providerTaskId: null,
        errorCode: null,
        errorMessage: null,
        input: {
          ...input,
          staleRequeueCount: priorRequeues + 1
        }
      }
    });
    if (updated.count === 0) return "failed";

    const requeued = await prisma.generationJob.findUnique({ where: { id: job.id } });
    if (!requeued) return "failed";

    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: requeued.ownerId,
      projectId: requeued.creativeProjectId,
      scheduleJob: scheduleGenerationJob
    });

    logger.warn("Generation job re-queued after dispatch timeout", {
      service: "GenerationStaleJobService",
      jobId: requeued.id,
      staleRequeueCount: priorRequeues + 1
    });

    return "requeued";
  }

  async reconcileJobIfStale(jobId: string): Promise<boolean> {
    const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) return false;
    if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return false;
    }

    const now = Date.now();

    if (job.status === "QUEUED" && now - job.createdAt.getTime() >= generationStaleJobPolicy.queueTimeoutMs) {
      await this.failStaleJob(
        job,
        "QUEUE_TIMEOUT",
        "任务在队列中等待过久，已自动取消并释放 Token。"
      );
      return true;
    }

    if (
      job.status === "SUBMITTING" &&
      now - job.createdAt.getTime() >= generationStaleJobPolicy.dispatchTimeoutMs
    ) {
      await this.requeueStaleDispatchJob(job);
      return true;
    }

    if (job.status === "PROCESSING" && job.startedAt) {
      if (now - job.startedAt.getTime() >= generationStaleJobPolicy.processingTimeoutMs) {
        await this.failStaleJob(
          job,
          "PROCESSING_TIMEOUT",
          "生成任务超时，已自动取消并释放 Token。"
        );
        return true;
      }
    }

    return false;
  }

  async sweepStaleJobs(limit = generationStaleJobPolicy.sweepBatchLimit): Promise<GenerationStaleSweepResult> {
    const now = Date.now();
    const result: GenerationStaleSweepResult = {
      queueTimedOut: 0,
      dispatchRequeued: 0,
      dispatchFailed: 0,
      processingTimedOut: 0
    };

    const queuedCutoff = new Date(now - generationStaleJobPolicy.queueTimeoutMs);
    const dispatchCutoff = new Date(now - generationStaleJobPolicy.dispatchTimeoutMs);
    const processingCutoff = new Date(now - generationStaleJobPolicy.processingTimeoutMs);

    const [queuedStale, submittingStale, processingStale] = await Promise.all([
      prisma.generationJob.findMany({
        where: { status: "QUEUED", createdAt: { lt: queuedCutoff } },
        orderBy: { createdAt: "asc" },
        take: limit
      }),
      prisma.generationJob.findMany({
        where: { status: "SUBMITTING", createdAt: { lt: dispatchCutoff } },
        orderBy: { createdAt: "asc" },
        take: limit
      }),
      prisma.generationJob.findMany({
        where: {
          status: "PROCESSING",
          startedAt: { not: null, lt: processingCutoff }
        },
        orderBy: { startedAt: "asc" },
        take: limit
      })
    ]);

    for (const job of queuedStale) {
      await this.failStaleJob(
        job,
        "QUEUE_TIMEOUT",
        "任务在队列中等待过久，已自动取消并释放 Token。"
      );
      result.queueTimedOut += 1;
    }

    for (const job of submittingStale) {
      const outcome = await this.requeueStaleDispatchJob(job);
      if (outcome === "requeued") {
        result.dispatchRequeued += 1;
      } else {
        result.dispatchFailed += 1;
      }
    }

    for (const job of processingStale) {
      await this.failStaleJob(
        job,
        "PROCESSING_TIMEOUT",
        "生成任务超时，已自动取消并释放 Token。"
      );
      result.processingTimedOut += 1;
    }

    return result;
  }
}

export const generationStaleJobService = new GenerationStaleJobService();
