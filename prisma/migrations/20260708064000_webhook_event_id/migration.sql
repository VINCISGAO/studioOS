ALTER TABLE "webhook_events"
ADD COLUMN IF NOT EXISTS "event_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_event_id_key"
ON "webhook_events"("event_id");

CREATE INDEX IF NOT EXISTS "webhook_events_provider_event_id_idx"
ON "webhook_events"("provider", "event_id");
