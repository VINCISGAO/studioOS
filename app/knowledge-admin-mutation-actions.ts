"use server";

import { guardAdminServerAction } from "@/features/admin/auth/admin-mutation-guard";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgePublishPipelineResult } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import { scheduleKnowledgeMultilingualSyncAfterResponse } from "@/features/knowledge-center/knowledge-publish-schedule";
import { appError, isAppError } from "@/lib/core/errors";

/** Server Actions use next.config serverActions.bodySizeLimit (320mb). */
const KNOWLEDGE_SAVE_MAX_BYTES = 20_000_000;

export type KnowledgeSaveActionResult =
  | {
      success: true;
      data: {
        article: KnowledgeArticleDetailDto;
        pipeline?: KnowledgePublishPipelineResult;
      };
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

    try {
      scheduleKnowledgeMultilingualSyncAfterResponse(saved);
    } catch {
      // Background scheduling must not fail a successful save.
    }

    return {
      success: true,
      data: {
        article: saved.article,
        pipeline: saved.pipeline
      }
    };
  } catch (error) {
    if (isAppError(error)) {
      return {
        success: false,
        error: { code: error.code, message: error.message }
      };
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return { success: false, error: { code: "SYSTEM_ERROR", message } };
  }
}
