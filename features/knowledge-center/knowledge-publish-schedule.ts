import "server-only";

import { after } from "next/server";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import type { KnowledgeSaveResult } from "@/features/knowledge-center/knowledge-publish.pipeline";
import { logger } from "@/lib/core/logger";

export function scheduleKnowledgeMultilingualSyncAfterResponse(saved: KnowledgeSaveResult) {
  const job = saved.queueMultilingualSync;
  if (!job) return;

  after(async () => {
    try {
      await knowledgeCenterService.runBackgroundMultilingualSync(job);
    } catch (error) {
      logger.error("knowledge.multilingual_background.schedule_failed", {
        service: "KnowledgePublishRoute",
        articleId: job.articleId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
