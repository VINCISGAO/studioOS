# Phase 0 GitHub Issues — M3 & M4

Copy each block into a new GitHub Issue.  
**Labels:** `phase-0`, `milestone-3` or `milestone-4`, plus area labels.

**Spec refs:** Architect #2 (State machine) · #3 (Proposal → Contract) · #4 (Phase 0 §M3–M4)

**Depends on:** M1 Foundation + M2 Wizard (see `phase0-github-issues-m1-m2.md`)

---

# MILESTONE 3 — Match + Structured Proposal

---

## M3.1 — AI Match: `match_invitations` + Top 5 UI

**Labels:** `phase-0`, `milestone-3`, `area:match`, `priority:p0`

### Context
After Publish, Brand sees Top 5 Studios with match scores — invite-only, not open bidding.

### Spec references
- Architect #2 §4 (MatchInvitation state machine)
- Architect #4 §M3.1
- QA Script Step 5

### Scope
- Store: `match_invitations` with `project_id`, `studio_id`, `match_score`, `score_breakdown_json`, `status`
- Rule-based scorer (Phase 0): industry, style_presets, budget_range, category, studio.rating, delivery_speed, availability stub
- Job triggered on `project.publish` → create up to 5 invitations (`pending`)
- UI: Project Hub **Match tab** — cards with score, specialties, CTA View / Select
- Expire invitations after 72h (`match.invite_expired` event) — cron or on-read

### Out of scope
- ML model
- Studio auto-decline

### Acceptance criteria
- [ ] Publish creates 1–5 invitations for approved studios only
- [ ] Match tab shows score + breakdown accordion
- [ ] Demo project `proj_demo_arc_nova` includes Nova in list
- [ ] `project_events` logs `match.invite_created`

### Dependencies
- Blocked by: M2.6, M1.6
- Blocks: M3.2, M5.9

---

## M3.2 — `project.studio_selected` + single-winner logic

**Labels:** `phase-0`, `milestone-3`, `area:match`, `priority:p0`

### Context
Brand picks exactly one Studio; others are declined.

### Spec references
- Architect #2 §3.3 (`project.studio_selected`), §4 (`match.invite_won`)
- Architect #4 §M3.2

### Scope
- Match tab **Select studio** → confirm modal
- Transition: `matching` → `studio_selected` → auto `proposal` (via `project.proposal_opened`)
- Set winning invitation `won`; others `declined`
- Store `projects.selected_studio_id`
- Notify Studio (in-app badge OK for Phase 0)

### Out of scope
- Multi-studio parallel production

### Acceptance criteria
- [ ] Only one `won` invitation per project
- [ ] Re-select blocked after studio_selected
- [ ] Status badges update on Brand + Studio dashboards
- [ ] Invalid transition from `draft` rejected

### Dependencies
- Blocked by: M3.1
- Blocks: M3.3, M3.4

---

## M3.3 — Migrate Proposal routes under Project

**Labels:** `phase-0`, `milestone-3`, `area:migration`, `priority:p0`

### Context
Proposal Room lives under Project Hub, not orphan `/proposal/[id]`.

### Spec references
- Architect #4 §4 (route table), §M3.3
- QA Script Step 7

### Scope
- New routes:
  - `/brand/projects/[id]/proposal`
  - `/studio/projects/[id]/proposal`
- Redirects:
  - `/proposal/[id]` → resolve inquiry/project → new URL
  - `/inquiries/[id]/chat` → same
  - `/match/[id]` → `/brand/projects/[id]?tab=match`
- Proposal thread must have `project_id` (required)
- Update all internal links (dashboard, match, notifications)

### Out of scope
- Delete old route files (301 only)

### Acceptance criteria
- [ ] Old bookmark URLs redirect without 404
- [ ] Brand + Studio open same thread via project routes
- [ ] Locale param preserved on redirect

### Dependencies
- Blocked by: M3.2, M1.4
- Blocks: M3.4

---

## M3.4 — Structured Proposal Composer

**Labels:** `phase-0`, `milestone-3`, `area:proposal`, `priority:p0`

### Context
Replace free-form chat-first UX with structured tabs that map to Contract fields.

### Spec references
- Architect #3 §4, §14 (Composer tabs)
- Architect #4 §M3.4

### Scope
- Composer tabs: **Budget · Timeline · Deliverables · Revisions · Reference · Note**
- Each structured tab writes `proposal_messages` with `kind` + `structured_json` per #3
- **Note** tab = plain text (contact filter still applies)
- Reference tab = existing reference upload behavior
- UI shows structured summary cards in thread (not raw JSON)
- Default tab on open: Budget (Studio) / read-only summary (Brand)

### Out of scope
- Contract generation
- Removing Note tab entirely

