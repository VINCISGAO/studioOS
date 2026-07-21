import { after } from "next/server";
import { authService } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import {
  buildDirectImageEditPrompt,
  buildDirectImageGenerationPrompt,
  editOpenAIImage,
  generateOpenAIImage
} from "@/lib/canvas/openai-image-generation";
import { hasOpenAI } from "@/lib/core/config/ai";
import { logger } from "@/lib/core/logger";

type ImageJobInput = {
  referenceAssetId?: string;
  referenceUrl?: string;
  referenceNodeId?: string;
};

function readImageJobInput(raw: unknown): ImageJobInput {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  return {
    referenceAssetId:
      typeof record.referenceAssetId === "string" ? record.referenceAssetId : undefined,
    referenceUrl: typeof record.referenceUrl === "string" ? record.referenceUrl : undefined,
    referenceNodeId:
      typeof record.referenceNodeId === "string" ? record.referenceNodeId : undefined
  };
}

export class CanvasImageGenerationService {
  scheduleJob(jobId: string, ownerId: string) {
    const run = () => {
      void this.processJob(jobId, ownerId).catch((error) => {
        logger.error("Canvas image generation failed", {
          service: "CanvasImageGenerationService",
          jobId,
          ownerId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };

    try {
      after(run);
    } catch {
      run();
    }
  }

  async processJob(jobId: string, ownerId: string) {
    const job = await canvasRepository.findGenerationJob(jobId, ownerId);
    if (!job || job.type !== "IMAGE") return;
    if (job.status !== "QUEUED" && job.status !== "SUBMITTING") return;

    const user = await authService.getUserById(ownerId);
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

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 20,
      startedAt: new Date()
    });

    if (!hasOpenAI()) {
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "OPENAI_NOT_CONFIGURED",
        errorMessage: "OPENAI_API_KEY is not configured",
        completedAt: new Date()
      });
      return;
    }

    const locale = user.languageCode.startsWith("zh") ? "zh" : "en";
    const payload = readImageJobInput(job.input);
    const referenceAssetId = payload.referenceAssetId?.trim();
    const imagePrompt = referenceAssetId
      ? buildDirectImageEditPrompt(job.prompt, locale)
      : buildDirectImageGenerationPrompt(job.prompt, locale);

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 45
    });

    let generated;
    if (referenceAssetId) {
      try {
        const reference = await canvasAssetService.loadBuffer(referenceAssetId, user);
        if (!reference.mimeType.startsWith("image/")) {
          await canvasRepository.updateGenerationJob(jobId, {
            status: "FAILED",
            progress: 100,
            errorCode: "INVALID_REFERENCE",
            errorMessage: locale === "zh" ? "参考图必须是图片文件" : "Reference must be an image file",
            completedAt: new Date()
          });
          return;
        }
        generated = await editOpenAIImage({
          buffer: reference.buffer,
          mimeType: reference.mimeType,
          prompt: imagePrompt,
          locale
        });
      } catch (error) {
        await canvasRepository.updateGenerationJob(jobId, {
          status: "FAILED",
          progress: 100,
          errorCode: "REFERENCE_LOAD_FAILED",
          errorMessage: error instanceof Error ? error.message : "Failed to load reference image",
          completedAt: new Date()
        });
        return;
      }
    } else {
      generated = await generateOpenAIImage(imagePrompt, locale);
    }

    if (!generated.ok) {
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "OPENAI_FAILED",
        errorMessage: generated.error,
        completedAt: new Date()
      });
      return;
    }

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 80
    });

    try {
      const asset = await canvasAssetService.saveGeneratedBuffer(job.creativeProjectId, user, {
        buffer: generated.buffer,
        mimeType: generated.mimeType,
        fileName: "canvas-generated-image.png",
        metadata: {
          prompt: imagePrompt,
          userPrompt: job.prompt,
          model: generated.model,
          referenceAssetId: referenceAssetId ?? null,
          mode: referenceAssetId ? "image_to_image" : "text_to_image",
          generationJobId: job.id,
          nodeId: job.nodeId
        }
      });

      await canvasRepository.updateGenerationJob(jobId, {
        status: "SUCCEEDED",
        progress: 100,
        outputAssetId: asset.id,
        actualCredits: job.estimatedCredits,
        completedAt: new Date()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to store generated image";
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "STORAGE_FAILED",
        errorMessage: message,
        completedAt: new Date()
      });
    }
  }
}

export const canvasImageGenerationService = new CanvasImageGenerationService();
