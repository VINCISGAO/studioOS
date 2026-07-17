import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeLucienSyncService } from "@/features/knowledge-center/knowledge-lucien-sync.service";
import type { KnowledgeSaveResult } from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

/** Persist SEO/Lucien sidecars and sync Lucien before the publish HTTP response returns. */
export async function runKnowledgeLucienSyncAfterSave(saved: KnowledgeSaveResult) {
  if (!saved.queuePublishPipeline && !saved.queueTranslationSidecars) {
    return { synced: 0 };
  }

  if (saved.queueTranslationSidecars) {
    await knowledgeCenterRepository.upsertTranslationSidecars(saved.queueTranslationSidecars);
  }

  const articleId =
    saved.queuePublishPipeline?.articleId ?? saved.queueTranslationSidecars?.articleId ?? saved.article?.id;
  if (!articleId) return { synced: 0 };

  const detail = await knowledgeCenterRepository.getById(articleId);
  if (!detail) return { synced: 0 };

  const result = await knowledgeLucienSyncService.syncPublishedArticle({
    slug: detail.slug,
    translations: detail.translations,
    categoryName: detail.category_name
  });

  logger.info("knowledge.publish.lucien_sync_inline", {
    service: "KnowledgePublishSchedule",
    articleId,
    slug: detail.slug,
    synced: result.synced
  });

  return result;
}

export function applyInlineLucienSyncToPipeline(
  saved: KnowledgeSaveResult,
  lucienSynced: number
): KnowledgeSaveResult {
  if (!saved.pipeline || lucienSynced <= 0) return saved;

  return {
    ...saved,
    pipeline: {
      ...saved.pipeline,
      lucien_synced: lucienSynced,
      steps: saved.pipeline.steps.includes("lucien_learning")
        ? saved.pipeline.steps
        : [...saved.pipeline.steps, "lucien_learning"]
    }
  };
}
