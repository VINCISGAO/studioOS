import { z } from "zod";
import { communicationConfig } from "@/lib/core/config/communication";

const langSchema = z.enum(communicationConfig.supportedLanguages as unknown as [string, ...string[]]);

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  receiver_id: z.string().uuid().optional()
});

export const translateTextSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  target_language: langSchema,
  source_type: z
    .enum([
      "CHAT",
      "REVIEW_COMMENT",
      "CAMPAIGN_BRIEF",
      "CREATIVE_SCRIPT",
      "CREATOR_QUOTE",
      "PORTFOLIO",
      "CONTRACT",
      "EMAIL",
      "NOTIFICATION",
      "DISPUTE",
      "SYSTEM"
    ])
    .default("CHAT"),
  campaign_id: z.string().uuid().optional(),
  context: z.string().max(2000).optional()
});

export const summarizeTextSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  target_language: langSchema.optional()
});

export const extractTodosSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  target_language: langSchema.optional()
});

export const updateTodoSchema = z.object({
  todo_id: z.string().min(1),
  done: z.boolean()
});
