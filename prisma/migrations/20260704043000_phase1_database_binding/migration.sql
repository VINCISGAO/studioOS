-- Phase 1 database binding: creator profile, portfolio, orders, referrals, withdrawals.

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReferralCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'AI_ACTIVE', 'HUMAN_REQUIRED', 'HUMAN_ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConversationMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'HUMAN_AGENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "nickname" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN "city" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN "service_cities_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "social_links_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "styles_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "specialties_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "tools_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "expertise_domains_json" JSONB;
ALTER TABLE "creator_profiles" ADD COLUMN "portfolio_url" TEXT;
ALTER TABLE "creator_profiles" ADD COLUMN "ai_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "creator_profiles" ADD COLUMN "profile_completed_at" TIMESTAMP(3);
ALTER TABLE "creator_profiles" ADD COLUMN "legacy_creator_id" TEXT;

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN "order_id" TEXT;
ALTER TABLE "ledger_entries" ADD COLUMN "withdrawal_request_id" TEXT;

-- AlterTable
ALTER TABLE "storage_files" ADD COLUMN "user_id" TEXT;
ALTER TABLE "storage_files" ADD COLUMN "portfolio_work_id" TEXT;
ALTER TABLE "storage_files" ADD COLUMN "file_name" TEXT;
ALTER TABLE "storage_files" ADD COLUMN "file_type" TEXT;
ALTER TABLE "storage_files" ADD COLUMN "public_url" TEXT;

