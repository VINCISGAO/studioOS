# VINCIS Architecture Freeze Audit

**Date:** 2026-07-11  
**Scope:** Full codebase architecture audit — no new features, no schema changes, no lifecycle spec changes.  
**Canonical business truth:** `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md`, `docs/AI_CREATIVE_COLLABORATION_FLOW.md`, `docs/AI_LEARNING_FOUNDATION.md`

**Goal:** Move from “能跑” to “稳定、可维护、不会越改越乱” via **Architecture Freeze** — refactor implementation, not add capability.

---

## Executive Summary

| Dimension | Grade | One-line verdict |
|-----------|-------|------------------|
| 1. Business flow single path | **C** | Prisma campaign path is partially correct; legacy JSON + dual publish gates break single-path |
| 2. State machine | **C-** | Campaign FSM exists; invitation/order/review legacy bypass; `CREATOR_ACCEPTED` semantics polluted |
| 3. Routing / redirects | **C** | One critical login↔studio loop; many redirects swallow 404 |
| 4. Loading states | **C+** | Several stuck-loading bugs; login/copilot mostly OK |
| 5. 404 / Not Found UX | **D** | No portal `not-found.tsx`; invalid IDs redirect to dashboard |
| 6. Permissions | **C-** | Critical brand portal IDOR when `clientEmail` null; dual auth stacks |
| 7. Dead code | **B-** | ~900 LOC dead brand-project-hub chain; disabled routes |
| 8. Duplicate logic | **C** | 6+ session helpers; 4+ formatDate; escrow guard copied 5× |
| 9. Error handling | **C-** | No unified toast; throw vs `{ok:false}` vs alert |
| 10. Database / queries | **D+** | Critical N+1 in matching + order listing |

**Overall:** Business闭环在 Prisma 主路径上已基本打通，但 **双轨状态（Prisma Campaign + legacy StoredProject/Order）** 和 **补丁式 status 判断** 是最大技术债。继续堆功能前，应先冻结架构并分阶段还债。

---

## Phase 1 — Business Flow Audit (Highest Priority)

### Intended single path (spec)

```
Brand 发布需求 → 付款托管 → AI 匹配 → 邀约 → Creator 接受/拒绝
→ Brand 最终选定 → 正式项目 → 审片 V1–Vn → Approve → 放款 → Completed
```

### What is correctly enforced

- Creator **接受邀约不生成**正式项目（Prisma 路径）
- Brand **最终选定**才 atomic lock + expire non-winners
- 邀约在 escrow 后触发（portal / checkout 路径）
- 付款成功 → `START_MATCHING`，不直接进入 production
- Phase 2 创意协作要求 `order.creator_id` + escrow（近期已修复持久化）

### Critical single-path violations

| ID | Severity | Issue | Primary files |
|----|----------|-------|---------------|
| B1 | **CRITICAL** | **双轨状态**：`Campaign.status`、Prisma JSON、`StoredProject`、`StoredOrder` 四套信号并行 | `lib/order-service.ts`, `lib/project-service.ts`, `features/portal/*` |
| B2 | **CRITICAL** | **Publish 双门禁**：状态机允许 `DRAFT→ESCROW_PENDING`，但 publish service 强制 `CREATIVE_APPROVED` + frozen brief | `campaign.state-machine.ts`, `brand-campaign-publish.service.ts`, `campaign-brand.service.ts` |
| B3 | **CRITICAL** | **`CREATOR_ACCEPTED` 语义污染**：状态名=创作者接受，实际=品牌最终选定；上传门允许此状态 | `campaign.state-machine.ts`, `review-video-upload-gate.ts`, `brand-campaign.utils.ts` |
| B4 | **HIGH** | **订单重复创建**：publish 时 `pending_match` 订单、选定后 reuse、selection fallback 新建 | `brand-checkout-service.ts`, `order-service.ts`, `campaign-selection.service.ts` |
| B5 | **HIGH** | **邀约重复创建**：portal ensure、InvitationService.send、JSON fallback 三套匹配源 | `invitation-portal.service.ts`, `invitation.service.ts`, `creator-invitation-store.ts` |
| B6 | **HIGH** | **Legacy payment sync** 可链式 `PUBLISH→PAYMENT_SUCCESS→START_MATCHING` 跳过 wizard 前置 | `lib/order-service.ts` (~806–822) |
| B7 | **HIGH** | **Pre-payment AI fast path**（`wizardDraftFastPath`）在 `DRAFT` 消耗 token | `creative-direction.service.ts` |
| B8 | **MEDIUM** | 邀约 accept 时从 `MATCHING` 触发 `SEND_INVITATION`（错误 actor 推进 campaign） | `invitation-portal.service.ts` |

