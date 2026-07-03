import "server-only";

import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export type AiLearningEventInput = {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  learningType: string;
  after: Record<string, unknown>;
  confidence: number;
};

export class AiLearningEventRepository {
  async append(input: AiLearningEventInput) {
    if (!hasDatabaseUrl()) return null;

    const eventRows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "ai_events" ("event_type", "entity_type", "entity_id", "payload")
      VALUES (${input.eventType}, ${input.entityType}, ${input.entityId}, ${JSON.stringify(input.payload)}::jsonb)
      RETURNING "id"
    `;
    const eventId = eventRows[0]?.id;
    if (!eventId) return null;

    await prisma.$executeRaw`
      INSERT INTO "ai_learning" (
        "source_event_id",
        "entity_type",
        "entity_id",
        "learning_type",
        "after",
        "confidence"
      )
      VALUES (
        ${eventId},
        ${input.entityType},
        ${input.entityId},
        ${input.learningType},
        ${JSON.stringify(input.after)}::jsonb,
        ${input.confidence}
      )
    `;

    return { eventId };
  }
}

export const aiLearningEventRepository = new AiLearningEventRepository();
