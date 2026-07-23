import "server-only";

import type { Prisma } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { authService } from "@/features/auth/auth.service";
import { activityService } from "@/features/campaign/activity.service";
import { aiModelGenerationGuard } from "@/features/canvas/ai-model-generation.guard";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { finalizeCanvasGenerationJob } from "@/features/canvas/canvas-generation-learning";
import { resolveCanvasProjectForOwner } from "@/features/canvas/canvas-project-access";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { creditLedgerService } from "@/features/credit-wallet/credit-ledger.service";
import { assertVideoGenerationInfrastructure } from "@/features/video-engine/video-infrastructure";
import { videoOrchestrator } from "@/features/video-engine/video-orchestrator";
import type {
  VideoGenerationCreateInput,
  VideoGenerationCreateResult,
  VideoOrchestratorJob
} from "@/features/video-engine/video-generation.types";
import { resolveVideoProviderId } from "@/features/video-engine/video-provider.registry";
import { scheduleCanvasBackgroundWork } from "@/lib/canvas/schedule-background-work";
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

    const resolved = await aiModelGenerationGuard.resolveForGeneration({
      type: "VIDEO",
      model: input.model,
      parameters: input.parameters
    });

    const billing = await creditGenerationBillingService.reserveForGeneration({
      userId: user.id,
      type: "VIDEO",
      model: resolved.internalModelId,
      parameters: input.parameters,
      idempotencyKey: input.idempotencyKey,
      campaignId: project.campaignId
    });

    const provider = resolveVideoProviderId(resolved.provider, resolved.internalModelId);
    const job = await canvasRepository.createGenerationJob({
      creativeProjectId: project.id,
      campaignId: project.campaignId,
      canvasId,
      ownerId: user.id,
      nodeId: input.nodeId,
      type: "VIDEO",
      provider,
      model: resolved.internalModelId,
      aiModelId: resolved.recordId,
      modelDisplayName: resolved.displayName,
      prompt: input.prompt,
      payload: input.parameters as Prisma.InputJsonValue,
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

    try {
      if (job.status === "QUEUED") {
        this.scheduleJob(job.id, user.id);
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

    if (project.campaignId) {
      const activityType =
        provider === "seedance"
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

  kickStaleJob(
    job: {
      id: string;
      type: "IMAGE" | "VIDEO" | "MUSIC";
      provider: string;
      status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
      createdAt: Date;
    },
    ownerId: string
  ) {
    if (job.type !== "VIDEO" || job.provider !== "seedance") return;
    if (job.status !== "QUEUED" && job.status !== "SUBMITTING") return;
    if (Date.now() - job.createdAt.getTime() < 1500) return;
    this.scheduleJob(job.id, ownerId);
  }

  async processJob(jobId: string, ownerId: string) {
    let user: AuthUserDto | null = null;

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
      const claimed = await canvasRepository.claimGenerationJob(jobId, ownerId, { progress: 15 });
      if (!claimed || claimed.type !== "VIDEO") return;

      const orchestratorJob: VideoOrchestratorJob = {
        id: claimed.id,
        type: "VIDEO",
        provider: claimed.provider,
        model: claimed.model,
        prompt: claimed.prompt,
        input: claimed.input,
        nodeId: claimed.nodeId,
        creativeProjectId: claimed.creativeProjectId,
        estimatedCredits: claimed.estimatedCredits
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
      const message = error instanceof Error ? error.message : "Failed to generate video";
      logger.error("Video generation crashed", {
        service: "VideoGenerationService",
        jobId,
        ownerId,
        error: message
      });
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "VIDEO_GENERATION_CRASHED",
        errorMessage: message,
        completedAt: new Date()
      });
    } finally {
      await finalizeCanvasGenerationJob(user, jobId, ownerId);
    }
  }
}

export const videoGenerationService = new VideoGenerationService();
