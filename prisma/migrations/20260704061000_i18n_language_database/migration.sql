-- StudioOS Internationalization (i18n) Specification V1.0
-- Adds database-managed languages, translation keys, translations, and user language preference.

CREATE TABLE "languages" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "native_name" TEXT NOT NULL,
  "english_name" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "language_keys" (
  "id" TEXT NOT NULL,
  "namespace" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "language_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "language_translations" (
  "id" TEXT NOT NULL,
  "key_id" TEXT NOT NULL,
  "language_code" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "language_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");
CREATE UNIQUE INDEX "languages_locale_key" ON "languages"("locale");
CREATE INDEX "languages_is_enabled_sort_order_idx" ON "languages"("is_enabled", "sort_order");
CREATE UNIQUE INDEX "language_keys_namespace_key_key" ON "language_keys"("namespace", "key");
CREATE INDEX "language_keys_namespace_idx" ON "language_keys"("namespace");
CREATE UNIQUE INDEX "language_translations_key_id_language_code_key" ON "language_translations"("key_id", "language_code");
CREATE INDEX "language_translations_language_code_idx" ON "language_translations"("language_code");

INSERT INTO "languages" ("id", "code", "locale", "native_name", "english_name", "is_default", "is_enabled", "sort_order", "updated_at")
VALUES
  ('lang_en', 'en', 'en', 'English', 'English', true, true, 10, CURRENT_TIMESTAMP),
  ('lang_zh_cn', 'zh-CN', 'zh-CN', '简体中文', 'Simplified Chinese', false, true, 20, CURRENT_TIMESTAMP),
  ('lang_zh_tw', 'zh-TW', 'zh-TW', '繁體中文', 'Traditional Chinese', false, true, 30, CURRENT_TIMESTAMP),
  ('lang_ja', 'ja', 'ja', '日本語', 'Japanese', false, true, 40, CURRENT_TIMESTAMP),
  ('lang_ko', 'ko', 'ko', '한국어', 'Korean', false, true, 50, CURRENT_TIMESTAMP),
  ('lang_th', 'th', 'th', 'ไทย', 'Thai', false, true, 60, CURRENT_TIMESTAMP),
  ('lang_km', 'km', 'km', 'ខ្មែរ', 'Khmer', false, true, 70, CURRENT_TIMESTAMP),
  ('lang_es', 'es', 'es', 'Español', 'Spanish', false, true, 80, CURRENT_TIMESTAMP),
  ('lang_fr', 'fr', 'fr', 'Français', 'French', false, true, 90, CURRENT_TIMESTAMP),
  ('lang_de', 'de', 'de', 'Deutsch', 'German', false, true, 100, CURRENT_TIMESTAMP),
  ('lang_vi', 'vi', 'vi', 'Tiếng Việt', 'Vietnamese', false, true, 110, CURRENT_TIMESTAMP),
  ('lang_id', 'id', 'id', 'Bahasa Indonesia', 'Indonesian', false, true, 120, CURRENT_TIMESTAMP),
  ('lang_ms', 'ms', 'ms', 'Bahasa Melayu', 'Malay', false, true, 130, CURRENT_TIMESTAMP),
  ('lang_pt', 'pt', 'pt', 'Português', 'Portuguese', false, true, 140, CURRENT_TIMESTAMP),
  ('lang_ar', 'ar', 'ar', 'العربية', 'Arabic', false, true, 150, CURRENT_TIMESTAMP),
  ('lang_ru', 'ru', 'ru', 'Русский', 'Russian', false, false, 210, CURRENT_TIMESTAMP),
  ('lang_it', 'it', 'it', 'Italiano', 'Italian', false, false, 220, CURRENT_TIMESTAMP),
  ('lang_tr', 'tr', 'tr', 'Türkçe', 'Turkish', false, false, 230, CURRENT_TIMESTAMP),
  ('lang_hi', 'hi', 'hi', 'हिन्दी', 'Hindi', false, false, 240, CURRENT_TIMESTAMP);

