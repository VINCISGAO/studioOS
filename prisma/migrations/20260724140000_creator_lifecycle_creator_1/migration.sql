-- Creator-1: ADD ONLY lifecycle fields (no bulk APPROVED)

-- CreateEnum
CREATE TYPE "CreatorVerificationStatus" AS ENUM ('NOT_APPLIED', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CreatorLevel" AS ENUM ('NEW', 'ESTABLISHED', 'PROFESSIONAL', 'PARTNER', 'FEATURED');

-- CreateEnum
CREATE TYPE "CreatorIdentityType" AS ENUM ('INDIVIDUAL', 'STUDIO', 'COMPANY', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "CreatorVerificationReviewAction" AS ENUM (
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'SUSPEND',
  'REINSTATE',
  'TOGGLE_CAN_ACCEPT',
  'TOGGLE_MARKETPLACE_VISIBLE',
  'SET_LEVEL',
  'SET_IDENTITY',
  'SET_AVAILABILITY'
);

-- AlterEnum (CreatorAvailability — add LIMITED and UNAVAILABLE; keep OFFLINE for legacy rows)
ALTER TYPE "CreatorAvailability" ADD VALUE IF NOT EXISTS 'LIMITED';
ALTER TYPE "CreatorAvailability" ADD VALUE IF NOT EXISTS 'UNAVAILABLE';

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN "verification_status" "CreatorVerificationStatus" NOT NULL DEFAULT 'NOT_APPLIED';
ALTER TABLE "creator_profiles" ADD COLUMN "verification_applied_at" TIMESTAMP(3);
ALTER TABLE "creator_profiles" ADD COLUMN "verification_reviewed_at" TIMESTAMP(3);
ALTER TABLE "creator_profiles" ADD COLUMN "verification_reviewed_by_admin_id" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN "verification_notes" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN "verification_reject_reason" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN "can_accept_projects" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creator_profiles" ADD COLUMN "marketplace_visible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creator_profiles" ADD COLUMN "creator_level" "CreatorLevel" NOT NULL DEFAULT 'NEW';
ALTER TABLE "creator_profiles" ADD COLUMN "identity_type" "CreatorIdentityType" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "creator_verification_review_logs" (
    "id" TEXT NOT NULL,
    "creator_profile_id" TEXT NOT NULL,
    "action" "CreatorVerificationReviewAction" NOT NULL,
    "previous_verification_status" "CreatorVerificationStatus",
    "new_verification_status" "CreatorVerificationStatus",
    "previous_can_accept_projects" BOOLEAN,
    "new_can_accept_projects" BOOLEAN,
    "previous_marketplace_visible" BOOLEAN,
    "new_marketplace_visible" BOOLEAN,
    "admin_id" TEXT,
    "reason" TEXT,
    "internal_notes" TEXT,
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_verification_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_profiles_verification_status_idx" ON "creator_profiles"("verification_status");
CREATE INDEX "creator_profiles_can_accept_projects_idx" ON "creator_profiles"("can_accept_projects");
CREATE INDEX "creator_profiles_marketplace_visible_idx" ON "creator_profiles"("marketplace_visible");
CREATE INDEX "creator_profiles_creator_level_idx" ON "creator_profiles"("creator_level");
CREATE INDEX "creator_profiles_identity_type_idx" ON "creator_profiles"("identity_type");
CREATE INDEX "creator_verification_review_logs_creator_profile_id_created_at_idx" ON "creator_verification_review_logs"("creator_profile_id", "created_at");
CREATE INDEX "creator_verification_review_logs_admin_id_idx" ON "creator_verification_review_logs"("admin_id");

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_verification_reviewed_by_admin_id_fkey" FOREIGN KEY ("verification_reviewed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_verification_review_logs" ADD CONSTRAINT "creator_verification_review_logs_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_verification_review_logs" ADD CONSTRAINT "creator_verification_review_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
