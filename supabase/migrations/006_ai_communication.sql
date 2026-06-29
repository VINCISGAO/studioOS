-- AI Communication Engine — Vol Communication v1
-- Run via: prisma migrate dev / db push

CREATE TYPE "CommunicationSourceType" AS ENUM (
  'CHAT',
  'REVIEW_COMMENT',
  'CAMPAIGN_BRIEF',
  'CREATIVE_SCRIPT',
  'CREATOR_QUOTE',
  'PORTFOLIO',
  'CONTRACT',
  'EMAIL',
  'NOTIFICATION',
  'DISPUTE',
  'SYSTEM'
);

CREATE TABLE IF NOT EXISTS "communication_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" UUID REFERENCES "campaigns"("id"),
  "sender_id" UUID NOT NULL REFERENCES "users"("id"),
  "receiver_id" UUID REFERENCES "users"("id"),
  "source_type" "CommunicationSourceType" NOT NULL DEFAULT 'CHAT',
  "source_ref_id" TEXT,
  "original_language" TEXT NOT NULL,
  "target_language" TEXT NOT NULL,
  "original_content" TEXT NOT NULL,
  "localized_content" TEXT,
  "summary" TEXT,
  "todos_json" JSONB,
  "detect_confidence" DECIMAL(5,4),
  "translation_available" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "communication_messages_campaign_id_idx" ON "communication_messages"("campaign_id");
CREATE INDEX IF NOT EXISTS "communication_messages_sender_id_idx" ON "communication_messages"("sender_id");
CREATE INDEX IF NOT EXISTS "communication_messages_receiver_id_idx" ON "communication_messages"("receiver_id");
CREATE INDEX IF NOT EXISTS "communication_messages_source_type_source_ref_id_idx" ON "communication_messages"("source_type", "source_ref_id");
CREATE INDEX IF NOT EXISTS "communication_messages_created_at_idx" ON "communication_messages"("created_at");

CREATE TABLE IF NOT EXISTS "communication_translation_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" UUID NOT NULL REFERENCES "communication_messages"("id") ON DELETE CASCADE,
  "model" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "source_lang" TEXT NOT NULL,
  "target_lang" TEXT NOT NULL,
  "prompt_version" TEXT NOT NULL,
  "token_input" INT NOT NULL DEFAULT 0,
  "token_output" INT NOT NULL DEFAULT 0,
  "cost" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "latency_ms" INT NOT NULL DEFAULT 0,
  "attempt" INT NOT NULL DEFAULT 1,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "communication_translation_logs_message_id_idx" ON "communication_translation_logs"("message_id");
CREATE INDEX IF NOT EXISTS "communication_translation_logs_created_at_idx" ON "communication_translation_logs"("created_at");
