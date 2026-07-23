-- Creator deposit bootstrap + production hardening
-- Legacy status mapping when upgrading existing rows:
--   UNDER_REVIEW -> PROCESSING
--   CONFIRMED      -> SUCCEEDED

DO $$
BEGIN
  CREATE TYPE "CreatorDepositStatus" AS ENUM (
    'UNPAID',
    'PAID',
    'REFUND_REQUESTED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'CreatorDepositPaymentStatus'
  ) THEN
    CREATE TYPE "CreatorDepositPaymentStatus" AS ENUM (
      'PENDING',
      'PROCESSING',
      'SUCCEEDED',
      'FAILED',
      'CANCELED',
      'REFUNDED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "creator_deposit_accounts" (
  "id" TEXT NOT NULL,
  "creator_profile_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "legacy_creator_id" TEXT,
  "deposit_status" "CreatorDepositStatus" NOT NULL DEFAULT 'UNPAID',
  "deposit_amount_usd" DECIMAL(18, 2) NOT NULL DEFAULT 99,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_deposit_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_accounts_creator_profile_id_key"
  ON "creator_deposit_accounts"("creator_profile_id");
CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_accounts_user_id_key"
  ON "creator_deposit_accounts"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_accounts_legacy_creator_id_key"
  ON "creator_deposit_accounts"("legacy_creator_id");
CREATE INDEX IF NOT EXISTS "creator_deposit_accounts_deposit_status_idx"
  ON "creator_deposit_accounts"("deposit_status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_deposit_accounts_creator_profile_id_fkey'
  ) THEN
    ALTER TABLE "creator_deposit_accounts"
      ADD CONSTRAINT "creator_deposit_accounts_creator_profile_id_fkey"
      FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_deposit_accounts_user_id_fkey'
  ) THEN
    ALTER TABLE "creator_deposit_accounts"
      ADD CONSTRAINT "creator_deposit_accounts_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "creator_deposit_payments" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "amount_usd" DECIMAL(18, 2) NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_reference" TEXT,
  "status" "CreatorDepositPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "status_note" TEXT,
  "stripe_session_id" TEXT,
  "stripe_payment_intent_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmed_at" TIMESTAMP(3),
  CONSTRAINT "creator_deposit_payments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "creator_deposit_payments"
  ADD COLUMN IF NOT EXISTS "user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "amount_minor" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "failure_code" TEXT,
  ADD COLUMN IF NOT EXISTS "failure_message" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata_json" JSONB,
  ADD COLUMN IF NOT EXISTS "canceled_at" TIMESTAMP(3);

UPDATE "creator_deposit_payments" AS p
SET "user_id" = a."user_id"
FROM "creator_deposit_accounts" AS a
WHERE p."account_id" = a."id"
  AND p."user_id" IS NULL;

UPDATE "creator_deposit_payments"
SET
  "amount_minor" = COALESCE("amount_minor", ROUND("amount_usd" * 100)::INTEGER, 9900),
  "currency" = COALESCE("currency", 'USD')
WHERE "amount_minor" IS NULL;