ALTER TABLE "users" ADD COLUMN "language_code" TEXT NOT NULL DEFAULT 'en';
UPDATE "users"
SET "language_code" = CASE
  WHEN "language" = 'zh' THEN 'zh-CN'
  WHEN "language" IN ('en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'th', 'km', 'es', 'fr', 'de', 'vi', 'id', 'ms', 'pt', 'ar') THEN "language"
  ELSE 'en'
END;

CREATE INDEX "users_language_code_idx" ON "users"("language_code");

ALTER TABLE "users"
ADD CONSTRAINT "users_language_code_fkey"
FOREIGN KEY ("language_code") REFERENCES "languages"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "language_translations"
ADD CONSTRAINT "language_translations_key_id_fkey"
FOREIGN KEY ("key_id") REFERENCES "language_keys"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "language_translations"
ADD CONSTRAINT "language_translations_language_code_fkey"
FOREIGN KEY ("language_code") REFERENCES "languages"("code")
ON DELETE CASCADE ON UPDATE CASCADE;

WITH inserted_keys AS (
  INSERT INTO "language_keys" ("id", "namespace", "key", "description", "updated_at")
  VALUES
    ('lk_common_save', 'common', 'save', 'Generic save action', CURRENT_TIMESTAMP),
    ('lk_common_cancel', 'common', 'cancel', 'Generic cancel action', CURRENT_TIMESTAMP),
    ('lk_common_delete', 'common', 'delete', 'Generic delete action', CURRENT_TIMESTAMP),
    ('lk_campaign_create', 'campaign', 'create', 'Create campaign action', CURRENT_TIMESTAMP),
    ('lk_campaign_edit', 'campaign', 'edit', 'Edit campaign action', CURRENT_TIMESTAMP),
    ('lk_campaign_publish', 'campaign', 'publish', 'Publish campaign action', CURRENT_TIMESTAMP),
    ('lk_payment_success', 'payment', 'success', 'Payment success message', CURRENT_TIMESTAMP),
    ('lk_payment_failed', 'payment', 'failed', 'Payment failed message', CURRENT_TIMESTAMP),
    ('lk_review_approve', 'review', 'approve', 'Approve review action', CURRENT_TIMESTAMP),
    ('lk_review_request_revision', 'review', 'request_revision', 'Request revision action', CURRENT_TIMESTAMP),
    ('lk_notification_new_campaign', 'notification', 'new_campaign', 'New campaign notification', CURRENT_TIMESTAMP),
    ('lk_notification_payment_received', 'notification', 'payment_received', 'Payment received notification', CURRENT_TIMESTAMP),
    ('lk_wallet_balance', 'wallet', 'balance', 'Wallet balance label', CURRENT_TIMESTAMP),
    ('lk_wallet_withdraw', 'wallet', 'withdraw', 'Wallet withdraw action', CURRENT_TIMESTAMP),
    ('lk_wallet_available', 'wallet', 'available', 'Available wallet balance label', CURRENT_TIMESTAMP),
    ('lk_error_payment_failed', 'error', 'payment_failed', 'Payment failed error', CURRENT_TIMESTAMP),
    ('lk_error_permission_denied', 'error', 'permission_denied', 'Permission denied error', CURRENT_TIMESTAMP),
    ('lk_error_file_too_large', 'error', 'file_too_large', 'File too large error', CURRENT_TIMESTAMP),
    ('lk_email_review_approved', 'email', 'review_approved', 'Review approved email template key', CURRENT_TIMESTAMP),
    ('lk_email_payment_success', 'email', 'payment_success', 'Payment success email template key', CURRENT_TIMESTAMP),
    ('lk_email_invitation', 'email', 'invitation', 'Invitation email template key', CURRENT_TIMESTAMP)
  RETURNING "id", "namespace", "key"
)
INSERT INTO "language_translations" ("id", "key_id", "language_code", "value", "updated_at")
SELECT 'lt_' || inserted_keys."namespace" || '_' || inserted_keys."key" || '_' || replace(translations."language_code", '-', '_'), inserted_keys."id", translations."language_code", translations."value", CURRENT_TIMESTAMP
FROM inserted_keys
JOIN (
  VALUES
    ('common', 'save', 'en', 'Save'),
    ('common', 'save', 'zh-CN', '保存'),
    ('common', 'save', 'km', 'រក្សាទុក'),
    ('common', 'cancel', 'en', 'Cancel'),
    ('common', 'cancel', 'zh-CN', '取消'),
    ('common', 'cancel', 'km', 'បោះបង់'),
    ('common', 'delete', 'en', 'Delete'),
    ('common', 'delete', 'zh-CN', '删除'),
    ('common', 'delete', 'km', 'លុប'),
    ('campaign', 'create', 'en', 'Create Campaign'),
    ('campaign', 'create', 'zh-CN', '创建活动'),
    ('campaign', 'create', 'km', 'បង្កើតយុទ្ធនាការ'),
    ('campaign', 'edit', 'en', 'Edit Campaign'),
    ('campaign', 'edit', 'zh-CN', '编辑活动'),
    ('campaign', 'edit', 'km', 'កែសម្រួលយុទ្ធនាការ'),
    ('campaign', 'publish', 'en', 'Publish Campaign'),
    ('campaign', 'publish', 'zh-CN', '发布活动'),
    ('campaign', 'publish', 'km', 'ផ្សព្វផ្សាយយុទ្ធនាការ'),
    ('payment', 'success', 'en', 'Payment Successful'),
    ('payment', 'success', 'zh-CN', '支付成功'),
    ('payment', 'success', 'km', 'ការទូទាត់បានជោគជ័យ'),
    ('payment', 'failed', 'en', 'Payment Failed'),
    ('payment', 'failed', 'zh-CN', '支付失败'),
    ('payment', 'failed', 'km', 'ការទូទាត់បានបរាជ័យ'),
    ('review', 'approve', 'en', 'Approve'),
    ('review', 'approve', 'zh-CN', '审核通过'),
    ('review', 'approve', 'km', 'អនុម័ត'),
    ('review', 'request_revision', 'en', 'Request Revision'),
    ('review', 'request_revision', 'zh-CN', '请求修改'),
    ('review', 'request_revision', 'km', 'ស្នើសុំកែសម្រួល'),
    ('notification', 'new_campaign', 'en', 'You received a new campaign'),
    ('notification', 'new_campaign', 'zh-CN', '你收到一个新活动'),
    ('notification', 'new_campaign', 'km', 'អ្នកបានទទួលយុទ្ធនាការថ្មី'),
    ('notification', 'payment_received', 'en', 'Payment received'),
    ('notification', 'payment_received', 'zh-CN', '已收到付款'),
    ('notification', 'payment_received', 'km', 'បានទទួលការទូទាត់'),
    ('wallet', 'balance', 'en', 'Wallet Balance'),
    ('wallet', 'balance', 'zh-CN', '钱包余额'),
    ('wallet', 'balance', 'km', 'សមតុល្យកាបូប'),
    ('wallet', 'withdraw', 'en', 'Withdraw'),
    ('wallet', 'withdraw', 'zh-CN', '提现'),
    ('wallet', 'withdraw', 'km', 'ដកប្រាក់'),
    ('wallet', 'available', 'en', 'Available Balance'),
    ('wallet', 'available', 'zh-CN', '可用余额'),
    ('wallet', 'available', 'km', 'សមតុល្យដែលអាចប្រើបាន'),
    ('error', 'payment_failed', 'en', 'Payment failed. Please try again.'),
    ('error', 'payment_failed', 'zh-CN', '支付失败，请重试。'),
    ('error', 'payment_failed', 'km', 'ការទូទាត់បានបរាជ័យ។ សូមព្យាយាមម្តងទៀត។'),
    ('error', 'permission_denied', 'en', 'Permission denied'),
    ('error', 'permission_denied', 'zh-CN', '权限不足'),
    ('error', 'permission_denied', 'km', 'គ្មានសិទ្ធិចូលប្រើ'),
    ('error', 'file_too_large', 'en', 'File is too large'),
    ('error', 'file_too_large', 'zh-CN', '文件过大'),
    ('error', 'file_too_large', 'km', 'ឯកសារធំពេក'),
    ('email', 'review_approved', 'en', 'Your review was approved'),
    ('email', 'review_approved', 'zh-CN', '你的审片已通过'),
    ('email', 'review_approved', 'km', 'ការត្រួតពិនិត្យរបស់អ្នកត្រូវបានអនុម័ត'),
    ('email', 'payment_success', 'en', 'Payment successful'),
    ('email', 'payment_success', 'zh-CN', '支付成功'),
    ('email', 'payment_success', 'km', 'ការទូទាត់បានជោគជ័យ'),
    ('email', 'invitation', 'en', 'You received an invitation'),
    ('email', 'invitation', 'zh-CN', '你收到一个邀请'),
    ('email', 'invitation', 'km', 'អ្នកបានទទួលការអញ្ជើញ')
) AS translations("namespace", "key", "language_code", "value")
ON inserted_keys."namespace" = translations."namespace" AND inserted_keys."key" = translations."key";
