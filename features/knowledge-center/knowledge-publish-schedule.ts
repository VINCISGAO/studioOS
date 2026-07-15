import "server-only";

import { after } from "next/server";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  runKnowledgePublishPipeline,
  type KnowledgeSaveResult
} from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

async function runKnowledgePostSaveWork(saved: KnowledgeSaveResult, requestId?: string) {
  if (saved.queueTranslationSidecars) {
    logger.info("knowledge.post_save.sidecars.start", {
      service: "KnowledgePublishSchedule",
      requestId,
      articleId: saved.article?.id
    });
    await knowledgeCenterRepository.upsertTranslationSidecars(saved.queueTranslationSidecars);
    logger.info("knowledge.post_save.sidecars.done", {
      service: "KnowledgePublishSchedule",
      requestId,
      articleId: saved.article?.id
    });
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
export function scheduleKnowledgePostSaveWork(saved: KnowledgeSaveResult, requestId?: string) {
  if (!saved.queueTranslationSidecars && !saved.queuePublishPipeline && !saved.queueMultilingualSync) {
    return;
  }

  const run = () =>
    runKnowledgePostSaveWork(saved, requestId).catch((error) => {
      const prismaCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : undefined;
      logger.error("knowledge.post_save.background_failed", {
        service: "KnowledgePublishSchedule",
        requestId,
        articleId: saved.article?.id,
        prismaCode,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    });

  try {
    after(run);
  } catch {
    void run();
  }
}

/** @deprecated Use scheduleKnowledgePostSaveWork */
export const scheduleKnowledgeMultilingualSyncAfterResponse = scheduleKnowledgePostSaveWork;