ALTER TABLE "creator_deposit_payments"
  ALTER COLUMN "amount_minor" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'CreatorDepositPaymentStatus'
      AND e.enumlabel = 'CONFIRMED'
  ) THEN
    CREATE TYPE "CreatorDepositPaymentStatus_new" AS ENUM (
      'PENDING',
      'PROCESSING',
      'SUCCEEDED',
      'FAILED',
      'CANCELED',
      'REFUNDED'
    );

    ALTER TABLE "creator_deposit_payments"
      ALTER COLUMN "status" DROP DEFAULT;

    ALTER TABLE "creator_deposit_payments"
      ALTER COLUMN "status" TYPE "CreatorDepositPaymentStatus_new"
      USING (
        CASE "status"::TEXT
          WHEN 'UNDER_REVIEW' THEN 'PROCESSING'
          WHEN 'CONFIRMED' THEN 'SUCCEEDED'
          WHEN 'PENDING' THEN 'PENDING'
          WHEN 'FAILED' THEN 'FAILED'
          ELSE 'FAILED'
        END
      )::"CreatorDepositPaymentStatus_new";

    ALTER TABLE "creator_deposit_payments"
      ALTER COLUMN "status" SET DEFAULT 'PENDING';

    DROP TYPE "CreatorDepositPaymentStatus";
    ALTER TYPE "CreatorDepositPaymentStatus_new" RENAME TO "CreatorDepositPaymentStatus";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_payments_stripe_session_id_key"
  ON "creator_deposit_payments"("stripe_session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_payments_stripe_payment_intent_id_key"
  ON "creator_deposit_payments"("stripe_payment_intent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_payments_idempotency_key_key"
  ON "creator_deposit_payments"("idempotency_key");
CREATE INDEX IF NOT EXISTS "creator_deposit_payments_account_id_created_at_idx"
  ON "creator_deposit_payments"("account_id", "created_at");
CREATE INDEX IF NOT EXISTS "creator_deposit_payments_user_id_status_idx"
  ON "creator_deposit_payments"("user_id", "status");
CREATE INDEX IF NOT EXISTS "creator_deposit_payments_status_idx"
  ON "creator_deposit_payments"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_deposit_payments_account_id_fkey'
  ) THEN
    ALTER TABLE "creator_deposit_payments"
      ADD CONSTRAINT "creator_deposit_payments_account_id_fkey"
      FOREIGN KEY ("account_id") REFERENCES "creator_deposit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  CREATE TYPE "CreatorDepositLedgerEntryType" AS ENUM (
    'DEPOSIT_CREDIT',
    'DEPOSIT_REFUND',
    'MANUAL_ADJUSTMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CreatorDepositLedgerDirection" AS ENUM (
    'CREDIT',
    'DEBIT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "creator_deposit_ledger_entries" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "payment_id" TEXT,
  "provider" TEXT NOT NULL,
  "external_reference_id" TEXT NOT NULL,
  "entry_type" "CreatorDepositLedgerEntryType" NOT NULL,
  "direction" "CreatorDepositLedgerDirection" NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "balance_after_minor" INTEGER NOT NULL,
  "description" TEXT,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_deposit_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_deposit_ledger_entries_provider_external_reference_id_entry_type_key"
  ON "creator_deposit_ledger_entries"("provider", "external_reference_id", "entry_type");
CREATE INDEX IF NOT EXISTS "creator_deposit_ledger_entries_account_id_created_at_idx"
  ON "creator_deposit_ledger_entries"("account_id", "created_at");
CREATE INDEX IF NOT EXISTS "creator_deposit_ledger_entries_payment_id_idx"
  ON "creator_deposit_ledger_entries"("payment_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_deposit_ledger_entries_account_id_fkey'
  ) THEN
    ALTER TABLE "creator_deposit_ledger_entries"
      ADD CONSTRAINT "creator_deposit_ledger_entries_account_id_fkey"
      FOREIGN KEY ("account_id") REFERENCES "creator_deposit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_deposit_ledger_entries_payment_id_fkey'
  ) THEN
    ALTER TABLE "creator_deposit_ledger_entries"
      ADD CONSTRAINT "creator_deposit_ledger_entries_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "creator_deposit_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "creator_deposit_ledger_entries" (
  "id",
  "account_id",
  "payment_id",
  "provider",
  "external_reference_id",
  "entry_type",
  "direction",
  "amount_minor",
  "currency",
  "balance_after_minor",
  "description",
  "created_at"
)
SELECT
  'cdl_backfill_' || p."id",
  p."account_id",
  p."id",
  COALESCE(p."provider", 'stripe'),
  COALESCE(p."stripe_payment_intent_id", p."stripe_session_id", p."id"),
  'DEPOSIT_CREDIT'::"CreatorDepositLedgerEntryType",
  'CREDIT'::"CreatorDepositLedgerDirection",
  p."amount_minor",
  p."currency",
  p."amount_minor",
  'Backfilled creator deposit credit',
  COALESCE(p."confirmed_at", p."created_at")
FROM "creator_deposit_payments" AS p
WHERE p."status" = 'SUCCEEDED'
ON CONFLICT ("provider", "external_reference_id", "entry_type") DO NOTHING;
