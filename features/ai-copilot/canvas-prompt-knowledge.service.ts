import "server-only";

import { createHash } from "crypto";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import {
  canvasPromptKnowledgeRepository,
  type CanvasPromptKnowledgeRow
} from "@/features/ai-copilot/canvas-prompt-knowledge.repository";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import { logger } from "@/lib/core/logger";

export const CANVAS_PROMPT_KNOWLEDGE_VERSION = "canvas_prompt_v1";

export type CanvasPromptKnowledgeTier = "verified_success" | "ai_inspire";

function promptHash(text: string) {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

function moduleLabel(generationType: "VIDEO" | "IMAGE" | "MUSIC", locale: "zh" | "en") {
  if (generationType === "VIDEO") {
    return locale === "zh" ? "Canvas 视频提示词" : "Canvas video prompts";
  }
  if (generationType === "IMAGE") {
    return locale === "zh" ? "Canvas 图片提示词" : "Canvas image prompts";
  }
  return locale === "zh" ? "Canvas 音乐提示词" : "Canvas music prompts";
}

function questionLabel(input: {
  generationType: "VIDEO" | "IMAGE" | "MUSIC";
  model?: string;
  locale: "zh" | "en";
}) {
  const model = input.model?.trim() || "Seedance";
  if (input.generationType === "VIDEO") {
    return input.locale === "zh"
      ? `高质量 ${model} 视频生成提示词示例`
      : `High-quality ${model} video prompt example`;
  }
  if (input.generationType === "IMAGE") {
    return input.locale === "zh" ? `高质量 ${model} 图片生成提示词示例` : `High-quality ${model} image prompt example`;
  }
  return input.locale === "zh" ? "高质量音乐风格提示词示例" : "High-quality music style prompt example";
}

function localeFromLanguageCode(languageCode: string): "zh" | "en" {
  return normalizeLanguageCode(languageCode).startsWith("zh") ? "zh" : "en";
}

function buildRow(input: {
  sourceKey: string;
  campaignId?: string | null;
  languageCode: string;
  generationType: "VIDEO" | "IMAGE" | "MUSIC";
  prompt: string;
  model?: string;
  tier: CanvasPromptKnowledgeTier;
  metadata?: Record<string, unknown>;
}): CanvasPromptKnowledgeRow {
  const prompt = input.prompt.trim();
  const locale = localeFromLanguageCode(input.languageCode);
  const question = questionLabel({
    generationType: input.generationType,
    model: input.model,
    locale
  });

  return {
    sourceKey: input.sourceKey,
    campaignId: input.campaignId ?? null,
    languageCode: normalizeLanguageCode(input.languageCode),
    module: moduleLabel(input.generationType, locale),
    question,
    answer: prompt,
    searchText: [question, prompt, input.model ?? "", input.generationType, input.tier].join("\n"),
    knowledgeType: "USER_PROJECT_DATA",
    visibility: "authenticated",
    sourceType: "canvas_prompt",
    version: CANVAS_PROMPT_KNOWLEDGE_VERSION,
    verifiedAt: new Date(),
    metadataJson: {
      generationType: input.generationType,
      model: input.model ?? null,
      tier: input.tier,
      tone: "canvas_high_quality_prompt",
      ...input.metadata
    }
  };
}

export const canvasPromptKnowledgeService = {
  async upsertFromGeneration(input: {
    jobId: string;
    campaignId?: string | null;
    languageCode: string;
    generationType: "VIDEO" | "IMAGE" | "MUSIC";
    prompt: string;
    model?: string;
    inputPayload?: Record<string, unknown>;
  }) {
    if (!aiCopilotRepository.isEnabled()) return;
    const prompt = input.prompt.trim();
    if (!prompt) return;

    try {
      await canvasPromptKnowledgeRepository.upsertRow(
        buildRow({
          sourceKey: `canvas_prompt_${input.generationType.toLowerCase()}_job_${input.jobId}`,
          campaignId: input.campaignId,
          languageCode: input.languageCode,
          generationType: input.generationType,
          prompt,
          model: input.model,
          tier: "verified_success",
          metadata: {
            jobId: input.jobId,
            aspectRatio: input.inputPayload?.aspectRatio ?? null,
            quality: input.inputPayload?.quality ?? null,
            duration: input.inputPayload?.duration ?? null
          }
        })
      );
    } catch (error) {
      logger.warn("Canvas prompt knowledge upsert failed (generation)", {
        service: "CanvasPromptKnowledgeService",
        jobId: input.jobId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  async upsertFromInspire(input: {
    projectId: string;
    campaignId?: string | null;
    languageCode: string;
    field: "video_prompt" | "music_style" | "image_prompt";
    sourceText: string;
    enhancedPrompt: string;
    model?: string;
    promptAuthor?: "gpt" | null;
  }) {
    if (!aiCopilotRepository.isEnabled()) return;
    const prompt = input.enhancedPrompt.trim();
    if (!prompt) return;

    const generationType =
      input.field === "video_prompt" ? "VIDEO" : input.field === "image_prompt" ? "IMAGE" : "MUSIC";

    try {
      await canvasPromptKnowledgeRepository.upsertRow(
        buildRow({
          sourceKey: `canvas_prompt_inspire_${input.field}_${promptHash(prompt)}`,
          campaignId: input.campaignId,
          languageCode: input.languageCode,
          generationType,
          prompt,
          model: input.model,
          tier: "ai_inspire",
          metadata: {
            projectId: input.projectId,
            field: input.field,
            sourceText: input.sourceText.trim().slice(0, 500) || null,
            promptAuthor: input.promptAuthor ?? "gpt"
          }
        })
      );
    } catch (error) {
      logger.warn("Canvas prompt knowledge upsert failed (inspire)", {
        service: "CanvasPromptKnowledgeService",
        projectId: input.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  async listVideoPromptExamples(input: { languageCode: string; query?: string; limit?: number }) {
    if (!aiCopilotRepository.isEnabled()) return [];
    try {
      const rows = await canvasPromptKnowledgeRepository.listVideoExamples(input);
      return rows.map((row) => row.answer.trim()).filter(Boolean);
    } catch (error) {
      logger.warn("Canvas prompt knowledge list failed", {
        service: "CanvasPromptKnowledgeService",
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  },

  buildEnhanceReferenceBlock(examples: string[], locale: "zh" | "en") {
    if (!examples.length) return "";
    const header =
      locale === "zh"
        ? "以下是平台已验证的高质量 Seedance 视频提示词，仅供结构与细节参考，请结合用户意图原创改写，不要整段照搬："
        : "Reference these verified high-quality Seedance video prompts for structure and detail only. Adapt to the user's intent; do not copy verbatim:";
    const body = examples.map((example, index) => `${index + 1}. ${example}`).join("\n\n");
    return `${header}\n\n${body}`;
  }
};
