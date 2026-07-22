-- Stripe hardening + creator earning ledger for Phase 2.2

ALTER TYPE "CreditPurchaseStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "CreditPurchaseStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

CREATE TYPE "CreatorEarningTransactionType" AS ENUM (
  'CONVERSION_OUT',
  'SETTLEMENT_IN',
  'WITHDRAWAL_OUT',
  'ADJUSTMENT'
);

ALTER TABLE "credit_wallets"
  ADD COLUMN IF NOT EXISTS "purchase_blocked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "credit_purchase_orders"
  ADD COLUMN IF NOT EXISTS "provider_charge_id" TEXT,
  ADD COLUMN IF NOT EXISTS "total_refunded_minor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "credits_clawed_back" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "credits_dispute_held" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripe_dispute_id" TEXT,
  ADD COLUMN IF NOT EXISTS "dispute_status" TEXT;

CREATE INDEX IF NOT EXISTS "credit_purchase_orders_provider_charge_id_idx"
  ON "credit_purchase_orders"("provider_charge_id");

CREATE TABLE IF NOT EXISTS "credit_purchase_refund_events" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "provider_refund_id" TEXT NOT NULL,
  "refund_amount_minor" INTEGER NOT NULL,
  "cumulative_refunded_minor" INTEGER NOT NULL,
  "credits_clawed_back_delta" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_purchase_refund_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_purchase_refund_events_provider_refund_id_key"
  ON "credit_purchase_refund_events"("provider_refund_id");

CREATE INDEX IF NOT EXISTS "credit_purchase_refund_events_order_id_created_at_idx"
  ON "credit_purchase_refund_events"("order_id", "created_at");

ALTER TABLE "credit_purchase_refund_events"
  ADD CONSTRAINT "credit_purchase_refund_events_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "credit_purchase_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "creator_earning_transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "type" "CreatorEarningTransactionType" NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "balance_before_minor" INTEGER NOT NULL,
  "balance_after_minor" INTEGER NOT NULL,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_earning_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "creator_earning_transactions_user_id_created_at_idx"
  ON "creator_earning_transactions"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "creator_earning_transactions_wallet_id_created_at_idx"
  ON "creator_earning_transactions"("wallet_id", "created_at");

CREATE INDEX IF NOT EXISTS "creator_earning_transactions_reference_type_reference_id_idx"
  ON "creator_earning_transactions"("reference_type", "reference_id");

ALTER TABLE "creator_earning_transactions"
  ADD CONSTRAINT "creator_earning_transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_earning_transactions"
  ADD CONSTRAINT "creator_earning_transactions_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "creator_earning_wallets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
