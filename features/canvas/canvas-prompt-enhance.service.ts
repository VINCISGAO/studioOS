import "server-only";

import { aiUsageQuotaService } from "@/features/abuse/ai-usage-quota.service";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { recordLucienInteraction } from "@/features/ai-copilot/lucien-learning.service";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
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

function emptyPromptMessage(locale: "en" | "zh") {
  return locale === "zh" ? "请先输入风格描述，再进行优化。" : "Enter a style description before enhancing.";
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
    }
  ) {
    const locale = localeFromLanguageCode(input.languageCode ?? user.languageCode);
    const source = input.text.trim();
    if (!source) {
      throw appError("VALIDATION_ERROR", emptyPromptMessage(locale));
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
    const result = await aiGatewayService.chatCompletion({
      system: canvasPromptEnhanceSystemPrompt(input.field),
      user: source,
      temperature: 0.45,
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
        field: input.field
      }
    });

    await recordLucienInteraction({
      surface: "authenticated",
      entityId: user.id,
      role: normalizeCopilotRole(user),
      pagePath: `/studio/canvas/${input.projectId}`,
      language: normalizeLanguageCode(input.languageCode ?? user.languageCode ?? "en"),
      userMessage: source,
      assistantAnswer: enhanced,
      answerMode: "music_style_enhance",
      knowledgeScope: "authenticated_business",
      queryCategory: "business"
    });

    return {
      text: enhanced,
      model: result.model,
      provider: result.provider
    };
  }
}

export const canvasPromptEnhanceService = new CanvasPromptEnhanceService();
