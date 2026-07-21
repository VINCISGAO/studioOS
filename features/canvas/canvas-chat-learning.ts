import type { AuthUserDto } from "@/features/auth/auth.service";
import { recordLucienInteraction } from "@/features/ai-copilot/lucien-learning.service";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

export async function recordCanvasChatLucienLearning(
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
  await recordLucienInteraction({
    surface: "authenticated",
    entityId: user.id,
    role: normalizeCopilotRole(user),
    sessionId: input.sessionId,
    messageId: input.messageId,
    pagePath: `/studio/canvas/${input.projectId}`,
    language: normalizeLanguageCode(input.languageCode ?? "en"),
    userMessage: input.userMessage,
    assistantAnswer: input.assistantAnswer,
    answerMode: input.answerMode,
    knowledgeScope: "authenticated_business",
    queryCategory: "business"
  });
}
