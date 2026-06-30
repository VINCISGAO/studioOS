-- MVP payment collection: payout tracking on escrow payments

DO $$ BEGIN
  CREATE TYPE "PaymentCollectionStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CreatorPayoutStatus" AS ENUM ('MANUAL_PAYOUT_PENDING', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE escrow_payments
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status "PaymentCollectionStatus" NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS creator_payout_status "CreatorPayoutStatus",
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_marked_by_admin_id UUID;

UPDATE escrow_payments
SET
  payment_status = 'PAID',
  creator_payout_status = COALESCE(creator_payout_status, 'MANUAL_PAYOUT_PENDING'),
  paid_at = COALESCE(paid_at, updated_at)
WHERE status IN ('HELD', 'PARTIAL_RELEASE', 'FULL_RELEASE', 'CLOSED')
  AND payment_status = 'UNPAID';

CREATE INDEX IF NOT EXISTS escrow_payments_payment_status_idx ON escrow_payments (payment_status);
CREATE INDEX IF NOT EXISTS escrow_payments_creator_payout_status_idx ON escrow_payments (creator_payout_status);
