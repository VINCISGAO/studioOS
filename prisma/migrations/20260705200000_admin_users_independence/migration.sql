-- Admin is independent from public `users` — standalone admin_users table.

CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_master" BOOLEAN NOT NULL DEFAULT false,
    "status" "AdminAccountStatus" NOT NULL DEFAULT 'PENDING_TOTP',
    "totp_secret_enc" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_bound_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "permissions" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

INSERT INTO "admin_users" (
    "id",
    "email",
    "full_name",
    "is_master",
    "status",
    "totp_secret_enc",
    "totp_enabled",
    "totp_bound_at",
    "last_verified_at",
    "failed_attempts",
    "locked_until",
    "permissions",
    "created_at",
    "updated_at"
)
SELECT
    ap."id",
    u."email",
    u."full_name",
    ap."is_master",
    ap."status",
    ap."totp_secret_enc",
    ap."totp_enabled",
    ap."totp_bound_at",
    ap."last_verified_at",
    ap."failed_attempts",
    ap."locked_until",
    ap."permissions",
    ap."created_at",
    ap."updated_at"
FROM "admin_profiles" ap
INNER JOIN "users" u ON u."id" = ap."user_id"
WHERE u."deleted_at" IS NULL;

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE INDEX "admin_users_status_totp_enabled_idx" ON "admin_users"("status", "totp_enabled");
CREATE INDEX "admin_users_is_master_idx" ON "admin_users"("is_master");

-- Child tables: admin_profile_id -> admin_user_id (same UUID values)
ALTER TABLE "admin_webauthn_credentials" RENAME COLUMN "admin_profile_id" TO "admin_user_id";
ALTER TABLE "admin_totp_consumptions" RENAME COLUMN "admin_profile_id" TO "admin_user_id";
ALTER TABLE "admin_sessions" RENAME COLUMN "admin_profile_id" TO "admin_user_id";

ALTER TABLE "admin_auth_audit_logs" RENAME COLUMN "admin_profile_id" TO "admin_user_id";
ALTER TABLE "admin_auth_audit_logs" DROP COLUMN IF EXISTS "admin_id";

DROP INDEX IF EXISTS "admin_webauthn_credentials_admin_profile_id_idx";
DROP INDEX IF EXISTS "admin_totp_consumptions_admin_profile_id_time_step_code_hash_key";
DROP INDEX IF EXISTS "admin_sessions_admin_profile_id_expires_at_idx";
DROP INDEX IF EXISTS "admin_auth_audit_logs_admin_profile_id_created_at_idx";

CREATE INDEX "admin_webauthn_credentials_admin_user_id_idx" ON "admin_webauthn_credentials"("admin_user_id");
CREATE UNIQUE INDEX "admin_totp_consumptions_admin_user_id_time_step_code_hash_key"
    ON "admin_totp_consumptions"("admin_user_id", "time_step", "code_hash");
CREATE INDEX "admin_sessions_admin_user_id_expires_at_idx" ON "admin_sessions"("admin_user_id", "expires_at");
CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx" ON "admin_auth_audit_logs"("admin_user_id", "created_at");

ALTER TABLE "admin_webauthn_credentials" DROP CONSTRAINT IF EXISTS "admin_webauthn_credentials_admin_profile_id_fkey";
ALTER TABLE "admin_totp_consumptions" DROP CONSTRAINT IF EXISTS "admin_totp_consumptions_admin_profile_id_fkey";
ALTER TABLE "admin_sessions" DROP CONSTRAINT IF EXISTS "admin_sessions_admin_profile_id_fkey";
ALTER TABLE "admin_auth_audit_logs" DROP CONSTRAINT IF EXISTS "admin_auth_audit_logs_admin_profile_id_fkey";

ALTER TABLE "admin_webauthn_credentials"
    ADD CONSTRAINT "admin_webauthn_credentials_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_totp_consumptions"
    ADD CONSTRAINT "admin_totp_consumptions_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_sessions"
    ADD CONSTRAINT "admin_sessions_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_auth_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_auth_audit_logs" RENAME TO "admin_audit_logs";

DROP TABLE "admin_profiles";
