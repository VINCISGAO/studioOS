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

export async function claimVideoGenerationJobWithAttempt(input: {
  jobId: string;
  ownerId: string;
  progress?: number;
}): Promise<ClaimedVideoGenerationJob | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.generationJob.findFirst({
      where: {
        id: input.jobId,
        ownerId: input.ownerId,
        status: { in: ["QUEUED", "SUBMITTING"] }
      }
    });
    if (!existing) return null;

    const updatedCount = await tx.generationJob.updateMany({
      where: {
        id: input.jobId,
        ownerId: input.ownerId,
        status: { in: ["QUEUED", "SUBMITTING"] }
      },
      data: {
        status: "PROCESSING",
        progress: input.progress ?? 10,
        startedAt: new Date()
      }
    });
    if (updatedCount.count === 0) return null;

    const lastAttempt = await tx.generationJobAttempt.findFirst({
      where: { generationJobId: input.jobId },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true }
    });
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    const attempt = await tx.generationJobAttempt.create({
      data: {
        generationJobId: input.jobId,
        attemptNumber,
        provider: existing.provider,
        status: "RUNNING"
      }
    });

    await tx.generationJobEvent.create({
      data: {
        generationJobId: input.jobId,
        eventType: VIDEO_JOB_EVENT_TYPES.JOB_CLAIMED,
        fromStatus: existing.status,
        toStatus: "PROCESSING",
        progress: input.progress ?? 10,
        payload: {
          attemptId: attempt.id,
          attemptNumber
        }
      }
    });

    const job = await tx.generationJob.findFirstOrThrow({
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
  });
}
