# VINCIS Infinite Canvas v1.0 — Acceptance Record

**Date:** 2026-07-24  
**Branch:** `main` @ `732234c` (`ahead 18` of `origin/main`)  
**Architecture optimization:** FROZEN after RC approval (production bugs only)

---

## Gate conclusions (split — do not merge)

| Gate | Result | Exit / notes |
|------|--------|----------------|
| **Infinite Canvas v1.0 automated gate** | **PASS** | Canvas-related `production:verify` steps green |
| **Global production verify** | **BLOCKED** | Exit code **1** — not “all green” |
| **Canvas-related failure** | **NONE** | No canvas step failed |

### Global blocker (separate track — not canvas)

| Item | Detail |
|------|--------|
| **ID** | Global RC blocker — Deposit reconciliation concurrency |
| **Step** | `deposit.reconcile.verify` |
| **Failure** | `FAIL reconcile.concurrent-single-ledger ledger=1, dupA=true, dupB=false` |
| **Scope** | Deposit / ledger idempotency under concurrency — may affect site-wide payment safety |
| **Canvas action** | **Do not mix into canvas fixes.** Track and fix on deposit track. |

**Important:** Canvas RC can be approved while **Global VINCIS v1.0 RC** remains blocked until deposit reconcile passes.

---

## Release status

| Product | Status |
|---------|--------|
| **VINCIS Infinite Canvas v1.0** | ACCEPTANCE IN PROGRESS → RC when checklist below complete |
| **VINCIS Global v1.0** | BLOCKED by deposit reconcile |
| **Architecture optimization (canvas)** | COMPLETE — FROZEN pending RC sign-off |
| **Further canvas features** | v1.1 only (P3 frozen) |

---

## RC approval checklist (all required for Canvas RC)

| # | Criterion | Owner | Status |
|---|-----------|-------|--------|
| 1 | Canvas automated gate pass | Agent | ✅ |
| 2 | 20 / 100 / 300 node manual perf | Owner | ☐ |
| 3 | Drag + autosave hard rules | Owner | ☐ |
| 4 | Desktop / iPad / Mobile — no visual regression | Owner | ☐ |
| 5 | Off-screen video → return — acceptable | Owner | ☐ |
| 6 | Refresh reconcile — no duplicate nodes | Owner | ☐ |
| 7 | Real image / video / music generation E2E | Owner | ☐ |
| 8 | Credits single charge + failure refund correct | Owner | ☐ |
| 9 | Git 18-commit scope reviewed before push | Owner | ☐ |
| 10 | Vercel production smoke after deploy | Owner | ☐ |

When **all ☐ → ✅**, set:

```
VINCIS Infinite Canvas v1.0
Status: RELEASE CANDIDATE APPROVED
Architecture optimization: FROZEN
Further feature work: v1.1
```

---

## 1. Production verify (automated — done)

**Command:** `npm run production:verify` · **Neon:** connected · **Date:** 2026-07-24

Canvas-relevant: typecheck, lint, build, migrate, login.preflight, canvas:ai-models, credits:*, video-engine:sprint-c, creator-lifecycle, sprint1 — **all ✅**

---

## 2. Manual performance (owner — no fake numbers)

**Goal:** No obvious regression — not chasing pretty FPS.

### Minimum table

| Scenario | FPS | React commits | Autosave POST | Result |
|----------|-----|---------------|---------------|--------|
| 20 nodes pan/zoom | | | expect **0** on pan/zoom | ☐ |
| 100 nodes pan/zoom | | | expect **0** on pan/zoom | ☐ |
| 300 nodes pan/zoom | | | expect **0** on pan/zoom | ☐ |
| Single-node drag 3s | | | **0 during drag**, ≤1 after release | ☐ |
| Multi-node drag 3s | | | **0 during drag**, ≤1 after release | ☐ |

### Hard rules (must pass)

| Rule | Expected |
|------|----------|
| Revision during drag | Does **not** increase every pointermove |
| After drag release | At most **one** dirty → one save |
| Pan/zoom only | Autosave POST = **0** |

### FPS judgment (qualitative)

| Scale | Expectation |
|-------|-------------|
| 20 nodes | Basically stable |
| 100 nodes | Usable editing, no severe jank |
| 300 nodes | May drop — must not freeze, crash, or stay unresponsive |

