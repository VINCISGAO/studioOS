import "server-only";

import { after } from "next/server";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  runKnowledgePublishPipeline,
  type KnowledgeSaveResult
} from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

export type KnowledgePostSaveScheduleOptions = {
  inlineSidecarsCompleted?: boolean;
  inlineLucienSyncCompleted?: boolean;
};

async function runKnowledgePostSaveWork(
  saved: KnowledgeSaveResult,
  requestId?: string,
  options?: KnowledgePostSaveScheduleOptions
) {
  logger.info("knowledge.post_save.work.start", {
    service: "KnowledgePublishSchedule",
    requestId,
    articleId: saved.article?.id,
    hasSidecarQueue: Boolean(saved.queueTranslationSidecars),
    hasPublishPipeline: Boolean(saved.queuePublishPipeline),
    hasMultilingualQueue: Boolean(saved.queueMultilingualSync),
    inlineSidecarsCompleted: Boolean(options?.inlineSidecarsCompleted),
    inlineLucienSyncCompleted: Boolean(options?.inlineLucienSyncCompleted)
  });

  if (saved.queueTranslationSidecars && !options?.inlineSidecarsCompleted) {
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
      await runKnowledgePublishPipeline(
        detail,
        {
          translations_synced: 1,
          translation_languages: [pipelineJob.sourceLanguage],
          errors: []
        },
        { skipLucienSync: options?.inlineLucienSyncCompleted }
      );
    }
  }

  if (multilingualJob) {
    await knowledgeCenterService.runBackgroundMultilingualSync(multilingualJob);
  } else if (pipelineJob) {
    logger.info("knowledge.post_save.multilingual_skipped", {
      service: "KnowledgePublishSchedule",
      requestId,
      articleId: saved.article?.id,
      reason: "queue_multilingual_sync_missing"
    });
  }
}

/** Queue revalidate / ping / multilingual sync after the save response returns. */
export function scheduleKnowledgePostSaveWork(
  saved: KnowledgeSaveResult,
  requestId?: string,
  options?: KnowledgePostSaveScheduleOptions
) {
  if (!saved.queueTranslationSidecars && !saved.queuePublishPipeline && !saved.queueMultilingualSync) {
    return;
  }

  const run = () =>
    runKnowledgePostSaveWork(saved, requestId, options).catch((error) => {
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

  logger.info("knowledge.post_save.scheduled", {
    service: "KnowledgePublishSchedule",
    requestId,
    articleId: saved.article?.id,
    hasSidecarQueue: Boolean(saved.queueTranslationSidecars),
    hasPublishPipeline: Boolean(saved.queuePublishPipeline),
    hasMultilingualQueue: Boolean(saved.queueMultilingualSync),
    inlineSidecarsCompleted: Boolean(options?.inlineSidecarsCompleted),
    inlineLucienSyncCompleted: Boolean(options?.inlineLucienSyncCompleted)
  });

  try {
    after(run);
  } catch {
    logger.warn("knowledge.post_save.after_unavailable", {
      service: "KnowledgePublishSchedule",
      requestId,
      articleId: saved.article?.id
    });
    void run();
  }
}

/** @deprecated Use scheduleKnowledgePostSaveWork */
export const scheduleKnowledgeMultilingualSyncAfterResponse = scheduleKnowledgePostSaveWork;
