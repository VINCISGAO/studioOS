-- StudioOS AI Copilot V1
-- Read-only AI assistant session/message/tool/context audit tables.

CREATE TABLE "chat_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "title" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "user_id" TEXT,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_tool_calls" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "message_id" TEXT,
  "tool_name" TEXT NOT NULL,
  "input_json" JSONB,
  "output_json" JSONB,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "duration_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_tool_calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_copilot_contexts" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "page_path" TEXT,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "context_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_copilot_contexts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_sessions_user_id_updated_at_idx" ON "chat_sessions"("user_id", "updated_at");
CREATE INDEX "chat_sessions_status_idx" ON "chat_sessions"("status");
CREATE INDEX "chat_messages_session_id_created_at_idx" ON "chat_messages"("session_id", "created_at");
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");
CREATE INDEX "ai_tool_calls_session_id_created_at_idx" ON "ai_tool_calls"("session_id", "created_at");
CREATE INDEX "ai_tool_calls_message_id_idx" ON "ai_tool_calls"("message_id");
CREATE INDEX "ai_tool_calls_tool_name_idx" ON "ai_tool_calls"("tool_name");
CREATE INDEX "ai_copilot_contexts_session_id_created_at_idx" ON "ai_copilot_contexts"("session_id", "created_at");
CREATE INDEX "ai_copilot_contexts_user_id_idx" ON "ai_copilot_contexts"("user_id");
CREATE INDEX "ai_copilot_contexts_entity_type_entity_id_idx" ON "ai_copilot_contexts"("entity_type", "entity_id");

ALTER TABLE "chat_sessions"
ADD CONSTRAINT "chat_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_tool_calls"
ADD CONSTRAINT "ai_tool_calls_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_tool_calls"
ADD CONSTRAINT "ai_tool_calls_message_id_fkey"
FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_copilot_contexts"
ADD CONSTRAINT "ai_copilot_contexts_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_copilot_contexts"
ADD CONSTRAINT "ai_copilot_contexts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