Protocol detail: [`INFINITE_CANVAS_PERF_RESULTS.md`](./INFINITE_CANVAS_PERF_RESULTS.md)

---

## 3. Visual & device (owner)

Devices: **Desktop · iPad · Mobile**

Confirm (not screenshot volume):

- ☐ UI unchanged (layout, fonts, colors, card chrome)
- ☐ Node size / position stable — no drift
- ☐ No flicker; video no abnormal reload
- ☐ Loading nodes OK when off-screen (`onlyRenderVisibleElements`)
- ☐ Off-screen video returns and is usable
- ☐ Multi-select + drag behave correctly

### `onlyRenderVisibleElements` — mandatory path

1. Play video  
2. Pan off viewport  
3. Pan back  
4. ☐ Progress / cover / controls acceptable — no broken state  

---

## 4. Real business E2E (owner)

```
Credits top-up
→ image job
→ video job
→ music job
→ parallel multi-job
→ refresh mid-flight
→ reopen canvas
→ wait for all terminal states
→ reopen project
```

| Check | ☐ |
|-------|---|
| One result node per job | |
| No duplicate loading nodes | |
| No duplicate result nodes | |
| One charge per job | |
| Failed job: refund / release reserved credits | |
| Refresh restores in-progress jobs | |
| Multiple refresh: no loading spam | |
| Two tabs: no duplicate spawn | |
| Re-enter project: nodes persist | |

---

## 5. Git scope audit (before `git push`)

**State:** `main...origin/main [ahead 18]` @ `732234c`

**Untracked (not in 18 commits — do not push accidentally):**

- `docs/INFINITE_CANVAS_V1_ACCEPTANCE.md` (this file — commit separately if desired)
- `public/images/home-hero-space*.png`, `login-space-bg.png` (local untracked restores)

### Commits ahead of origin (canvas perf + merge)

```
732234c fix(canvas): allow dragging ready video nodes
45ae4fa merge: restore cleanup/auth-legacy canvas and auth work onto main
8c31c26 … 97257a1  (10 canvas architecture commits)
```

### Diff scope vs `origin/main` (161 files — **not canvas-only**)

| Area | Files | Push review |
|------|-------|-------------|
| Canvas perf + reconcile + memo | ~25 | ✅ Intended |
| Generation panel / Seedance (merge) | ~17 | ✅ Owner-approved branch work |
| Auth cleanup (merge) | ~15 | ⚠️ Review — not canvas-only |
| Creator lifecycle + Prisma migrations | ~15 | ⚠️ Review — schema change |
| Video engine sprint C (merge) | ~12 | ⚠️ Review |
| Docs / audit | ~12 | ✅ OK |
| Marketing (`landing-recent-work`, showcase modal) | 2 | ⚠️ **Homepage stack — verify owner intent** |
| Deleted `public/images/home-hero-space*` in tree | 3 | ⚠️ Merge deleted; local untracked copies exist |

**Not found in diff:** `.env`, `tmp/`, debug dumps, perf capture binaries.

**Push recommendation:** Do **not** push all 18 commits as “canvas only.” Treat as **multi-track batch** (canvas RC + auth + creator lifecycle + generation UI). Owner must explicitly accept non-canvas files before push.

### Pre-push commands

```bash
git status
git log --oneline --decorate -25
git diff origin/main...HEAD --stat
git diff origin/main...HEAD --name-only
```

---

## Post–Canvas RC (when checklist complete)

1. Owner approves git scope  
2. `git push origin main`  
3. Vercel: login → canvas → small real generation → refresh → credits → reopen  
4. Update status block in this file + `INFINITE_CANVAS_PERF_RESULTS.md`  
5. **Freeze canvas architecture** — only production bugs afterward  
6. **Separately:** fix Global RC blocker `deposit.reconcile.verify`

---

## Related docs

- [`INFINITE_CANVAS_PERF_RESULTS.md`](./INFINITE_CANVAS_PERF_RESULTS.md)
- [`INFINITE_CANVAS_AUDIT.md`](./INFINITE_CANVAS_AUDIT.md)
- [`INFINITE_CANVAS_GAP_ANALYSIS.md`](./INFINITE_CANVAS_GAP_ANALYSIS.md)
