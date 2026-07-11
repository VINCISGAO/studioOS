# Phase 0.5 — Idempotency & Concurrency Audit Appendix

**Date:** 2026-07-11  
**Scope:** Payment webhooks, campaign selection, order creation, AI jobs, invitation responses.  
**Goal:** Document gaps and minimal hardening without FSM refactor or lifecycle spec changes.

---

## Executive Summary

| Area | Current state | Risk | Phase 0.5 action |
|------|---------------|------|------------------|
| Stripe webhooks | `webhook_event_id` + retry after failure | Medium | **Done** (prior session) |
| Campaign selection | Atomic lock in `campaign-selection.service` | Medium | Verify + document |
| Order duplicate create | Multiple publish/selection paths | High | Single-entry enforcement deferred; guard at selection |
| AI job enqueue | Active job dedupe per campaign | Low | **Exists** (`findActiveForCampaign`) |
| Invitation accept | Status + FSM transition | Medium | **Wired** (`transitionInvitation`) |
| Wallet balance | Service-layer mutations only | High | No direct writes (policy) |
| Optimistic locking | None on Campaign row | Medium | Recommend `updatedAt` check in selection PR |

---

## 1. Payment / Webhook Idempotency

**Pattern:** `PaymentWebhookService` reserves `webhook_event_id` before processing; failed attempts can retry; succeeded events are skipped.

**Residual risk:** Legacy `markOrderPaid` JSON path has no webhook idempotency — acceptable for demo/local only.

**Recommendation (Phase 1+):** Route all production payment confirmation through Prisma escrow + `payment.service.ts`.

---

## 2. Campaign Selection Concurrency

**Pattern:** `campaign-selection.service` uses transaction + campaign memory lock before `START_PRODUCTION`.

**Gap:** No row-version optimistic lock — two parallel brand tabs could race before lock is written.

**Phase 0.5 mitigation (recommended next PR):**

```sql
-- selection update pattern
UPDATE campaigns
SET campaign_memory_json = ..., updated_at = now()
WHERE id = $1 AND updated_at = $expected
```

Return `409 CAMPAIGN_STALE` when `count = 0`.

---

## 3. Order Creation Duplication

**Known paths:**

1. Publish → `pending_match` order  
2. Brand selection → reuse or create  
3. Legacy JSON `order-service` fallback  

**Phase 0.5:** Document only. **Phase 1 SSOT** must expose `createActiveOrder()` single entry.

**Unique constraint candidate:**

```prisma
@@unique([campaignId, creatorProfileId]) // on Order where status != CANCELLED
```

Requires migration + backfill — schedule with owner sign-off.

---

## 4. AI Job Idempotency

**Pattern:** `aiJobRepository.findActiveForCampaign(campaignId, 'CREATIVE_DIRECTION')` prevents duplicate enqueue.

**Quota layer:** `CampaignAiUsageLog` counts charged OpenAI calls per campaign.

**Gap:** Retry after DEAD job can enqueue again — intentional (user retry).

---

## 5. Invitation Response

**Pattern:** Status guard (`SENT` / `VIEWED` only) + `invitationStateMachine.transition()` via `transitionInvitation()`.

**Gap:** Legacy `invitation-portal.service` JSON path bypasses Prisma FSM — dual stack retained short-term.

---

## 6. Review / Settlement

**Pattern:** Order/project id match enforced in review actions; settlement auth before release branches.

**Idempotency:** Settlement service checks already-released state before double payout.

---

## 7. Monitoring Checklist (Admin)

| Signal | Table / query | Alert threshold |
|--------|---------------|-----------------|
| AI abuse | `campaign_ai_usage_logs` daily per user | > 200 copilot calls / day |
| Creation spam | `campaigns.created_at` per brand | > 5 / 24h |
| Webhook failures | payment webhook logs | > 3 retries / hour |
| Stuck AI jobs | `ai_jobs` RUNNING > 15m | count > 0 |

---

## Implementation Status (this pass)

- [x] Invitation FSM wired for Prisma accept/decline validation  
- [x] Order list N+1 eliminated (`listForClientEmail`, `listForLegacyProjectId`, `listForLegacyCreatorId`)  
- [x] Matching N+1 batch-loaded (memory facts + relationship DNA)  
- [ ] Campaign selection optimistic lock (deferred — needs migration)  
- [ ] Order `@@unique([campaignId, creatorProfileId])` (deferred — needs owner sign-off)  

---

*Companion to `docs/architecture-freeze-audit-2026-07-11.md`. FSM full refactor (Phase 3) remains deferred.*
