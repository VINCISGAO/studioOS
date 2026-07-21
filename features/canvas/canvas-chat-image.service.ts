import { aiUsageQuotaService } from "@/features/abuse/ai-usage-quota.service";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { recordCanvasChatLucienLearning } from "@/features/canvas/canvas-chat-learning";
import { canvasService } from "@/features/canvas/canvas.service";
import { canvasChatImageCopy } from "@/lib/canvas/chat-image-intent";
import {
  buildDirectImageEditPrompt,
  buildDirectImageGenerationPrompt,
  editOpenAIImage,
  generateOpenAIImage
} from "@/lib/canvas/openai-image-generation";
import { appError } from "@/lib/core/errors";
import { hasOpenAI } from "@/lib/core/config/ai";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import { asInputJson } from "@/lib/core/prisma-json";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

function localeFromLanguageCode(languageCode?: string | null): "en" | "zh" {
  const normalized = normalizeLanguageCode(languageCode ?? "en");
  return normalized.startsWith("zh") ? "zh" : "en";
}

function storageUnavailableMessage(locale: "en" | "zh") {
  return locale === "zh"
    ? "生产环境未配置对象存储（R2），无法保存生成的图片。请在 Vercel 配置 R2_ENDPOINT、R2_ACCESS_KEY、R2_SECRET_KEY、R2_BUCKET 后重新部署。"
    : "Object storage (R2) is not configured in production. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, and R2_BUCKET in Vercel, then redeploy.";
}

function assertChatImageInfrastructure(locale: "en" | "zh") {
  if (!hasOpenAI()) return copyForLocale(locale).unconfigured;
  if (!isObjectStorageConfigured() && !canPersistLocalDataStore()) {
    return storageUnavailableMessage(locale);
  }
  return null;
}

function copyForLocale(locale: "en" | "zh") {
  return canvasChatImageCopy(locale);
}

async function learnCanvasChatTurn(
  user: AuthUserDto,
  input: {
    projectId: string;
    sessionId: string;
    messageId: string;
    userMessage: string;
    assistantAnswer: string;
    answerMode: string;
    languageCode?: string | null;
  }
) {
  await recordCanvasChatLucienLearning(user, {
    projectId: input.projectId,
    sessionId: input.sessionId,
    messageId: input.messageId,
    userMessage: input.userMessage,
    assistantAnswer: input.assistantAnswer,
    answerMode: input.answerMode,
    languageCode: input.languageCode
  });
}

export class CanvasChatImageService {
  async generateFromChat(
    user: AuthUserDto,
    input: {
      projectId: string;
      message: string;
      sessionId?: string | null;
      languageCode?: string | null;
      referenceAssetId?: string | null;
    }
  ) {
    await canvasService.assertAccess(input.projectId, user);
    if (!aiCopilotRepository.isEnabled()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const locale = localeFromLanguageCode(input.languageCode);
    const copy = canvasChatImageCopy(locale === "zh" ? "zh" : "en");
    const role = normalizeCopilotRole(user);
    const userMessage =
      input.message.trim() ||
      (locale === "zh" ? "根据参考图生成图片" : "Generate image from reference");
    const session = input.sessionId
      ? await aiCopilotRepository.getSession(input.sessionId)
      : await aiCopilotRepository.createSession({
          userId: user.id,
          role,
          title: input.message.trim().slice(0, 80)
        });

    if (!session || session.userId !== user.id) {
      throw appError("NOT_FOUND", "AI Copilot session not found");
    }

    await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: user.id,
      role: "USER",
      content: userMessage,
      metadataJson: asInputJson({
        pagePath: `/studio/canvas/${input.projectId}`,
        entityType: "canvas",
        entityId: input.projectId,
        languageCode: input.languageCode ?? null,
        referenceAssetId: input.referenceAssetId ?? null
      })
    });

    const infrastructureError = assertChatImageInfrastructure(locale);
    if (infrastructureError) {
      const answer = infrastructureError;
      const assistantMessage = await aiCopilotRepository.createMessage({
        sessionId: session.id,
        userId: null,
        role: "ASSISTANT",
        content: answer,
        metadataJson: asInputJson({
          answerMode: infrastructureError === copy.unconfigured ? "model_unconfigured" : "storage_unconfigured"
        })
      });
      await aiCopilotRepository.touchSession(session.id);
      await learnCanvasChatTurn(user, {
        projectId: input.projectId,
        sessionId: session.id,
        messageId: assistantMessage.id,
        userMessage,
        assistantAnswer: answer,
        answerMode:
          infrastructureError === copy.unconfigured ? "model_unconfigured" : "storage_unconfigured",
        languageCode: input.languageCode
      });
      return {
        sessionId: session.id,
        messageId: assistantMessage.id,
        answer,
        answerMode:
          infrastructureError === copy.unconfigured
            ? ("model_unconfigured" as const)
            : ("storage_unconfigured" as const),
        modelConfigured: infrastructureError !== copy.unconfigured,
        participants: ["gpt", "lucien_learning"] as const
      };
    }

    const quota = await aiUsageQuotaService.assertCampaignQuota({
      userId: user.id,
      campaignId: null,
      category: "copilot_qa"
    });
    if (!quota.ok) {
      const answer = copy.quota;
      const assistantMessage = await aiCopilotRepository.createMessage({
        sessionId: session.id,
        userId: null,
        role: "ASSISTANT",
        content: answer,
        metadataJson: asInputJson({ answerMode: "quota_exceeded", quotaCode: quota.code })
      });
      await aiCopilotRepository.touchSession(session.id);
      await learnCanvasChatTurn(user, {
        projectId: input.projectId,
        sessionId: session.id,
        messageId: assistantMessage.id,
        userMessage,
        assistantAnswer: answer,
        answerMode: "quota_exceeded",
        languageCode: input.languageCode
      });
      return {
        sessionId: session.id,
        messageId: assistantMessage.id,
        answer,
        answerMode: "quota_exceeded" as const,
        modelConfigured: true,
        participants: ["gpt", "lucien_learning"] as const
      };
    }