### Acceptance criteria
- [ ] Budget message stores `total_usd`, `breakdown[]`, `currency`
- [ ] Timeline message stores `delivery_date`, `milestones[]`
- [ ] Deliverables message stores `items[]` per #3 §5.2
- [ ] Revision message stores `included_rounds`, `scope`
- [ ] Thread renders each kind with distinct card layout

### Dependencies
- Blocked by: M3.3
- Blocks: M3.5, M4.2

---

## M3.5 — Dual-confirm on structured messages

**Labels:** `phase-0`, `milestone-3`, `area:proposal`, `priority:p0`

### Context
Both parties must confirm budget/timeline/deliverables/revisions before Accept Proposal.

### Spec references
- Architect #3 §8.1, §9.1 (validation checklist)
- Architect #4 §M3.5

### Scope
- `structured_json.confirmed_by_brand` / `confirmed_by_studio` booleans
- **Confirm** button visible to counterparty only
- Sender auto-set `confirmed_by_{sender}=true` on send
- Visual: ✓ Brand · ✓ Studio badges on message card
- Helper: `isProposalReadyForAccept(projectId)` checks four kinds dual-confirmed (or revision uses platform default)

### Out of scope
- E-signature

### Acceptance criteria
- [ ] Brand cannot confirm own sent message (only counterparty)
- [ ] Accept Proposal disabled until checklist fails with specific missing items
- [ ] Confirm state persists on refresh

### Dependencies
- Blocked by: M3.4
- Blocks: M4.2

---

## M3.6 — Retain Live Pitch + Reference in new Composer

**Labels:** `phase-0`, `milestone-3`, `area:proposal`, `priority:p1`

### Context
Preserve existing differentiators inside structured Proposal Room.

### Spec references
- Architect #3 §12
- Architect #4 §M3.6

