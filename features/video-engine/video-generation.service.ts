import "server-only";

import type { Prisma } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { authService } from "@/features/auth/auth.service";
import { activityService } from "@/features/campaign/activity.service";
import { aiModelGenerationGuard } from "@/features/canvas/ai-model-generation.guard";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { canvasGenerationReferenceService } from "@/features/canvas/canvas-generation-reference.service";
import { finalizeCanvasGenerationJob } from "@/features/canvas/canvas-generation-learning";
import { resolveCanvasProjectForOwner } from "@/features/canvas/canvas-project-access";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { creditLedgerService } from "@/features/credit-wallet/credit-ledger.service";
import { generationConcurrencyService } from "@/features/generation/concurrency/generation-concurrency.service";
import { assertVideoGenerationInfrastructure, assertVideoReferenceInfrastructure } from "@/features/video-engine/video-infrastructure";
import { claimVideoGenerationJobWithAttempt } from "@/features/video-engine/video-job-claim.repository";
import { videoJobAuditService } from "@/features/video-engine/video-job-audit.service";
import { videoOrchestrator } from "@/features/video-engine/video-orchestrator";
import type {
  VideoGenerationCreateInput,
  VideoGenerationCreateResult,
  VideoOrchestratorJob
} from "@/features/video-engine/video-generation.types";
import { resolveVideoProviderRouting } from "@/features/video-engine/video-provider.registry";
import {
  sanitizeVideoGenerationJobError,
  userFacingGenerationErrorMessage
} from "@/features/video-engine/video-generation.errors";
import { scheduleCanvasBackgroundWork } from "@/lib/canvas/schedule-background-work";
import { maybeScheduleGenerationJob } from "@/lib/canvas/schedule-generation-job";
import { appError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

async function abortVideoGenerationJob(input: {
  jobId: string;
  reservationId: string;
  campaignId: string | null;
  errorCode: string;
  errorMessage: string;
}) {
  await canvasRepository.updateGenerationJob(input.jobId, {
    status: "FAILED",
    progress: 100,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    completedAt: new Date()
  });
  await creditGenerationBillingService.finalizeFailure(input.reservationId, {
    campaignId: input.campaignId,
    generationJobId: input.jobId,
    reason: input.errorCode
  });
}

function toVideoJobRecord(job: {
  id: string;
  nodeId: string | null;
  type: "IMAGE" | "VIDEO" | "MUSIC";
  status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress: number;
  outputAssetId: string | null;
  errorMessage: string | null;
  estimatedCredits: number;
  provider: string;
}): VideoGenerationCreateResult["job"] {
  if (job.type !== "VIDEO") {
    throw appError("SYSTEM_ERROR", "Expected video generation job");
  }
  return {
    id: job.id,
    nodeId: job.nodeId,
    type: "VIDEO",
    status: job.status,
    progress: job.progress,
    outputAssetId: job.outputAssetId,
    errorMessage: job.errorMessage,
    estimatedCredits: job.estimatedCredits,
    provider: job.provider
  };
}

export class VideoGenerationService {
  async createJob(
    input: VideoGenerationCreateInput,
    user: AuthUserDto
  ): Promise<VideoGenerationCreateResult> {
    assertVideoGenerationInfrastructure(input.model);

    const project = await resolveCanvasProjectForOwner(input.projectId, user);
    const { id: canvasId } = await canvasRepository.ensureCanvas(
      project.id,
      user.id,
      project.campaignId
    );

    const normalizedParameters =
      await canvasGenerationReferenceService.normalizeGenerationReferenceParameters(
        user,
        project.id,
        input.parameters
      );

    assertVideoReferenceInfrastructure(normalizedParameters);

    const resolved = await aiModelGenerationGuard.resolveForGeneration({
      type: "VIDEO",
      model: input.model,
      parameters: normalizedParameters
    });

    const routing = resolveVideoProviderRouting(resolved.provider, resolved.internalModelId);
    if (!routing.providerId) {
      throw appError(
        "SYSTEM_ERROR",
        routing.reason === "SEEDANCE_NOT_CONFIGURED"
          ? "SEEDANCE_API_KEY is not configured. Add it to .env.local (dev) or Vercel environment variables and redeploy."
          : "No video provider is available for this model."
      );
    }

    await generationConcurrencyService.assertCanCreateJob({
      userId: user.id,
      projectId: project.id,
      type: "VIDEO",
      provider: routing.providerId
    });

    const billing = await creditGenerationBillingService.reserveForGeneration({
      userId: user.id,
      type: "VIDEO",
      model: resolved.internalModelId,
      parameters: normalizedParameters,
      idempotencyKey: input.idempotencyKey,
      campaignId: project.campaignId
    });

    const { job, created } = await canvasRepository.createGenerationJob({
      creativeProjectId: project.id,
      campaignId: project.campaignId,
      canvasId,
      ownerId: user.id,
      nodeId: input.nodeId,
      type: "VIDEO",
      provider: routing.providerId,
      model: resolved.internalModelId,
      aiModelId: resolved.recordId,
      modelDisplayName: resolved.displayName,
      prompt: input.prompt,
      payload: normalizedParameters as Prisma.InputJsonValue,
      idempotencyKey: input.idempotencyKey,
      estimatedCredits: billing.estimatedCredits,
      creditReservationId: billing.reservation.id,
      pricingRuleId: billing.quote.ruleId,
      pricingRuleVersion: billing.quote.ruleVersion,
      creditsQuoted: billing.quote.credits,
      providerCostSnapshot: {
        providerCostMinor: billing.quote.providerCostMinor,
        outputCount: billing.quote.outputCount
      } as Prisma.InputJsonValue,
      pricingSnapshot: billing.pricingSnapshot as Prisma.InputJsonValue,
      quotedAt: new Date(billing.quote.quotedAt)
    });

    await creditLedgerService.linkReservationToJob(billing.reservation.id, job.id);

    if (created) {
      await videoJobAuditService.recordJobCreated({
        generationJobId: job.id,
        prompt: input.prompt,
        routing: {
          generationJobId: job.id,
          requestedModel: resolved.internalModelId,
          resolvedProvider: routing.providerId,
          resolvedModel: routing.resolvedModel,
          reason: routing.reason,
          metadata: {
            displayName: resolved.displayName,
            provider: resolved.provider
          }
        }
      });
    }

    try {
      if (created && job.status === "QUEUED") {
        await maybeScheduleGenerationJob({
          type: "VIDEO",
          provider: routing.providerId,
          jobId: job.id,
          ownerId: user.id,
          projectId: project.id
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start generation";
      await abortVideoGenerationJob({
        jobId: job.id,
        reservationId: billing.reservation.id,
        campaignId: project.campaignId,
        errorCode: "SCHEDULE_FAILED",
        errorMessage: message
      });
      throw appError("SYSTEM_ERROR", message);
    }

    if (created && project.campaignId) {
      const activityType =
        routing.providerId === "seedance"
          ? "canvas.video_generation_requested"
          : "canvas.mock_generation_requested";
      await activityService.write(
        project.campaignId,
        activityType,
        { userId: user.id, email: user.email, role: "creator" },
        { job_id: job.id, node_id: input.nodeId, type: "VIDEO" }
      );
    }

    return {
      job: toVideoJobRecord(job),
      chargedCredits: billing.estimatedCredits
    };
  }

  scheduleJob(jobId: string, ownerId: string) {
    scheduleCanvasBackgroundWork("VideoGenerationService.processJob", () => {
      void this.processJob(jobId, ownerId).catch((error) => {
        logger.error("Video generation worker failed", {
          service: "VideoGenerationService",
          jobId,
          ownerId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    });
  }

  async processJob(jobId: string, ownerId: string) {
    let user: AuthUserDto | null = null;
    let attemptId: string | null = null;

    try {
      user = await authService.getUserById(ownerId);
      if (!user) {
        await canvasRepository.updateGenerationJob(jobId, {
          status: "FAILED",
          progress: 100,
          errorCode: "OWNER_NOT_FOUND",
          errorMessage: "Generation owner not found",
          completedAt: new Date()
        });
        return;
      }

      const owner: AuthUserDto = user;
      const claimed = await claimVideoGenerationJobWithAttempt({
        jobId,
        ownerId,
        progress: 15
      });
      if (!claimed || claimed.job.type !== "VIDEO") return;

      attemptId = claimed.attempt.id;

      const orchestratorJob: VideoOrchestratorJob = {
        id: claimed.job.id,
        type: "VIDEO",
        provider: claimed.job.provider,
        model: claimed.job.model,
        prompt: claimed.job.prompt,
        input: claimed.job.input,
        nodeId: claimed.job.nodeId,
        creativeProjectId: claimed.job.creativeProjectId,
        estimatedCredits: claimed.job.estimatedCredits,
        attemptId: claimed.attempt.id,
        attemptNumber: claimed.attempt.attemptNumber
      };

      await videoOrchestrator.runJob(owner, orchestratorJob, {
        progress: {
          markProcessing: async ({ taskId, progress }) => {
            await canvasRepository.updateGenerationJob(jobId, {
              status: "PROCESSING",
              progress,
              providerTaskId: taskId
            });
          },
          markPollComplete: async () => {
            await canvasRepository.updateGenerationJob(jobId, {
              status: "PROCESSING",
              progress: 88
            });
          },
          markSucceeded: async ({ outputAssetId, actualCredits }) => {
            await canvasRepository.updateGenerationJob(jobId, {
              status: "SUCCEEDED",
              progress: 100,
              outputAssetId,
              actualCredits,
              completedAt: new Date()
            });
          },
          markFailed: async ({ errorCode, errorMessage }) => {
            await canvasRepository.updateGenerationJob(jobId, {
              status: "FAILED",
              progress: 100,
              errorCode,
              errorMessage,
              completedAt: new Date()
            });
          }
        },
        storage: {
          saveGeneratedVideo: async ({ projectId, buffer, mimeType, fileName, metadata }) => {
            const asset = await canvasAssetService.saveGeneratedVideoBuffer(projectId, owner, {
              buffer,
              mimeType,
              fileName,
              metadata
            });
            return { id: asset.id };
          }
        }
      });
    } catch (error) {
      const sanitized = sanitizeVideoGenerationJobError(error, "VIDEO_GENERATION_CRASHED");
      logger.error("Video generation crashed", {
        service: "VideoGenerationService",
        jobId,
        ownerId,
        attemptId,
        errorCode: sanitized.errorCode,
        error: sanitized.logMessage
      });
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: sanitized.errorCode,
        errorMessage: userFacingGenerationErrorMessage(sanitized, "zh"),
        completedAt: new Date()
      });
      if (attemptId) {
        await videoJobAuditService.markAttemptFailed({
          generationJobId: jobId,
          attemptId,
          errorCode: sanitized.errorCode
        });
      }
    } finally {
      await finalizeCanvasGenerationJob(user, jobId, ownerId);
    }
  }
}

export const videoGenerationService = new VideoGenerationService();
