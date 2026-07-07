# VINCIS Nightly Site Audit

Date: 2026-07-07

## Scope

- Routes, navigation links, redirects, notification action URLs, email action URLs.
- Brand / Creator / Admin core flows: brief, payment, matching, invitation, production, review, paid revisions, settlement.
- Old domains, temporary Vercel domains, hardcoded URLs, zombie links.
- Verification scripts that can pollute runtime data.
- Repeated avatar initials logic and lightweight memory-leak risks.

## Fixed

### Notification and 404 Links

- Fixed translation-failure notifications in `features/communication/communication.service.ts`.
  - Before: always linked to `/brand/projects/{campaignId}`.
  - After: brand recipients link to `/brand/projects/{legacyProjectId}/communication`; creator recipients fall back to `/studio/projects`.

- Fixed arbitration notifications in `features/admin/dispute.service.ts`.
  - Before: brand action URLs used Prisma `campaignId`, which can 404 in brand project pages.
  - After: brand action URLs use `resolveLegacyProjectId()`.

- Fixed paid revision add-on brand notifications in `features/review/paid-revision.service.ts`.
  - Before: fallback URL used `campaignId`.
  - After: fallback URL uses `resolveLegacyProjectId()`.

- Expanded internal notification URL normalization in `lib/studioos/internal-action-href.ts`.
  - Added legacy/public app paths such as `/orders`, `/proposal`, `/dashboard`, `/projects`, `/match`, `/creators`, and `/brands` so internal action links keep locale handling.

- Fixed order-based review links in:
  - `components/proposal/proposal-contract-panel.tsx`
  - `components/order/brand-order-view.tsx`

- Fixed portal section review links to prefer `legacyProjectId` in:
  - `components/studioos/brand-portal-sections.tsx`
  - `components/studioos/creator-portal-sections.tsx`

### Verification Script Data Pollution

- Fixed `scripts/payment-collection-verify.ts`.
  - Now deletes test campaign notifications before deleting the test campaign.

- Fixed `scripts/sprint3-verify.ts`.
  - Now deletes matching/invitation notifications created by the test campaign.

- Fixed `scripts/sprint8-verify.ts`.
  - Now deletes payment/invitation/wallet-flow notifications created by the test campaign.

- Added missing package scripts for existing maintenance utilities:
  - `npm run data:purge`
  - `npm run membership:verify`

These scripts were the source of test notifications such as `Payment Collection Verify`, `Payment received`, `AI found creator matches`, and `Creator accepted your invitation`.

### Avatar Initials / Hydration Hardening

- Replaced remaining manual initials truncation with `buildAvatarInitials()` in:
  - `components/studioos/brand-profile-editor.tsx`
  - `components/studioos/brand-profile-ui.tsx`
  - `components/creator/creator-profile-ui.tsx`
  - `components/creator/creator-public-profile-editor.tsx`
  - `lib/studioos/brand-messages-ui.ts`

This avoids emoji/surrogate-pair truncation and reduces future hydration mismatch risk.

### UI Runtime Cleanup

- Fixed toast timeout cleanup in `components/studioos/brand-profile-editor.tsx`.
  - Prevents stale `setToast(null)` after the component unmounts.

## Logic Map

### Brand Flow

1. Brand creates a project through `/brand/projects/new`.
2. Wizard stores legacy project data and connects to Campaign when DB is available.
3. Creative direction approval transitions Campaign into matching/payment states.
4. Payment checkout and demo payment flow fund escrow.
5. Matching generates creator recommendations and invitations.
6. Brand selects creator, then project proceeds to production/review.

Key files:

- `app/project-wizard-actions.ts`
- `features/campaign/campaign.service.ts`
- `features/ai/creative-direction.service.ts`
- `features/payment/payment.service.ts`
- `features/matching/matching.service.ts`
- `features/matching/invitation.service.ts`

### Creator Flow

1. Creator receives invitation.
2. Creator accepts or declines.
3. Selected creator sees production/review workspaces.
4. Creator uploads V1-V5 versions.
5. Creator can revert upload only before brand review/annotations.

Key files:

- `features/matching/invitation.service.ts`
- `features/delivery/version.service.ts`
- `features/delivery/creator-revert-upload.service.ts`
- `features/review/review.service.ts`

### Review Flow

- Review coordinates are validated as percentage values (`0..1`).
- Brand comments are only allowed during active review states.
- V1-V5 and paid revision slots are handled by review round policy.
- Creator revert upload checks brand review notifications, comments, and Prisma review status.

Key files:

- `features/review/review.schemas.ts`
- `features/review/review-round-policy.ts`
- `features/review/paid-revision.service.ts`
- `features/delivery/creator-revert-upload.service.ts`

## Remaining Risks

- P0 business-flow risk found by logic audit: some UI/service paths still treat `ESCROW_FUNDED` as uploadable or in-production. This should be fixed in a focused follow-up because it touches production gating:
  - `features/review/review-portal-ui-state.ts`
  - `features/delivery/version.service.ts`
  - `features/video/version-processing.service.ts`

- P0 logic risk: `campaign-selection.service.ts` silently swallows `START_PRODUCTION` transition failures after selection. This can leave legacy order and Prisma campaign out of sync.

- P1 authorization risk: `InvitationService.list` permits broad creator-profile access to campaign invitations if the caller has a creator profile. It should require invitation membership or brand ownership.

- P1 duplicate-notification risk: review approve/revision and paid-revision flows still send notifications both inline and through event handlers/legacy helpers in some paths. Deduping is safe but should be done with notification tests.

- P1 verification pollution risk remains in larger transaction scripts:
  - `scripts/happy-path-transaction-verify.ts`
  - `scripts/revision-five-round-verify.ts`

  These should receive transaction-style cleanup before being run against shared databases.

- Several older verification scripts still create test campaigns and then soft-delete or delete them. They are less visible than notification pollution, but a future cleanup pass should standardize all verification scripts around a shared cleanup helper.

- Some legacy JSON stores remain active for backward compatibility:
  - `lib/project-service.ts`
  - `lib/order-service.ts`
  - `lib/studioos/review-store.ts`
  - `lib/studioos/creator-invitation-store.ts`

  These are not safe to delete yet because current brand/review pages still bridge Prisma Campaign data to legacy project/order IDs.

- Direct status writes exist in repository layers. They appear to be used behind service/state-machine methods, but a deeper pass should ensure no page/action calls repository status updates directly.

- Shell verification did not return an exit status in this environment. Run locally:

```bash
npm run typecheck
npm run build
npm run production:verify
```

## Follow-Up Recommendations

- Add a shared `cleanupVerifyCampaign(prisma, campaignId)` helper and use it in all `scripts/*verify.ts` files.
- Add a small unit test for `normalizeInternalActionHref()` covering:
  - `vincis.app`
  - `www.vincis.app`
  - `*.vercel.app`
  - `localhost`
  - external domains
- Add an audit check that fails if notification action URLs use `/brand/projects/${campaignId}` without resolving legacy project IDs.
- Add a focused P0 fix pass for `ESCROW_FUNDED` upload gating and `START_PRODUCTION` transition failure handling.
