import "server-only";

import { aiUsageQuotaService } from "@/features/abuse/ai-usage-quota.service";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { canvasPromptKnowledgeService } from "@/features/ai-copilot/canvas-prompt-knowledge.service";
import {
  gptPromptAnswerMode,
  recordGptPromptLucienLearning
} from "@/features/ai-copilot/gpt-prompt-lucien-learning.service";
import { canvasService } from "@/features/canvas/canvas.service";
import type { AuthUserDto } from "@/features/auth/auth.service";
import {
  CANVAS_PROMPT_ENHANCE_MAX_LENGTH,
  canvasPromptEnhanceSystemPrompt,
  normalizeEnhancedPrompt,
  type CanvasPromptEnhanceField
} from "@/lib/canvas/prompt-enhance";
import { hasOpenAI } from "@/lib/core/config/ai";
import { appError } from "@/lib/core/errors";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

function localeFromLanguageCode(languageCode?: string | null): "en" | "zh" {
  const normalized = normalizeLanguageCode(languageCode ?? "en");
  return normalized.startsWith("zh") ? "zh" : "en";
}

function emptyPromptMessage(field: CanvasPromptEnhanceField, locale: "en" | "zh") {
  if (field === "video_prompt") {
    return locale === "zh" ? "暂时无法生成灵感，请稍后重试。" : "Inspiration is unavailable right now. Please try again.";
  }
  if (field === "image_prompt") {
    return locale === "zh" ? "暂时无法生成图片提示词，请稍后重试。" : "Image prompt inspiration is unavailable right now. Please try again.";
  }
  return locale === "zh" ? "请先输入风格描述，再进行优化。" : "Enter a style description before enhancing.";
}

function fallbackVideoInspirationPrompt(locale: "en" | "zh") {
  return locale === "zh"
    ? "请给出一个原创的短视频创意描述，包含场景、主体、氛围、镜头运动与节奏。"
    : "Suggest an original short-form video concept with scene, subject, mood, camera movement, and pacing.";
}

function fallbackImageInspirationPrompt(locale: "en" | "zh") {
  return locale === "zh"
    ? "请给出一个原创的 AI 图片生成描述，包含主体、场景、构图、光线、风格与细节。"
    : "Suggest an original AI image prompt with subject, scene, composition, lighting, style, and detail.";
}

function fallbackInspirationPrompt(field: CanvasPromptEnhanceField, locale: "en" | "zh") {
  if (field === "image_prompt") return fallbackImageInspirationPrompt(locale);
  if (field === "video_prompt") return fallbackVideoInspirationPrompt(locale);
  return "";
}

function unconfiguredMessage(locale: "en" | "zh") {
  return locale === "zh"
    ? "OpenAI 未配置，暂时无法优化提示词。"
    : "OpenAI is not configured, so prompt enhancement is unavailable.";
}

export class CanvasPromptEnhanceService {
  async enhance(
    user: AuthUserDto,
    input: {
      projectId: string;
      field: CanvasPromptEnhanceField;
      text: string;
      languageCode?: string | null;
      learningContext?: {
        sessionId?: string | null;
        messageId?: string | null;
        pagePath?: string | null;
        recordLearning?: boolean;
      };
    }
  ) {
    const locale = localeFromLanguageCode(input.languageCode ?? user.languageCode);
    const source = input.text.trim();
    if (!source && input.field === "music_style") {
      throw appError("VALIDATION_ERROR", emptyPromptMessage(input.field, locale));
    }

    const project = await canvasService.assertAccess(input.projectId, user);

    if (!hasOpenAI()) {
      throw appError("SYSTEM_ERROR", unconfiguredMessage(locale));
    }

    const quota = await aiUsageQuotaService.assertCampaignQuota({
      userId: user.id,
      campaignId: project.campaignId,
      category: "copilot_qa"
    });
    if (!quota.ok) {
      throw appError("RATE_LIMIT", aiUsageQuotaService.quotaErrorMessage(locale, quota));
    }

    const maxLength = CANVAS_PROMPT_ENHANCE_MAX_LENGTH[input.field];
    const userPrompt = source || fallbackInspirationPrompt(input.field, locale);

    let systemPrompt = canvasPromptEnhanceSystemPrompt(input.field);
    if (input.field === "video_prompt") {
      const examples = await canvasPromptKnowledgeService.listVideoPromptExamples({
        languageCode: normalizeLanguageCode(input.languageCode ?? user.languageCode ?? "en"),
        query: userPrompt,
        limit: 3
      });
      const referenceBlock = canvasPromptKnowledgeService.buildEnhanceReferenceBlock(examples, locale);
      if (referenceBlock) {
        systemPrompt = `${systemPrompt}\n\n${referenceBlock}`;
      }
    }

    const result = await aiGatewayService.chatCompletion({
      system: systemPrompt,
      user: userPrompt,
      temperature: input.field === "music_style" ? 0.45 : 0.65,
      language: locale === "zh" ? "Chinese" : "English"
    });

    const enhanced = normalizeEnhancedPrompt(result.content, maxLength);
    if (!enhanced) {
      throw appError(
        "SYSTEM_ERROR",
        locale === "zh" ? "优化失败，请稍后重试。" : "Enhancement failed. Please try again."
      );
    }

    await aiUsageQuotaService.recordOpenAiUsage({
      userId: user.id,
      campaignId: project.campaignId,
      category: "copilot_qa",
      provider: result.provider,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
      cost: result.cost,
      metadata: {
        projectId: input.projectId,
        field: input.field,
        promptAuthor: "gpt"
      }
    });

    if (input.learningContext?.recordLearning !== false) {
      await recordGptPromptLucienLearning({
        user,
        projectId: input.projectId,
        campaignId: project.campaignId,
        field: input.field,
        sourceText: source,
        gptPrompt: enhanced,
        model: result.model,
        provider: result.provider,
        languageCode: normalizeLanguageCode(input.languageCode ?? user.languageCode ?? "en"),
        pagePath: input.learningContext?.pagePath ?? `/studio/canvas/${input.projectId}`,
        sessionId: input.learningContext?.sessionId ?? null,
        messageId: input.learningContext?.messageId ?? null
      });
    }

    return {
      text: enhanced,
      model: result.model,
      provider: result.provider,
      answerMode: gptPromptAnswerMode(input.field),
      promptAuthor: "gpt" as const,
      campaignId: project.campaignId
    };
  }
}

export const canvasPromptEnhanceService = new CanvasPromptEnhanceService();
