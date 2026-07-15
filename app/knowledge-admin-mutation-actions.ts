"use server";

import { guardAdminServerAction } from "@/features/admin/auth/admin-mutation-guard";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { scheduleKnowledgeMultilingualSyncAfterResponse } from "@/features/knowledge-center/knowledge-publish-schedule";
import { appError, isAppError } from "@/lib/core/errors";
import {
  type KnowledgeSaveClientPayload,
  toKnowledgeSaveClientPayload
} from "@/lib/knowledge/knowledge-save-client";

/** Server Actions use next.config serverActions.bodySizeLimit (320mb). */
const KNOWLEDGE_SAVE_MAX_BYTES = 20_000_000;

export type KnowledgeSaveActionResult =
  | {
      success: true;
      data: KnowledgeSaveClientPayload;
    }
  | {
      success: false;
      error: { code: string; message: string };
    };

function parsePayload(raw: string) {
  if (!raw.trim()) {
    throw appError("VALIDATION_ERROR", "Request body is required");
  }
  if (raw.length > KNOWLEDGE_SAVE_MAX_BYTES) {
    throw appError(
      "PAYLOAD_TOO_LARGE",
      "Article payload too large (>20MB). Use image upload for media instead of pasting inline."
    );
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw appError("VALIDATION_ERROR", "Invalid JSON body");
  }
}

function formatActionError(error: unknown): { code: string; message: string } {
  if (isAppError(error)) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : null;
    if (prismaCode === "P2002") {
      return { code: "SYSTEM_ERROR", message: "Duplicate record — refresh and retry." };
    }
    if (prismaCode === "P2021" || prismaCode === "P2022") {
      return {
        code: "SYSTEM_ERROR",
        message: `Database schema out of date (${prismaCode}). Run db:migrate:deploy.`
      };
    }
    return { code: "SYSTEM_ERROR", message: error.message.slice(0, 280) || "Internal server error" };
  }
  return { code: "SYSTEM_ERROR", message: "Internal server error" };
}

export async function saveKnowledgeArticleAction(formData: FormData): Promise<KnowledgeSaveActionResult> {
  try {
    await guardAdminServerAction(formData);
    const articleId = String(formData.get("article_id") ?? "").trim() || undefined;
    const parsed = parseKnowledgeArticleBody(parsePayload(String(formData.get("payload") ?? "")));

    const saved = articleId
      ? await knowledgeCenterService.update(articleId, parsed)
      : await knowledgeCenterService.create(parsed);

    if (!saved.article) {
      return {
        success: false,
        error: {
          code: "SYSTEM_ERROR",
          message: articleId
            ? "Article not found"
            : "Database unavailable — check DATABASE_URL and run db:migrate:deploy"
        }
      };
    }

    scheduleKnowledgeMultilingualSyncAfterResponse(saved);
    const payload = toKnowledgeSaveClientPayload(saved);
    if (!payload) {
      return {
        success: false,
        error: {
          code: "SYSTEM_ERROR",
          message: articleId
            ? "Article not found"
            : "Database unavailable — check DATABASE_URL and run db:migrate:deploy"
        }
      };
    }

    return { success: true, data: payload };
  } catch (error) {
    return { success: false, error: formatActionError(error) };
  }
}
