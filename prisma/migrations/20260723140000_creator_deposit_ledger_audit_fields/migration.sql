-- Creator deposit ledger audit fields (immutable entries; adjustments append-only)

ALTER TABLE "creator_deposit_ledger_entries"
  ADD COLUMN IF NOT EXISTS "actor_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "reason" TEXT;
