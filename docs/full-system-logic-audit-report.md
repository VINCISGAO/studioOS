# VINCIS Full System Logic Audit Report

Date: 2026-07-08

## End-to-End Product Logic

Canonical flow:

1. Brand signs in and creates campaign requirements.
2. Requirements are saved as draft or payment-pending campaign data.
3. Brand completes escrow payment.
4. Payment success moves Campaign into matching.
5. AI matching sends invitations to Creators.
6. Creator accept/decline is only an intent response.
7. Brand final selection creates or assigns the active production order/project.
8. Creator uploads review versions.
9. Brand reviews, annotates, approves, or requests revisions.
10. Revision rounds follow V1-V5 policy.
11. Final approval releases escrow to Creator wallet through settlement service.
12. Creator withdraws through payout methods and withdrawal workflow.

## Five-Round Review

### Round 1 - Entrypoints, Sessions, Roles

Findings fixed:

- `app/brand-selection-actions.ts` only read the demo session cookie, so real Supabase Brand sessions could not final-select Creators, reroll matching batches, or record Creator profile views.
- `app/brand-settings-actions.ts` and `app/brand-project-actions.ts` also used demo-only Brand identity.
- `lib/client-session.ts` did not resolve real Brand sessions in `getCurrentClientEmail()`.
- `lib/creator-session.ts` did not resolve real Creator sessions from Supabase email.
- `requireBrandPortalClientEmail()` could resolve guest wizard/visitor identity before authenticated Brand identity.

Fixes:

- Unified Brand portal actions on `getCurrentSession()`.
- `getCurrentClientEmail()` now recognizes authenticated Brand sessions.
- `getCurrentCreatorId()` now resolves authenticated Creator sessions through email-to-Creator mapping.
- Brand portal actions now require authenticated Brand identity, not visitor draft identity.

### Round 2 - Brand Order And Payment

Findings fixed:

- `acceptQuoteAction()` allowed the flow to continue when no Brand session existed.
- `payOrderAction()` allowed payment flow access when no Brand session existed.
- Stripe webhook reservation treated failed prior attempts as permanent duplicates, so Stripe retries could be swallowed after a transient failure.

Fixes:

- Quote acceptance and legacy order payment now require authenticated Brand identity and matching client email.
- Failed Stripe webhook events can be retried, while successfully processed or currently reserved events remain idempotent.

### Round 3 - AI, Matching, Invitations

Findings fixed:

- `CreativeDirectionService` still allowed AI generation from old DRAFT semantics if called directly.
- `AiWorkerService` could enqueue or process creative direction jobs without independently confirming escrow funding.

Fixes:

- AI creative generation now checks funded escrow in the service layer.
- AI worker enqueue and processing paths also check funded escrow before token-consuming work.
- Post-payment campaign statuses can generate manual creative directions without falling back to pre-payment DRAFT AI semantics.

### Round 4 - Review, Delivery, Settlement

Findings fixed:

- `SettlementService.releaseForCampaign()` did not authorize the actor before the already-released recovery branch.
- Review/settlement actions accepted form `project_id` without requiring it to match the order's bound project id.

Fixes:

- Settlement release authorization now applies before all release/completion branches.
- Review revision, paid revision unlock, settlement preview, and final approve/settle now reject mismatched order/project pairs.

### Round 5 - Links, Notifications, Final Cross-Check

Checked:

- Brand/Creator session helpers after the fixes.
- AI generation and worker escrow gates.
- Stripe webhook retry/idempotency behavior.
- Review project/order matching helper.
- Settlement authorization ordering.

No additional concrete P0/P1/P2 logic issue was found in the final static pass.

## Subagent Follow-up Round

Additional findings from the parallel audit agents were implemented after the first five-round pass:

- Legacy `approveDeliveryAction()` / `requestRevisionAction()` now fail closed when no authenticated Brand session exists, reject mismatched order/project ids, and route Prisma approval through the settlement release service.
- Paid revision invoice simulation now uses the same production demo-payment gate as escrow checkout; production `pay_invoice=1` no longer writes synthetic wallet credit unless explicitly enabled for testing.
- Notification action URLs are normalized before persistence and client navigation. External URLs are discarded instead of being stored or opened from the notification center.
- Production demo surfaces now reject demo social login, demo escrow checkout, and demo review video access unless explicitly enabled.
- v1 video upload now enforces selected-Creator ownership, campaign lifecycle, max review versions, 5 MB chunk limits, and video magic-byte validation.
- Legacy multipart review video upload now rechecks Prisma campaign status, selected Creator, and funded escrow during init, part upload, and complete.
- Brand selection no longer swallows `START_PRODUCTION` failures, and legacy order sync runs after production bootstrap so selected Creators are not notified into a locked review hub.
- Legacy invitation accept now records a `CreatorAccepted` AI learning event with `project_created: false` when a Prisma campaign can be resolved.
- Project repair no longer writes the `pending_match` placeholder into `selected_studio_id`.

## Residual Verification

The agent terminal environment still intermittently returns `spawn EBADF` or no exit status, so local command results from this environment are not trustworthy.

Run locally:

```bash
npm run db:generate
npm run typecheck
npm run build
npm run production:verify
npm audit --audit-level=moderate
```

Production must keep demo finance switches unset unless intentionally testing:

```bash
VINCIS_ENABLE_DEMO_PAYMENT=1
STUDIOOS_ENABLE_DEMO_PAYMENT=1
VINCIS_ENABLE_MANUAL_WALLET_RECHARGE=1
STUDIOOS_ENABLE_MANUAL_WALLET_RECHARGE=1
VINCIS_ENABLE_DEMO_WITHDRAW_COMPLETE=1
STUDIOOS_ENABLE_DEMO_WITHDRAW_COMPLETE=1
```