### Scope
- Live Pitch: Studio uploads ≤60s video URL → `kind=live_pitch`
- Reference: file/URL → `kind=reference` (no confirm required)
- Pitch appears in thread + Contract attachment index (#3 §11)
- Existing `live-pitch-form.tsx` / actions wired to new routes

### Out of scope
- File upload hosting (URL OK)

### Acceptance criteria
- [ ] Live Pitch playable inline in thread
- [ ] Reference messages do not block Accept
- [ ] Pitch visible on Brand side after Studio upload

### Dependencies
- Blocked by: M3.4
- Blocks: —

---

## M3.7 — Contact filter in structured messages

**Labels:** `phase-0`, `milestone-3`, `area:proposal`, `priority:p1`

### Context
Block off-platform contact until escrow (existing feature, ensure works on new message types).

### Spec references
- Architect #3 §12 (contact filter)
- Existing `contact-filter.ts`

### Scope
- Apply filter on `kind=text` (Note tab) and any free-text fields
- Filtered messages: store with flag; show platform notice in UI
- Proposal open + unpaid: block WeChat/Telegram/email/phone patterns
- Unit tests for filter on Note tab

### Out of scope
- Post-escrow contact policy (Phase 1)

### Acceptance criteria
- [ ] QA Script Step 7.11 passes on new Composer
- [ ] Structured JSON fields not scanned incorrectly (only human text)
- [ ] Filtered message not counted toward contract

### Dependencies
- Blocked by: M3.4
- Blocks: —

---

## M3.8 — Proposal lock hook (pre-Escrow)

**Labels:** `phase-0`, `milestone-3`, `area:proposal`, `priority:p1`

### Context
Prepare Proposal thread lock semantics; full lock on escrow in M4.8.

### Spec references
- Architect #2 §5 (ProposalThread states)
- Architect #4 §M3.8

### Scope
- Add `proposal_threads.status`: `open | locked | converted | archived`
- `isProposalChatLocked(threadId)` reads order payment state
- UI: when locked → read-only banner + link to Review/Production
- Disable Composer when locked

### Out of scope
- Escrow webhook (M4.7)

### Acceptance criteria
- [ ] Helper returns locked=true when order.payment_status=escrowed
- [ ] Composer hidden/disabled when locked
- [ ] Manual test with seed escrowed order

### Dependencies
- Blocked by: M3.3
- Blocks: M4.8

---

## M3.9 — Migrate legacy Inquiries → Proposal threads

**Labels:** `phase-0`, `milestone-3`, `area:migration`, `priority:p0`

### Context
One-time migration + adapter so old demo data works with Project routes.

### Spec references
- Architect #4 §5 (data migration order), §M3.9

### Scope
- Script: for each `inquiry` without `project_id`, create or link project stub
- Create `proposal_thread` if missing; map messages to `proposal_messages` kinds (best-effort: text → note)
- Preserve `legacy_inquiry_id` on thread
- New inquiries: reject create without `project_id`

### Out of scope
- Perfect reconstruction of structured messages from old chat

### Acceptance criteria
- [ ] Seed inquiries open via `/brand/projects/[id]/proposal`
- [ ] No orphaned `/proposal/[id]` without redirect target
- [ ] Migration idempotent (safe to run twice)

### Dependencies
- Blocked by: M1.4, M3.3
- Blocks: M6.4

---

# MILESTONE 4 — Contract + Escrow Gateway

---

## M4.1 — `contracts` entity + merge Brief and Proposal

**Labels:** `phase-0`, `milestone-4`, `area:contract`, `priority:p0`

### Context
Auto-generate contract JSON from Creative Pack snapshot + confirmed Proposal messages.

### Spec references
- Architect #3 §3–§5, §9.2, §11 (attachments)
- Architect #4 §M4.1

### Scope
- Store: `contracts` with `project_id`, `proposal_thread_id`, `content_json`, `source_map`, status enum
- Generator: `generateContract(projectId)` implementing #3 mapping table
- Snapshot brief + pack at generation time (immutable)
- Default revision policy when no confirmed revision message (#3 §6.1)
- Default deliverables from pack when no deliverable message (#3 §5.4)

### Out of scope
- PDF rendering (M4.3 can be HTML preview first)

### Acceptance criteria
- [ ] `content_json` contains commercial, timeline, deliverables, revision_policy
- [ ] `source_map` points to message IDs for budget/timeline
- [ ] platform_fee = 20%; studio_payout calculated

### Dependencies
- Blocked by: M3.5, M2.5
- Blocks: M4.2, M4.3

---

## M4.2 — Accept Proposal validation gateway

**Labels:** `phase-0`, `milestone-4`, `area:contract`, `priority:p0`

### Context
Brand Accept triggers contract generation only when #3 §9.1 checklist passes.

### Spec references
- Architect #3 §9.1
- Architect #2 `proposal.accepted_by_brand`
- Architect #4 §M4.2

### Scope
- Replace/direct Accept Proposal button through gateway
- Validate: dual-confirmed budget, timeline, deliverables; studio approved; project=proposal
- On success: `generateContract()` → `contract.status=brand_pending` → project `contract_pending`
- On failure: inline checklist UI (missing budget confirm, etc.)

### Out of scope
- Studio sign

### Acceptance criteria
- [ ] QA Script Step 8.1 blocked state passes
- [ ] Step 8.2–8.3 pass when confirmed
- [ ] `proposal.accepted_by_brand` event logged

### Dependencies
- Blocked by: M4.1, M3.5
- Blocks: M4.3

---

## M4.3 — Contract Review page + Brand sign

**Labels:** `phase-0`, `milestone-4`, `area:contract`, `area:brand-portal`, `priority:p0`

### Context
Brand reviews full agreement and confirms.

### Spec references
- Architect #3 §10.1–§10.2
- Architect #2 `contract.brand_confirmed`
- QA Script Step 9.1

### Scope
- Route: `/brand/projects/[id]/contract`
- UI: scrollable contract sections + summary sidebar
- **Confirm & Sign** → `brand_confirmed_at`, status → `studio_pending`
- Unlock Project Hub Contract tab when `contract_pending`
- Request amendment → supersede + return to proposal (stub OK)

### Out of scope
- DocuSign

### Acceptance criteria
- [ ] Brand sign without Studio sign → project stays `contract_pending`
- [ ] Signed timestamp visible
- [ ] Contract tab locked before accept proposal

### Dependencies
- Blocked by: M4.2
- Blocks: M4.4

---

## M4.4 — Studio Contract sign

**Labels:** `phase-0`, `milestone-4`, `area:contract`, `area:studio-portal`, `priority:p0`

### Context
Studio must sign after Brand before payment.

### Spec references
- Architect #3 §10.2
- Architect #2 `contract.studio_confirmed`
- QA Script Step 9.2–9.3

### Scope
- Route: `/studio/projects/[id]/contract`
- Notification: badge on Studio dashboard when `studio_pending`
- **Confirm & Sign** → `studio_confirmed_at`, `fully_signed`
- Transition project → `payment_pending`

### Out of scope
- Email notifications

### Acceptance criteria
- [ ] Studio cannot pay (no checkout on studio side)
- [ ] Both signed → Brand sees Checkout CTA
- [ ] Either party unsigned → Escrow blocked

### Dependencies
- Blocked by: M4.3
- Blocks: M4.5, M4.6

---

## M4.5 — Post-sign state: `payment_pending` + tab unlock rules

**Labels:** `phase-0`, `milestone-4`, `area:state-machine`, `priority:p1`

### Context
Wire Contract completion to Project Hub navigation.

### Spec references
- Architect #2 §16
- Architect #4 §M4.5

### Scope
- On `fully_signed`: unlock Checkout tab; lock Proposal composer
- Project Hub tab guards updated for Brand + Studio
- Display payment deadline optional (7 days)

### Out of scope
- Auto-cancel on timeout (Phase 1)

### Acceptance criteria
- [ ] QA Script Step 9.5 — Production tab locked before pay
- [ ] Checkout tab visible after dual sign

### Dependencies
- Blocked by: M4.4
- Blocks: M4.6

---

## M4.6 — Checkout bound to `contract.content_json.commercial.total_usd`

**Labels:** `phase-0`, `milestone-4`, `area:payments`, `priority:p0`

### Context
Escrow amount must exactly match contract — no drift from old quote objects.

### Spec references
- Architect #3 §8.3–§8.4
- QA Script Step 10.1

### Scope
- Checkout reads active contract for project
- `order.amount === contract.total_usd` enforced on create
- Display line item: project title + contract id
- Block checkout if no `fully_signed` contract

### Out of scope
- Multi-currency

### Acceptance criteria
- [ ] Mismatch contract vs checkout throws / blocks
- [ ] Demo pay completes with correct amount
- [ ] Order linked to `project_id` + `contract_id`

### Dependencies
- Blocked by: M4.4
- Blocks: M4.7

---

## M4.7 — Escrow webhook → single `order.escrow_paid` entry

**Labels:** `phase-0`, `milestone-4`, `area:payments`, `priority:p0`

### Context
One canonical path from payment to production.

### Spec references
- Architect #2 §7.4 (`order.escrow_paid`), §10
- Architect #4 §M4.7
- QA Script Step 10.2–10.3

### Scope
- Stripe webhook / demo pay → `markOrderPaid` refactored to emit `order.escrow_paid`
- Transitions: project → `production`; order production → `in_production`; payment → `escrowed`
- Initialize production stages (hook for M5.1)
- Proposal thread → `locked`

### Out of scope
- Real Stripe production keys

### Acceptance criteria
- [ ] Pay once → no duplicate production init
- [ ] `project_events` audit trail complete
- [ ] QA Step 10 passes end-to-end

### Dependencies
- Blocked by: M4.6
- Blocks: M4.8, M5.1

---

## M4.8 — Enforce Proposal lock after Escrow

**Labels:** `phase-0`, `milestone-4`, `area:proposal`, `priority:p0`

### Context
Hard enforcement — no messages after payment.

### Spec references
- Architect #2 §5, §13.1 step 10
- Architect #4 §M4.8
- QA Script Step 10.4

### Scope
- Server-side reject `addMessage` when thread locked
- API returns 403 + reason
- UI read-only archive mode
- Banner: "Production started — use Review Center for feedback"

### Out of scope
- Chat elsewhere

### Acceptance criteria
- [ ] POST message to locked thread fails server-side (not just UI hide)
- [ ] QA Step 10.4 Pass

### Dependencies
- Blocked by: M4.7, M3.8
- Blocks: M5.8

---

## M4.9 — Remove legacy Accept → Order without Contract

**Labels:** `phase-0`, `milestone-4`, `area:migration`, `priority:p0`

### Context
Prevent dual code paths; all accepts go through Contract.

### Spec references
- Architect #4 §M4.9, §17 (MVP gap)

### Scope
- Feature flag or delete direct `acceptQuoteAction` → order without contract
- Redirect legacy flows to Contract gateway with migration message
- Update QA downgrade doc if needed

### Out of scope
- Admin override

### Acceptance criteria
- [ ] Grep codebase: no production path creates order skipping contract
- [ ] Old demo flow updated in seed data
- [ ] Regression: M3 happy path still works

### Dependencies
- Blocked by: M4.7
- Blocks: M6.3

---

# Suggested GitHub Milestones

| Milestone | Issues |
|-----------|--------|
| **Phase 0 — M3 Match + Proposal** | M3.1 – M3.9 |
| **Phase 0 — M4 Contract + Escrow** | M4.1 – M4.9 |

---

# M3–M4 Dependency graph

```
M2.6 ─ M3.1 ─ M3.2 ─ M3.3 ─ M3.4 ─ M3.5 ─ M4.1 ─ M4.2 ─ M4.3 ─ M4.4 ─ M4.5
                  │              │                              │
                  │              ├ M3.6, M3.7                   M4.6 ─ M4.7 ─ M4.8
                  │              │
M1.4 ─ M3.9 ──────┘              M3.8 ────────────────────────────────┘
                                 │
                                 └─ M4.9 (after M4.7)
```

---

# Bulk labels (add to M1 set)

```bash
gh label create "milestone-3" --color "006B75"
gh label create "milestone-4" --color "D93F0B"
gh label create "area:match" --color "BFD4F2"
gh label create "area:proposal" --color "F9D0C4"
gh label create "area:contract" --color "E4E669"
gh label create "area:payments" --color "FEF2C0"
```
