# VINCIS Infinite Canvas — Performance Results

**Date:** 2026-07-24  
**Baseline commit (pre-optimization):** `1857b5d`  
**Optimized commit range:** `97257a1` … `732234c`  
**Acceptance tracker:** [`INFINITE_CANVAS_V1_ACCEPTANCE.md`](./INFINITE_CANVAS_V1_ACCEPTANCE.md)

---

## Engineering principle (v1.0 lock)

> **Infinite Canvas optimizations must not increase architectural complexity.**  
> Prefer a 5% slower simple path over extra wrappers, duplicate stores, or nested hooks.  
> Each change = one problem, one commit, one rollback.

---

## How to measure (required for sign-off)

### Environment
- Chrome latest, `/studio/canvas/[projectId]`
- Disable CPU throttling for baseline; repeat with **4× slowdown** for drag stress
- DevTools → Performance → Record 5s while action runs
- React DevTools → Profiler → record same action

### Scenarios
1. Empty canvas pan/zoom  
2. 20 mixed nodes (image + video ready) — pan  
3. 100 duplicate image nodes — pan + single-node drag  
4. Drag one node 3s fast  
5. Multi-select marquee 10 nodes  

### Metrics to capture

| Metric | Tool |
|--------|------|
| FPS (avg / min) | Performance panel → Frames |
| React commits / interaction | Profiler → commit count |
| Autosave POST count / 10s drag | Network filter `autosave` |
| `revision++` during drag | Temporarily log `onNodesChange` dirty (dev only) |
| Heap after 10 min | Memory → heap snapshot delta |

---

## Results template (fill after manual run)

| Scenario | Metric | Before (`1857b5d`) | After (`6f8f938`) |
|----------|--------|-------------------|-------------------|
| 20 nodes pan | Avg FPS | _TBD_ | _TBD_ |
| 20 nodes pan | Min FPS | _TBD_ | _TBD_ |
| 100 nodes pan | Avg FPS | _TBD_ | _TBD_ |
| 100 nodes pan | Min FPS | _TBD_ | _TBD_ |
| Drag 3s | React commits | _TBD_ | _TBD_ |
| Drag 3s | Autosave requests | _TBD_ | **Expected: 0 during drag, 1 after** |
| Drag 3s | revision bumps / pointermove | _TBD_ | **Expected: 0 during drag, 1 on release** |
| Zoom/pan 10s | Autosave requests | _TBD_ | **Expected: 0** |

---

## Code-level expected improvements (implemented)

| Change | Expected effect |
|--------|-----------------|
| `React.memo` + render key | Unchanged nodes skip re-render when another node updates |
| Drag `revision` skip | No autosave/debounce churn during pointermove |
| Viewport not dirty | Pan/zoom never triggers autosave alone |
| `onlyRenderVisibleElements` | Off-screen DOM + video decoders removed |
| SSE dedupe + reconcile | Correctness; prevents duplicate terminal side effects |
| Spawn overlap | Fewer stacked loading cards (position only, no UI change) |

---

## Automated verification (2026-07-24 session)

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass (inside production:verify) |
| `npm run lint` | ✅ Pass |
| `npm run production:verify` | ⚠️ **29/30 steps pass** — see below |

### production:verify detail (Neon connected)

- ✅ Database: `DATABASE_URL` → Neon pooler OK  
- ✅ `prisma migrate deploy` / `migrate status` OK  
- ✅ `canvas:ai-models:verify` OK  
- ✅ `login.preflight` OK  
- ✅ All credits pricing / workflow verifies OK  
- ❌ `deposit.reconcile.verify` — `reconcile.concurrent-single-ledger` (deposit module, not canvas)

Canvas v1.0 automated gate: **PASS**. Full suite exit code 1 due to deposit reconcile only.

Perf FPS / commits / autosave counts: **owner manual** — fill results table above; do not estimate.

---

## UI regression

Static visual parity required. Compare screenshots at Desktop / iPad widths before merge to production.

**Allowed diffs:** smoother motion, lower latency, correct loading recovery after refresh.  
**Forbidden:** layout, className, colors, typography, panel chrome changes.

---

## v1.0 status

| Scope | Status |
|-------|--------|
| **Infinite Canvas v1.0 automated gate** | **PASS** |
| **Global `production:verify`** | **BLOCKED** — `deposit.reconcile.verify` (Global RC blocker — Deposit reconciliation concurrency) |
| **Canvas-related verify failure** | **NONE** |
| **Manual perf / visual / business** | Owner checklist — [`INFINITE_CANVAS_V1_ACCEPTANCE.md`](./INFINITE_CANVAS_V1_ACCEPTANCE.md) |
| **Architecture optimization** | COMPLETE — **FROZEN** after Canvas RC approval |
| **Further canvas work** | v1.1 only (P3 frozen) |

Canvas RC approval ≠ Global VINCIS v1.0 RC approval.
