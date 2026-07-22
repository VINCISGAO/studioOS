-- Phase 2.4C: Regional credit package pricing + purchase order snapshots

DO $$ BEGIN
  ALTER TYPE "CreditPlatformAuditEntity" ADD VALUE 'CREDIT_PACKAGE_REGIONAL_PRICE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE "credit_package_regional_prices"
SET "region_code" = 'GLOBAL'
WHERE "region_code" IS NULL;

ALTER TABLE "credit_package_regional_prices"
  ALTER COLUMN "region_code" SET DEFAULT 'GLOBAL',
  ALTER COLUMN "region_code" SET NOT NULL;

ALTER TABLE "credit_package_regional_prices"
  ADD COLUMN IF NOT EXISTS "bonus_credits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripe_price_id" TEXT,
  ADD COLUMN IF NOT EXISTS "starts_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tax_behavior" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "credit_package_regional_prices_package_id_currency_region_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "credit_package_regional_prices_package_id_region_code_currency_version_key"
  ON "credit_package_regional_prices"("package_id", "region_code", "currency", "version");

CREATE INDEX IF NOT EXISTS "credit_package_regional_prices_package_id_enabled_region_code_idx"
  ON "credit_package_regional_prices"("package_id", "enabled", "region_code");

CREATE INDEX IF NOT EXISTS "credit_package_regional_prices_package_id_region_code_enabled_starts_at_ends_at_idx"
  ON "credit_package_regional_prices"("package_id", "region_code", "enabled", "starts_at", "ends_at");

ALTER TABLE "credit_purchase_orders"
  ADD COLUMN IF NOT EXISTS "package_version" INTEGER,
  ADD COLUMN IF NOT EXISTS "regional_price_id" TEXT,
  ADD COLUMN IF NOT EXISTS "region_code" TEXT,
  ADD COLUMN IF NOT EXISTS "stripe_price_id_snapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "pricing_snapshot" JSONB;

CREATE INDEX IF NOT EXISTS "credit_purchase_orders_regional_price_id_idx"
  ON "credit_purchase_orders"("regional_price_id");

ALTER TABLE "credit_purchase_orders"
  ADD CONSTRAINT "credit_purchase_orders_regional_price_id_fkey"
  FOREIGN KEY ("regional_price_id") REFERENCES "credit_package_regional_prices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "credit_package_regional_prices" (
  "id", "package_id", "region_code", "currency", "amount_minor", "bonus_credits", "enabled", "version", "updated_at"
)
SELECT
  'cprp_' || cp."id" || '_global_v1',
  cp."id",
  'GLOBAL',
  UPPER(cp."currency"),
  cp."amount_minor",
  cp."bonus_credits",
  true,
  1,
  CURRENT_TIMESTAMP
FROM "credit_packages" cp
WHERE cp."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "credit_package_regional_prices" rp
    WHERE rp."package_id" = cp."id"
      AND rp."region_code" = 'GLOBAL'
      AND rp."currency" = UPPER(cp."currency")
      AND rp."version" = 1
  );
