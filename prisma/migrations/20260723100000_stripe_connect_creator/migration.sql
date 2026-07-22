-- Stripe Connect payout fields on creator profiles
ALTER TABLE "creator_profiles"
ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" TEXT,
ADD COLUMN IF NOT EXISTS "stripe_connect_details_submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "stripe_connect_payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "stripe_connect_onboarded_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_profiles_stripe_connect_account_id_key"
ON "creator_profiles"("stripe_connect_account_id");