### State pollution examples

- `production` legacy status 可通过 `skipPreconditions` 从 `matching` 跳入，绕过 brand selection 语义
- `CREATOR_ACCEPTED` 与 invitation `ACCEPTED` 在 DB/UI 不可区分（无 `SELECTED` enum）
- Commercial stepper（`commercial-lifecycle.ts`）可能与 Prisma campaign 不一致

### Recommendation (freeze)

1. **Declare SSOT:** Prisma `Campaign` + `CreatorInvitation` 为唯一业务状态源；legacy JSON 只读/迁移，禁止新写入路径
2. **Align publish** with spec step 3（付款前不要求 AI 创意批准）或更新 spec（需 owner 明确授权）
3. **Rename/split** `CREATOR_ACCEPTED` → `BRAND_SELECTED`；上传门仅 `PRODUCING`+
4. **Single entry points:** one `publish()`, one `sendInvitations()`, one `selectCreator()`, one `createActiveOrder()`

---

## Phase 2 — State Machine

### Machines that exist

| Machine | File | Wired in production? |
|---------|------|-------------------|
| Campaign | `features/campaign/campaign.state-machine.ts` | **Yes** via `campaignService.transition()` |
| Invitation | `features/shared/state-machines/invitation.state-machine.ts` | **No** — direct `updateStatus` only |
| Review | `features/review/review.state-machine.ts` | **Yes** in `review.service.ts` |
| Escrow | payment state machines | Partial |
| Legacy project | `lib/studioos/project-status.ts` | **Yes** — parallel to Prisma |

### Anti-patterns found

- **Multiple booleans / parallel flags** instead of one status: `order.payment_status` + `order.status` + `campaign.status` + `project.status` + `canUpload` heuristics
- **Direct status writes:** `campaign.repository.updateStatus()` (dormant API), `orderRepository.updateStatus()`, `invitationRepository.updateStatus()`
- **Patch chains** in payment/matching/settlement (see Phase 8)

### Recommendation (freeze)

1. Wire **invitation FSM** or delete dead machine file
2. Add `SELECTED` to `InvitationStatus` or formal `campaignMemory.selection` query helpers
3. Ban new `if (status === "...")` branches in services — extend FSM events instead
4. Document allowed transitions table in repo (generated from machines)

---

## Phase 3 — Routing & Redirects

### Critical: infinite redirect

```
/login?role=creator  →  /studio  →  /login?role=creator  →  ...
```

**Cause:** Middleware trusts `profiles.role=creator`; studio pages require `getCurrentCreatorId()` (creator profile row). OAuth signup gap triggers loop.

**Files:** `middleware.ts`, `app/login/page.tsx`, `app/studio/page.tsx`, `lib/creator-session.ts`

### Medium: role/session mismatch bounce

- `/brand/review` uses `getCurrentClientEmail()` (requires Prisma role BRAND)
- `/brand` dashboard uses `session.email` directly — home works, child routes fail

### Legacy hops (OK, single-hop)

- `/brand/campaigns` → `/brand`
- `/creator/orders/*` → `/studio/*`
- Checkout ↔ project guarded by `brand-payment-funding.ts`

### Recommendation (freeze)

1. Middleware + login page: if `role=creator` but no creatorId → `/creator/onboarding` (not `/studio`)
2. Unify brand session check: always `requireBrandPortalClientEmail` or Prisma BRAND role
3. Add redirect cycle detector in dev (middleware test)

---

## Phase 4 — Loading States

### Stuck loading (missing `finally`)

| Severity | Component | Issue |
|----------|-----------|-------|
| **HIGH** | `creator-invitation-card.tsx` | `actingId` never cleared on action failure |
| **MEDIUM** | `creator-pricing-preference-card.tsx` | `setPending(false)` skipped on throw |
| **MEDIUM** | `creator-profile-studio.tsx` | publish dialog `submitting` stuck on throw |
| **MEDIUM** | `use-brand-campaign-directions.ts` | AI poll no timeout — infinite loading |

### OK patterns

- `login-workspace.tsx`, `use-login-email-resend.ts`, `creative-collaboration-panel.tsx` (`useTransition`)

### Recommendation (freeze)

1. ESLint rule or code review checklist: async UI handlers must use `try/finally`
2. Shared `useAsyncAction()` hook with pending + error + reset
3. Poll helpers: max attempts + backoff + user-visible timeout

---

## Phase 5 — 404 / Not Found UX

### Current behavior

