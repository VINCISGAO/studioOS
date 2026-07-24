import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { VIDEO_JOB_EVENT_TYPES } from "@/features/video-engine/video-job-audit.types";

export type ClaimedVideoGenerationJob = {
  job: {
    id: string;
    ownerId: string;
    type: "IMAGE" | "VIDEO" | "MUSIC";
    provider: string;
    model: string;
    prompt: string;
    input: Prisma.JsonValue;
    nodeId: string | null;
    creativeProjectId: string;
    estimatedCredits: number;
    status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  };
  attempt: {
    id: string;
    generationJobId: string;
    attemptNumber: number;
    provider: string;
    providerTaskId: string | null;
    status: string;
  };
};

/**
 * Claim a queued video job and create its worker attempt.
 *
 * IMPORTANT: No interactive Prisma transaction here. Long-running provider calls
 * (Seedance submit/poll) happen later in VideoOrchestrator, outside any tx.
 * Interactive transactions on pooled/serverless Postgres (Neon) can expire with
 * "Transaction not found" even for short callbacks.
 */
export async function claimVideoGenerationJobWithAttempt(input: {
  jobId: string;
  ownerId: string;
  progress?: number;
}): Promise<ClaimedVideoGenerationJob | null> {
  const progress = input.progress ?? 10;

  const existing = await prisma.generationJob.findFirst({
    where: {
      id: input.jobId,
      ownerId: input.ownerId,
      status: { in: ["QUEUED", "SUBMITTING"] }
    }
  });
  if (!existing) return null;

  const claimed = await prisma.generationJob.updateMany({
    where: {
      id: input.jobId,
      ownerId: input.ownerId,
      status: { in: ["QUEUED", "SUBMITTING"] }
    },
    data: {
      status: "PROCESSING",
      progress,
      startedAt: new Date()
    }
  });
  if (claimed.count === 0) return null;

  async function rollbackClaim() {
    await prisma.generationJob.updateMany({
      where: {
        id: input.jobId,
        ownerId: input.ownerId,
        status: "PROCESSING",
        providerTaskId: null
      },
      data: {
        status: "QUEUED",
        progress: 0,
        startedAt: null
      }
    });
  }

  try {
    const lastAttemptNumber = await prisma.generationJobAttempt.aggregate({
      where: { generationJobId: input.jobId },
      _max: { attemptNumber: true }
    });
    const attemptNumber = (lastAttemptNumber._max.attemptNumber ?? 0) + 1;

    const attempt = await prisma.generationJobAttempt.create({
      data: {
        generationJobId: input.jobId,
        attemptNumber,
        provider: existing.provider,
        status: "RUNNING"
      }
    });

    await prisma.generationJobEvent.create({
      data: {
        generationJobId: input.jobId,
        eventType: VIDEO_JOB_EVENT_TYPES.JOB_CLAIMED,
        fromStatus: existing.status,
        toStatus: "PROCESSING",
        progress,
        payload: {
          attemptId: attempt.id,
          attemptNumber
        }
      }
    });

    const job = await prisma.generationJob.findFirstOrThrow({
      where: { id: input.jobId, ownerId: input.ownerId }
    });

    return {
      job: {
        id: job.id,
        ownerId: job.ownerId,
        type: job.type,
        provider: job.provider,
        model: job.model,
        prompt: job.prompt,
        input: job.input,
        nodeId: job.nodeId,
        creativeProjectId: job.creativeProjectId,
        estimatedCredits: job.estimatedCredits,
        status: job.status
      },
      attempt: {
        id: attempt.id,
        generationJobId: attempt.generationJobId,
        attemptNumber: attempt.attemptNumber,
        provider: attempt.provider,
        providerTaskId: attempt.providerTaskId,
        status: attempt.status
      }
    };
  } catch (error) {
    await rollbackClaim().catch(() => undefined);
    throw error;
  }
}
