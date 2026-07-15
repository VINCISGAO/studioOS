import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  runKnowledgePublishPipeline,
  type KnowledgeSaveResult
} from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

async function runKnowledgePostPublishWork(saved: KnowledgeSaveResult) {
  const sidecarJob = saved.queueTranslationSidecars;
  const pipelineJob = saved.queuePublishPipeline;
  const multilingualJob = saved.queueMultilingualSync;

  if (sidecarJob) {
    await knowledgeCenterRepository.upsertTranslationSidecars(sidecarJob);
  }

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

/** Fire-and-forget post-publish work. Avoid `after()` — it can break Server Actions on Vercel. */
export function scheduleKnowledgeMultilingualSyncAfterResponse(saved: KnowledgeSaveResult) {
  const hasWork =
    saved.queueTranslationSidecars || saved.queuePublishPipeline || saved.queueMultilingualSync;
  if (!hasWork) return;

  void runKnowledgePostPublishWork(saved).catch((error) => {
    logger.error("knowledge.post_publish.background_failed", {
      service: "KnowledgePublishSchedule",
      articleId: saved.article?.id,
      error: error instanceof Error ? error.message : String(error)
    });
  });
}
