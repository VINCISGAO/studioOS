import type { AuthUserDto } from "@/features/auth/auth.service";

export type AiCopilotRole = "BRAND" | "CREATOR" | "ADMIN" | "SUPPORT";
export type AiCopilotMessageRole = "USER" | "ASSISTANT" | "SYSTEM";
export type AiCopilotToolStatus = "SUCCESS" | "FAILED" | "SKIPPED";
export type AiCopilotFeedbackRating = "HELPFUL" | "NOT_HELPFUL";

export type AiCopilotPageContext = {
  pagePath?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  languageCode?: string | null;
};

export type AiCopilotRequest = AiCopilotPageContext & {
  sessionId?: string | null;
  message: string;
};

export type AiCopilotContext = AiCopilotPageContext & {
  user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    languageCode: string;
  };
  language: string;
  country?: string | null;
  timezone?: string | null;
  summaries: Record<string, unknown>;
};

export type AiCopilotMessageFeedback = {
  rating: AiCopilotFeedbackRating;
  reason?: string | null;
  createdAt: string;
};

export type AiCopilotToolResult = {
  toolName: string;
  status: AiCopilotToolStatus;
  output: Record<string, unknown>;
  durationMs: number;
};

export type AiCopilotAnswer = {
  sessionId: string;
  messageId: string;
  answer: string;
  suggestedQuestions: string[];
  context: AiCopilotPageContext;
  toolCalls: AiCopilotToolResult[];
};

export function normalizeCopilotRole(user: AuthUserDto): AiCopilotRole {
  const role = user.role.toUpperCase();
  if (role === "ADMIN") return "ADMIN";
  if (role === "SUPPORT") return "SUPPORT";
  if (role === "CREATOR" || role === "STUDIO") return "CREATOR";
  return "BRAND";
}
