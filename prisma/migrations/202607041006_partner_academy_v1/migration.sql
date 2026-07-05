CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'PENDING', 'ARCHIVED');
CREATE TYPE "PartnerTier" AS ENUM ('STARTER', 'GROWTH', 'STRATEGIC');
CREATE TYPE "AcademyAudience" AS ENUM ('BRAND', 'CREATOR', 'PARTNER', 'ADMIN', 'ALL');
CREATE TYPE "AcademyContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "partner_programs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" "PartnerTier" NOT NULL DEFAULT 'STARTER',
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "contact_name" TEXT,
    "contact_email" TEXT,
    "region" TEXT,
    "referral_code" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "attributed_brands" INTEGER NOT NULL DEFAULT 0,
    "attributed_creators" INTEGER NOT NULL DEFAULT 0,
    "attributed_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pending_commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paid_commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academy_courses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "audience" "AcademyAudience" NOT NULL,
    "status" "AcademyContentStatus" NOT NULL DEFAULT 'DRAFT',
    "level" TEXT NOT NULL DEFAULT 'Beginner',
    "duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "lesson_count" INTEGER NOT NULL DEFAULT 1,
    "completion_count" INTEGER NOT NULL DEFAULT 0,
    "owner" TEXT NOT NULL DEFAULT 'VINCIS',
    "description" TEXT,
    "outcomes_json" JSONB,
    "metadata_json" JSONB,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_courses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_programs_slug_key" ON "partner_programs"("slug");
CREATE UNIQUE INDEX "partner_programs_referral_code_key" ON "partner_programs"("referral_code");
CREATE INDEX "partner_programs_campaign_id_idx" ON "partner_programs"("campaign_id");
CREATE INDEX "partner_programs_status_idx" ON "partner_programs"("status");
CREATE INDEX "partner_programs_tier_idx" ON "partner_programs"("tier");
CREATE INDEX "partner_programs_region_idx" ON "partner_programs"("region");

CREATE UNIQUE INDEX "academy_courses_slug_key" ON "academy_courses"("slug");
CREATE INDEX "academy_courses_campaign_id_idx" ON "academy_courses"("campaign_id");
CREATE INDEX "academy_courses_audience_idx" ON "academy_courses"("audience");
CREATE INDEX "academy_courses_status_idx" ON "academy_courses"("status");
CREATE INDEX "academy_courses_published_at_idx" ON "academy_courses"("published_at");

ALTER TABLE "partner_programs"
ADD CONSTRAINT "partner_programs_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "academy_courses"
ADD CONSTRAINT "academy_courses_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
