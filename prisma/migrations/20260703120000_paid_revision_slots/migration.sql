-- Add paid revision unlock counter for V4/V5 gating
ALTER TABLE "campaigns" ADD COLUMN "paid_revision_slots_unlocked" INTEGER NOT NULL DEFAULT 0;
