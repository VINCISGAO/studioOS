-- Tier-8 admin security: passkeys, TOTP replay guard, session metadata

CREATE TABLE "admin_webauthn_credentials" (
    "id" TEXT NOT NULL,
    "admin_profile_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "backed_up" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "admin_webauthn_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_totp_consumptions" (
    "id" TEXT NOT NULL,
    "admin_profile_id" TEXT NOT NULL,
    "time_step" INTEGER NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_totp_consumptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_webauthn_credentials_credential_id_key" ON "admin_webauthn_credentials"("credential_id");
CREATE INDEX "admin_webauthn_credentials_admin_profile_id_idx" ON "admin_webauthn_credentials"("admin_profile_id");

CREATE UNIQUE INDEX "admin_totp_consumptions_admin_profile_id_time_step_code_hash_key"
  ON "admin_totp_consumptions"("admin_profile_id", "time_step", "code_hash");
CREATE INDEX "admin_totp_consumptions_expires_at_idx" ON "admin_totp_consumptions"("expires_at");

ALTER TABLE "admin_sessions" ADD COLUMN "device_label" TEXT;
ALTER TABLE "admin_sessions" ADD COLUMN "last_active_at" TIMESTAMP(3);

ALTER TABLE "admin_webauthn_credentials" ADD CONSTRAINT "admin_webauthn_credentials_admin_profile_id_fkey"
  FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_totp_consumptions" ADD CONSTRAINT "admin_totp_consumptions_admin_profile_id_fkey"
  FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
