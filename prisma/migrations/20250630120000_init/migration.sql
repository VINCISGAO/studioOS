-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BRAND', 'CREATOR', 'ADMIN', 'SUPPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "CreatorAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'VACATION', 'OFFLINE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'AI_PROCESSING', 'CREATIVE_READY', 'CREATIVE_APPROVED', 'MATCHING', 'INVITATION_SENT', 'CREATOR_ACCEPTED', 'ESCROW_PENDING', 'ESCROW_FUNDED', 'PRODUCING', 'UNDER_REVIEW', 'APPROVED', 'MASTER_UPLOADED', 'SETTLEMENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LOGO', 'PRODUCT_IMAGE', 'PRODUCT_VIDEO', 'BRAND_GUIDE', 'FONT', 'MUSIC', 'REFERENCE_VIDEO', 'REFERENCE_IMAGE', 'PDF', 'ZIP', 'OTHER');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'TRANSCODING', 'GENERATING_HLS', 'AI_ANALYZING', 'READY', 'REVIEWING', 'APPROVED', 'MASTER', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('WAITING', 'READY', 'REVIEWING', 'REVISION_REQUIRED', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('CIRCLE', 'RECTANGLE', 'ARROW', 'POINT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'COUNTER', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('CREATED', 'PAYING', 'HELD', 'PARTIAL_RELEASE', 'FULL_RELEASE', 'CLOSED', 'REFUND', 'DISPUTE');

-- CreateEnum
CREATE TYPE "PaymentCollectionStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CreatorPayoutStatus" AS ENUM ('MANUAL_PAYOUT_PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_DEPOSIT', 'ESCROW_RELEASE', 'PLATFORM_COMMISSION', 'CLIENT_SERVICE_FEE', 'MEMBERSHIP_FEE', 'WITHDRAW_REQUEST', 'WITHDRAW_SUCCESS', 'WITHDRAW_FAILED', 'REFUND', 'CHARGEBACK', 'BONUS', 'PENALTY', 'DISPUTE_FREEZE', 'DISPUTE_RELEASE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'WEBHOOK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CreatorMembershipPlanType" AS ENUM ('DEFAULT', 'VERIFIED');

-- CreateEnum
CREATE TYPE "CreatorMembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CreatorMembershipPaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'CRYPTO', 'ADMIN', 'DEMO');

-- CreateEnum
CREATE TYPE "CreatorMembershipHistoryAction" AS ENUM ('CREATED', 'ACTIVATED', 'RENEWED', 'EXPIRED', 'DOWNGRADED', 'CANCELLED', 'REFUNDED', 'ADMIN_UPGRADE', 'ADMIN_DOWNGRADE', 'ADMIN_EXTEND', 'UPGRADE_DECLINED');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'VALIDATING', 'SUCCESS', 'FAILED', 'RETRYING', 'DEAD');

-- CreateEnum
CREATE TYPE "QueueJobStatus" AS ENUM ('WAITING', 'RUNNING', 'SUCCESS', 'FAILED', 'RETRY', 'DEAD');

