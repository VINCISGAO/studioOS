-- Unified finance: WalletAccount, WalletAsset, PaymentMethod, LedgerEntry

CREATE TYPE "WalletAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "WalletAssetCode" AS ENUM ('USD', 'CNY', 'EUR', 'USDT', 'USDC', 'BTC', 'ETH', 'TRX');
CREATE TYPE "PaymentChannel" AS ENUM (
  'STRIPE',
  'PAYPAL',
  'WISE',
  'BANK_TRANSFER',
  'ALIPAY',
  'WECHAT_PAY',
  'ABA_LOCAL_BANK',
  'MANUAL_OFFLINE',
  'CRYPTO_ONCHAIN',
  'INTERNAL'
);
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_WIRE', 'PAYPAL', 'WISE', 'ALIPAY', 'WECHAT', 'CRYPTO', 'LOCAL_BANK', 'MANUAL');
CREATE TYPE "PaymentMethodProvider" AS ENUM (
  'STRIPE',
  'PAYPAL',
  'WISE',
  'BANK_TRANSFER',
  'ALIPAY',
  'WECHAT_PAY',
  'ABA_LOCAL_BANK',
  'MANUAL_OFFLINE',
  'CRYPTO'
);
CREATE TYPE "PaymentMethodStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISABLED');
CREATE TYPE "LedgerEntryType" AS ENUM (
  'DEPOSIT',
  'WITHDRAW',
  'ESCROW_LOCK',
  'ESCROW_RELEASE',
  'SETTLEMENT',
  'COMMISSION',
  'REFUND',
  'MANUAL_ADJUSTMENT'
);
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

CREATE TABLE "wallet_accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" "WalletAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_assets" (
  "id" TEXT NOT NULL,
  "wallet_account_id" TEXT NOT NULL,
  "asset_code" "WalletAssetCode" NOT NULL,
  "available_balance" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "pending_balance" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "frozen_balance" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "wallet_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_methods" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "PaymentMethodType" NOT NULL,
  "provider" "PaymentMethodProvider" NOT NULL,
  "account_name" TEXT,
  "account_number" TEXT,
  "account_email" TEXT,
  "wallet_address" TEXT,
  "network" TEXT,
  "currency" "WalletAssetCode" NOT NULL DEFAULT 'USD',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "status" "PaymentMethodStatus" NOT NULL DEFAULT 'PENDING',
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "wallet_account_id" TEXT NOT NULL,
  "asset_code" "WalletAssetCode" NOT NULL,
  "entry_type" "LedgerEntryType" NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount" DECIMAL(24,8) NOT NULL,
  "available_after" DECIMAL(24,8) NOT NULL,
  "pending_after" DECIMAL(24,8) NOT NULL,
  "frozen_after" DECIMAL(24,8) NOT NULL,
  "campaign_id" TEXT,
  "payment_method_id" TEXT,
  "channel" "PaymentChannel",
  "reference_type" TEXT,
  "reference_id" TEXT,
  "crypto_network" TEXT,
  "tx_hash" TEXT,
  "external_wallet_address" TEXT,
  "description" TEXT,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_accounts_user_id_key" ON "wallet_accounts"("user_id");
CREATE UNIQUE INDEX "wallet_assets_wallet_account_id_asset_code_key" ON "wallet_assets"("wallet_account_id", "asset_code");
CREATE INDEX "wallet_assets_wallet_account_id_idx" ON "wallet_assets"("wallet_account_id");
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");
CREATE INDEX "payment_methods_user_id_is_default_idx" ON "payment_methods"("user_id", "is_default");
CREATE INDEX "payment_methods_status_idx" ON "payment_methods"("status");
CREATE INDEX "ledger_entries_wallet_account_id_created_at_idx" ON "ledger_entries"("wallet_account_id", "created_at");
CREATE INDEX "ledger_entries_wallet_account_id_asset_code_idx" ON "ledger_entries"("wallet_account_id", "asset_code");
CREATE INDEX "ledger_entries_campaign_id_idx" ON "ledger_entries"("campaign_id");
CREATE INDEX "ledger_entries_entry_type_idx" ON "ledger_entries"("entry_type");
CREATE INDEX "ledger_entries_channel_idx" ON "ledger_entries"("channel");
CREATE INDEX "ledger_entries_tx_hash_idx" ON "ledger_entries"("tx_hash");

ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_assets" ADD CONSTRAINT "wallet_assets_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
