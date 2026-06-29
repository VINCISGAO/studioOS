import type { CommunicationSourceType } from "@prisma/client";

export type CommunicationTodo = {
  id: string;
  text: string;
  done: boolean;
};

export type AiCommunicationResult = {
  language: string;
  confidence: number;
  localizedContent: string;
  summary: string | null;
  todos: string[];
};

export type LocalizeTextInput = {
  content: string;
  targetLanguage: string;
  sourceType: CommunicationSourceType;
  context?: string;
  senderRole?: string;
  memoryContext?: string;
  neverUseEmojis?: boolean;
  tone?: string;
};

export type CreateCommunicationMessageInput = {
  campaignId?: string | null;
  senderId: string;
  receiverId?: string | null;
  sourceType?: CommunicationSourceType;
  sourceRefId?: string | null;
  content: string;
  targetLanguage: string;
  context?: string;
  senderRole?: string;
};

export type CommunicationStreamEvent =
  | { type: "connected"; campaignId: string; at: string }
  | { type: "heartbeat"; at: string }
  | { type: "MessageCreated"; messageId: string; campaignId: string | null }
  | { type: "MessageTranslated"; messageId: string; campaignId: string | null }
  | { type: "SummaryGenerated"; messageId: string }
  | { type: "TodoGenerated"; messageId: string };
