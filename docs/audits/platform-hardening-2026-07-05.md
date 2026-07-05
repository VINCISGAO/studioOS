# Platform Hardening Audit - 2026-07-05

## Fixed In This Pass

- `/api/v1/ai/jobs/process` now requires independent `AdminSession` mutation auth instead of ordinary `User.role === "ADMIN"`.
- Admin brand and quality pages no longer inject demo data when real data is absent.
- Brand Creative DNA and Analytics now show empty states instead of demo DNA, demo ads, or demo insights for ordinary accounts.
- Legacy MVP review workspace no longer loads mock comments in live routes; it maps real `video_comments` from the review bundle.
- Relationship DNA API now allows ordinary users only when they are the route `brandId` or `creatorId`; independent admin sessions keep platform-wide access.
- Ordinary users can carry both `BrandProfile` and `CreatorProfile`; login, signup, email-code login, OAuth, portal guards, and permission checks now use profile capability.
- Creator project/home/review surfaces now expose an upload action when an accepted/in-production order has no deliverables.

## Secrets

- `.env`, `.env.*`, key/cert files, `.data`, and local credentials are ignored.
- Tracked scan found only placeholder/local defaults and scripts that print setup instructions:
  - local PostgreSQL default URL for development scripts
  - `ADMIN_TOTP_SECRET=<...>` examples and generator output
  - private-key wrapper code for Alipay env values
- No tracked Stripe, AWS, Google API, Resend, TOTP, or private-key material was found.

## Intentional Demo / Local Fallback Still Present

- Demo authentication and `@studioos.test` accounts remain in `lib/demo-auth.ts` and auth services for local/demo workflows.
- Legacy `/workspace/*` MVP compatibility still uses file/Supabase stores and demo seed data.
- Demo review media remains limited to explicit `ord_demo_*` development review paths.
- Creator home/invitation demo cards remain as local onboarding/demo content.
- Brand display/profile/message helpers still use demo account labels when the active session itself is a demo account.
- Creative performance demo records remain scoped to demo org emails such as `client.arc@studioos.test`.

## Script Cleanup

- Active scripts and archive candidates are tracked in `docs/ops/script-inventory.md`.
- No physical script move was made in this pass because many archive candidates still have `package.json` aliases or local runbook references.

## Verification Status

- `npm run typecheck`: passing.
- `npm run lint`: passing with existing warnings.
- `npm run build`: passing with network access; warnings remain for Supabase Edge Runtime usage and webpack cache serialization.
- `npm run e2e`: blocked in this managed macOS sandbox after installing Chromium to `/private/tmp/ms-playwright`; Chromium exits before tests with `bootstrap_check_in ... Permission denied (1100)`.
