import "server-only";

import { after } from "next/server";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  runKnowledgePublishPipeline,
  type KnowledgeSaveResult
} from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

export function scheduleKnowledgeMultilingualSyncAfterResponse(saved: KnowledgeSaveResult) {
  const sidecarJob = saved.queueTranslationSidecars;
  const pipelineJob = saved.queuePublishPipeline;
  const multilingualJob = saved.queueMultilingualSync;
  if (!sidecarJob && !pipelineJob && !multilingualJob) return;

  after(async () => {
    if (sidecarJob) {
      try {
        await knowledgeCenterRepository.upsertTranslationSidecars(sidecarJob);
      } catch (error) {
        logger.error("knowledge.translation_sidecars.background_failed", {
          service: "KnowledgePublishRoute",
          articleId: sidecarJob.articleId,
          translationId: sidecarJob.translationId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (pipelineJob) {
      try {
        const detail = await knowledgeCenterRepository.getById(pipelineJob.articleId);
        if (detail) {
          await runKnowledgePublishPipeline(detail, {
            translations_synced: 1,
            translation_languages: [pipelineJob.sourceLanguage],
            errors: []
          });
        }
      } catch (error) {
        logger.error("knowledge.publish_pipeline.background_failed", {
          service: "KnowledgePublishRoute",
          articleId: pipelineJob.articleId,
          slug: pipelineJob.slug,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (multilingualJob) {
      try {
        await knowledgeCenterService.runBackgroundMultilingualSync(multilingualJob);
      } catch (error) {
        logger.error("knowledge.multilingual_background.schedule_failed", {
          service: "KnowledgePublishRoute",
          articleId: multilingualJob.articleId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
}
