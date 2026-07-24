# VINCIS v1.0 — Dead Code Audit (Phase 1)

**Date:** 2026-07-24  
**Branch / commit:** `cleanup/auth-legacy` @ `268acff`  
**Method:** Static analysis + ripgrep + route/script cross-check. No files deleted.

**Classification key**

| Class | Meaning |
|-------|---------|
| **A — CONFIRMED_DEAD** | No static/dynamic/route/script reference found; safe to delete after one verification pass |
| **B — PROBABLY_DEAD** | Likely unused; dynamic/string/config risk |
| **C — LEGACY_COMPATIBILITY** | Deprecated but intentionally kept |
| **D — ACTIVE** | Production path |

---

## A. CONFIRMED_DEAD (top 25 — delete candidates)

| # | File / symbol | Evidence | Delete risk | Suggested action |
|---|---------------|----------|-------------|------------------|
| 1 | `features/canvas/canvas-video-generation.service.ts` | 0 imports; `@deprecated` pass-through to `videoGenerationService` | Low | Delete file; grep verify |
| 2 | `lib/studioos/creator-demo-invitations.ts` | 0 imports; re-export only | Low | Delete |
| 3 | `features/campaign/brand-campaign/index.ts` | 0 `@/features/campaign/brand-campaign` imports | Low | Delete barrel |
| 4 | `features/portal/index.ts` | 0 barrel imports | Low | Delete barrel |
| 5 | `features/finance/index.ts` | 0 barrel imports | Low | Delete barrel |
| 6 | `features/admin/campaign/index.ts` | 0 barrel imports | Low | Delete barrel |
| 7 | `features/shared/state-machines/index.ts` | 0 barrel imports (leaf imports used) | Low | Delete barrel or wire — verify leaf imports first |
| 8 | `lib/design/index.ts` | 0 `@/lib/design` imports | Low | Delete barrel |
| 9 | `lib/api-client/index.ts` | 0 imports via index | Low | Delete or implement client |
| 10 | `features/review/reviewer-v1.index.ts` | 0 external imports | Low | Delete barrel |
| 11 | `lib/project-events-service.ts` | Re-export only; consumers use `-core` | Low | Delete shim |
| 12 | `lib/project-events-service-core.ts:listProjectEvents` | Defined, never called | Low | Remove export |
| 13 | `app/mvp-actions.ts` (9 actions) | 0 UI/form callers | Low | Delete after confirming no external forms |
| 14 | `features/video/video-bridge.service.ts` | Only imported by dead `mvp-actions` | Low | Delete with mvp-actions |
| 15 | `features/canvas/providers/provider.types.ts` | Superseded by `video-engine/video-provider.types.ts` | Low | Delete |
| 16 | `components/mvp/review-watermark-overlay.tsx` | 0 imports; duplicate in `studioos/` | Low | Delete MVP copy |
| 17 | `components/mvp/review-video-source.tsx` | 0 imports | Low | Delete |
| 18 | `brand-campaign-actions.ts:saveBrandCampaignStep1Action` | `@deprecated`; 0 callers | Low | Remove export |
| 19 | `brand-campaign-actions.ts:generateBrandCreativeDirectionsAction` | Same | Low | Remove export |
| 20 | `video-provider.registry.ts:resolveVideoProviderId` | Only re-exported; unused vs `resolveVideoProviderRouting` | Low | Remove symbol |
| 21 | `components/studioos/brand-checkout-pay-action.tsx:BrandCheckoutPayAction` | Panel uses sibling components only | Low | Delete component |
| 22 | `lib/i18n.ts:brandStartBriefHref` | 0 callers | Low | Remove export |
| 23 | `lib/studioos/commercial-interaction-notify.ts:notifyCreatorsNotSelected` | 0 callers | Low | Remove export |
| 24 | `components/creator/creator-profile-ui.tsx:CreatorWorksGrid` | `@deprecated` alias; 0 callers | Low | Remove export |
| 25 | `features/campaign/campaign-asset.service.ts` deprecated wrappers | `campaignAssetService.*` grep → 0 | Medium | Remove after confirming no dynamic calls |

**Estimated removal:** ~15–22 files + ~30 dead exports ≈ **1,500–3,000 LOC** (estimate from grep scope).

---

## B. PROBABLY_DEAD (top 15 — do not delete yet)

