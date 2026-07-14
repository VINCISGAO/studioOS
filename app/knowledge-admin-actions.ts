"use server";

import { guardAdminServerAction } from "@/features/admin/auth/admin-mutation-guard";
import { knowledgeAiAssistantService } from "@/features/knowledge-center/knowledge-ai-assistant.service";
import {
  KNOWLEDGE_AI_ASSISTANT_ACTIONS,
  type KnowledgeAiAssistantAction,
  type KnowledgeAiAssistantResult,
  type KnowledgeAiDraftContext
} from "@/features/knowledge-center/knowledge-ai-assistant.types";
import { appError } from "@/lib/core/errors";

function parseDraftContext(formData: FormData): KnowledgeAiDraftContext {
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim() || undefined,
    slug: String(formData.get("slug") ?? "").trim() || undefined,
    body_markdown: String(formData.get("body_markdown") ?? ""),
    seo_title: String(formData.get("seo_title") ?? "").trim() || undefined,
    meta_description: String(formData.get("meta_description") ?? "").trim() || undefined,
    focus_keywords: String(formData.get("focus_keywords") ?? "").trim() || undefined,
    category_slug: String(formData.get("category_slug") ?? "").trim() || undefined,
    tags: tagsRaw ? tagsRaw.split(",").map((item) => item.trim()).filter(Boolean) : []
  };
}

function parseAction(value: string): KnowledgeAiAssistantAction {
  if ((KNOWLEDGE_AI_ASSISTANT_ACTIONS as readonly string[]).includes(value)) {
    return value as KnowledgeAiAssistantAction;
  }
  throw appError("VALIDATION_ERROR", "Invalid knowledge AI action");
}

export async function runKnowledgeAiAssistantAction(formData: FormData): Promise<KnowledgeAiAssistantResult> {
  const admin = await guardAdminServerAction(formData);
  const action = parseAction(String(formData.get("action") ?? "").trim());
  const draft = parseDraftContext(formData);
  return knowledgeAiAssistantService.run({
    adminUserId: admin.id,
    action,
    draft
  });
}
