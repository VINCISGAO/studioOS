# StudioOS Internationalization (i18n) Specification V1.0

StudioOS uses a database-backed language system so UI copy, AI output, notifications, emails, errors, and admin content can share one translation source.

## Supported Languages

First batch:

- `en` English
- `zh-CN` Simplified Chinese
- `zh-TW` Traditional Chinese
- `ja` Japanese
- `ko` Korean
- `th` Thai
- `km` Khmer
- `es` Spanish
- `fr` French
- `de` German
- `vi` Vietnamese
- `id` Indonesian
- `ms` Malay
- `pt` Portuguese
- `ar` Arabic

Reserved for later rollout:

- `ru` Russian
- `it` Italian
- `tr` Turkish
- `hi` Hindi

## Database Model

- `languages`: supported locales, native names, enablement, default language, and sort order.
- `language_keys`: canonical translation keys such as `campaign.create`, `payment.success`, `review.approve`.
- `language_translations`: localized values by key and language.
- `users.language_code`: user language preference, linked to `languages.code`.

## Key Rules

- Do not introduce new hardcoded business copy for AI, notification, email, payment, wallet, campaign, review, or error flows.
- Use canonical keys:
  - `common.save`
  - `common.cancel`
  - `campaign.create`
  - `payment.success`
  - `review.request_revision`
  - `notification.new_campaign`
  - `wallet.withdraw`
  - `error.permission_denied`
  - `email.invitation`
- Admin can maintain languages and translation values in `/admin/languages`.
- Public consumers can load enabled languages from `/api/i18n/languages`.
- Public consumers can load translation bundles from `/api/i18n/translations?language=km`.

## AI Output

All AI jobs should accept or infer:

```json
{
  "language": "km"
}
```

AI prompts must instruct models to write all user-facing output in that language. Existing creative direction jobs now persist the language in job input and pass it to the AI gateway.

## Fallback

If a translation is missing:

1. Use the requested language.
2. Fall back to `en`.
3. Fall back to the canonical key.

This makes newly added languages safe to enable progressively.
