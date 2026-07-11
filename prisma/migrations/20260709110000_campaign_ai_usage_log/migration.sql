-- Campaign + user AI usage ledger for quota enforcement and admin cost visibility.

CREATE TABLE IF NOT EXISTS "campaign_ai_usage_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT,
    "token_input" INTEGER NOT NULL DEFAULT 0,
    "token_output" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "campaign_ai_usage_logs_campaign_id_category_created_at_idx"
    ON "campaign_ai_usage_logs"("campaign_id", "category", "created_at");

CREATE INDEX IF NOT EXISTS "campaign_ai_usage_logs_user_id_created_at_idx"
    ON "campaign_ai_usage_logs"("user_id", "created_at");

ALTER TABLE "campaign_ai_usage_logs"
    ADD CONSTRAINT "campaign_ai_usage_logs_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_ai_usage_logs"
    ADD CONSTRAINT "campaign_ai_usage_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
