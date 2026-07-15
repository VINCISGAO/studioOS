import "server-only";

import { after } from "next/server";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  runKnowledgePublishPipeline,
  type KnowledgeSaveResult
} from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

async function runKnowledgePostSaveWork(saved: KnowledgeSaveResult) {
  if (saved.queueTranslationSidecars) {
    await knowledgeCenterRepository.upsertTranslationSidecars(saved.queueTranslationSidecars);
  }

  const pipelineJob = saved.queuePublishPipeline;
  const multilingualJob = saved.queueMultilingualSync;

  if (pipelineJob) {
    const detail = await knowledgeCenterRepository.getById(pipelineJob.articleId);
    if (detail) {
      await runKnowledgePublishPipeline(detail, {
        translations_synced: 1,
        translation_languages: [pipelineJob.sourceLanguage],
        errors: []
      });
    }
  }

  if (multilingualJob) {
    await knowledgeCenterService.runBackgroundMultilingualSync(multilingualJob);
  }
}

/** Queue sidecars / revalidate / ping / multilingual sync after the save response returns. */
export function scheduleKnowledgePostSaveWork(saved: KnowledgeSaveResult) {
  if (!saved.queueTranslationSidecars && !saved.queuePublishPipeline && !saved.queueMultilingualSync) {
    return;
  }

  try {
    after(() =>
      runKnowledgePostSaveWork(saved).catch((error) => {
        logger.error("knowledge.post_save.background_failed", {
          service: "KnowledgePublishSchedule",
          articleId: saved.article?.id,
          error: error instanceof Error ? error.message : String(error)
        });
      })
    );
  } catch {
    void runKnowledgePostSaveWork(saved).catch((error) => {
      logger.error("knowledge.post_save.background_failed", {
        service: "KnowledgePublishSchedule",
        articleId: saved.article?.id,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
}

/** @deprecated Use scheduleKnowledgePostSaveWork */
export const scheduleKnowledgeMultilingualSyncAfterResponse = scheduleKnowledgePostSaveWork;
