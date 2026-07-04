-- Master admin account — only one platform master; sub-admins are provisioned from the admin UI.

ALTER TABLE "admin_profiles" ADD COLUMN "is_master" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "admin_profiles_is_master_idx" ON "admin_profiles"("is_master");

-- At most one master row (Postgres partial unique index).
CREATE UNIQUE INDEX "admin_profiles_single_master_idx" ON "admin_profiles"("is_master") WHERE "is_master" = true;
