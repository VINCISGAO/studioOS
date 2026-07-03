-- Creator invitation decline feedback and append-only AI learning records.

CREATE TYPE "CreatorInvitationDeclineReason" AS ENUM (
  'BUDGET_TOO_LOW',
  'SCHEDULE_CONFLICT',
  'NOT_MY_CATEGORY',
  'BRIEF_INSUFFICIENT',
  'DEADLINE_TOO_TIGHT',
  'BRAND_RISK'
);

ALTER TABLE "creator_invitations"
  ADD COLUMN "decline_reason" "CreatorInvitationDeclineReason",
  ADD COLUMN "decline_feedback_json" JSONB;

CREATE INDEX "creator_invitations_decline_reason_idx"
  ON "creator_invitations"("decline_reason");

CREATE TABLE "ai_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "event_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "retry" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_events_event_type_idx" ON "ai_events"("event_type");
CREATE INDEX "ai_events_entity_type_entity_id_idx" ON "ai_events"("entity_type", "entity_id");
CREATE INDEX "ai_events_processed_idx" ON "ai_events"("processed");

CREATE TABLE "ai_learning" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "source_event_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "learning_type" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_learning_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_learning_source_event_id_idx" ON "ai_learning"("source_event_id");
CREATE INDEX "ai_learning_entity_type_entity_id_idx" ON "ai_learning"("entity_type", "entity_id");
CREATE INDEX "ai_learning_learning_type_idx" ON "ai_learning"("learning_type");
