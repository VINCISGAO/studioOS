# VINCIS v1.0 Code Cleanup — Safety Baseline

**Audit date:** 2026-07-24  
**Branch:** `cleanup/auth-legacy`  
**Commit:** `268acff672ef0ec0ee03edf5fcb274dfa5b39a47`  
**Remote:** `origin/cleanup/auth-legacy` (synced)  
**Uncommitted:** `.DS_Store` only (ignored for baseline)

---

## 1. Git state

| Item | Value |
|------|-------|
| Branch | `cleanup/auth-legacy` |
| HEAD | `268acff` — feat(canvas): video generation UI, autosave fixes, and creator lifecycle |
| Recent commits (5) | auth legacy cleanup ×4 + canvas/creator lifecycle ×1 |
| Working tree | Clean except `.DS_Store` |

---

## 2. Repository scale (static)

| Metric | Count |
|--------|------:|
| API routes (`app/api/**/route.ts`) | 210 |
| Feature modules (`features/**/*.ts`) | 405 |
| React components (`components/**/*.tsx`) | 593 |
| Prisma migrations | 59 |
| npm scripts (`package.json`) | 154 |
| e2e specs | 2 (`e2e/happy-path.spec.ts`, `e2e/phase1-interaction.spec.ts`) |
| ESLint warnings (lint run) | 183 (all warnings, exit 0) |

---

## 3. Verification matrix

| Check | Command | Result | Duration (approx) | Notes |
|-------|---------|--------|-------------------|-------|
| Prisma validate | `npm run db:validate` | ✅ PASS | ~2s | Schema valid |
| Prisma generate | (via typecheck) | ✅ PASS | ~0.5s | Client v6.19.3 |
| Prisma migrate status | `prisma migrate status` | ✅ PASS | DB up to date (59 migrations) | Neon PostgreSQL |
| Typecheck | `npm run typecheck` | ✅ PASS | ~10s | `tsc --noEmit` |
| Lint | `npm run lint` | ✅ PASS (183 warnings) | ~11s | No errors; unused-vars dominant |
| Build | `npm run build` | ✅ PASS | ~103s | Next.js 15.5.19 |
| Production verify | `npm run production:verify` | ✅ PASS | ~336s | All gates green |
| Login preflight | `npm run login:preflight` | ✅ PASS | ~23s | Auth paths + DB tables |
| Credits verify | `npm run credits:verify` | ✅ PASS | Skips wallet mutation without test email |
| Creator lifecycle | `npm run creator-lifecycle:verify` | ✅ PASS | 9/9 checks |
| Video engine Sprint C | `npm run video-engine:sprint-c:verify` | ✅ PASS | 10/10 checks |
| E2E (not run in baseline) | `npm run e2e` | ⏸ NOT RUN | — | Playwright; manual regression separate |

### Production verify sub-gates (all ✅)

`prisma.generate`, `prisma.validate`, `typecheck`, `marketing.verify_links`, `lint`, `build`, payment collection files, `knowledge.verify`, `video-engine:sprint-c:verify`, `creator-lifecycle:verify`, admin secrets, deposit security (27/27), migrate deploy/status, deposit reconcile, login preflight, payment verify, credits pricing (3 scripts), canvas ai-models, credits verify, sprint1 verify.

---

## 4. Build & bundle baseline

| Route / asset | First Load JS | Route size |
|---------------|--------------:|-----------:|
| Shared chunks (all pages) | 102 kB | — |
| Middleware | 202 kB | — |
| `/studio/canvas/[projectId]` | **284 kB** | 148 kB |
| `/studio/canvas` | 107 kB | 1.45 kB |
| `.next` artifact dir | **1.6 GB** | dev+prod build cache |

**Baseline note:** Canvas project page is the heaviest user-facing route; cleanup should not regress this without measured bundle audit.

---

## 5. Dependency & security baseline

| Item | Status |
|------|--------|
| Runtime dependencies | 65 |
| Dev dependencies | 15 |
| `npm audit --omit=dev` | **3 high** — all in `sharp` (<0.35.0); fix requires major bump |
| Prisma config deprecation | Warning: `package.json#prisma` deprecated for Prisma 7 |

**Not in scope for cleanup (per owner):** dependency major upgrades unless security-critical with owner approval.

---

## 6. Known warnings (pre-existing, not introduced by this audit)

1. **183 ESLint `@typescript-eslint/no-unused-vars`** — scattered across lib/features/components; cleanup candidates but not blockers.
2. **Prisma 7 config migration warning** — informational.
3. **`npm warn Unknown env config "devdir"`** — local npm config; not repo issue.
4. **`typescript.ignoreBuildErrors: true`** in `next.config.ts` — build passes but TS errors could hide in CI build path; typecheck script is authoritative.
5. **`eslint.ignoreDuringBuilds: true`** — same pattern.
6. **Dual review systems** (Prisma + legacy JSON/MVP) — architectural debt, not a baseline failure.
7. **Client-side credit quote helpers** parallel server pricing — consistency risk, not a build failure.

---

## 7. Key route inventory (protected flows)

### Auth (protected — do not break)

- `/login`, `/auth/callback`, `/auth/alipay/callback`
- `POST /api/auth/email/start`, `POST /api/auth/continue`
- `GET /api/auth/oauth/google`
- Legacy shims: `POST /api/login`, `POST /api/continue`, `POST /api/auth/email/send-code`, `POST /api/auth/demo-social` (410)

### Payments & credits (protected)

- Stripe webhooks: `/api/v1/webhooks/stripe`
- Escrow checkout, deposit, paid revision, credits purchase/checkout/quote/wallet
- Credits ledger/reservation/capture paths in `features/credit-wallet/**`

### Canvas & generation (protected)

- `/studio/canvas/**`, `/api/canvas/**`, `/api/generation/**`, `/api/events/generation`
- Seedance webhook/status, Mureka status

### Order lifecycle (protected)

- Matching, invitation, proposal, review center, settlement — see `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md`

---

## 8. Baseline comparison metrics (for post-cleanup)

Track after each cleanup commit:

| Metric | Baseline (2026-07-24) | Post-cleanup target |
|--------|----------------------:|--------------------|
| Confirmed dead files removed | 0 | TBD after owner approval |
| Dead export symbols removed | 0 | ≥15 low-risk |
| Zero-value wrapper layers merged | 0 | ≥8 |
| ESLint warnings | 183 | ↓ without hiding rules |
| `/studio/canvas/[projectId]` First Load JS | 284 kB | ≤284 kB (no regression) |
| API routes | 210 | ≤210 (no new compat routes) |
| `production:verify` | PASS | PASS |
| Manual regression checklist | Not started | 22 flows |

---

## 9. Rollback baseline

Before any cleanup commit batch:

```bash
git tag cleanup-baseline-20260724 268acff
git push origin cleanup-baseline-20260724
```

Per-commit rollback: `git revert <commit>` or reset branch to tag.  
Database: **no schema changes in cleanup phase** — rollback is code-only.

---

## 10. Audit artifacts (Phase 1)

| Document | Purpose |
|----------|---------|
| `docs/DEAD_CODE_AUDIT.md` | Orphan / zombie code classification |
| `docs/NESTED_CODE_AUDIT.md` | Wrapper & forwarding chains |
| `docs/DUPLICATE_CODE_AUDIT.md` | DRY merge candidates |
| `docs/INTERACTION_FLOW_AUDIT.md` | UX / flow / error surfacing risks |

**Status:** Phase 0 complete. Phase 1 static audit complete. **No deletions executed.**
