import "server-only";

import type { AuthUserDto } from "@/features/auth/auth.service";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { canvasPromptKnowledgeService } from "@/features/ai-copilot/canvas-prompt-knowledge.service";
import { recordLucienInteraction } from "@/features/ai-copilot/lucien-learning.service";
import type { CanvasPromptEnhanceField } from "@/lib/canvas/prompt-enhance";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

export type GptPromptLucienLearningInput = {
  user: AuthUserDto;
  projectId: string;
  campaignId?: string | null;
  field: CanvasPromptEnhanceField;
  sourceText: string;
  gptPrompt: string;
  model: string;
  provider: string;
  languageCode: string;
  pagePath?: string | null;
  sessionId?: string | null;
  messageId?: string | null;
};

export function gptPromptAnswerMode(field: CanvasPromptEnhanceField) {
  if (field === "video_prompt") return "gpt_video_prompt_enhance";
  if (field === "music_style") return "gpt_music_style_enhance";
  return "gpt_image_prompt_enhance";
}

export async function recordGptPromptLucienLearning(input: GptPromptLucienLearningInput) {
  const role = normalizeCopilotRole(input.user);
  const language = normalizeLanguageCode(input.languageCode);
  const sourceText = input.sourceText.trim();
  const gptPrompt = input.gptPrompt.trim();
  const answerMode = gptPromptAnswerMode(input.field);

  await recordLucienInteraction({
    surface: "authenticated",
    entityId: input.user.id,
    role,
    sessionId: input.sessionId ?? null,
    messageId: input.messageId ?? null,
    pagePath: input.pagePath ?? `/studio/canvas/${input.projectId}`,
    language,
    userMessage: sourceText || gptPrompt,
    assistantAnswer: gptPrompt,
    answerMode,
    knowledgeScope: "authenticated_business",
    queryCategory: "business",
    promptAuthor: "gpt",
    lucienRole: "learning_only",
    gptModel: input.model,
    gptProvider: input.provider
  });

  await canvasPromptKnowledgeService.upsertFromInspire({
    projectId: input.projectId,
    campaignId: input.campaignId,
    languageCode: language,
    field: input.field,
    sourceText,
    enhancedPrompt: gptPrompt,
    model: input.model,
    promptAuthor: "gpt"
  });
}
