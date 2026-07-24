# VINCIS v1.0 — Nested Code & Forwarding Audit (Phase 1)

**Date:** 2026-07-24  
**Scope:** Auth, canvas/generation, credits, matching/invitation, review, payments  
**Method:** Read-only call-chain tracing. No files modified.

**Layer verdict:** **KEEP** = clear responsibility · **MERGE_CANDIDATE** = zero/near-zero value

---

## Top 15 call chains

### 1. Session resolution hub (auth)

```
Page / Action / API
  → features/auth/session-context.ts          [MERGE_CANDIDATE — 60+ imports, re-export only]
  → lib/session-user.ts                       [KEEP — Supabase + cookie merge]
  → features/auth/session.service.ts          [KEEP — DB hydrate]
  → features/auth/auth.service.ts             [KEEP]
  → lib/core/api-route.requireApiUser         [KEEP — rate limit]
```

**Action:** Migrate imports to direct modules; collapse `session-context` after call-site pass.

---

### 2. Auth route aliases

```
POST /api/continue  → re-export POST /api/auth/continue   [MERGE_CANDIDATE shim]
POST /api/login     → re-export POST /api/auth/login      [MERGE_CANDIDATE shim]
```

**Action:** Keep until external clients gone; document canonical paths only.

---

### 3. Escrow checkout (payments)

```
POST /api/v1/campaigns/:id/checkout
  → escrowService.startCheckout()             [MERGE_CANDIDATE @deprecated]
  → paymentService.startCheckout()            [KEEP — state machine + Stripe]
  → stripeCheckoutService                     [KEEP]
  → paymentBridgeService.syncLegacy…()        [KEEP — legacy order sync]
```

**Duplicate permission:** `requireApiUser` → `canAccessCampaign` → `payment.read`

---

### 4. Dual Stripe checkout builders

```
paymentService / creditPurchaseService
  ├─ stripeCheckoutService          (campaign escrow)
  └─ stripeUnifiedCheckoutService   (credits, deposit, revision)
```

**Verdict:** **KEEP** short-term; **MERGE_CANDIDATE** long-term when metadata contract unified.

---

### 5. Video generation (canvas)

```
POST /api/generation/video
  → canvasService.createMockGeneration()      [KEEP — misnamed router]
  → videoGenerationService.createJob()        [KEEP — billing + orchestrator]
  → creditGenerationBillingService            [KEEP]
  → videoOrchestrator.runJob()                [KEEP]

Parallel dead path:
  canvasVideoGenerationService                [MERGE_CANDIDATE — delete]
```

---

### 6. Canvas project access double hop

```
canvasService.assertAccess()
  → canvasService.resolveProject()
  → resolveCanvasProjectForOwner()            [KEEP — actual logic]
```

**Action:** Call `resolveCanvasProjectForOwner` directly; remove two-hop wrappers.

---

### 7. Credit billing pass-through

```
POST /api/v1/credits/quote
  → creditGenerationBillingService.quoteGenerationDetailed()
  → creditPricingService.quoteGeneration()    [KEEP — DB rules]
```

`quoteGeneration()` / `quoteGenerationDetailed()` on billing service = **MERGE_CANDIDATE** (thin pass-through).

---

### 8. Credit purchase duplicate parse

```
preview/route.ts  — purchaseInputSchema
checkout/route.ts — purchaseInputSchema (+ idempotencyKey)
```

**MERGE_CANDIDATE:** Extract `features/credit-wallet/credit-purchase.schemas.ts`.

---

### 9. Invitation accept (legacy dual path)

```
invitationService.accept()                    [KEEP]
  → PermissionService + ownership
  → invitationPortalService.acceptForCreator() [KEEP — legacy notifications]
      → re-fetch + duplicate ownership check
```

**Action:** Collapse ownership validation to one layer; keep portal side effects.

---

### 10. Review approve (modern + legacy)

```
API: reviewDecisionService → reviewService → state machine     [KEEP]

Legacy: reviewPortalService → reviewDecisionService → reviewBridge [KEEP until legacy retired]

Inner: reviewService → reviewerV1Service → repository            [KEEP — v1 adapter]
```

---

### 11. Review comments (inconsistent permission boundary)

```
comments/route: requireApiUser (GET + POST)
  → reviewService → assertVersionAccess + PermissionService

playback/audit/route: permission in route only                 [inconsistent]
```

**Action:** Standardize boundary (route OR service, not mixed).

---

### 12. Prompt enhance

```
canvasPromptEnhanceService → canvasService.assertAccess() → …   [MERGE_CANDIDATE middle hop]
```

---

### 13. Component re-exports

| File | Verdict |
|------|---------|
| `components/canvas/generation-panel.tsx` → `GenerationStudioPanel` | MERGE_CANDIDATE |
| `components/mvp/review-workspace.tsx` → `ReviewWorkspace` | MERGE_CANDIDATE |
| `components/site-header.tsx` | MERGE_CANDIDATE |

---

### 14. Creator eligibility re-export

```
creator-eligibility.service.ts re-exports core   [MERGE_CANDIDATE — import core directly]
```

---

### 15. Unused API client barrel

```
lib/api-client/studioos-api.ts — defined, 0 app imports   [MERGE_CANDIDATE — wire or delete]
Multiple raw fetch() to same endpoints                    [MERGE_CANDIDATE]
```

---

## Wrapper inventory summary

| Type | MERGE_CANDIDATE count | KEEP (required) |
|------|----------------------:|----------------:|
| Deprecated service facades | 3 | payment/review bridges |
| Session/auth re-export hubs | 2 | session-user, auth-security |
| Canvas access hops | 2 | video orchestrator |
| Credit billing thin methods | 2 | pricing repository |
| Component aliases | 3+ | GenerationStudioPanel host |
| Dead barrels | 7+ | state-machines aggregate |

**Estimated layer reduction:** 8–12 merge targets ≈ **500–1,200 LOC** removed without behavior change.

---

## Permission stacking patterns (same request)

| Flow | Layers | Recommendation |
|------|--------|----------------|
| Escrow checkout | 3 | Keep service checks; document as defense-in-depth OR collapse to 2 |
| Invitation accept | 3–4 | Collapse to 2 after legacy ID retirement |
| Review approve | 3 | KEEP |
| Paid revision | 2 (route role + service ownership) | KEEP |
| Review comments | 3 + duplicate requireApiUser | Remove duplicate route call pattern |

---

## Phase 1 merge priority

1. Delete `canvas-video-generation.service.ts`, migrate `escrowService` callers  
2. Inline `resolveCanvasProjectForOwner` (drop canvas double-hop)  
3. Extract credit purchase Zod schemas  
4. Unify wallet/asset fetch client OR delete `studioOsApi`  
5. Migrate off `session-context` facade (incremental)  
6. Remove dead barrels  
7. Standardize review permission boundary  

**Do not merge:** `reviewPortalService`, `paymentBridgeService`, `reviewBridgeService` until legacy order path retired.