- **Zero** `app/not-found.tsx`, `app/brand/not-found.tsx`, `app/studio/not-found.tsx`
- Invalid project/order IDs → **redirect** to dashboard/list (looks like “消失”，不是 Not Found)
- Only `app/brand/orders/[id]/review/page.tsx` calls `notFound()` → bare Next 404

### Recommendation (freeze)

1. Add localized `not-found.tsx` under `app/brand/`, `app/studio/` with:
   - “项目不存在或无权访问”
   - CTA: 返回项目列表
2. Portal pages: `notFound()` for missing resource; `redirect` only for auth failure
3. Distinguish 403 vs 404 in portal services (today both → redirect)

---

## Phase 6 — Permissions

### Critical

**Brand portal IDOR:** `brandProjectPortalService.getDetail()` only checks ownership when `clientEmail` is truthy. API route can pass `null` after `requireApiUser`.

**Files:** `features/portal/brand-project-portal.service.ts`, `app/api/v1/portal/brand/projects/[projectId]/route.ts`

### High

- **Dual auth:** `requireApiUser` (Prisma) vs `getCurrentClientEmail` / `getCurrentCreatorId` (legacy cookies)
- **~72 legacy `/api/*` routes** without `requireApiUser`
- **Brand/studio layouts** use `session!` without server redirect
- **`studioos-actions.ts`:** unauthenticated AI actions (dead but dangerous)

### OK

- Review upload APIs check creator ownership
- Admin routes use `validateAdminSession` / mutation guards
- Creator portal collaboration API checks order ownership

### Recommendation (freeze)

1. Fix IDOR immediately (Phase 0 hotfix)
2. All `/api/v1/portal/*` and mutations: `requireApiUser` + resource ownership in **service layer**
3. Deprecate legacy cookie-only API routes behind middleware allowlist
4. Delete or auth-gate `studioos-actions.ts`

---

## Phase 7 — Dead Code

| Item | Est. LOC | Evidence |
|------|----------|----------|
| `brand-project-hub.tsx` + match-tab shell/tab | ~900 | Zero imports; replaced by `brand-project-overview` |
| `lib/api-client/portal-client.ts` fetch helpers | small | Never imported; gateway used instead |
| `app/api/campaign-videos/...` | — | Always 404 "Route disabled" |
| `app/studioos-actions.ts` | — | Never called |
| `invitation.repository.declineOthers()` | — | Never called |
| `campaign-bridge.service` publish sync | — | No-op |

### Recommendation (freeze)

1. Delete dead hub chain in dedicated PR (no behavior change)
2. `scripts/dead-code-audit.mjs` in CI (knip or custom import graph)
3. Freeze rule: new portal UI must not duplicate overview/hub patterns

---

## Phase 8 — Duplicate Logic

| Pattern | Copies | Unify to |
|---------|--------|----------|
| Session/user resolution | 6+ helpers | `features/auth/session-context.ts` |
| `formatDate` | 4+ local copies | `lib/utils.ts` + locale param |
| Escrow-funded guard | 5 services | `features/payment/escrow-guards.ts` |
| Post-login redirect | 4+ entry points | already centralized — enforce usage |
| Portal detail loading | gateway + portal-client + page direct | single `server-portal-gateway` |

### Patch-chain debt (status `if` nesting)

**Worst offenders:** `payment.service.ts`, `order-service.ts`, `project-service.ts`, `matching.service.ts`, `creative-direction.service.ts`

This matches the user’s fear:

```ts
if (status === "production") { ... }
else if (status === "review") { ... }
else if (reviewCompleted) { ... }
else if (version === 5) { ... }
```

### Recommendation (freeze)

1. No new status string comparisons in `lib/` — FSM events only
2. Extract shared guards (escrow, active project, upload gate) to `features/*/guards.ts`
3. Portal read models: one mapper per aggregate

---

## Phase 9 — Error Handling

### Findings

- **No global toast** — per-component `setError`, local `notify()`, one `window.alert`
- **API client split:** `creative-collaboration-client` returns `{ok:false}`; `portal-client` throws
- **`handleRouteError`** uses `console.error` not `logger`
- **Silent failures:** `refreshSessions` in copilot, admin payments table

### Positive

- No `console.log` in app/features/components/lib
- Server routes mostly return `{ success, error }` envelope

### Recommendation (freeze)

1. `lib/ui/async-feedback.ts` — toast + log + recover pattern
2. All API clients return `ApiResult<T>` (no throw in client layer)
3. Replace `console.error` in app/features with `logger.error`

---

## Phase 10 — Database & Queries

### Critical N+1

