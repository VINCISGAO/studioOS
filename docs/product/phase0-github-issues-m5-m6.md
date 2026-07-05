# Phase 0 GitHub Issues — M5 & M6

Copy each block into a new GitHub Issue.  
**Labels:** `phase-0`, `milestone-5` or `milestone-6`, plus area labels.

**Spec refs:** Architect #2 · #3 §6.4 · #4 (Phase 0 §M5–M6) · QA Script Steps 11–15

**Depends on:** M1–M4 complete (see `phase0-github-issues-m1-m2.md`, `phase0-github-issues-m3-m4.md`)

---

# MILESTONE 5 — Production Pipeline + Review

---

## M5.1 — Initialize `production_stages` on Escrow

**Labels:** `phase-0`, `milestone-5`, `area:pipeline`, `priority:p0`

### Context
Seven-stage pipeline auto-created when Escrow clears.

### Spec references
- Architect #2 §8 (ProductionStage state machine)
- Architect #4 §M5.1
- QA Script Step 11

### Scope
- On `order.escrow_paid`: create 7 stages per order:
  `brief → storyboard → rendering → voice → music → qa → delivery`
- `brief` + `storyboard` auto-`done` if pack exists on project
- Store: `order_id`, `stage`, `status`, `due_at`, `artifact_url`, `notes`
- Helper: `getPipelineForOrder(orderId)`, `completeStage(orderId, stage)`

### Out of scope
- Gantt charts
- Automatic due date ML

### Acceptance criteria
- [ ] Pay demo order → 7 rows created exactly once
- [ ] First two stages done when pack seeded
- [ ] `pipeline.initialized` event logged

### Dependencies
- Blocked by: M4.7
- Blocks: M5.2, M5.4

---

## M5.2 — Studio Production Pipeline UI

**Labels:** `phase-0`, `milestone-5`, `area:studio-portal`, `area:pipeline`, `priority:p0`

### Context
Studio sees Linear/Kanban-style production progress.

### Spec references
- Architect #1 UX patterns · #4 §M5.2
- QA Script Step 11

### Scope
- Route: `/studio/projects/[id]/pipeline`
- UI: horizontal stepper or vertical checklist with status chips
- Actions per stage: Start · Mark done · Add artifact URL/notes
- Show contract delivery date + revision policy summary
- Link to Quality Center + Upload deliverable (final stage)

### Out of scope
- Real-time collaboration

### Acceptance criteria
- [ ] Studio can progress rendering → voice → music → qa
- [ ] Completed stages show timestamp + artifact
- [ ] Non-assigned studio blocked (403)

### Dependencies
- Blocked by: M5.1
- Blocks: M5.4

---

## M5.3 — Quality Center gate before deliverable submit

**Labels:** `phase-0`, `milestone-5`, `area:quality`, `priority:p1`

### Context
Deliverables must pass spec check before Brand review.

### Spec references
- Architect #3 §8 (acceptance criteria)
- Existing `video-probe.ts` / Quality Center
- Architect #4 §M5.3

### Scope
- Before `order.deliverable_submitted`: run ffprobe checks vs contract deliverables (resolution, duration, aspect)
- Fail → block submit with actionable errors
- Pass → store `qa_report_json` on deliverable
- UI: Quality tab shows last run results

### Out of scope
- Full automated creative QA

### Acceptance criteria
- [ ] Wrong aspect ratio blocks submit
- [ ] Valid demo MP4 passes
- [ ] QA report visible to Brand in Review metadata

### Dependencies
- Blocked by: M4.1, M5.2
- Blocks: M5.4

---

## M5.4 — Deliverable submit → Project `in_review`

**Labels:** `phase-0`, `milestone-5`, `area:pipeline`, `priority:p0`

### Context
Studio submission moves project to Brand Review Center.

### Spec references
- Architect #2 §7.4, §9 (`order.deliverable_submitted`)
- QA Script Step 12

### Scope
- **Submit for review** on pipeline delivery stage (or dedicated upload page)
- Create `deliverables` v1+ with version increment
- Transitions: order → `review`; project → `in_review`
- Notify Brand (badge on project hub)
- Require `qa` stage = done if M5.3 enabled

### Out of scope
- Multiple parallel deliverable types (one video OK for MVP)

### Acceptance criteria
- [ ] Submit creates deliverable version 1
- [ ] Brand Review tab unlocks
- [ ] Re-submit creates v2 without deleting v1