-- CreateEnum
CREATE TYPE "CommunicationSourceType" AS ENUM ('CHAT', 'REVIEW_COMMENT', 'CAMPAIGN_BRIEF', 'CREATIVE_SCRIPT', 'CREATOR_QUOTE', 'PORTFOLIO', 'CONTRACT', 'EMAIL', 'NOTIFICATION', 'DISPUTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AiTonePreference" AS ENUM ('PROFESSIONAL', 'LUXURY', 'GEN_Z', 'CORPORATE', 'CASUAL');

-- CreateEnum
CREATE TYPE "MemoryOwnerType" AS ENUM ('BRAND', 'CREATOR', 'CAMPAIGN', 'RELATIONSHIP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar_url" TEXT,
    "full_name" TEXT NOT NULL,
    "country" TEXT,
    "timezone" TEXT,
    "language" TEXT DEFAULT 'en',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "website" TEXT,
    "logo_url" TEXT,
    "industry" TEXT,
    "brand_description" TEXT,
    "credit_score" INTEGER NOT NULL DEFAULT 100,
    "completed_campaigns" INTEGER NOT NULL DEFAULT 0,
    "brand_dna_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "country" TEXT,
    "languages_json" JSONB,
    "availability" "CreatorAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "hourly_rate" DECIMAL(18,2),
    "min_budget" DECIMAL(18,2),
    "max_budget" DECIMAL(18,2),
    "credit_score" INTEGER NOT NULL DEFAULT 100,
    "ai_quality_score" INTEGER NOT NULL DEFAULT 80,
    "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "average_review_round" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "average_delivery_days" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "completed_campaigns" INTEGER NOT NULL DEFAULT 0,
    "creator_dna_json" JSONB,
    "portfolio_cover" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deadline" TIMESTAMP(3) NOT NULL,
    "platform" TEXT,
    "aspect_ratio" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "creative_direction" TEXT,
    "production_brief" JSONB,
    "campaign_memory_json" JSONB,
    "campaign_health" INTEGER NOT NULL DEFAULT 100,
    "review_round" INTEGER NOT NULL DEFAULT 0,
    "current_version" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'r2',
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DECIMAL(10,3),
    "hash" TEXT,
    "preview_url" TEXT,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaign_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_versions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "video_key" TEXT NOT NULL,
    "video_url" TEXT,
    "hls_url" TEXT,
    "thumbnail_url" TEXT,
    "duration" DECIMAL(10,3),
    "watermark" BOOLEAN NOT NULL DEFAULT true,
    "status" "VersionStatus" NOT NULL DEFAULT 'UPLOADING',
    "review_round" INTEGER NOT NULL DEFAULT 0,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'WAITING',
    "review_score" DECIMAL(5,2),
    "ai_report_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaign_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comments" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "time_seconds" DECIMAL(10,3) NOT NULL,
    "comment" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_annotations" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "x" DECIMAL(8,6) NOT NULL,
    "y" DECIMAL(8,6) NOT NULL,
    "width" DECIMAL(8,6) NOT NULL,
    "height" DECIMAL(8,6) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF4D4F',
    "stroke_width" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_invitations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "match_score" DECIMAL(5,2) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'SENT',
    "counter_offer" DECIMAL(18,2),
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_payments" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "stripe_payment_id" TEXT,
    "stripe_session_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(18,2) NOT NULL,
    "released_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(18,2) NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'CREATED',
    "payment_status" "PaymentCollectionStatus" NOT NULL DEFAULT 'UNPAID',
    "creator_payout_status" "CreatorPayoutStatus",
    "paid_at" TIMESTAMP(3),
    "payout_paid_at" TIMESTAMP(3),
    "payout_marked_by_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "available_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_withdraw" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance_after" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "device" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "admin_id" TEXT,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "input_json" JSONB NOT NULL,
    "output_json" JSONB,
    "prompt_version" TEXT,
    "token_input" INTEGER NOT NULL DEFAULT 0,
    "token_output" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_jobs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "version_id" TEXT,
    "queue" TEXT NOT NULL,
    "status" "QueueJobStatus" NOT NULL DEFAULT 'WAITING',
    "payload_json" JSONB NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_jobs" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "status" "QueueJobStatus" NOT NULL DEFAULT 'WAITING',
    "payload_json" JSONB NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_logs" (
    "id" TEXT NOT NULL,
    "worker_name" TEXT NOT NULL,
    "job_id" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "to_email" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_files" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "file_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'r2',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_translation_logs" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source_lang" TEXT NOT NULL,
    "target_lang" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "token_input" INTEGER NOT NULL DEFAULT 0,
    "token_output" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_translation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_preferences" (
    "user_id" TEXT NOT NULL,
    "preferred_language" TEXT,
    "always_translate" BOOLEAN NOT NULL DEFAULT true,
    "never_use_emojis" BOOLEAN NOT NULL DEFAULT false,
    "tone" "AiTonePreference" NOT NULL DEFAULT 'PROFESSIONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "memory_facts" (
    "id" TEXT NOT NULL,
    "owner_type" "MemoryOwnerType" NOT NULL,
    "brand_id" TEXT,
    "creator_id" TEXT,
    "campaign_id" TEXT,
    "category" TEXT NOT NULL,
    "fact_key" TEXT NOT NULL,
    "fact_value" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL DEFAULT 0.8,
    "source_type" TEXT NOT NULL,
    "source_ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_dna" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "collaboration_count" INTEGER NOT NULL DEFAULT 0,
    "avg_satisfaction" DECIMAL(3,2),
    "avg_review_rounds" DECIMAL(5,2),
    "avg_days_early" DECIMAL(5,2),
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "last_collaboration_at" TIMESTAMP(3),
    "dna_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_dna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_membership_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_type" "CreatorMembershipPlanType" NOT NULL,
    "annual_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "creator_commission_percentage" DECIMAL(5,2) NOT NULL,
    "membership_duration_days" INTEGER NOT NULL DEFAULT 365,
    "benefits_json" JSONB NOT NULL DEFAULT '[]',
    "stripe_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_memberships" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "creator_profile_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "status" "CreatorMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "payment_provider" "CreatorMembershipPaymentProvider",
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "payment_id" TEXT,
    "stripe_session_id" TEXT,
    "amount_paid" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "client_service_fee_percentage" DECIMAL(5,2) NOT NULL,
    "default_creator_commission_percentage" DECIMAL(5,2) NOT NULL,
    "verified_creator_commission_percentage" DECIMAL(5,2) NOT NULL,
    "upgrade_revenue_threshold" DECIMAL(18,2) NOT NULL,
    "upgrade_modal_enabled" BOOLEAN NOT NULL DEFAULT true,
    "client_service_fee_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_commissions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "order_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "order_amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "client_service_fee_percentage" DECIMAL(5,2) NOT NULL,
    "client_service_fee_amount" DECIMAL(18,2) NOT NULL,
    "creator_commission_percentage" DECIMAL(5,2) NOT NULL,
    "creator_commission_amount" DECIMAL(18,2) NOT NULL,
    "creator_payout_amount" DECIMAL(18,2) NOT NULL,
    "platform_total_revenue" DECIMAL(18,2) NOT NULL,
    "creator_membership_type_at_order_time" "CreatorMembershipPlanType" NOT NULL,
    "commission_rule_id" TEXT,
    "plan_id" TEXT,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_earnings" (
    "creator_id" TEXT NOT NULL,
    "total_settled_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_pending_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_withdrawn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_creator_payout" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "upgrade_declined_at" TIMESTAMP(3),
    "last_upgrade_prompt_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_earnings_pkey" PRIMARY KEY ("creator_id")
);

-- CreateTable
CREATE TABLE "creator_membership_history" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "membership_id" TEXT,
    "action" "CreatorMembershipHistoryAction" NOT NULL,
    "actor_id" TEXT,
    "note" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_membership_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_user_id_key" ON "brand_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_user_id_key" ON "creator_profiles"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_brand_id_idx" ON "campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "campaigns_creator_id_idx" ON "campaigns"("creator_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_deadline_idx" ON "campaigns"("deadline");

-- CreateIndex
CREATE INDEX "campaigns_campaign_health_idx" ON "campaigns"("campaign_health");

-- CreateIndex
CREATE INDEX "campaigns_created_at_idx" ON "campaigns"("created_at");

-- CreateIndex
CREATE INDEX "campaign_assets_campaign_id_idx" ON "campaign_assets"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_assets_asset_type_idx" ON "campaign_assets"("asset_type");

-- CreateIndex
CREATE INDEX "campaign_versions_campaign_id_idx" ON "campaign_versions"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_versions_status_idx" ON "campaign_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_versions_campaign_id_version_number_key" ON "campaign_versions"("campaign_id", "version_number");

-- CreateIndex
CREATE INDEX "review_comments_campaign_id_idx" ON "review_comments"("campaign_id");

-- CreateIndex
CREATE INDEX "review_comments_version_id_idx" ON "review_comments"("version_id");

-- CreateIndex
CREATE INDEX "review_comments_user_id_idx" ON "review_comments"("user_id");

-- CreateIndex
CREATE INDEX "review_annotations_comment_id_idx" ON "review_annotations"("comment_id");

-- CreateIndex
CREATE INDEX "review_annotations_version_id_idx" ON "review_annotations"("version_id");

-- CreateIndex
CREATE INDEX "creator_invitations_campaign_id_idx" ON "creator_invitations"("campaign_id");

-- CreateIndex
CREATE INDEX "creator_invitations_creator_id_idx" ON "creator_invitations"("creator_id");

-- CreateIndex
CREATE INDEX "creator_invitations_status_idx" ON "creator_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_payments_campaign_id_key" ON "escrow_payments"("campaign_id");

-- CreateIndex
CREATE INDEX "escrow_payments_brand_id_idx" ON "escrow_payments"("brand_id");

-- CreateIndex
CREATE INDEX "escrow_payments_creator_id_idx" ON "escrow_payments"("creator_id");

-- CreateIndex
CREATE INDEX "escrow_payments_status_idx" ON "escrow_payments"("status");

-- CreateIndex
CREATE INDEX "escrow_payments_payment_status_idx" ON "escrow_payments"("payment_status");

-- CreateIndex
CREATE INDEX "escrow_payments_creator_payout_status_idx" ON "escrow_payments"("creator_payout_status");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_campaign_id_idx" ON "transactions"("campaign_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "domain_events_event_name_idx" ON "domain_events"("event_name");

-- CreateIndex
CREATE INDEX "domain_events_aggregate_id_idx" ON "domain_events"("aggregate_id");

-- CreateIndex
CREATE INDEX "domain_events_status_idx" ON "domain_events"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_campaign_id_idx" ON "notifications"("campaign_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "activity_logs_campaign_id_idx" ON "activity_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "disputes_campaign_id_idx" ON "disputes"("campaign_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "ai_jobs_campaign_id_idx" ON "ai_jobs"("campaign_id");

-- CreateIndex
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs"("status");

-- CreateIndex
CREATE INDEX "ai_jobs_type_idx" ON "ai_jobs"("type");

-- CreateIndex
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events"("provider");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "video_jobs_campaign_id_idx" ON "video_jobs"("campaign_id");

-- CreateIndex
CREATE INDEX "video_jobs_status_idx" ON "video_jobs"("status");

-- CreateIndex
CREATE INDEX "video_jobs_queue_idx" ON "video_jobs"("queue");

-- CreateIndex
CREATE INDEX "queue_jobs_queue_idx" ON "queue_jobs"("queue");

-- CreateIndex
CREATE INDEX "queue_jobs_status_idx" ON "queue_jobs"("status");

-- CreateIndex
CREATE INDEX "worker_logs_worker_name_idx" ON "worker_logs"("worker_name");

-- CreateIndex
CREATE INDEX "worker_logs_job_id_idx" ON "worker_logs"("job_id");

-- CreateIndex
CREATE INDEX "email_logs_user_id_idx" ON "email_logs"("user_id");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "session_logs_user_id_idx" ON "session_logs"("user_id");

-- CreateIndex
CREATE INDEX "storage_files_campaign_id_idx" ON "storage_files"("campaign_id");

-- CreateIndex
CREATE INDEX "storage_files_file_key_idx" ON "storage_files"("file_key");

-- CreateIndex
CREATE INDEX "communication_messages_campaign_id_idx" ON "communication_messages"("campaign_id");

-- CreateIndex
CREATE INDEX "communication_messages_sender_id_idx" ON "communication_messages"("sender_id");

-- CreateIndex
CREATE INDEX "communication_messages_receiver_id_idx" ON "communication_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "communication_messages_source_type_source_ref_id_idx" ON "communication_messages"("source_type", "source_ref_id");

-- CreateIndex
CREATE INDEX "communication_messages_created_at_idx" ON "communication_messages"("created_at");

-- CreateIndex
CREATE INDEX "communication_translation_logs_message_id_idx" ON "communication_translation_logs"("message_id");

-- CreateIndex
CREATE INDEX "communication_translation_logs_created_at_idx" ON "communication_translation_logs"("created_at");

-- CreateIndex
CREATE INDEX "memory_facts_brand_id_idx" ON "memory_facts"("brand_id");

-- CreateIndex
CREATE INDEX "memory_facts_creator_id_idx" ON "memory_facts"("creator_id");

-- CreateIndex
CREATE INDEX "memory_facts_campaign_id_idx" ON "memory_facts"("campaign_id");

-- CreateIndex
CREATE INDEX "memory_facts_owner_type_idx" ON "memory_facts"("owner_type");

-- CreateIndex
CREATE UNIQUE INDEX "memory_facts_owner_type_brand_id_creator_id_campaign_id_cat_key" ON "memory_facts"("owner_type", "brand_id", "creator_id", "campaign_id", "category", "fact_key");

-- CreateIndex
CREATE INDEX "relationship_dna_brand_id_idx" ON "relationship_dna"("brand_id");

-- CreateIndex
CREATE INDEX "relationship_dna_creator_id_idx" ON "relationship_dna"("creator_id");

-- CreateIndex
CREATE INDEX "relationship_dna_priority_score_idx" ON "relationship_dna"("priority_score");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_dna_brand_id_creator_id_key" ON "relationship_dna"("brand_id", "creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_membership_plans_slug_key" ON "creator_membership_plans"("slug");

-- CreateIndex
CREATE INDEX "creator_membership_plans_plan_type_is_active_idx" ON "creator_membership_plans"("plan_type", "is_active");

-- CreateIndex
CREATE INDEX "creator_memberships_creator_id_status_idx" ON "creator_memberships"("creator_id", "status");

-- CreateIndex
CREATE INDEX "creator_memberships_expires_at_idx" ON "creator_memberships"("expires_at");

-- CreateIndex
CREATE INDEX "creator_memberships_plan_id_idx" ON "creator_memberships"("plan_id");

-- CreateIndex
CREATE INDEX "commission_rules_is_active_idx" ON "commission_rules"("is_active");

-- CreateIndex
CREATE INDEX "order_commissions_creator_id_idx" ON "order_commissions"("creator_id");

-- CreateIndex
CREATE INDEX "order_commissions_settled_at_idx" ON "order_commissions"("settled_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_commissions_campaign_id_key" ON "order_commissions"("campaign_id");

-- CreateIndex
CREATE INDEX "creator_membership_history_creator_id_created_at_idx" ON "creator_membership_history"("creator_id", "created_at");

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_versions" ADD CONSTRAINT "campaign_versions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "campaign_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_annotations" ADD CONSTRAINT "review_annotations_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "review_comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_annotations" ADD CONSTRAINT "review_annotations_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "campaign_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_invitations" ADD CONSTRAINT "creator_invitations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_invitations" ADD CONSTRAINT "creator_invitations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_payments" ADD CONSTRAINT "escrow_payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_translation_logs" ADD CONSTRAINT "communication_translation_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_preferences" ADD CONSTRAINT "ai_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_facts" ADD CONSTRAINT "memory_facts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_dna" ADD CONSTRAINT "relationship_dna_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_dna" ADD CONSTRAINT "relationship_dna_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_memberships" ADD CONSTRAINT "creator_memberships_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_memberships" ADD CONSTRAINT "creator_memberships_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_memberships" ADD CONSTRAINT "creator_memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "creator_membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_membership_history" ADD CONSTRAINT "creator_membership_history_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_membership_history" ADD CONSTRAINT "creator_membership_history_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "creator_membership_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

