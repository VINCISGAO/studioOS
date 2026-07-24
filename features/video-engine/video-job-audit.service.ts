import "server-only";

import { logger } from "@/lib/core/logger";
import { isPrismaMissingTableError } from "@/lib/core/prisma-errors";
import { videoJobAuditRepository } from "@/features/video-engine/video-job-audit.repository";
import {
  BEST_EFFORT_VIDEO_JOB_EVENT_TYPES,
  REQUIRED_VIDEO_JOB_EVENT_TYPES,
  VIDEO_ENGINE_AUDIT_WRITE_FAILED,
  VIDEO_JOB_EVENT_TYPES,
  type VideoJobAuditEventInput,
  type VideoPromptVersionInput,
  type VideoRoutingDecisionInput
} from "@/features/video-engine/video-job-audit.types";

type RequiredAuditKind =
  | "event"
  | "routing_decision"
  | "prompt_version"
  | "attempt_update";

function reportRequiredAuditFailure(input: {
  kind: RequiredAuditKind;
  generationJobId: string;
  detail: string;
  error: unknown;
}) {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  logger.error(VIDEO_ENGINE_AUDIT_WRITE_FAILED, {
    service: "VideoJobAuditService",
    kind: input.kind,
    generationJobId: input.generationJobId,
    detail: input.detail,
    error: message
  });
}

function isMissingAuditTable(error: unknown) {
  return isPrismaMissingTableError(error);
}

async function writeEvent(input: VideoJobAuditEventInput) {
  const tier = REQUIRED_VIDEO_JOB_EVENT_TYPES.has(input.eventType)
    ? "required"
    : BEST_EFFORT_VIDEO_JOB_EVENT_TYPES.has(input.eventType)
      ? "best_effort"
      : "best_effort";

  try {
    await videoJobAuditRepository.createEvent(input);
  } catch (error) {
    if (isMissingAuditTable(error)) {
      if (tier === "required") {
        reportRequiredAuditFailure({
          kind: "event",
          generationJobId: input.generationJobId,
          detail: `Missing audit table while writing ${input.eventType}`,
          error
        });
      }
      return;
    }

    if (tier === "required") {
      reportRequiredAuditFailure({
        kind: "event",
        generationJobId: input.generationJobId,
        detail: `Failed to write ${input.eventType}`,
        error
      });
      return;
    }

    logger.warn("Video engine audit event skipped", {
      service: "VideoJobAuditService",
      generationJobId: input.generationJobId,
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export const videoJobAuditService = {
  async recordJobCreated(input: {
    generationJobId: string;
    prompt: string;
    routing: VideoRoutingDecisionInput;
  }) {
    try {
      await videoJobAuditRepository.createPromptVersion({
        generationJobId: input.generationJobId,
        version: 1,
        source: "USER",
        prompt: input.prompt,
        providerPrompt: null
      });
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "prompt_version",
        generationJobId: input.generationJobId,
        detail: "Failed to write initial prompt version",
        error
      });
    }

    try {
      await videoJobAuditRepository.createRoutingDecision(input.routing);
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "routing_decision",
        generationJobId: input.generationJobId,
        detail: "Failed to write routing decision",
        error
      });
    }

    await writeEvent({
      generationJobId: input.generationJobId,
      eventType: VIDEO_JOB_EVENT_TYPES.JOB_CREATED,
      toStatus: "QUEUED",
      progress: 0,
      payload: {
        requestedModel: input.routing.requestedModel,
        resolvedProvider: input.routing.resolvedProvider,
        reason: input.routing.reason
      }
    });
  },

  async recordProviderPromptSubmitted(input: {
    generationJobId: string;
    version: number;
    providerPrompt: string;
  }) {
    try {
      await videoJobAuditRepository.updatePromptVersionProviderPrompt(
        input.generationJobId,
        input.version,
        input.providerPrompt
      );
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "prompt_version",
        generationJobId: input.generationJobId,
        detail: "Failed to update provider prompt before submit",
        error
      });
    }
  },

  writeEvent,

  async markAttemptSucceeded(input: { generationJobId: string; attemptId: string }) {
    try {
      await videoJobAuditRepository.updateAttempt({
        attemptId: input.attemptId,
        status: "SUCCEEDED",
        finishedAt: new Date()
      });
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "attempt_update",
        generationJobId: input.generationJobId,
        detail: "Failed to mark attempt succeeded",
        error
      });
    }

    await writeEvent({
      generationJobId: input.generationJobId,
      eventType: VIDEO_JOB_EVENT_TYPES.JOB_SUCCEEDED,
      toStatus: "SUCCEEDED",
      progress: 100
    });
  },

  async markAttemptFailed(input: {
    generationJobId: string;
    attemptId: string;
    errorCode: string;
  }) {
    try {
      await videoJobAuditRepository.updateAttempt({
        attemptId: input.attemptId,
        status: "FAILED",
        errorCode: input.errorCode,
        finishedAt: new Date()
      });
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "attempt_update",
        generationJobId: input.generationJobId,
        detail: "Failed to mark attempt failed",
        error
      });
    }

    await writeEvent({
      generationJobId: input.generationJobId,
      eventType: VIDEO_JOB_EVENT_TYPES.JOB_FAILED,
      toStatus: "FAILED",
      progress: 100,
      payload: { errorCode: input.errorCode }
    });
  },

  async updateAttemptProviderTask(input: {
    generationJobId: string;
    attemptId: string;
    providerTaskId: string;
  }) {
    try {
      await videoJobAuditRepository.updateAttempt({
        attemptId: input.attemptId,
        status: "RUNNING",
        providerTaskId: input.providerTaskId
      });
    } catch (error) {
      reportRequiredAuditFailure({
        kind: "attempt_update",
        generationJobId: input.generationJobId,
        detail: "Failed to store provider task id on attempt",
        error
      });
    }
  }
};
