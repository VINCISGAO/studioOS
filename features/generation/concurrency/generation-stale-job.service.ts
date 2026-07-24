import type { GenerationJob, GenerationStatus, Prisma } from "@prisma/client";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { generationDispatcherService } from "@/features/generation/concurrency/generation-dispatcher.service";
import { generationStaleJobPolicy } from "@/features/generation/concurrency/generation-stale-job-policy";
import { prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { scheduleGenerationJob } from "@/lib/canvas/schedule-generation-job";

const CRON_ADVISORY_LOCK_KEY = "generation-stale-reaper-cron";
const INCOMPLETE_STATUSES: GenerationStatus[] = ["QUEUED", "SUBMITTING", "PROCESSING"];

type JobClient = Prisma.TransactionClient | typeof prisma;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type GenerationStaleSweepResult = {
  queueTimedOut: number;
  dispatchRequeued: number;
  dispatchFailed: number;
  processingTimedOut: number;
};

export type GenerationStaleReaperResult = {
  ok: true;
  scanned: number;
  requeued: number;
  failed: number;
  releasedCredits: number;
  durationMs: number;
};

type FailedStaleJobAction = {
  type: "failed";
  jobId: string;
  ownerId: string;
  projectId: string;
  estimatedCredits: number;
  creditReservationId: string | null;
  errorCode: "QUEUE_TIMEOUT" | "DISPATCH_TIMEOUT" | "PROCESSING_TIMEOUT";
  errorMessage: string;
};

type RequeuedStaleJobAction = {
  type: "requeued";
  jobId: string;
  ownerId: string;
  projectId: string;
};

type StaleJobAction = FailedStaleJobAction | RequeuedStaleJobAction;

export class GenerationStaleJobService {
  private failureCopy(errorCode: FailedStaleJobAction["errorCode"]) {
    if (errorCode === "QUEUE_TIMEOUT") {
      return "任务在队列中等待过久，已自动取消并释放 Token。";
    }
    if (errorCode === "DISPATCH_TIMEOUT") {
      return "任务调度超时，已自动取消并释放 Token。";
    }
    return "生成任务超时，已自动取消并释放 Token。";
  }

  private async finalizeFailedJobAction(action: FailedStaleJobAction) {
    const job = await prisma.generationJob.findUnique({ where: { id: action.jobId } });
    if (!job || job.status !== "FAILED") return 0;

    const reservationBefore = action.creditReservationId
      ? await creditWalletRepository.findReservationById(action.creditReservationId)
      : null;

    await creditGenerationBillingService.syncJobBilling(job);

    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: action.ownerId,
      projectId: action.projectId,
      scheduleJob: scheduleGenerationJob
    });

    if (reservationBefore?.status !== "ACTIVE") return 0;

    const reservationAfter = action.creditReservationId
      ? await creditWalletRepository.findReservationById(action.creditReservationId)
      : null;
    return reservationAfter?.status === "RELEASED" ? action.estimatedCredits : 0;
  }

  private async finalizeRequeuedJobAction(action: RequeuedStaleJobAction) {
    await generationDispatcherService.dispatchAfterTerminal({
      ownerId: action.ownerId,
      projectId: action.projectId,
      scheduleJob: scheduleGenerationJob
    });
  }

  private async failStaleJob(job: GenerationJob, errorCode: FailedStaleJobAction["errorCode"]) {
    const updated = await prisma.generationJob.updateMany({
      where: {
        id: job.id,
        status: { in: INCOMPLETE_STATUSES }
      },
      data: {
        status: "FAILED",
        progress: 100,
        errorCode,
        errorMessage: this.failureCopy(errorCode),
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
    const current = await prisma.generationJob.findUnique({ where: { id: job.id } });
    if (!current || current.status !== "SUBMITTING") {
      return "failed";
    }

    const input = isRecord(current.input) ? current.input : {};
    const priorRequeues =
      typeof input.staleRequeueCount === "number" && Number.isInteger(input.staleRequeueCount)
        ? input.staleRequeueCount
        : 0;

    if (priorRequeues >= generationStaleJobPolicy.maxDispatchRequeues) {
      await this.failStaleJob(current, "DISPATCH_TIMEOUT");
      return "failed";
    }

    const updated = await prisma.generationJob.updateMany({
      where: { id: current.id, status: "SUBMITTING" },
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

    const requeued = await prisma.generationJob.findUnique({ where: { id: current.id } });
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

  private async listStaleCandidates(client: JobClient, limit: number) {
    const now = Date.now();
    const queuedCutoff = new Date(now - generationStaleJobPolicy.queueTimeoutMs);
    const dispatchCutoff = new Date(now - generationStaleJobPolicy.dispatchTimeoutMs);
    const processingCutoff = new Date(now - generationStaleJobPolicy.processingTimeoutMs);

    const [queuedStale, submittingStale, processingStale] = await Promise.all([
      client.generationJob.findMany({
        where: { status: "QUEUED", createdAt: { lt: queuedCutoff } },
        orderBy: { createdAt: "asc" },
        take: limit
      }),
      client.generationJob.findMany({
        where: { status: "SUBMITTING", createdAt: { lt: dispatchCutoff } },
        orderBy: { createdAt: "asc" },
        take: limit
      }),
      client.generationJob.findMany({
        where: {
          status: "PROCESSING",
          startedAt: { not: null, lt: processingCutoff }
        },
        orderBy: { startedAt: "asc" },
        take: limit
      })
    ]);

    return { queuedStale, submittingStale, processingStale };
  }

  private buildReaperActions(input: {
    queuedStale: GenerationJob[];
    submittingStale: GenerationJob[];
    processingStale: GenerationJob[];
  }): StaleJobAction[] {
    const actions: StaleJobAction[] = [];

    for (const job of input.queuedStale) {
      actions.push({
        type: "failed",
        jobId: job.id,
        ownerId: job.ownerId,
        projectId: job.creativeProjectId,
        estimatedCredits: job.estimatedCredits,
        creditReservationId: job.creditReservationId,
        errorCode: "QUEUE_TIMEOUT",
        errorMessage: this.failureCopy("QUEUE_TIMEOUT")
      });
    }

    for (const job of input.processingStale) {
      actions.push({
        type: "failed",
        jobId: job.id,
        ownerId: job.ownerId,
        projectId: job.creativeProjectId,
        estimatedCredits: job.estimatedCredits,
        creditReservationId: job.creditReservationId,
        errorCode: "PROCESSING_TIMEOUT",
        errorMessage: this.failureCopy("PROCESSING_TIMEOUT")
      });
    }

    for (const job of input.submittingStale) {
      const payload = isRecord(job.input) ? job.input : {};
      const priorRequeues =
        typeof payload.staleRequeueCount === "number" && Number.isInteger(payload.staleRequeueCount)
          ? payload.staleRequeueCount
          : 0;

      if (priorRequeues >= generationStaleJobPolicy.maxDispatchRequeues) {
        actions.push({
          type: "failed",
          jobId: job.id,
          ownerId: job.ownerId,
          projectId: job.creativeProjectId,
          estimatedCredits: job.estimatedCredits,
          creditReservationId: job.creditReservationId,
          errorCode: "DISPATCH_TIMEOUT",
          errorMessage: this.failureCopy("DISPATCH_TIMEOUT")
        });
      } else {
        actions.push({
          type: "requeued",
          jobId: job.id,
          ownerId: job.ownerId,
          projectId: job.creativeProjectId
        });
      }
    }

    return actions;
  }

  private async applyReaperAction(tx: Prisma.TransactionClient, action: StaleJobAction): Promise<boolean> {
    if (action.type === "failed") {
      const result = await tx.generationJob.updateMany({
        where: {
          id: action.jobId,
          status: { in: INCOMPLETE_STATUSES }
        },
        data: {
          status: "FAILED",
          progress: 100,
          errorCode: action.errorCode,
          errorMessage: action.errorMessage,
          completedAt: new Date()
        }
      });
      return result.count > 0;
    }

    const current = await tx.generationJob.findUnique({ where: { id: action.jobId } });
    if (!current || current.status !== "SUBMITTING") return false;

    const input = isRecord(current.input) ? current.input : {};
    const priorRequeues =
      typeof input.staleRequeueCount === "number" && Number.isInteger(input.staleRequeueCount)
        ? input.staleRequeueCount
        : 0;

    const result = await tx.generationJob.updateMany({
      where: { id: action.jobId, status: "SUBMITTING" },
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
    return result.count > 0;
  }

  async runStaleJobReaper(
    limit = generationStaleJobPolicy.sweepBatchLimit
  ): Promise<GenerationStaleReaperResult> {
    const startedAt = Date.now();

    const lockedPlan = await prisma.$transaction(
      async (tx) => {
        const lockRows = await tx.$queryRaw<{ locked: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(hashtext(${CRON_ADVISORY_LOCK_KEY})) AS locked
        `;
        if (!lockRows[0]?.locked) {
          return { lockAcquired: false as const };
        }

        const candidates = await this.listStaleCandidates(tx, limit);
        const scanned =
          candidates.queuedStale.length +
          candidates.submittingStale.length +
          candidates.processingStale.length;
        const actions = this.buildReaperActions(candidates);
        const appliedActions: StaleJobAction[] = [];

        for (const action of actions) {
          const applied = await this.applyReaperAction(tx, action);
          if (applied) appliedActions.push(action);
        }

        return { lockAcquired: true as const, scanned, actions: appliedActions };
      },
      { timeout: 120_000 }
    );

    if (!lockedPlan.lockAcquired) {
      return {
        ok: true,
        scanned: 0,
        requeued: 0,
        failed: 0,
        releasedCredits: 0,
        durationMs: Date.now() - startedAt
      };
    }

    let requeued = 0;
    let failed = 0;
    let releasedCredits = 0;

    for (const action of lockedPlan.actions) {
      if (action.type === "requeued") {
        await this.finalizeRequeuedJobAction(action);
        requeued += 1;
        continue;
      }

      releasedCredits += await this.finalizeFailedJobAction(action);
      failed += 1;
    }

    return {
      ok: true,
      scanned: lockedPlan.scanned,
      requeued,
      failed,
      releasedCredits,
      durationMs: Date.now() - startedAt
    };
  }

  async reconcileJobIfStale(jobId: string): Promise<boolean> {
    const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) return false;
    if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return false;
    }

    const now = Date.now();

    if (job.status === "QUEUED" && now - job.createdAt.getTime() >= generationStaleJobPolicy.queueTimeoutMs) {
      await this.failStaleJob(job, "QUEUE_TIMEOUT");
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
        await this.failStaleJob(job, "PROCESSING_TIMEOUT");
        return true;
      }
    }

    return false;
  }

  /** @deprecated Prefer runStaleJobReaper — kept for backward-compatible CLI callers. */
  async sweepStaleJobs(limit = generationStaleJobPolicy.sweepBatchLimit): Promise<GenerationStaleSweepResult> {
    const reaper = await this.runStaleJobReaper(limit);
    return {
      queueTimedOut: reaper.failed,
      dispatchRequeued: reaper.requeued,
      dispatchFailed: 0,
      processingTimedOut: 0
    };
  }
}

export const generationStaleJobService = new GenerationStaleJobService();
