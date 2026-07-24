import type { GenerationJob, GenerationStatus } from "@prisma/client";
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

const staleFailableStatuses: GenerationStatus[] = ["QUEUED", "SUBMITTING", "PROCESSING"];

export class GenerationStaleJobService {
  private async failStaleJob(job: GenerationJob, errorCode: string, errorMessage: string): Promise<boolean> {
    const failed = await prisma.generationJob.updateMany({
      where: {
        id: job.id,
        status: { in: staleFailableStatuses }
      },
      data: {
        status: "FAILED",
        progress: 100,
        errorCode,
        errorMessage,
        completedAt: new Date()
      }
    });
    if (failed.count === 0) return false;

    const updated = await prisma.generationJob.findUnique({ where: { id: job.id } });
    if (!updated) return false;

    await creditGenerationBillingService.syncJobBilling(updated);

    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: updated.ownerId,
      projectId: updated.creativeProjectId,
      scheduleJob: scheduleGenerationJob
    });

    logger.warn("Generation job failed by stale reaper", {
      service: "GenerationStaleJobService",
      jobId: updated.id,
      errorCode,
      status: job.status
    });

    return true;
  }

  private async requeueStaleDispatchJob(
    job: GenerationJob
  ): Promise<"requeued" | "failed" | "skipped"> {
    const input = isRecord(job.input) ? job.input : {};
    const priorRequeues =
      typeof input.staleRequeueCount === "number" && Number.isInteger(input.staleRequeueCount)
        ? input.staleRequeueCount
        : 0;

    if (priorRequeues >= generationStaleJobPolicy.maxDispatchRequeues) {
      const failed = await this.failStaleJob(
        job,
        "DISPATCH_TIMEOUT",
        "任务调度超时，已自动取消并释放 Token。"
      );
      return failed ? "failed" : "skipped";
    }

    const requeued = await prisma.generationJob.updateMany({
      where: {
        id: job.id,
        status: "SUBMITTING"
      },
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
    if (requeued.count === 0) return "skipped";

    const updated = await prisma.generationJob.findUnique({ where: { id: job.id } });
    if (!updated) return "skipped";

    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: updated.ownerId,
      projectId: updated.creativeProjectId,
      scheduleJob: scheduleGenerationJob
    });

    logger.warn("Generation job re-queued after dispatch timeout", {
      service: "GenerationStaleJobService",
      jobId: updated.id,
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
      return this.failStaleJob(
        job,
        "QUEUE_TIMEOUT",
        "任务在队列中等待过久，已自动取消并释放 Token。"
      );
    }

    if (
      job.status === "SUBMITTING" &&
      now - job.createdAt.getTime() >= generationStaleJobPolicy.dispatchTimeoutMs
    ) {
      const outcome = await this.requeueStaleDispatchJob(job);
      return outcome !== "skipped";
    }

    if (job.status === "PROCESSING" && job.startedAt) {
      if (now - job.startedAt.getTime() >= generationStaleJobPolicy.processingTimeoutMs) {
        return this.failStaleJob(
          job,
          "PROCESSING_TIMEOUT",
          "生成任务超时，已自动取消并释放 Token。"
        );
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
      const failed = await this.failStaleJob(
        job,
        "QUEUE_TIMEOUT",
        "任务在队列中等待过久，已自动取消并释放 Token。"
      );
      if (failed) result.queueTimedOut += 1;
    }

    for (const job of submittingStale) {
      const outcome = await this.requeueStaleDispatchJob(job);
      if (outcome === "requeued") {
        result.dispatchRequeued += 1;
      } else if (outcome === "failed") {
        result.dispatchFailed += 1;
      }
    }

    for (const job of processingStale) {
      const failed = await this.failStaleJob(
        job,
        "PROCESSING_TIMEOUT",
        "生成任务超时，已自动取消并释放 Token。"
      );
      if (failed) result.processingTimedOut += 1;
    }

    return result;
  }
}

export const generationStaleJobService = new GenerationStaleJobService();
