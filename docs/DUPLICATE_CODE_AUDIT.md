# VINCIS v1.0 — Duplicate Code Audit (Phase 1)

**Date:** 2026-07-24  
**Rule:** Merge only when semantics are identical. No God-utils.

---

## 1. Duplicate Zod / validation schemas

| Schema | Locations | Merge target | Risk |
|--------|-----------|--------------|------|
| `purchaseInputSchema` | `credits/purchase/preview/route.ts`, `checkout/route.ts` | `features/credit-wallet/credit-purchase.schemas.ts` | Low |
| Auth continue body | Inline parse in `auth/continue/route.ts` | Shared auth schema (optional) | Medium — auth protected |
| Generation schemas | Centralized in `lib/canvas/validation.ts` | ✅ Already unified | — |

---

## 2. Duplicate permission checks

| Pattern | Occurrences | Recommendation |
|---------|-------------|----------------|
| `requireApiUser` + `PermissionService.assert` + domain ownership | Escrow, review, invitation | Document layers; collapse legacy duplicates |
| Brand role check in route + service | `paid-revision/route.ts` | KEEP route guard + service ownership |
| `canAccessCampaign` + `review.read/approve/comment` | Review module | Extract `ReviewAccess.assert()` domain helper |
| Creator eligibility scattered | matching, invitation, proposal, deposit-guard | **Partially converged** — extend `CreatorEligibilityService` as single read API |

---

## 3. Duplicate fetch / API clients

| Endpoint | Call sites | Recommendation |
|----------|------------|----------------|
| `/api/v1/credits/wallet` | canvas popover, wallet panel, `generation-credits.ts` | `lib/api-client/credits-wallet.client.ts` |
| `/api/v1/auth/me` | 5+ components/hooks | Use one session hook |
| `POST /api/canvas/assets` | 4 hooks/modals | `uploadCanvasAsset()` helper |
| `POST /api/generation/{kind}` | `use-canvas-media-actions.ts` | Already centralized in hook — OK |

---

## 4. Duplicate pricing / credits logic (semantic drift risk)

| Layer | Files | Issue |
|-------|-------|-------|
| Server authoritative | `creditPricingService`, `seedance-credits-pricing.ts` | Source of truth |
| Client estimate | `lib/canvas/generation-credits.ts` | Parallel formulas |
| Hook | `use-generation-credit-quote.ts` → `/api/v1/credits/quote` | Correct path |

**Recommendation:** UI display must use quote API; deprecate client `compute*GenerationCredits` except optimistic placeholder with disclaimer.

---

## 5. Duplicate error handling

| Pattern | Status |
|---------|--------|
| `appError` + `handleRouteError` | Centralized in `lib/core/errors.ts`, `lib/core/api-route.ts` |
| Missing fields | No unified `requestId`, `userMessage`, `retryable` in JSON (gap vs target spec) |
| Prisma errors in production | Partially masked in `handleRouteError`; some routes catch raw Prisma |
| Generation SSE | Fixed closed-controller pattern (recent commit) |

**Gap vs Section IX target:** Extend `apiError()` response shape incrementally; do not big-bang rewrite.

---

## 6. Duplicate DTO / mapping

| Area | Notes |
|------|-------|
| Campaign brand portal | `brand-campaign/index.ts` aliases same service 4× — delete aliases |
| Creator profile DTO | `lib/types.ts` + service mappers — audit per endpoint |
| Canvas snapshot mapping | `canvas.service.ts` node/edge map — single place ✅ |

---

## 7. Duplicate locale / copy

| Pattern | Locations |
|---------|-----------|
| Error copy CN | `features/auth/auth-error-copy.ts`, scattered UI strings |
| Vocabulary | `lib/studioos/vocabulary.ts` — prefer for portal nav |
| Toast duplicates | Not statically enumerable — manual flow audit |

---

## 8. Duplicate state / loading

| Pattern | Risk |
|---------|------|
| Multiple hooks polling notifications | `/api/v1/notifications` + SSE stream coexist |
| Canvas autosave concurrent POSTs | Fixed via upsert (recent); client debounce still worth audit |
| Generation job polling + SSE | `/api/events/generation` + status routes |

---

## 9. Duplicate Stripe / webhook idempotency

| Area | Status |
|------|--------|
| Stripe webhook | Central handler — **KEEP** |
| Credits purchase idempotency | `ownerId_idempotencyKey` on generation jobs — verified in sprint-c |
| Deposit reconcile | Dedicated verify script ✅ |

---

## 10. Merge candidates (safe, post-approval)

| Priority | Merge | Est. LOC saved |
|----------|-------|---------------:|
| P0 | Credit purchase Zod schema | ~30 |
| P0 | Canvas asset upload fetch helper | ~80 |
| P1 | Credits wallet client | ~60 |
| P1 | Remove client-side pricing duplicates | ~200 |
| P2 | Review access helper | ~100 |
| P2 | Session import migration (not logic merge) | 0 LOC, clarity |

**Total estimate:** ~470–800 LOC removable/consolidated without behavior change.

---

## Anti-patterns to avoid

- Single `utils.ts` for unrelated helpers  
- `common.service.ts` absorbing all domains  
- Merging brand vs creator permission checks into one mega-function  
- DRYing legacy + modern review paths before legacy retirement  
