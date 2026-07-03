import "server-only";

import {
  updateCampaignLearningStatistics,
  updateCreatorLearningMemory,
  type DeclineFeedbackForMemory
} from "@/features/ai/ai-learning-memory-writer";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

type AiEventRow = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  processed: boolean;
};

type AiLearningRow = {
  after: Record<string, unknown>;
  confidence: number;
};

export class AiLearningWorkerService {
  async processEvent(eventId: string) {
    if (!hasDatabaseUrl()) return null;

    const event = await this.findEvent(eventId);
    if (!event || event.processed || event.eventType !== "CreatorRejected") return null;

    const learning = await this.findLearning(event.id);
    const payload = event.payload;
    const feedback = resolveFeedback(payload, learning?.after);
    const creatorProfileId = stringValue(payload.creatorProfileId);
    const creatorUserId = await this.resolveCreatorUserId(payload, creatorProfileId);
    const campaignId = stringValue(payload.campaignId);
    if (!feedback.reason || !creatorUserId || !campaignId) return null;

    await updateCreatorLearningMemory({
      creatorUserId,
      eventId: event.id,
      feedback,
      confidence: learning?.confidence ?? 0.75
    });
    await updateCampaignLearningStatistics({
      campaignId,
      eventId: event.id,
      feedback,
      confidence: learning?.confidence ?? 0.75
    });
    await this.markProcessed(event.id);
    return { ok: true as const, eventId: event.id };
  }

  async processPending(limit = 20) {
    if (!hasDatabaseUrl()) return [];

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "ai_events"
      WHERE "processed" = false AND "event_type" = 'CreatorRejected'
      ORDER BY "created_at" ASC
      LIMIT ${limit}
    `;
    const results = [];
    for (const row of rows) {
      results.push(await this.processEvent(row.id));
    }
    return results;
  }

  private async findEvent(eventId: string) {
    const rows = await prisma.$queryRaw<AiEventRow[]>`
      SELECT
        "id",
        "event_type" AS "eventType",
        "entity_type" AS "entityType",
        "entity_id" AS "entityId",
        "payload",
        "processed"
      FROM "ai_events"
      WHERE "id" = ${eventId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async findLearning(eventId: string) {
    const rows = await prisma.$queryRaw<AiLearningRow[]>`
      SELECT "after", "confidence"
      FROM "ai_learning"
      WHERE "source_event_id" = ${eventId}
      ORDER BY "created_at" DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async resolveCreatorUserId(payload: Record<string, unknown>, creatorProfileId: string | null) {
    const fromPayload = stringValue(payload.creatorUserId);
    if (fromPayload) return fromPayload;
    if (!creatorProfileId) return null;
    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      select: { userId: true }
    });
    return profile?.userId ?? null;
  }

  private async markProcessed(eventId: string) {
    await prisma.$executeRaw`
      UPDATE "ai_events"
      SET "processed" = true
      WHERE "id" = ${eventId}
    `;
  }
}

function resolveFeedback(payload: Record<string, unknown>, after?: Record<string, unknown>): DeclineFeedbackForMemory {
  const payloadFeedback = payload.feedback;
  if (isRecord(payloadFeedback)) return payloadFeedback as DeclineFeedbackForMemory;
  const afterFeedback = after?.feedback;
  if (isRecord(afterFeedback)) return afterFeedback as DeclineFeedbackForMemory;
  return {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const aiLearningWorkerService = new AiLearningWorkerService();