| # | Candidate | Risk |
|---|-----------|------|
| 1 | `app/api/checkout/route.ts` | No in-repo fetch; external/bookmarked URL possible |
| 2 | `app/workspace/admin/page.tsx` | Middleware redirects to `/admin`; bookmark compat |
| 3 | `app/workspace/**` redirect pages | Legacy URL bookmarks |
| 4 | `components/mvp/review-workspace.tsx` | Thin re-export; workspace stack legacy |
| 5 | `components/mvp/brand-review-shell.tsx` | Used only by workspace layout |
| 6 | `lib/core/password.ts` | Re-export barrel; 1 import vs direct crypto |
| 7 | `lib/core/monitoring/index.ts` | Only sprint18 verify; instrumentation drift |
| 8 | `scripts/sprint2–21:verify` | Not in production gate (only sprint1) |
| 9 | 40 scripts on disk not in `package.json` | Ad-hoc ops tools |
| 10 | `components/page-shell.tsx` | `@deprecated`; 3 imports remain |
| 11 | `lib/studioos/brand-theme.ts` | `@deprecated`; 2 imports |
| 12 | `lib/studioos/deposit-guard.ts:isCreatorVerified` | Deprecated alias; internal use |
| 13 | `app/api/v1/seedance/status/route.ts` | Poll endpoint; verify worker usage |
| 14 | `lib/marketing/home-hero-video-sources.ts` alias exports | Homepage protected stack |
| 15 | `features/auth/oauth-state.ts:encodeOAuthState` | Legacy encoder; verify Alipay path |

---

## C. LEGACY_COMPATIBILITY (must not delete without migration plan)

| Entry | Behavior | Dependents |
|-------|----------|------------|
| `POST /api/auth/demo-social` | 410 Gone | `login-preflight-verify.ts` |
| `POST /api/auth/email/send-code` | Delegates to `/start` + Deprecation header | Preflight + old clients |
| `POST /api/login` | Re-export → `/api/auth/login` | Middleware whitelist |
| `POST /api/continue` | Re-export → `/api/auth/continue` | Middleware whitelist |
| `lib/demo-auth.ts` | Empty demo users; compat stubs | sign-in, seed, settings |
| `lib/campaign-store.ts` / `review-store.ts` | JSON fallback when no DB | Dev/demo paths |
| `lib/mvp/store.ts` + workspace review | Legacy review URLs | `/workspace/projects/[id]/review` |
| `features/payment/escrow.service.ts` | `@deprecated` → `paymentService` | 4 API routes |
| `features/review/review.repository.ts` | Wrapper over ReviewerV1 | 5 importers |
| `confirmBrandCampaignAction` | `@deprecated` but wired in UI | `brand-campaign-confirmation.tsx` |
| `GET /api/review-video/[orderId]/[version]` | Active + 410 branches | Delivery pipeline |

---

## D. ACTIVE (looks redundant but protected)

| Module | Why keep |
|--------|----------|
| AI Learning (`features/memory/**`, `ai-copilot/**`, Lucien) | Owner-locked foundation |
| Homepage / marketing stack | `homepage-absolute-lock.mdc` |
| Google / Alipay OAuth routes | `auth-oauth-protection.mdc` |
| Canvas / AI Tools tables & routes | `ai-tools-absolute-lock.mdc` |
| Master admin bootstrap scripts | `super-admin-absolute-lock.mdc` |
| `scripts/login-preflight-verify.ts` | Production gate |
| New canvas generation files (`generation-video-*`) | Wired in studio section |

---

## High-risk deletion list (DO NOT delete in Phase 1)

1. Any OAuth / auth callback / session cookie logic  
2. `lib/demo-auth.ts` (until sign-in refactor approved)  
3. Deprecated API routes until preflight updated + owner sign-off  
4. `lib/mvp/store.ts`, campaign/review JSON stores  
5. AI learning / memory / preference modules  
6. Homepage/marketing files (even “unused” exports)  
7. Prisma schema / migrations  
8. Stripe webhook handlers  
9. Credits ledger / reservation code  
10. `super-admin` / bootstrap scripts  

---

## Suggested deletion order (post-approval)

1. Dead barrels (7 files)  
2. `canvas-video-generation.service.ts`, `creator-demo-invitations.ts`, `provider.types.ts`  
3. MVP orphan components + `mvp-actions.ts` + `video-bridge.service.ts`  
4. Unused exports in `brand-campaign-actions.ts`, `i18n.ts`, notify helpers  
5. One-off scripts (owner inventory)  
6. Legacy compat routes — **last**, with preflight + external client audit  

---

## Statistics

| Category | Count |
|----------|------:|
| CONFIRMED_DEAD (listed) | 25 |
| Dead barrels | 7–9 |
| LEGACY_COMPAT routes | 4 |
| PROBABLY_DEAD | 15+ |
| Scripts not in package.json | ~40 |
| npm verify scripts not in production gate | ~20 |

**Audit rule applied:** No item marked CONFIRMED_DEAD without grep + route/script check. Dynamic import and Next.js file routing considered.