    const hasReference = Boolean(input.referenceAssetId?.trim());
    const imagePrompt = hasReference
      ? buildDirectImageEditPrompt(input.message, locale)
      : buildDirectImageGenerationPrompt(input.message, locale);

    let generated;
    if (hasReference && input.referenceAssetId) {
      const reference = await canvasAssetService.loadBuffer(input.referenceAssetId, user);
      if (!reference.mimeType.startsWith("image/")) {
        const answer = locale === "zh" ? "参考图必须是图片文件。" : "Reference must be an image file.";
        const assistantMessage = await aiCopilotRepository.createMessage({
          sessionId: session.id,
          userId: null,
          role: "ASSISTANT",
          content: answer,
          metadataJson: asInputJson({ answerMode: "image_generation_failed" })
        });
        await aiCopilotRepository.touchSession(session.id);
        await learnCanvasChatTurn(user, {
          projectId: input.projectId,
          sessionId: session.id,
          messageId: assistantMessage.id,
          userMessage,
          assistantAnswer: answer,
          answerMode: "image_generation_failed",
          languageCode: input.languageCode
        });
        return {
          sessionId: session.id,
          messageId: assistantMessage.id,
          answer,
          answerMode: "image_generation_failed" as const,
          modelConfigured: true,
          participants: ["gpt", "lucien_learning"] as const
        };
      }
      generated = await editOpenAIImage({
        buffer: reference.buffer,
        mimeType: reference.mimeType,
        prompt: imagePrompt,
        locale
      });
    } else {
      generated = await generateOpenAIImage(imagePrompt, locale);
    }

    if (!generated.ok) {
      const answer = `${copy.failed}\n\n${generated.error}`;
      const assistantMessage = await aiCopilotRepository.createMessage({
        sessionId: session.id,
        userId: null,
        role: "ASSISTANT",
        content: answer,
        metadataJson: asInputJson({ answerMode: "image_generation_failed", imagePrompt })
      });
      await aiCopilotRepository.touchSession(session.id);
      await learnCanvasChatTurn(user, {
        projectId: input.projectId,
        sessionId: session.id,
        messageId: assistantMessage.id,
        userMessage,
        assistantAnswer: answer,
        answerMode: "image_generation_failed",
        languageCode: input.languageCode
      });
      return {
        sessionId: session.id,
        messageId: assistantMessage.id,
        answer,
        answerMode: "image_generation_failed" as const,
        modelConfigured: true,
        participants: ["gpt", "lucien_learning"] as const
      };
    }

    let asset;
    try {
      asset = await canvasAssetService.saveGeneratedBuffer(input.projectId, user, {
        buffer: generated.buffer,
        mimeType: generated.mimeType,
        fileName: "canvas-chat-image.png",
        metadata: {
          prompt: imagePrompt,
          userMessage: input.message.trim(),
          model: generated.model,
          referenceAssetId: input.referenceAssetId ?? null,
          mode: hasReference ? "image_to_image" : "text_to_image"
        }
      });
    } catch (error) {
      const storageMessage =
        error instanceof Error && error.message.includes("Durable object storage")
          ? storageUnavailableMessage(locale)
          : error instanceof Error
            ? error.message
            : storageUnavailableMessage(locale);
      const answer = `${copy.failed}\n\n${storageMessage}`;
      const assistantMessage = await aiCopilotRepository.createMessage({
        sessionId: session.id,
        userId: null,
        role: "ASSISTANT",
        content: answer,
        metadataJson: asInputJson({ answerMode: "image_generation_failed", imagePrompt })
      });
      await aiCopilotRepository.touchSession(session.id);
      await learnCanvasChatTurn(user, {
        projectId: input.projectId,
        sessionId: session.id,
        messageId: assistantMessage.id,
        userMessage,
        assistantAnswer: answer,
        answerMode: "image_generation_failed",
        languageCode: input.languageCode
      });
      return {
        sessionId: session.id,
        messageId: assistantMessage.id,
        answer,
        answerMode: "image_generation_failed" as const,
        modelConfigured: true,
        participants: ["gpt", "lucien_learning"] as const
      };
    }

    const answerMode = hasReference ? "image_to_image" : "image_generation";
    const answer = hasReference ? copy.successFromReference : copy.success;
    const assistantMessage = await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: null,
      role: "ASSISTANT",
      content: answer,
      metadataJson: asInputJson({
        answerMode,
        imagePrompt,
        imageUrl: asset.url,
        assetId: asset.id,
        model: generated.model,
        referenceAssetId: input.referenceAssetId ?? null
      })
    });
    await aiCopilotRepository.touchSession(session.id);
    await learnCanvasChatTurn(user, {
      projectId: input.projectId,
      sessionId: session.id,
      messageId: assistantMessage.id,
      userMessage,
      assistantAnswer: answer,
      answerMode,
      languageCode: input.languageCode
    });

    return {
      sessionId: session.id,
      messageId: assistantMessage.id,
      answer,
      imageUrl: asset.url,
      assetId: asset.id,
      answerMode: hasReference ? ("image_to_image" as const) : ("image_generation" as const),
      modelConfigured: true,
      participants: ["gpt", "lucien_learning"] as const
    };
  }
}

export const canvasChatImageService = new CanvasChatImageService();
