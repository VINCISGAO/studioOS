-- VINCIS Credits ledger (user-scoped AI billing)

CREATE TYPE "CreditTransactionType" AS ENUM (
  'PURCHASE',
  'EARNING_CONVERSION',
  'BONUS',
  'RESERVE',
  'CAPTURE',
  'RELEASE',
  'REFUND',
  'ADMIN_ADJUSTMENT',
  'EXPIRATION'
);

CREATE TYPE "CreditSource" AS ENUM (
  'CASH_PAYMENT',
  'CREATOR_EARNINGS',
  'PROMOTION',
  'SYSTEM',
  'ADMIN',
  'GENERATION_JOB'
);

CREATE TYPE "CreditPurchaseStatus" AS ENUM (
  'PENDING',
  'PAYMENT_CREATED',
  'PAID',
  'CREDITED',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE "ConversionStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "CreditReservationStatus" AS ENUM (
  'ACTIVE',
  'CAPTURED',
  'RELEASED',
  'EXPIRED'
);

CREATE TABLE "credit_wallets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "available_credits" INTEGER NOT NULL DEFAULT 0,
  "reserved_credits" INTEGER NOT NULL DEFAULT 0,
  "lifetime_purchased" INTEGER NOT NULL DEFAULT 0,
  "lifetime_bonus" INTEGER NOT NULL DEFAULT 0,
  "lifetime_spent" INTEGER NOT NULL DEFAULT 0,
  "lifetime_refunded" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "credit_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creator_earning_wallets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "available_balance_minor" INTEGER NOT NULL DEFAULT 0,
  "pending_balance_minor" INTEGER NOT NULL DEFAULT 0,
  "frozen_balance_minor" INTEGER NOT NULL DEFAULT 0,
  "withdrawn_balance_minor" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "creator_earning_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balance_before" INTEGER NOT NULL,
  "balance_after" INTEGER NOT NULL,
  "source" "CreditSource" NOT NULL,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_packages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "bonus_credits" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "amount_minor" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_purchase_orders" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "package_id" TEXT,
  "credits" INTEGER NOT NULL,
  "bonus_credits" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "provider_session_id" TEXT,
  "provider_payment_id" TEXT,
  "status" "CreditPurchaseStatus" NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "paid_at" TIMESTAMP(3),
  "credited_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "credit_purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "earning_to_credit_conversions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "earning_wallet_id" TEXT NOT NULL,
  "credit_wallet_id" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "earning_amount_minor" INTEGER NOT NULL,
  "credits_granted" INTEGER NOT NULL,
  "exchange_rate_snapshot" JSONB NOT NULL,
  "status" "ConversionStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" TEXT NOT NULL,
  "earning_transaction_id" TEXT,
  "credit_transaction_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "earning_to_credit_conversions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_reservations" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "estimated_credits" INTEGER NOT NULL,
  "captured_credits" INTEGER NOT NULL DEFAULT 0,
  "released_credits" INTEGER NOT NULL DEFAULT 0,
  "status" "CreditReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "idempotency_key" TEXT NOT NULL,
  "pricing_snapshot" JSONB,
  "generation_job_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "captured_at" TIMESTAMP(3),
  "released_at" TIMESTAMP(3),

  CONSTRAINT "credit_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_pricing_rules" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "generation_type" "GenerationType" NOT NULL,
  "duration_sec" INTEGER,
  "resolution" TEXT,
  "output_count" INTEGER NOT NULL DEFAULT 1,
  "provider_cost_minor" INTEGER,
  "credit_price" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "credit_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_exchange_rate_configs" (
  "id" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "credits_per_unit_minor" INTEGER NOT NULL,
  "pro_bonus_percent" INTEGER NOT NULL DEFAULT 0,
  "promo_bonus_percent" INTEGER NOT NULL DEFAULT 0,
  "min_conversion_minor" INTEGER NOT NULL DEFAULT 100,
  "daily_limit_minor" INTEGER,
  "monthly_limit_minor" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "credit_exchange_rate_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credit_wallets_user_id_key" ON "credit_wallets"("user_id");
CREATE UNIQUE INDEX "creator_earning_wallets_user_id_key" ON "creator_earning_wallets"("user_id");
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at");
CREATE INDEX "credit_transactions_wallet_id_created_at_idx" ON "credit_transactions"("wallet_id", "created_at");
CREATE INDEX "credit_transactions_reference_type_reference_id_idx" ON "credit_transactions"("reference_type", "reference_id");
CREATE INDEX "credit_packages_enabled_sort_order_idx" ON "credit_packages"("enabled", "sort_order");
CREATE UNIQUE INDEX "credit_purchase_orders_idempotency_key_key" ON "credit_purchase_orders"("idempotency_key");
CREATE INDEX "credit_purchase_orders_user_id_created_at_idx" ON "credit_purchase_orders"("user_id", "created_at");
CREATE INDEX "credit_purchase_orders_status_created_at_idx" ON "credit_purchase_orders"("status", "created_at");
CREATE INDEX "credit_purchase_orders_provider_session_id_idx" ON "credit_purchase_orders"("provider_session_id");
CREATE UNIQUE INDEX "earning_to_credit_conversions_idempotency_key_key" ON "earning_to_credit_conversions"("idempotency_key");
CREATE INDEX "earning_to_credit_conversions_user_id_created_at_idx" ON "earning_to_credit_conversions"("user_id", "created_at");
CREATE UNIQUE INDEX "credit_reservations_idempotency_key_key" ON "credit_reservations"("idempotency_key");
CREATE INDEX "credit_reservations_user_id_status_idx" ON "credit_reservations"("user_id", "status");
CREATE INDEX "credit_reservations_wallet_id_status_idx" ON "credit_reservations"("wallet_id", "status");
CREATE INDEX "credit_pricing_rules_generation_type_model_enabled_idx" ON "credit_pricing_rules"("generation_type", "model", "enabled");
CREATE UNIQUE INDEX "credit_exchange_rate_configs_currency_key" ON "credit_exchange_rate_configs"("currency");

ALTER TABLE "generation_jobs" ADD COLUMN "credit_reservation_id" TEXT;
ALTER TABLE "generation_jobs" ADD COLUMN "pricing_snapshot" JSONB;
CREATE UNIQUE INDEX "generation_jobs_credit_reservation_id_key" ON "generation_jobs"("credit_reservation_id");

ALTER TABLE "credit_wallets" ADD CONSTRAINT "credit_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creator_earning_wallets" ADD CONSTRAINT "creator_earning_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_purchase_orders" ADD CONSTRAINT "credit_purchase_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_purchase_orders" ADD CONSTRAINT "credit_purchase_orders_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_purchase_orders" ADD CONSTRAINT "credit_purchase_orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "credit_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "earning_to_credit_conversions" ADD CONSTRAINT "earning_to_credit_conversions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "earning_to_credit_conversions" ADD CONSTRAINT "earning_to_credit_conversions_earning_wallet_id_fkey" FOREIGN KEY ("earning_wallet_id") REFERENCES "creator_earning_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "earning_to_credit_conversions" ADD CONSTRAINT "earning_to_credit_conversions_credit_wallet_id_fkey" FOREIGN KEY ("credit_wallet_id") REFERENCES "credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_credit_reservation_id_fkey" FOREIGN KEY ("credit_reservation_id") REFERENCES "credit_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "credit_packages" ("id", "name", "credits", "bonus_credits", "currency", "amount_minor", "enabled", "sort_order", "updated_at")
VALUES
  ('pkg_credits_500', 'Starter', 500, 0, 'USD', 900, true, 10, CURRENT_TIMESTAMP),
  ('pkg_credits_2000', 'Creator', 2000, 200, 'USD', 2900, true, 20, CURRENT_TIMESTAMP),
  ('pkg_credits_6000', 'Studio', 6000, 800, 'USD', 7900, true, 30, CURRENT_TIMESTAMP),
  ('pkg_credits_15000', 'Pro', 15000, 2500, 'USD', 14900, true, 40, CURRENT_TIMESTAMP);

INSERT INTO "credit_exchange_rate_configs" ("id", "currency", "credits_per_unit_minor", "pro_bonus_percent", "promo_bonus_percent", "min_conversion_minor", "updated_at")
VALUES ('cfg_usd_default', 'USD', 100, 10, 0, 100, CURRENT_TIMESTAMP);
