-- CreateEnum
CREATE TYPE "AdminAccountStatus" AS ENUM ('PENDING_TOTP', 'ACTIVE', 'SUSPENDED', 'LOCKED');

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AdminAccountStatus" NOT NULL DEFAULT 'PENDING_TOTP',
    "totp_secret_enc" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_bound_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_profile_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_auth_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT,
    "admin_profile_id" TEXT,
    "email_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent_hash" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_user_id_key" ON "admin_profiles"("user_id");

-- CreateIndex
CREATE INDEX "admin_profiles_status_totp_enabled_idx" ON "admin_profiles"("status", "totp_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_profile_id_expires_at_idx" ON "admin_sessions"("admin_profile_id", "expires_at");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_admin_profile_id_created_at_idx" ON "admin_auth_audit_logs"("admin_profile_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_email_hash_created_at_idx" ON "admin_auth_audit_logs"("email_hash", "created_at");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_event_created_at_idx" ON "admin_auth_audit_logs"("event", "created_at");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_auth_audit_logs" ADD CONSTRAINT "admin_auth_audit_logs_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