### Dependencies
- Blocked by: M5.2, M5.3 (soft — can ship without M5.3)
- Blocks: M5.5

---

## M5.5 — Review Center reads `contract.revision_policy`

**Labels:** `phase-0`, `milestone-5`, `area:review`, `priority:p0`

### Context
Show remaining revision rounds from contract, not hardcoded.

### Spec references
- Architect #3 §6.3–§6.4
- Architect #4 §M5.5
- QA Script Step 13.3

### Scope
- Review page loads active contract `revision_policy.included_rounds`
- Display: "2 revision rounds included · X remaining"
- Track `order.revision_rounds_used`
- Minor text tweak flag (optional) — does not decrement

### Out of scope
- Change order for extra rounds

### Acceptance criteria
- [ ] UI shows correct included rounds from contract
- [ ] Comment-only does not decrement (QA 13.4)

### Dependencies
- Blocked by: M4.1, M5.4
- Blocks: M5.6

---

## M5.6 — Request Revision consumes round; block when exhausted

**Labels:** `phase-0`, `milestone-5`, `area:review`, `priority:p0`

### Context
Structured revision enforcement — Frame.io style, not open chat.

### Spec references
- Architect #3 §6.4
- Architect #2 `order.revision_requested`
- QA Script Step 13–14 boundary