| Path | Pattern |
|------|---------|
| `matching.service.ts` | `findMany` creators → per-row memory + DNA queries |
| `order-service.ts` | `listAll()` → `map(findById)` ×3 list functions |
| `order-service.ts` | `repairSelectedCreatorCampaignOrders` loop |

**Existing fix unused:** `order.repository.listForUser(userId)` never called from `order-service.ts`

### Layer violations

- **12 `lib/*` files** call Prisma directly (should be `features/*/repository`)
- **~56 feature services** bypass their repositories
- Portal composes lib + JSON store → amplified query cost

### Recommendation (freeze)

1. Hotfix order listing: use `listForUser` / SQL `where` — no `listAll`+filter
2. Matching: batch-load memory facts + DNA for candidate IDs
3. Migration plan: move `lib/order-service.ts` orchestration into `features/order/` behind repository
4. Add Prisma query logging in staging; budget p95 per portal page

---

## Recent Fixes (already shipped — reduce audit severity)

These were addressed in the session before this audit report:

| Area | Fix |
|------|-----|
| Creative collaboration | API routes + Prisma persistence + `PRODUCING` status gate |
| AI copilot drawer | Locale names, feedback API, Lucien avatar |
| Production build | `scripts/next-build.mjs` worker-thread race |
| Portal layer | `features/portal/*`, gateway, selection lock |

---

## Architecture Freeze Plan (recommended order)

### Phase 0 — Hotfixes (1–2 days, zero spec change)

- [ ] Brand portal IDOR (`clientEmail` required)
- [ ] Creator login redirect loop → onboarding
- [ ] Invitation `actingId` stuck loading
- [ ] Delete `brand-project-hub` dead chain

### Phase 1 — SSOT declaration (3–5 days)

- [ ] Document: Prisma campaign is authoritative; legacy JSON write paths frozen
- [ ] Single publish / select / invite entry points (wrap existing services)
- [ ] Fix `CREATOR_ACCEPTED` naming in UI only (display layer)

### Phase 2 — Routing & UX shell (3–5 days)

- [ ] `not-found.tsx` for brand/studio
- [ ] Unified `useAsyncAction` + API `ApiResult`
- [ ] `requireBrandPortalClientEmail` on all brand portal routes

### Phase 3 — Query & layer cleanup (1–2 weeks)

- [ ] Order list N+1 elimination
- [ ] Matching batch queries
- [ ] Wire invitation FSM or remove
- [ ] Move hot Prisma from `lib/` to `features/`

### Phase 4 — State machine consolidation (2+ weeks, needs owner sign-off)

- [ ] Reconcile publish gate with lifecycle spec
- [ ] Legacy JSON read-only mode
- [ ] Remove `skipPreconditions` chains except documented admin tools

---

## Retained Risks (accept or schedule)

| Risk | Why retained short-term |
|------|-------------------------|
| Dual JSON + Prisma stacks | Large migration; portal recently added gateway |
| Wizard pre-payment AI fast path | Product may want draft wizard UX |
| `CREATOR_ACCEPTED` enum name | DB migration + notification template churn |
| 72 legacy API routes | Mobile/iframe clients may depend |
| Template-based creative collaboration AI | Spec allows draft loop before OpenAI wiring |

---

## Audit Rules for Future PRs (Architecture Freeze)

1. **No new features** until Phase 0–1 complete (owner exception only)
2. **No new `if (status ===)`** in services — FSM event or shared guard
3. **No new Prisma in `lib/`** — repository in `features/`
4. **No new server actions** for mobile-bound flows — `/api/v1/portal/*` only
5. **No page-level DB access** — portal gateway → service → repository
6. **Every async UI** must have `finally` or `useAsyncAction`
7. **Missing resource** → `notFound()` with recovery CTA, not silent redirect
8. **Delete** unused code in same PR that replaces it

---

## Appendix — Key Files Reference

| Concern | Files |
|---------|-------|
| Lifecycle spec | `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md` |
| Campaign FSM | `features/campaign/campaign.state-machine.ts` |
| Selection | `features/matching/campaign-selection.service.ts` |
| Payment loop | `lib/studioos/brand-payment-funding.ts`, `features/payment/payment.service.ts` |
| Portal SSOT | `features/portal/*`, `lib/api-client/server-portal-gateway.ts` |
| Middleware | `middleware.ts`, `lib/auth/post-login-redirect.ts` |
| Order debt | `lib/order-service.ts`, `features/order/order.repository.ts` |
| Matching N+1 | `features/matching/matching.service.ts` |

---

*Generated by architecture audit pass. No code was modified in this report. Remediation PRs should be scoped per freeze phase above.*
