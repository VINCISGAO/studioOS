# VINCIS Deep Night Developer-Doc Audit

Date: 2026-07-07

## Scope

This audit reads the founder/developer PDF set and compares the current system against the non-negotiable VINCIS lifecycle:

Brand brief -> AI creative directions -> brand selects one direction -> escrow payment -> AI creator matching -> invitations -> creator accept/decline -> brand final selection -> formal creator project -> review center V1 upload -> V1-V5 review / paid revision / settlement / arbitration.

This pass does not change UI design, homepage baseline, database schema, or owner-approved business flows. Changes are limited to lifecycle guardrails, security tightening, and documentation protection for AI assets.

## Core Rules Extracted From Developer Docs

### Order Lifecycle

- Payment success is the gate for AI matching and creator invitations.
- Creator acceptance is only collaboration intent.
- A creator project/order is created only after the brand explicitly selects one accepted creator.
- The creator workspace must not show a formal project form before final brand selection.
- V1 upload is allowed only after formal collaboration exists and the project is ready for review.
- Every key action requires two-sided notifications.
- Every meaningful AI decision or mismatch must become learning data.

Current canonical project spec already contains these rules in `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md`.

### Review System

- Review is a versioned workflow, not a comment box.
- One version must have one review outcome.
- V1-V5 map directly to review rounds 1-5.
- V1-V3 are included in the base project.
- One 20% paid add-on unlocks V4 and V5.
- If V5 still fails, normal revision stops and platform/customer-support arbitration begins.
- Any version V1-V5 can be approved and release payment.

### AI Learning / AI Database

- AI must be a unified platform layer, not scattered direct model calls.
- Long-term AI memory is a platform asset, not feature-local cache.
- Creator rejection reasons are mandatory learning signals.
- Budget objections should become budget health / acceptance-rate intelligence.
- AI should learn from creative selection, creator refusal, brand final selection, brand override of AI recommendation, review outcomes, delivery performance, and settlement outcomes.
- AI rules and weights must be configurable, not hard-coded into matching code.

### AI Copilot / Customer Support

- AI customer support is not ordinary chat. It is StudioOS Brain.
- It must read real platform data through service/repository layers.
- It should be able to explain matches, budget health, invitation issues, review status, wallet/income, and platform rules.
- It must not invent facts or operate from a separate truth.

### Language, Email, Notification

- UI, AI replies, email templates, notifications, errors, and admin copy should converge toward a shared language database.
- Emails follow the VINCIS black/silver brand system.
- Invitation, response, final selection, upload, revision, approval, payout, and arbitration all need lifecycle-aligned templates.
- System reply content is a knowledge base and should be protected like AI support data.

### Admin

- Admin login is a protected path.
- Admin access must not reuse ordinary social/OAuth/magic-link paths.
- TOTP / Google Authenticator, server-side admin session, audit logs, throttling, and no dev bypass are the target standard.

### Partner / Academy

- Partner/Academy is an ecosystem layer and must not pollute Campaign / Payment / Review.
- Commissions only come from real transactions.
- No infinite MLM.
- Every commission must trace to campaign/order/settlement.

## Current System Alignment

Strong alignment:

- `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md` already records the exact lifecycle the owner restated.
- `features/ai/creative-direction.service.ts` records creative direction selection as AI learning evidence.
- `features/matching/invitation.service.ts` and `features/matching/invitation-portal.service.ts` require decline feedback and write AI learning events.
- `features/matching/campaign-selection.service.ts` gates selection to accepted invitations and writes brand selection memory.
- `features/review/review-round-policy.ts` and `features/review/paid-revision.service.ts` encode the V1-V5 / 20% add-on policy.
- `docs/AI_PREFERENCE_ENGINE.md` and `docs/AI_LEARNING_FOUNDATION.md` now protect Preference Engine and AI learning assets.

Subagent cross-checks confirmed the same main conclusion: the Prisma Campaign main path mostly follows the intended lifecycle, but the largest risks are dual legacy/Prisma paths, incomplete AI learning processing, and some lifecycle wording or gate mismatches.

## Fixed In This Pass

### P0 Lifecycle Guardrail: ESCROW_FUNDED Upload Gating

Problem:

Some review/upload paths treated `ESCROW_FUNDED` as uploadable or in-production. That violates the founder rule: payment success starts matching/invitation, not formal production.

Fixed:

- `features/review/review-portal-ui-state.ts`
  - Removed `ESCROW_FUNDED` from creator-uploadable statuses.
  - Stopped deriving `ESCROW_FUNDED` as `in_production`.
- `features/delivery/version.service.ts`
  - Removed `ESCROW_FUNDED` from uploadable statuses.
- `features/video/version-processing.service.ts`
  - Removed automatic `START_PRODUCTION` when pipeline runs on `ESCROW_FUNDED`.
- `features/campaign/brand-campaign/brand-campaign.utils.ts`
  - Mapped `ESCROW_FUNDED` to `matching`, not `production`, so payment success does not appear as formal production before creator selection.

Result:

Creators can upload only after the campaign has reached real production/review states, not merely after escrow funding.

### P1 Security Guardrail: Invitation List Authorization

Problem:

`InvitationService.list` allowed broad invitation listing when a caller had any creator profile / creator role.

Fixed:

- `features/matching/invitation.service.ts`
  - Brand/admin access can still list the full campaign invitation set.
  - Creator access now returns only that creator's own invitation.
  - A creator with no invitation for the campaign receives forbidden.

Result:

Creators can no longer infer other invited creators for the same campaign through this service.

### P1 Observability: Silent START_PRODUCTION Failure

Problem:

After final brand selection, `START_PRODUCTION` transition failure was swallowed with `.catch(() => undefined)`.

Fixed:

- `features/matching/campaign-selection.service.ts`
  - Failure now logs a structured warning through `lib/core/logger`.

Result:

The behavior remains non-breaking, but state sync failures become visible in logs instead of silently hiding.

### P0 Dual Invitation Response Entry Points

Problem:

`invitationService.accept()` / `decline()` were thinner than the portal implementation. Depending on which UI/action path was used, the same creator response could miss activity logs, legacy bridge notifications, or learning side effects.

Fixed:

- `features/matching/invitation.service.ts`
  - Creator accept now delegates to `invitationPortalService.acceptForCreator()` when the legacy creator id is resolvable.
  - Creator decline now delegates to `invitationPortalService.declineForCreator()` when the legacy creator id is resolvable.
  - Fallback behavior remains for non-legacy mappings.

Result:

Accept/decline behavior is more consistent across Prisma portal and legacy bridge paths without changing UI or database schema.

### P1 Payment Success Wording

Problem:

Payment success notifications used production-start language, which conflicts with the rule that payment starts matching/invitation unless a creator is formally selected.

Fixed:

- `features/payment/payment-collection.service.ts`
  - Brand notification now says AI creator matching can begin.
  - Creator notification avoids saying production can start immediately and points to formal selection/upload readiness.

Result:

Lifecycle copy no longer implies that escrow funding alone equals formal production.

### AI Asset Protection

Expanded protected AI foundation inventory:

- AI Preference Engine
- AI Learning Events
- Memory Facts
- Brand DNA / Creator DNA / Relationship DNA
- Creative DNA
- Matching Memory
- AI Knowledge QA
- AI Copilot sessions/messages/tool calls/context
- AI support / StudioOS Brain
- AI inquiry learning
- language database assets
- creative performance and attribution sources
- Partner/Academy ecosystem data
- system reply library
- email and notification template knowledge

Updated:

- `docs/AI_LEARNING_FOUNDATION.md`
- `docs/prompts/AI_CONSTITUTION.md`
- `.cursor/rules/studioos-engineering.mdc`
- `AGENT.md`

## Remaining Gaps / Risks

### P0: Full Lifecycle E2E Still Needs Dedicated Test

The system needs one strict E2E verification that proves:

1. Publishing does not send invitations before payment.
2. Payment success starts matching/invitations.
3. Accepting an invitation does not create/upload a project.
4. Brand final selection creates the formal creator project/order.
5. Selected creator can enter review and upload V1.
6. V4/V5 require the 20% add-on.
7. V5 failure escalates to arbitration.

### P1: Admin TOTP Target Is Not Fully Verified In This Pass

The admin PDF requires an independent `/admin/login` + TOTP-only security path. This pass did not fully audit or implement admin auth because that can affect security architecture and should be a focused task.

### P1: AI Platform Target Is Bigger Than Current Implementation

Current implementation has `AIEvent`, `AILearning`, `AiJob`, `AiPreference`, `MemoryFact`, and `RelationshipDna`, but the PDF target architecture also defines:

- `AIMemory`
- `AIKnowledge`
- `AIEmbedding`
- `AIDecision`
- `AIFeedback`
- `AIModel`
- `AIPrompt`

These should be treated as roadmap targets, not added casually in this pass.

Known implementation gap: `ai-learning-worker.service.ts` currently processes only `CreatorRejected`, so events such as brand-selected creator and future Save Creator signals still need worker support before they become true long-term memory.

### P1: Matching Weights Conflict With Long-Term Preference Rules

`lib/studioos/ai-matching-policy.ts` currently uses compiled runtime weights. This conflicts with the long-term Preference Engine rule that weights should be configurable and versioned through learning rules. The current file is protected as a migration target, not as the final architecture.

### P1: Language Database Is Not Yet A Real Database Layer

The PDF requires a shared editable language database for UI, AI, email, notification, errors, and admin copy. Current code still has many local copy objects and hard-coded strings. This is a future migration, not safe to mass-change overnight.

### P1: Notification Deduplication Still Needs Tests

Some lifecycle events still send both modern notification rows and legacy notification records. This is necessary during bridge migration, but duplicate user-visible messages should be tested and deduped carefully.

### P1: V5 Arbitration Needs Product Decision

The review flow notifies platform intervention after V5, but a fully automatic Dispute/Admin case was not implemented in this pass. That changes operational workflow and should be handled as a focused owner-approved task.

### P2: Partner / Academy Should Stay Isolated

Partner/Academy is a valid future ecosystem layer, but it must remain isolated from Campaign / Payment / Review core flows until schema and settlement rules are formally implemented.

## Recommendations

1. Add `npm run lifecycle:verify` for the full payment -> matching -> invitation -> final selection -> review lifecycle.
2. Add a static audit script that fails if `ESCROW_FUNDED` appears inside uploadable status sets.
3. Add a static audit script that fails if creator invitation listing returns other creators' invitations.
4. Create an AI Platform roadmap doc that maps current models to the future `AIMemory` / `AIKnowledge` / `AIPrompt` target.
5. Create an i18n migration plan before adding a language database schema.
6. Handle Admin TOTP-only login as a separate security task, not mixed into product-flow hardening.
7. Preserve homepage golden baseline and avoid UI redesign during lifecycle hardening.

## Verification

Local shell in the agent environment still intermittently returns no exit status. The owner should run:

```bash
npm run typecheck
npm run build
npm run production:verify
```

The previous owner run showed only TypeScript failures before this pass. Those earlier errors were fixed before this audit continued.