### Scope
- **Request Revision** button → structured form (required summary + optional timestamp refs)
- Decrement `revision_rounds_used`; order → `revision`; project → `production`
- When rounds exhausted → block with Change Order message (#3 §13 stub)
- Studio pipeline reopens appropriate stage (default: rendering)

### Out of scope
- Paid extra rounds checkout

### Acceptance criteria
- [ ] 2 rounds contract → 3rd request blocked
- [ ] Revision creates `revision_requests` record
- [ ] After revision, re-submit increments deliverable version

### Dependencies
- Blocked by: M5.5
- Blocks: M5.7

---

## M5.7 — Approve delivery → Escrow release + payout approved

**Labels:** `phase-0`, `milestone-5`, `area:review`, `area:payments`, `priority:p0`

### Context
Brand approval completes project and unlocks Studio payout.

### Spec references
- Architect #2 §7.4, §13.1 steps 14–15
- QA Script Step 14

### Scope
- **Approve delivery** on Review Center
- order: production `completed`, payment `released`, payout `approved`
- project: `delivered` → `completed` (or demo timer auto-release)
- Optional: Brand review modal (rating + comment)
- Trigger escrow release job (demo: immediate)

### Out of scope
- Automated hold period (Phase 1)

### Acceptance criteria
- [ ] QA Step 14 Pass
- [ ] Studio income available balance increases
- [ ] Approve without deliverable blocked

### Dependencies
- Blocked by: M5.6
- Blocks: M5.8 (ordering), Studio income verification

---

## M5.8 — Remove / hide production-period Chat

**Labels:** `phase-0`, `milestone-5`, `area:proposal`, `priority:p0`

### Context
OS principle: no chat during production — only Pipeline + Review.

### Spec references
- Architect #2 communication matrix
- Architect #4 §M5.8
- QA Script R5

### Scope
- Remove chat widgets from:
  - Studio project hub during production
  - Brand project hub during production/review
- Proposal Room remains read-only archive with link to Review
- Guard any global chat/inquiry floating entry points

### Out of scope
- Proposal Room pre-payment (still structured messages)

### Acceptance criteria
- [ ] QA R5 Pass — no chat entry production → completed
- [ ] Review comments still work
- [ ] No regression on Proposal pre-escrow

### Dependencies
- Blocked by: M4.8, M5.4
- Blocks: M6.5

---

## M5.9 — Studio Match Inbox `/studio/matches`

**Labels:** `phase-0`, `milestone-5`, `area:studio-portal`, `area:match`, `priority:p1`

### Context
Studio discovers matching invitations before Proposal.

### Spec references
- Architect #2 §4
- Architect #4 §M5.9
- QA Script Step 7.1–7.2

### Scope
- Route: `/studio/matches`
- List invitations: project title, category, budget range, match score, status
- Actions: View brief summary · Accept · Decline
- Accept → notify Brand (optional) · opens proposal when Brand selects or auto if 1:1 invite flow
- Link from Studio dashboard card "Open briefs"

### Out of scope
- Studio-initiated apply to public projects

### Acceptance criteria
- [ ] Nova sees demo invitation after publish
- [ ] Accept/decline updates invitation status
- [ ] Expired invites hidden or marked expired

### Dependencies
- Blocked by: M3.1
- Blocks: —

---

# MILESTONE 6 — Cleanup + IA Alignment

---

## M6.1 — Landing dual entry CTAs

**Labels:** `phase-0`, `milestone-6`, `area:marketing`, `priority:p1`

### Context
Premium SaaS landing — not marketplace.

### Spec references
- Architect IA §3.1
- Architect #4 §M6.1
- QA Script Step 1.1

### Scope
- Hero CTAs:
  - **I need Ads** → `/brand/projects/new` (or login → wizard)
  - **I want Projects** → `/studio/apply` (stub page OK) or `/login?role=creator`
- Subcopy per product vision doc
- Remove single marketplace-style CTA if redundant

### Out of scope
- Full Studio apply flow (stub copy sufficient)

### Acceptance criteria
- [ ] QA Step 1.1 target state Pass
- [ ] Logged-in users route to correct portal
- [ ] Mobile layout acceptable

### Dependencies
- Blocked by: M2.1
- Blocks: —

---

## M6.2 — Brand nav: Projects as root

**Labels:** `phase-0`, `milestone-6`, `area:brand-portal`, `priority:p1`

### Context
Remove orphaned Brief / marketplace nav items.

### Spec references
- Architect #4 §M6.2, §4 route table

### Scope
- Brand header nav: Projects · Analytics · Assets · Team · Billing
- Primary CTA: New Campaign → `/brand/projects/new`
- Remove links to `/brand/brief/new`, legacy `/start` except redirect

### Out of scope
- Studio nav overhaul (minimal)

### Acceptance criteria
- [ ] No visible Brief route in Brand nav
- [ ] All CTAs reach wizard

### Dependencies
- Blocked by: M2.7
- Blocks: —

---

## M6.3 — Complete legacy redirect table

**Labels:** `phase-0`, `milestone-6`, `area:migration`, `priority:p0`

### Context
No broken bookmarks from MVP.

### Spec references
- Architect #4 §4, §M6.3

### Scope
Implement/verify all redirects:

| Old | New |
|-----|-----|
| `/brand/brief/new` | `/brand/projects/new` |
| `/start` | `/brand/projects/new` |
| `/proposal/[id]` | `/brand/projects/[pid]/proposal` |
| `/inquiries/[id]/chat` | same |
| `/match/[id]` | `/brand/projects/[id]?tab=match` |
| `/dashboard` | `/brand` |
| `/creator/*` | `/studio/*` |
| `/creators` | keep (+ `/studios` alias) |

- Add integration test or checklist script that curls each redirect

### Out of scope
- Delete old route files

### Acceptance criteria
- [ ] All rows return 307/308, not 404
- [ ] Locale query preserved
- [ ] Documented in README internal section

### Dependencies
- Blocked by: M3.3, M4.9
- Blocks: —

---

## M6.4 — Deprecate standalone Studio `#inquiry` → Project flow

**Labels:** `phase-0`, `milestone-6`, `area:migration`, `priority:p1`

### Context
Portfolio discovery OK; inquiry should create Project draft, not orphan thread.

### Spec references
- Architect #4 §M6.4
- Principle: portfolio for discovery, OS for execution

### Scope
- `/studios/[id]#inquiry` form:
  - Logged-out → login as brand → create project draft pre-linked to studio OR create match invitation after mini-brief
  - Logged-in → `projects/new?studio={id}&work={workId}` shortcut prefill
- Mark direct `createInquiry(creator_id)` without project deprecated
- Studio public page copy: "Start a campaign" not "Start chat"

### Out of scope
- Removing public portfolio

### Acceptance criteria
- [ ] Inquiry from studio page creates/links project
- [ ] No new orphan inquiries in store after deploy
- [ ] Portfolio video playback unchanged

### Dependencies
- Blocked by: M3.9, M2.1
- Blocks: —

---

## M6.5 — Terminology sweep (Creator → Studio, etc.)

**Labels:** `phase-0`, `milestone-6`, `area:ux`, `priority:p2`

### Context
Consistent VINCIS vocabulary across UI.

### Spec references
- `lib/studioos/vocabulary.ts`
- Architect #4 §M6.5

### Scope
- Audit UI strings: Creator → Studio, Client → Brand, Quote → Proposal (where appropriate)
- Keep internal code names (`creator_id`) — UI only
- Update EN + ZH locale pairs
- Exclude: database column renames

### Out of scope
- Full i18n framework change

### Acceptance criteria
- [ ] No user-visible "Creator marketplace" on core flows
- [ ] Glossary doc updated in vocabulary.ts comments

### Dependencies
- Blocked by: M5.8 (after copy stable)
- Blocks: —

---

## M6.6 — Wire QA Script to CI smoke (optional)

**Labels:** `phase-0`, `milestone-6`, `area:qa`, `priority:p2`

### Context
Automate critical path slices from `phase0-happy-path-qa-script.md`.

### Spec references
- QA Script §4 (R1–R10)
- Architect #4 §M6.6

### Scope
- Playwright/Cypress smoke (if test stack exists):
  - Brand login
  - Project list loads
  - `/studios` loads
  - Proposal redirect works
- Or: `npm run qa:smoke` manual checklist runner
- Link QA doc in PR template

### Out of scope
- Full 15-step E2E automation (Phase 1)

### Acceptance criteria
- [ ] CI runs smoke on PR to main
- [ ] Fail on 404 for redirect table core routes

### Dependencies
- Blocked by: M6.3
- Blocks: —

---

## M6.7 — Admin: `project_events` debug view

**Labels:** `phase-0`, `milestone-6`, `area:admin`, `priority:p2`

### Context
Support state debugging without reading JSON files.

### Spec references
- Architect #2 §15
- Architect #4 §M6.7

### Scope
- Route: `/admin/projects/[id]/events`
- Table: timestamp, event_name, actor, from/to state, metadata preview
- Link from admin project list
- Filter by entity_type

### Out of scope
- Full audit export

### Acceptance criteria
- [ ] Demo project shows publish + payment + delivery events
- [ ] Admin-only guard

### Dependencies
- Blocked by: M1.3
- Blocks: —

---

# Phase 0 Go/No-Go issue (Epic)

## EPIC — Phase 0 Complete · Go/No-Go

**Labels:** `phase-0`, `epic`, `priority:p0`

### Acceptance criteria (from Architect #4 §8)
- [ ] M1–M6 issues closed or N/A documented
- [ ] QA Script §4 R1–R10 Pass (or N/A marked)
- [ ] 15-step demo rehearsed ≤35 min
- [ ] Redirect table verified (M6.3)
- [ ] No P0 open bugs on happy path

### Dependencies
- Blocked by: all M5.7, M6.3, M4.9, M5.8

---

# Suggested GitHub Milestones

| Milestone | Issues |
|-----------|--------|
| **Phase 0 — M5 Pipeline + Review** | M5.1 – M5.9 |
| **Phase 0 — M6 Cleanup** | M6.1 – M6.7 + EPIC |

---

# M5–M6 Dependency graph

```
M4.7 ─ M5.1 ─ M5.2 ─ M5.4 ─ M5.5 ─ M5.6 ─ M5.7
         │       │
         │       └ M5.3
         │
M3.1 ─ M5.9

M4.8 ─ M5.8 ─ M6.5
M5.7 ─ (Studio income QA)

M2.7 ─ M6.2
M3.3, M4.9 ─ M6.3
M3.9, M2.1 ─ M6.4
M6.3 ─ M6.6
M1.3 ─ M6.7

All ─ EPIC Go/No-Go
```

---

# Full Phase 0 issue count

| Milestone | Issues |
|-----------|--------|
| M1 | 6 |
| M2 | 8 |
| M3 | 9 |
| M4 | 9 |
| M5 | 9 |
| M6 | 7 + 1 Epic |
| **Total** | **49** |

---

# Bulk labels (add to prior sets)

```bash
gh label create "milestone-5" --color "5319E7"
gh label create "milestone-6" --color "1D76DB"
gh label create "area:pipeline" --color "C2E0C6"
gh label create "area:review" --color "FBCA04"
gh label create "area:quality" --color "BFDADC"
gh label create "area:marketing" --color "E99695"
gh label create "area:admin" --color "000000"
gh label create "area:qa" --color "FEF2C0"
gh label create "epic" --color "3E4B9E"
```

---

# Suggested sprint mapping (recap)

| Sprint | Milestones | Demo |
|--------|------------|------|
| S1 | M1 + M2 | Publish project |
| S2 | M3 + M4 | Match → Contract → Pay |
| S3 | M5 + M6 | Produce → Review → Complete |
