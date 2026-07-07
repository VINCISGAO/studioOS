# Order Flow Refactor Report

Task: Refactor order flow: payment -> AI matching -> invitation -> creator selection -> active project

Date: 2026-07-07

## Goal

Refactor the core brand order flow so the system does not create active projects too early and does not spend AI tokens before payment.

Target lifecycle:

1. Brand submits requirements.
2. System saves requirements only.
3. Brand completes escrow payment.
4. Payment success enters AI creator matching.
5. Creators receive invitations, not projects.
6. Creator accept means interest only.
7. Brand final creator selection creates the active project.
8. Review/upload opens only after active project.

## Files Changed

- `app/brand-campaign-actions.ts`
- `app/brand-selection-actions.ts`
- `components/studioos/brand-invitation-status-panel.tsx`
- `components/studioos/brand-project-match-tab.tsx`
- `features/ai/creative-direction.service.ts`
- `features/matching/invitation-portal.service.ts`
- `features/matching/invitation.repository.ts`
- `features/matching/matching.service.ts`
- `lib/studioos/creator-invitation-store.ts`
- `docs/order-flow-refactor-report.md`

## State Changes

No new Prisma enum states were added in this pass.

Reason: adding new campaign statuses requires a database migration and a larger state-machine migration. This pass keeps the existing state set and tightens semantics:

- `DRAFT`: requirements can be saved here.
- `ESCROW_PENDING`: checkout/payment stage.
- `ESCROW_FUNDED`: payment is done, but this is not production.
- `MATCHING`: AI creator matching stage.
- `INVITATION_SENT`: creators have received collaboration invitations.
- `CREATOR_ACCEPTED`: accepted candidates exist / brand selection bridge state.
- `PRODUCING`: active project exists after brand final creator selection.
- `UNDER_REVIEW`: creator has uploaded a review version.

Recommended future migration:

- Add `BRAND_SELECTED_CREATOR` / `ACTIVE_PROJECT` as explicit state-machine concepts.
- Replace the overloaded `CREATOR_ACCEPTED` bridge state.

State-machine event changes:

- `PUBLISH` now supports `DRAFT -> ESCROW_PENDING` and `CREATIVE_READY -> ESCROW_PENDING`.
- `START_PAYMENT` now supports `DRAFT / CREATIVE_READY / CREATIVE_APPROVED / ESCROW_PENDING -> ESCROW_PENDING`.
- `BRAND_SELECT_CREATOR` is the explicit brand-final-selection event.
- `CREATOR_ACCEPT` remains only as a legacy alias and must not be used for new brand-selection code.
- `START_PRODUCTION` now starts only from the brand-selected bridge state, not from `ESCROW_FUNDED`.

This lets a brand submit requirements and enter payment without first generating or approving AI creative directions.

## Avoiding Early AI Token Usage

Changed:

- `saveBrandCampaignBriefAction()` no longer calls `reorganizeBrandBriefWithAI()` when saving requirements.
- Deprecated `saveBrandCampaignStep1Action()` no longer calls `reorganizeBrandBriefWithAI()`.
- `publishBrandCampaignAction()` no longer requires an AI-generated/frozen creative brief.
- `refineBrandBriefAction()`, `prepareBrandCampaignAction()`, `startBrandCreativeDirectionsAction()`, and `generateBrandCreativeDirectionsAction()` now require escrow payment before AI generation.
- AI creative generation button clicks are recorded through `CreativeDirectionGenerationRequested`.

Result:

Saving/submitting requirements does not spend AI tokens. AI generation is a manual, post-payment action.

## Avoiding Early Project Creation

Already enforced in prior hardening and preserved here:

- `ESCROW_FUNDED` is not uploadable.
- Version upload only allows `PRODUCING` / `UNDER_REVIEW`.
- Video processing no longer starts production from `ESCROW_FUNDED`.

Changed in this pass:

- Publishing no longer requires AI creative approval first.
- Publishing now transitions the linked Prisma Campaign to `ESCROW_PENDING` when applicable.
- Matching can use the submitted requirement brief if no AI frozen creative direction exists.
- Legacy payment completion now syncs the linked Prisma Campaign through `PAYMENT_SUCCESS` and `START_MATCHING`.
- Prisma payment completion no longer starts production just because a `creatorId` exists.
- Brand final creator selection redirects back to the project match tab instead of checkout.
- Final selection remains the point where the active creator order/project is created.

## Payment -> Matching

Preserved:

- `payment.service.ts` moves `ESCROW_FUNDED` without a selected creator into `START_MATCHING`.
- Payment success now always treats `ESCROW_FUNDED` as matching-stage input, never direct production.
- Matching/invitation sending still requires escrow to be funded.

Changed:

- `matching.service.ts` now falls back to user-submitted campaign requirements if no AI frozen production brief exists.

