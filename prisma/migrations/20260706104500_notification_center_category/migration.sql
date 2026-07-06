-- Notification Center: classify in-app events for cross-portal inboxes.
CREATE TYPE "NotificationCategory" AS ENUM (
  'AI',
  'PAYMENT',
  'MATCHING',
  'INVITATION',
  'COLLABORATION',
  'DELIVERY',
  'REVIEW',
  'REVISION',
  'SETTLEMENT',
  'ARBITRATION',
  'MEMBERSHIP',
  'ATTRIBUTION',
  'SYSTEM'
);

ALTER TABLE "notifications"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "event_name" TEXT,
  ADD COLUMN "metadata_json" JSONB;

CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_category_idx" ON "notifications"("category");
