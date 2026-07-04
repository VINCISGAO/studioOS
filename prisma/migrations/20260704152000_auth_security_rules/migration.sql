-- StudioOS auth hardening: rate limits, verification codes, attempts, locks, audit logs.

CREATE TYPE "AuthVerificationPurpose" AS ENUM ('SIGNUP_LOGIN', 'RESET_PASSWORD', 'SECURITY_CHECK');
CREATE TYPE "AuthAttemptType" AS ENUM ('EMAIL_START', 'CODE_VERIFY', 'PASSWORD_LOGIN', 'OAUTH_CALLBACK');
CREATE TYPE "AuthAuditEvent" AS ENUM (
  'EMAIL_CODE_SENT',
  'EMAIL_CODE_VERIFIED',
  'SIGNUP_COMPLETED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'OAUTH_SUCCESS',
  'OAUTH_FAILED',
  'ACCOUNT_LOCKED',
  'TURNSTILE_REQUIRED',
  'TURNSTILE_FAILED'
);

ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified" = true AND "email_verified_at" IS NULL;

CREATE TABLE "auth_rate_limits" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "window_start" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_verification_codes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "purpose" "AuthVerificationPurpose" NOT NULL DEFAULT 'SIGNUP_LOGIN',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_hash" TEXT,
  "user_agent_hash" TEXT,

  CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_attempts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email_hash" TEXT,
  "ip_hash" TEXT,
  "provider" TEXT,
  "type" "AuthAttemptType" NOT NULL,
  "success" BOOLEAN NOT NULL,
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_locks" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email_hash" TEXT,
  "ip_hash" TEXT,
  "reason" TEXT NOT NULL,
  "locked_until" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_locks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_audit_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "email_hash" TEXT,
  "event" "AuthAuditEvent" NOT NULL,
  "ip_hash" TEXT,
  "user_agent_hash" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_rate_limits_key_scope_key" ON "auth_rate_limits"("key", "scope");
CREATE INDEX "auth_rate_limits_expires_at_idx" ON "auth_rate_limits"("expires_at");
CREATE INDEX "email_verification_codes_email_purpose_consumed_at_idx" ON "email_verification_codes"("email", "purpose", "consumed_at");
CREATE INDEX "email_verification_codes_expires_at_idx" ON "email_verification_codes"("expires_at");
CREATE INDEX "auth_attempts_email_hash_type_created_at_idx" ON "auth_attempts"("email_hash", "type", "created_at");
CREATE INDEX "auth_attempts_ip_hash_type_created_at_idx" ON "auth_attempts"("ip_hash", "type", "created_at");
CREATE INDEX "auth_attempts_provider_created_at_idx" ON "auth_attempts"("provider", "created_at");
CREATE INDEX "auth_locks_email_hash_locked_until_idx" ON "auth_locks"("email_hash", "locked_until");
CREATE INDEX "auth_locks_ip_hash_locked_until_idx" ON "auth_locks"("ip_hash", "locked_until");
CREATE INDEX "auth_audit_logs_user_id_created_at_idx" ON "auth_audit_logs"("user_id", "created_at");
CREATE INDEX "auth_audit_logs_email_hash_created_at_idx" ON "auth_audit_logs"("email_hash", "created_at");
CREATE INDEX "auth_audit_logs_event_created_at_idx" ON "auth_audit_logs"("event", "created_at");

ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
