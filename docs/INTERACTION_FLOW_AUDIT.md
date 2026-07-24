# VINCIS v1.0 — Interaction Flow Audit (Phase 1 — Static)

**Date:** 2026-07-24  
**Method:** Code-path review + known runtime issues. No live E2E in this phase.

Legend: 🔴 High · 🟡 Medium · 🟢 OK / recently fixed

---

## Flow matrix (23 core flows)

| # | Flow | Entry authority | State source | Issues | Priority |
|---|------|-----------------|--------------|--------|----------|
| 1 | Login (email OTP) | `/login` → `/api/auth/email/start` → `/api/auth/continue` | Server session cookie | 🟢 Unified `resolveSafePostLoginDestination` | — |
| 2 | Login (Google/Alipay) | OAuth routes | Server session | 🟢 Protected; do not refactor | — |
| 3 | Register | Same as login | DB user row | 🟢 | — |
| 4 | Role selection | Login UI + session role | Server | 🟢 Cross-role `next=` blocked | — |
| 5 | Creator onboarding | `/studio/onboarding` | DB profile | 🟡 Fallback path complexity | Medium |
| 6 | Creator AI tools | `/studio/canvas` | Canvas project + credits | 🟢 | — |
| 7 | Creator verification | Deposit + admin | `CreatorEligibilityService` | 🟢 New lifecycle wired | — |
| 8 | Brand publish | `/brand/projects/new` | Campaign state machine | 🟡 Legacy JSON store parallel path | Medium |
| 9 | Matching | Post-payment AI match | `matching.service` | 🟢 No demo fallback in prod | — |
| 10 | Invitation | `/api/v1/invitations/*` | Invitation SM | 🟡 Dual legacy portal path | Medium |
| 11 | Proposal | Portal + actions | Order/campaign | 🟡 Multiple entry URLs | Medium |
| 12 | Payment (escrow) | Stripe checkout | `paymentService` | 🟡 `escrowService` wrapper + demo fallback dev | Medium |
| 13 | Credits purchase | `/api/v1/credits/purchase/*` | Wallet ledger | 🟢 Verify scripts pass | — |
| 14 | AI image gen | `/api/generation/image` | GenerationJob + billing | 🟡 Client pricing estimate drift | Medium |
| 15 | Seedance video | `/api/generation/video` | Video engine + audit | 🟢 Sprint C verify pass | — |
| 16 | Mureka music | `/api/generation/music` | GenerationJob | 🟢 | — |
| 17 | Failed gen refund | Billing release | `creditGenerationBillingService` | 🟡 Verify on failure paths manually | High |
| 18 | Upload review version | Review center | ReviewerV1 + legacy | 🔴 Dual review stacks | High |
| 19 | Frame comments | Review player | Prisma + JSON store | 🔴 Dual persistence | High |
| 20 | Final delivery | Delivery routes | Order lifecycle | 🟡 Legacy bridge sync | Medium |
| 21 | Settlement | Admin + payment | Escrow release | 🟢 Deposit verify 27/27 | — |
| 22 | Admin audit | `/admin/*` | Admin guard | 🟢 Separate guard layer | — |
| 23 | Responsive main flows | Portal layouts | — | 🟡 Not statically verifiable | Manual QA |

---

## Interaction anti-patterns found (static)

### 🔴 High risk

| Issue | Location | Impact |
|-------|----------|--------|
| Dual review systems (Prisma + legacy JSON/MVP) | `features/review/*`, `lib/review-engine/*`, `app/workspace/**/review` | Inconsistent state after cleanup |
| Client-side credit pricing | `lib/canvas/generation-credits.ts` | Display vs charge mismatch |
| Concurrent canvas autosave | Was `createMany` race | **Fixed** (upsert) — verify in QA |
| Legacy workspace review URL | `/workspace/projects/[id]/review` | Users bookmark old paths |

### 🟡 Medium risk

| Issue | Location | Impact |
|-------|----------|--------|
| Multiple wallet fetch implementations | 3 call sites | Duplicate requests on canvas open |
| Generation SSE + polling | `events/generation` + job status | Redundant traffic; SSE close errors **fixed** |
| `confirmBrandCampaignAction` deprecated but live | `brand-campaign-confirmation.tsx` | Confusing maintenance |
| Demo payment fallback | `escrow.service` / demo checkout route | Must not leak to prod |
| 183 ESLint unused vars | Various | Dead branches may hide stale UI |

### 🟢 Recently addressed (on branch)

- Canvas autosave P2002 → upsert in `canvas.repository.ts`
- Generation SSE `Controller is already closed` → safe enqueue
- Nested `<button>` in reference strip → div wrapper
- Auth post-login redirect unified

---

## Error surfacing audit

| Check | Status |
|-------|--------|
| Zod errors user-friendly | ✅ via `formatValidationMessage` |
| Prisma raw in production | ⚠️ Partially masked; dev shows detail |
| Stripe errors to user | ⚠️ Route-dependent |
| Unified `{ code, userMessage, requestId }` | ❌ Not implemented — gap |
| Stack traces in API JSON | ✅ Suppressed in production for unknown errors |

---

## Idempotency & double-submit (static)

| Flow | Mechanism | Gap |
|------|-----------|-----|
| Generation job create | `idempotencyKey` + P2002 fallback | ✅ |
| Credits purchase | Checkout session + order row | Verify manually |
| Stripe webhook | Signature + idempotency handlers | ✅ in verify |
| Canvas autosave | No client idempotency key | Relies on upsert — OK |
| Login OTP | Rate limits + auth locks | ✅ |

---

## Manual regression checklist (required post-cleanup)

Copy for Phase 2 execution — **22 flows from spec Section XIV**:

- [ ] 1–3 Register / login / email verify  
- [ ] 4–7 Creator onboarding, AI tools, verification gating  
- [ ] 8–11 Brand publish, matching, invitation, proposal  
- [ ] 12–13 Credits purchase  
- [ ] 14–16 Image / Seedance / Mureka generation  
- [ ] 17 Failed task credit release  
- [ ] 18–19 Review upload + frame comments  
- [ ] 20–21 Delivery + settlement  
- [ ] 22 IDOR denial + admin audit  
- [ ] Mobile / iPad / desktop smoke  

---

## Interaction cleanup targets (no code yet)

1. Single review write path per order (document legacy read-only)  
2. Credits display always from `/api/v1/credits/quote`  
3. One wallet fetch on canvas mount  
4. Debounce autosave client-side (300–500ms)  
5. Remove duplicate success toasts (manual QA pass)  
6. Mark deprecated actions `@deprecated` + remove from UI wiring  
