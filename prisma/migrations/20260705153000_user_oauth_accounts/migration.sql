-- Link external OAuth providers (Alipay, WeChat, QQ) to StudioOS users.

CREATE TABLE "user_oauth_accounts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_oauth_accounts_provider_provider_user_id_key"
  ON "user_oauth_accounts"("provider", "provider_user_id");
CREATE INDEX "user_oauth_accounts_user_id_idx" ON "user_oauth_accounts"("user_id");

ALTER TABLE "user_oauth_accounts"
  ADD CONSTRAINT "user_oauth_accounts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
