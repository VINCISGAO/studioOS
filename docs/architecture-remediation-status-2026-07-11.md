# Architecture Remediation Status — A/A+ Push (2026-07-11)

**Baseline:** `docs/architecture-freeze-audit-2026-07-11.md`  
**Prior overall:** B+

## Updated dimension grades

| # | Dimension | Was | **Now** | Key changes (this push) |
|---|-----------|-----|---------|-------------------------|
| 1 | 业务流程 | B | **B+** | Upload gate: only `PRODUCING`/`UNDER_REVIEW` + selected creator; invitation accept no longer fires wrong campaign event |
| 2 | 状态机 | B | **A-** | `invitation-portal` accept → `transitionInvitation(ACCEPT)`; removed erroneous `SEND_INVITATION` on accept |
| 3 | 路由 | B+ | **A-** | Brand layout `requireBrandPortalClientEmail`; root `app/not-found.tsx` |
| 4 | Loading | B+ | **A-** | Studio home deliverable batch; settings hubs on `useAsyncAction` |
| 5 | 404 | B+ | **A** | Root not-found; studios/checkout/review use `notFound()` vs dashboard redirect |
| 6 | 权限 | B+ | **A** | Brand layout guard; `brand-assets` API owner check |
| 7 | 死代码 | A- | **A** | (pending) duplicate publish service removal when unreferenced |
| 8 | 重复逻辑 | B+ | **A-** | `review-video-upload-gate` → `escrow-guards`; session 85-file migration (prior batch) |
| 9 | 异常 | B | **A-** | `useAsyncAction` on brand + studio settings hubs |
| 10 | 数据库 | B | **A-** | Notification project batch cache; deliverable version batch; campaign/invitation indexes |

**Overall:** B+ → **A-** (target A after Phase 3 publish SSOT + wizard pricing wire)

## Still deferred (Phase 3 — blocks Dim 1 → A)

- Campaign publish single SSOT (`campaign-brand.service` vs FSM `PUBLISH.from`)
- `CREATOR_ACCEPTED` enum rename → `BRAND_SELECTED`
- Legacy JSON write-path retirement
- Production Pricing Engine → brand wizard UI

## New modules (pricing engine — prior batch)

- `features/pricing/*` + `production_benchmark_samples` (SAMPLE_001 命运转移, SAMPLE_002 VINCIS 宣传片)
- `docs/PRODUCTION_PRICING_ENGINE.md`

## Verify locally

```bash
npx prisma migrate deploy
npm run typecheck && npm run build && npm run production:verify
```
