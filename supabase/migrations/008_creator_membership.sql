-- Creator Membership & Commission System (008)

CREATE TYPE "CreatorMembershipPlanType" AS ENUM ('DEFAULT', 'VERIFIED');
CREATE TYPE "CreatorMembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "CreatorMembershipPaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'CRYPTO', 'ADMIN', 'DEMO');
CREATE TYPE "CreatorMembershipHistoryAction" AS ENUM (
  'CREATED', 'ACTIVATED', 'RENEWED', 'EXPIRED', 'DOWNGRADED', 'CANCELLED', 'REFUNDED',
  'ADMIN_UPGRADE', 'ADMIN_DOWNGRADE', 'ADMIN_EXTEND', 'UPGRADE_DECLINED'
);

ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'CLIENT_SERVICE_FEE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_FEE';

CREATE TABLE IF NOT EXISTS creator_membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan_type "CreatorMembershipPlanType" NOT NULL,
  annual_fee DECIMAL(18, 2) NOT NULL DEFAULT 0,
  creator_commission_percentage DECIMAL(5, 2) NOT NULL,
  membership_duration_days INT NOT NULL DEFAULT 365,
  benefits_json JSONB NOT NULL DEFAULT '[]',
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  client_service_fee_percentage DECIMAL(5, 2) NOT NULL,
  default_creator_commission_percentage DECIMAL(5, 2) NOT NULL,
  verified_creator_commission_percentage DECIMAL(5, 2) NOT NULL,
  upgrade_revenue_threshold DECIMAL(18, 2) NOT NULL,
  upgrade_modal_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  client_service_fee_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  creator_profile_id UUID REFERENCES creator_profiles(id),
  plan_id UUID NOT NULL REFERENCES creator_membership_plans(id),
  status "CreatorMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  payment_provider "CreatorMembershipPaymentProvider",
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  payment_id TEXT,
  stripe_session_id TEXT,
  amount_paid DECIMAL(18, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id),
  order_id TEXT,
  creator_id UUID NOT NULL REFERENCES users(id),
  order_amount DECIMAL(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  client_service_fee_percentage DECIMAL(5, 2) NOT NULL,
  client_service_fee_amount DECIMAL(18, 2) NOT NULL,
  creator_commission_percentage DECIMAL(5, 2) NOT NULL,
  creator_commission_amount DECIMAL(18, 2) NOT NULL,
  creator_payout_amount DECIMAL(18, 2) NOT NULL,
  platform_total_revenue DECIMAL(18, 2) NOT NULL,
  creator_membership_type_at_order_time "CreatorMembershipPlanType" NOT NULL,
  commission_rule_id UUID,
  plan_id UUID,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_earnings (
  creator_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_settled_revenue DECIMAL(18, 2) NOT NULL DEFAULT 0,
  total_pending_revenue DECIMAL(18, 2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(18, 2) NOT NULL DEFAULT 0,
  total_creator_payout DECIMAL(18, 2) NOT NULL DEFAULT 0,
  upgrade_declined_at TIMESTAMPTZ,
  last_upgrade_prompt_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_membership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID REFERENCES creator_membership_plans(id),
  membership_id UUID,
  action "CreatorMembershipHistoryAction" NOT NULL,
  actor_id UUID,
  note TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_memberships_creator_status ON creator_memberships(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_creator_memberships_expires ON creator_memberships(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_commissions_creator ON order_commissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_creator ON creator_membership_history(creator_id, created_at);
