import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import type {
  VideoJobAuditEventInput,
  VideoPromptVersionInput,
  VideoRoutingDecisionInput
} from "@/features/video-engine/video-job-audit.types";

export const videoJobAuditRepository = {
  createEvent(input: VideoJobAuditEventInput) {
    return prisma.generationJobEvent.create({
      data: {
        generationJobId: input.generationJobId,
        eventType: input.eventType,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus ?? null,
        progress: input.progress ?? null,
        payload: (input.payload ?? undefined) as Prisma.InputJsonValue | undefined
      }
    });
  },

  createRoutingDecision(input: VideoRoutingDecisionInput) {
    return prisma.videoRoutingDecision.create({
      data: {
        generationJobId: input.generationJobId,
        requestedModel: input.requestedModel,
        resolvedProvider: input.resolvedProvider,
        resolvedModel: input.resolvedModel,
        reason: input.reason,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined
      }
    });
  },

  createPromptVersion(input: VideoPromptVersionInput) {
    return prisma.videoPromptVersion.create({
      data: {
        generationJobId: input.generationJobId,
        version: input.version,
        source: input.source,
        prompt: input.prompt,
        providerPrompt: input.providerPrompt ?? null
      }
    });
  },

  updatePromptVersionProviderPrompt(generationJobId: string, version: number, providerPrompt: string) {
    return prisma.videoPromptVersion.update({
      where: {
        generationJobId_version: {
          generationJobId,
          version
        }
      },
      data: { providerPrompt }
    });
  },

  updateAttempt(input: {
    attemptId: string;
    status: string;
    providerTaskId?: string | null;
    errorCode?: string | null;
    finishedAt?: Date | null;
  }) {
    return prisma.generationJobAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: input.status,
        providerTaskId: input.providerTaskId,
        errorCode: input.errorCode,
        finishedAt: input.finishedAt
      }
    });
  }
};
