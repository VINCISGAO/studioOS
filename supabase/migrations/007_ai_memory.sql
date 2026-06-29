-- AI Memory — Brand / Creator / Relationship DNA
CREATE TYPE "AiTonePreference" AS ENUM ('PROFESSIONAL', 'LUXURY', 'GEN_Z', 'CORPORATE', 'CASUAL');
CREATE TYPE "MemoryOwnerType" AS ENUM ('BRAND', 'CREATOR', 'CAMPAIGN', 'RELATIONSHIP');

ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "campaign_memory_json" JSONB;

CREATE TABLE IF NOT EXISTS "ai_preferences" (
  "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "preferred_language" TEXT,
  "always_translate" BOOLEAN NOT NULL DEFAULT true,
  "never_use_emojis" BOOLEAN NOT NULL DEFAULT false,
  "tone" "AiTonePreference" NOT NULL DEFAULT 'PROFESSIONAL',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "memory_facts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_type" "MemoryOwnerType" NOT NULL,
  "brand_id" UUID,
  "creator_id" UUID,
  "campaign_id" UUID REFERENCES "campaigns"("id"),
  "category" TEXT NOT NULL,
  "fact_key" TEXT NOT NULL,
  "fact_value" TEXT NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL DEFAULT 0.8,
  "source_type" TEXT NOT NULL,
  "source_ref_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("owner_type", "brand_id", "creator_id", "campaign_id", "category", "fact_key")
);

CREATE INDEX IF NOT EXISTS "memory_facts_brand_id_idx" ON "memory_facts"("brand_id");
CREATE INDEX IF NOT EXISTS "memory_facts_creator_id_idx" ON "memory_facts"("creator_id");
CREATE INDEX IF NOT EXISTS "memory_facts_campaign_id_idx" ON "memory_facts"("campaign_id");

CREATE TABLE IF NOT EXISTS "relationship_dna" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" UUID NOT NULL REFERENCES "users"("id"),
  "creator_id" UUID NOT NULL REFERENCES "users"("id"),
  "collaboration_count" INT NOT NULL DEFAULT 0,
  "avg_satisfaction" DECIMAL(3,2),
  "avg_review_rounds" DECIMAL(5,2),
  "avg_days_early" DECIMAL(5,2),
  "priority_score" INT NOT NULL DEFAULT 0,
  "last_collaboration_at" TIMESTAMPTZ,
  "dna_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("brand_id", "creator_id")
);

CREATE INDEX IF NOT EXISTS "relationship_dna_priority_score_idx" ON "relationship_dna"("priority_score");
