import "server-only";

import {
  applyInlineLucienSyncToPipeline,
  runKnowledgeLucienSyncAfterSave
} from "@/features/knowledge-center/knowledge-publish-inline-lucien";
import {
  scheduleKnowledgePostSaveWork,
  type KnowledgePostSaveScheduleOptions
} from "@/features/knowledge-center/knowledge-publish-schedule";
import type { KnowledgeSaveResult } from "@/features/knowledge-center/knowledge-publish.pipeline";
import { toKnowledgeSaveClientPayload } from "@/lib/knowledge/knowledge-save-client";

export async function finalizeKnowledgeAdminSave(
  saved: KnowledgeSaveResult,
  requestId: string,
  scheduleOptions?: KnowledgePostSaveScheduleOptions
) {
  let nextSaved = saved;

  if (saved.queuePublishPipeline) {
    const { synced } = await runKnowledgeLucienSyncAfterSave(saved);
    nextSaved = applyInlineLucienSyncToPipeline(saved, synced);
    scheduleKnowledgePostSaveWork(nextSaved, requestId, {
      ...scheduleOptions,
      inlineSidecarsCompleted: true,
      inlineLucienSyncCompleted: true
    });
  } else {
    scheduleKnowledgePostSaveWork(saved, requestId, scheduleOptions);
  }

  return toKnowledgeSaveClientPayload(nextSaved);
}