## Invitation / Selection

Preserved:

- Creator receives a collaboration invitation, not an active project.
- Creator accept/decline does not create an active project.
- Brand final selection creates/assigns the order.

Changed:

- Brand selection action now returns to the project match tab after selection instead of checkout.
- Brand selection service now uses `BRAND_SELECT_CREATOR` instead of the misleading `CREATOR_ACCEPT` event.
- Legacy fallback selection now writes a `BrandSelectedCreator` or `BrandSelectedNonRecommendedCreator` AI learning event.

## Reroll Creator Batch

Added:

- `InvitationPortalService.rerollForProject()`
- `invitationRepository.expireOpenBatch()`
- `rerollCreatorInvitationsAction()`
- Minimal `换一批 Creator / Show another batch` button in the match status panel.

Rules:

- Only works after escrow is paid.
- Existing open pending/viewed invitations are expired.
- Previously invited creators are excluded from the new batch.
- Maximum reroll count is 3.
- Each reroll writes `BrandRequestedCreatorReroll`.
- If the limit is reached or no creators remain, the action returns a refund-available state.

## AI Learning Events Covered

Implemented or already present:

- Creator recommended / matching complete: `AIMatchingComplete`
- Brand rerolls creators: `BrandRequestedCreatorReroll`
- Reroll limit / refund option: `CreatorRerollLimitReached`
- Refund option shown after failed matching batches: `BrandRefundOptionShown`
- Creator accepts invitation: `CreatorAccepted`
- Creator rejects invitation and reason: `CreatorRejected`
- Brand views Creator profile from accepted creator list: `BrandViewedCreatorProfile`
- Brand selects creator: `BrandSelectedCreator`
- Brand ignores AI recommendation: `BrandSelectedNonRecommendedCreator`
- AI creative generation button clicked: `CreativeDirectionGenerationRequested`
- Brand selects creative direction and rejects the others: `CreativeDirectionSelected` now includes rejected direction ids/titles

Still recommended:

- Add a dedicated event when brand views a creator profile.
- Add a dedicated event when brand formally requests refund.
- Expand `ai-learning-worker.service.ts` beyond `CreatorRejected` so more events become long-term memory, not only raw rows.

## Phase 2: AI Creative Collaboration

The next product layer is not automatic AI creative generation. It is a post-payment collaboration tool between Brand and Creator.

Canonical spec:

- `docs/AI_CREATIVE_COLLABORATION_FLOW.md`

Rules added after the order-flow refactor:

- AI creative ideas must not auto-generate.
- Brand or Creator must explicitly click `AI 帮我想想`.
- Brand-side AI creative generation starts only after payment and active project context.
- Creator-side AI generation can be used to create or derive directions for Brand confirmation.
- Generated ideas are reference drafts, not final production approval.
- A true creative intent draft exists only after Brand and Creator exchange and confirm a direction.
- Review center can open after active project, but if no direction is confirmed the UI must warn about rework risk.

Future implementation should record:

- `brand_ai_idea_clicked`
- `brand_ai_idea_generated`
- `brand_ai_idea_selected`
- `brand_ai_idea_deepened`
- `brand_ai_idea_sent_to_creator`
- `brand_ai_idea_skipped`
- `creator_ai_idea_clicked`
- `creator_ai_idea_generated`
- `creator_ai_idea_selected`
- `creator_idea_sent_to_brand`
- `brand_confirmed_creator_idea`
- `brand_rejected_creator_idea`
- `brand_deepened_creator_idea`
- `final_creative_direction_confirmed`

Token control:

- Every generation must include `project_id`, `campaign_id`, `user_id`, `role`, `trigger_source`, and `parent_idea_id` for derivatives.
- System lifecycle steps must not consume tokens.

## UI Notes

Only one minimal UI hook was added:

- `换一批 Creator / Show another batch`
- Payment success now triggers the existing AI matching loader for 3 seconds via `matching=1`.
- Creator review room shows a non-blocking warning when no creative direction is confirmed: upload is allowed, but rework risk is marked.

No homepage, marketing layout, or visual design baseline was changed.

## Verification

Attempted:

```bash
npm run typecheck
```

The local agent shell did not return an exit status, so the result cannot be trusted from this environment.

Required local verification:

```bash
npm run typecheck
npm run build
npm run production:verify
```

## Remaining Risks

- `CREATOR_ACCEPTED` is still semantically overloaded as a bridge state. A future migration should add explicit brand-selection / active-project states.
- Reroll is implemented with a minimal button; UX copy and refund UI need product polishing.
- Refund option learning is represented by `BrandRefundOptionShown`, but a formal refund request / refund completed action still needs a real escrow/refund workflow event.
- `ai-learning-worker.service.ts` still only processes `CreatorRejected`; other events are stored but not all converted into memory facts yet.