-- CreateTable
CREATE TABLE "creator_portfolio_works" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "country" TEXT,
    "category" TEXT,
    "platform" TEXT,
    "format" TEXT,
    "work_type" TEXT,
    "thumbnail_url" TEXT,
    "thumbnail_key" TEXT,
    "video_url" TEXT,
    "video_key" TEXT,
    "tags_json" JSONB,
    "price_min" DECIMAL(18,2),
    "price_max" DECIMAL(18,2),
    "price_visible" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_portfolio_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_ai_configs" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "ai_name" TEXT NOT NULL,
    "persona" TEXT,
    "welcome_message" TEXT,
    "service_intro" TEXT,
    "faq_json" JSONB,
    "pricing_rules_json" JSONB,
    "reception_script" TEXT,
    "multilingual_json" JSONB,
    "default_reply" TEXT,
    "blocked_content_json" JSONB,
    "handoff_rules_json" JSONB,
    "data_sources_json" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connected_channels" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "account_url" TEXT,
    "account_handle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "source_count" INTEGER NOT NULL DEFAULT 0,
    "ai_learning_enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata_json" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "client_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "creator_profile_id" TEXT,
    "service_project" TEXT NOT NULL,
    "shooting_city" TEXT,
    "shooting_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "order_amount" DECIMAL(18,2) NOT NULL,
    "platform_commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "creator_income" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "source_channel" TEXT,
    "conversation_id" TEXT,
    "referrer_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "visitor_id" TEXT,
    "customer_id" TEXT,
    "campaign_id" TEXT,
    "channel" TEXT NOT NULL,
    "source" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "last_message_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "ConversationMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "campaign_id" TEXT,
    "conversation_id" TEXT,
    "creator_id" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "content" TEXT,
    "utm" JSONB,
    "platform" TEXT,
    "click_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "asset_code" "WalletAssetCode" NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(24,8) NOT NULL,
    "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_relations" (
    "id" TEXT NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_commissions" (
    "id" TEXT NOT NULL,
    "referrer_user_id" TEXT NOT NULL,
    "referred_user_id" TEXT,
    "order_id" TEXT,
    "campaign_id" TEXT,
    "source" TEXT,
    "deal_amount" DECIMAL(18,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(18,2) NOT NULL,
    "status" "ReferralCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_legacy_creator_id_key" ON "creator_profiles"("legacy_creator_id");

-- CreateIndex
CREATE INDEX "creator_profiles_country_idx" ON "creator_profiles"("country");

-- CreateIndex
CREATE INDEX "creator_profiles_availability_idx" ON "creator_profiles"("availability");

-- CreateIndex
CREATE INDEX "creator_profiles_profile_completed_at_idx" ON "creator_profiles"("profile_completed_at");

-- CreateIndex
CREATE INDEX "creator_portfolio_works_creator_id_idx" ON "creator_portfolio_works"("creator_id");

-- CreateIndex
CREATE INDEX "creator_portfolio_works_campaign_id_idx" ON "creator_portfolio_works"("campaign_id");

-- CreateIndex
CREATE INDEX "creator_portfolio_works_creator_id_is_public_sort_order_idx" ON "creator_portfolio_works"("creator_id", "is_public", "sort_order");

-- CreateIndex
CREATE INDEX "creator_portfolio_works_deleted_at_idx" ON "creator_portfolio_works"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "creator_ai_configs_creator_id_key" ON "creator_ai_configs"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "connected_channels_creator_id_platform_key" ON "connected_channels"("creator_id", "platform");

-- CreateIndex
CREATE INDEX "connected_channels_creator_id_idx" ON "connected_channels"("creator_id");

-- CreateIndex
CREATE INDEX "connected_channels_platform_idx" ON "connected_channels"("platform");

-- CreateIndex
CREATE INDEX "connected_channels_status_idx" ON "connected_channels"("status");

-- CreateIndex
CREATE INDEX "connected_channels_ai_learning_enabled_idx" ON "connected_channels"("ai_learning_enabled");

-- CreateIndex
CREATE INDEX "orders_campaign_id_idx" ON "orders"("campaign_id");

-- CreateIndex
CREATE INDEX "orders_client_id_idx" ON "orders"("client_id");

-- CreateIndex
CREATE INDEX "orders_creator_id_idx" ON "orders"("creator_id");

-- CreateIndex
CREATE INDEX "orders_creator_profile_id_idx" ON "orders"("creator_profile_id");

-- CreateIndex
CREATE INDEX "orders_conversation_id_idx" ON "orders"("conversation_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_referrer_id_idx" ON "orders"("referrer_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "conversations_creator_id_idx" ON "conversations"("creator_id");

-- CreateIndex
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");

-- CreateIndex
CREATE INDEX "conversations_campaign_id_idx" ON "conversations"("campaign_id");

-- CreateIndex
CREATE INDEX "conversations_assigned_to_idx" ON "conversations"("assigned_to");

-- CreateIndex
CREATE INDEX "conversations_status_last_message_at_idx" ON "conversations"("status", "last_message_at");

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_created_at_idx" ON "conversation_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "conversation_messages_role_idx" ON "conversation_messages"("role");

-- CreateIndex
CREATE INDEX "attributions_order_id_idx" ON "attributions"("order_id");

-- CreateIndex
CREATE INDEX "attributions_campaign_id_idx" ON "attributions"("campaign_id");

-- CreateIndex
CREATE INDEX "attributions_conversation_id_idx" ON "attributions"("conversation_id");

-- CreateIndex
CREATE INDEX "attributions_creator_id_idx" ON "attributions"("creator_id");

-- CreateIndex
CREATE INDEX "attributions_platform_idx" ON "attributions"("platform");

-- CreateIndex
CREATE INDEX "attributions_source_medium_idx" ON "attributions"("source", "medium");

-- CreateIndex
CREATE INDEX "attributions_created_at_idx" ON "attributions"("created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_order_id_idx" ON "ledger_entries"("order_id");

-- CreateIndex
CREATE INDEX "ledger_entries_withdrawal_request_id_idx" ON "ledger_entries"("withdrawal_request_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_wallet_account_id_idx" ON "withdrawal_requests"("wallet_account_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_payment_method_id_idx" ON "withdrawal_requests"("payment_method_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_created_at_idx" ON "withdrawal_requests"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_user_id_idx" ON "referral_codes"("user_id");

-- CreateIndex
CREATE INDEX "referral_codes_is_active_idx" ON "referral_codes"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "referral_relations_referred_user_id_key" ON "referral_relations"("referred_user_id");

-- CreateIndex
CREATE INDEX "referral_relations_referrer_user_id_idx" ON "referral_relations"("referrer_user_id");

-- CreateIndex
CREATE INDEX "referral_commissions_referrer_user_id_idx" ON "referral_commissions"("referrer_user_id");

-- CreateIndex
CREATE INDEX "referral_commissions_referred_user_id_idx" ON "referral_commissions"("referred_user_id");

-- CreateIndex
CREATE INDEX "referral_commissions_order_id_idx" ON "referral_commissions"("order_id");

-- CreateIndex
CREATE INDEX "referral_commissions_campaign_id_idx" ON "referral_commissions"("campaign_id");

-- CreateIndex
CREATE INDEX "referral_commissions_status_idx" ON "referral_commissions"("status");

-- CreateIndex
CREATE INDEX "storage_files_user_id_idx" ON "storage_files"("user_id");

-- CreateIndex
CREATE INDEX "storage_files_portfolio_work_id_idx" ON "storage_files"("portfolio_work_id");

-- AddForeignKey
ALTER TABLE "creator_portfolio_works" ADD CONSTRAINT "creator_portfolio_works_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_portfolio_works" ADD CONSTRAINT "creator_portfolio_works_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_ai_configs" ADD CONSTRAINT "creator_ai_configs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_channels" ADD CONSTRAINT "connected_channels_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_profile_id_fkey" FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_withdrawal_request_id_fkey" FOREIGN KEY ("withdrawal_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relations" ADD CONSTRAINT "referral_relations_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relations" ADD CONSTRAINT "referral_relations_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_portfolio_work_id_fkey" FOREIGN KEY ("portfolio_work_id") REFERENCES "creator_portfolio_works"("id") ON DELETE SET NULL ON UPDATE CASCADE;
