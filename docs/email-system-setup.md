# VINCIS Email System Setup

VINCIS uses Resend for transactional email delivery. All production emails should use the shared enterprise email system under `features/email/`.

## Required Environment Variables

Set these in Vercel Production:

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=VINCIS <hello@vincis.app>
AUTH_EMAIL_FROM=VINCIS <hello@vincis.app>
```

`AUTH_EMAIL_FROM` is used for login verification codes. `RESEND_FROM_EMAIL` is used for lifecycle and notification emails.

## Sender Domain

Use the verified `vincis.app` sender domain in Resend. The expected sender is:

```text
VINCIS <hello@vincis.app>
```

Do not send production VINCIS emails from `onboarding@resend.dev`.

## Design Rules

- Black background and silver VINCIS branding.
- White titles, muted gray body copy, dark gray cards, large rounded corners.
- No external fonts.
- No animation.
- No complex gradients.
- Server-side sending only. UI components must never call Resend directly.

## Verification

Before deployment, run:

```bash
npm run typecheck
npm run build
npm run production:verify
```
