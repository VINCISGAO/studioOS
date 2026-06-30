# Phase 0 GitHub Issues — M1 & M2

Copy each block into a new GitHub Issue.  
**Labels:** `phase-0`, `milestone-1` or `milestone-2`, plus area labels.

**Spec refs:** Product Architect #1 (Wizard), #2 (State machine), #4 (Phase 0 checklist)

---

## Issue Template (reuse for all)

```markdown
## Context
<!-- Paste from issue below -->

## Spec references
- 

## Scope
- 

## Out of scope
- 

## Acceptance criteria
- [ ] 

## Dependencies
- Blocked by: #
- Blocks: #

## Engineering notes
- Write `project_events` on every status change
- Do not remove legacy redirects until M6
```

---

# MILESTONE 1 — Foundation

---

## M1.1 — Define `projects` entity schema

**Labels:** `phase-0`, `milestone-1`, `area:schema`, `priority:p0`

### Context
Introduce `projects` as the single source of truth for Brand campaigns. All Orders, Proposals, and Contracts will attach to `project_id`.

### Spec references
- Architect #1 §1.3 (global header fields), §8 (data write sequence)
- Architect #4 §M1.1

### Scope
- Add TypeScript types / store schema for `projects` with fields:
  - Identity: `id`, `org_id`, `created_by`, `title`
  - Wizard: `wizard_step`, `wizard_completed_steps[]`, `status`
  - Step 1: `product_url`, `product_name`, `commercial_objective`, `category`, `target_market`, `target_audience`
  - Step 4: `style_presets[]`, `video_lengths[]`, `aspect_ratios[]`, `output_quantity`, `budget_range`, `budget_min`, `budget_max`, `deadline`
  - Meta: `published_at`, `visibility`, `settings_json`, `created_at`, `updated_at`
- Align field names with #1 Field Spec (Steps 1, 4, 6)
- If using file store: `.data/project-store.json`; if Supabase: migration draft matching same shape

### Out of scope
- Wizard UI
- Migration of legacy inquiries

### Acceptance criteria
- [ ] `projects` type exported and documented in one file
- [ ] CRUD helpers: `createProject`, `getProject`, `updateProject`, `listProjectsForOrg`
- [ ] New project defaults: `status=draft`, `wizard_step=1`
- [ ] Schema review checklist in PR description mapping fields to #1

### Dependencies
- Blocked by: —
- Blocks: M1.2, M1.4, M2.1

---

## M1.2 — Implement `projects.status` state machine

**Labels:** `phase-0`, `milestone-1`, `area:state-machine`, `priority:p0`

### Context
Unified lifecycle for Brand-facing project stages. All route guards and tabs read this status.

### Spec references
- Architect #2 §3 (Project state machine + event table)
- Architect #4 §M1.2

### Scope
- Implement status enum: `draft`, `matching`, `studio_selected`, `proposal`, `contract_pending`, `payment_pending`, `production`, `in_review`, `delivered`, `completed`, `cancelled`, `disputed`
- Implement `transitionProject(projectId, event, actor)` with validation (reject illegal transitions)
- Map event names from #2 §3.3 (`project.publish`, `project.studio_selected`, etc.)
- Return typed errors for UI (`INVALID_TRANSITION`, `PRECONDITION_FAILED`)

### Out of scope
- UI changes
- Full dispute flow

### Acceptance criteria
- [ ] Unit tests for happy path: `draft → matching → studio_selected → proposal`
- [ ] Unit tests reject: `draft → production`, `completed → proposal`
- [ ] `project.publish` only allowed from `draft` with publish preconditions stub (filled in M2.6)
- [ ] All transitions callable only through transition helper (no direct status assignment in UI)

### Dependencies
- Blocked by: M1.1
- Blocks: M1.3, M1.5, M2.6

---

## M1.3 — Add `project_events` audit log

**Labels:** `phase-0`, `milestone-1`, `area:platform`, `priority:p1`

### Context
Debug state issues and power Admin activity feed later.

### Spec references
- Architect #2 §15 (`project_events` table)
- Architect #4 §M1.3

### Scope
- Store: `project_events[]` with fields: `id`, `project_id`, `entity_type`, `entity_id`, `event_name`, `from_state`, `to_state`, `actor_id`, `actor_role`, `metadata`, `created_at`
- Hook into `transitionProject()` — every successful transition writes one event
- Helper: `listProjectEvents(projectId)`

### Out of scope
- Admin UI (deferred to M6.7)

### Acceptance criteria
- [ ] Every status transition creates exactly one event
- [ ] Failed transitions do not write events
- [ ] Events readable via helper for a demo project

### Dependencies
- Blocked by: M1.2
- Blocks: M6.7

---

## M1.4 — Attach `project_id` to Orders and Inquiries (adapter layer)

**Labels:** `phase-0`, `milestone-1`, `area:migration`, `priority:p0`

### Context
Legacy MVP uses `inquiry_id` / orphan orders. Bridge to Project without breaking existing demos.

### Spec references
- Architect #4 §M1.4, §5 (data migration order)

### Scope
- Add nullable `project_id` on `StoredOrder` and inquiry/chat types
- Adapters:
  - `getProjectForInquiry(inquiryId)`
  - `getProjectForOrder(orderId)`
  - `linkInquiryToProject(inquiryId, projectId)`
- One-time backfill script: seed demo project + link existing seed inquiries if any
- Keep `legacy_inquiry_id` on proposal_threads (forward-compatible with M3.9)

### Out of scope
- Deleting inquiry model
- Proposal route move

### Acceptance criteria
- [ ] All new inquiries created after this PR require `project_id` (server validation)
- [ ] Existing demo paths still load via adapter fallback
- [ ] `getProjectForOrder` returns project for demo Nova order after backfill

### Dependencies
- Blocked by: M1.1
- Blocks: M3.9, M4.1

---

## M1.5 — Brand Dashboard reads Projects (not orphan orders)

**Labels:** `phase-0`, `milestone-1`, `area:brand-portal`, `priority:p1`

### Context
Brand home should show campaigns by Project stage, not scattered orders.

### Spec references
- Architect #2 §16 (UI status → route mapping)
- Architect #4 §M1.5

### Scope
- `/brand` dashboard: list `projects[]` for org with columns:
  - Title, Status badge, Updated, CTA (Continue wizard / Open project)
- Status badge labels from #2 §3.1
- Click row → `/brand/projects/[id]` (stub OK until M2.8)
- Draft projects show "Continue setup" → wizard step from `wizard_step`

### Out of scope
- Match tab content
- Analytics redesign

### Acceptance criteria
- [ ] Dashboard lists projects from project store
- [ ] Each status maps to correct CTA label
- [ ] Empty state: "Create your first campaign" → `/brand/projects/new`
- [ ] No regression: existing brand login still works

### Dependencies
- Blocked by: M1.1, M1.2
- Blocks: M2.8

---

## M1.6 — Seed demo Project (Nova × Arc happy path)

**Labels:** `phase-0`, `milestone-1`, `area:demo`, `priority:p1`

### Context
Fixed QA path for investors and regression.

### Spec references
- Architect #4 §M1.6
- Demo accounts: `client.arc@studioos.test`, `creator.nova@studioos.test`

### Scope
- Seed one project `proj_demo_arc_nova`:
  - Published brief fields filled
  - `status=matching` (or `proposal` if linking existing inquiry)
  - Linked to existing inquiry/order if present
- Document IDs in PR / internal QA doc comment

### Out of scope
- Full pack AI content (static template JSON OK)

### Acceptance criteria
- [ ] Log in as Arc → see demo project on dashboard
- [ ] Log in as Nova → can reach linked proposal (existing or stub)
- [ ] project_events show creation + at least one transition

### Dependencies
- Blocked by: M1.1, M1.4
- Blocks: M3.1 (match uses this project)

---

# MILESTONE 2 — Project Wizard

---

## M2.1 — Wizard shell at `/brand/projects/new`

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `priority:p0`

### Context
Six-step, one-screen-per-step wizard shell with progress bar and draft persistence.

### Spec references
- Architect #1 §1 (Global Shell wireframe)
- Architect #4 §M2.1

### Scope
- Route: `/brand/projects/new` (+ optional `?step=N`)
- On first visit: create `projects` draft via M1.1
- UI: header, step indicator (6 steps), Back / Continue, Save draft button
- Continue: save current step, advance `wizard_step`, mark step in `wizard_completed_steps`
- Leave protection: unsaved changes confirm (client)
- Step labels: Product · References · Analysis · Options · Pack · Publish

### Out of scope
- Step-specific forms (M2.2–M2.6)
- AI calls

### Acceptance criteria
- [ ] User can navigate steps 1→6 shell with empty placeholders
- [ ] Refresh restores last `wizard_step`
- [ ] Save draft persists without advancing step
- [ ] Back hidden on step 1

### Dependencies
- Blocked by: M1.1, M1.2
- Blocks: M2.2–M2.6

---

## M2.2 — Wizard Steps 1–2: Product assets & References

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `priority:p0`

### Context
Collect brand/product assets and reference links per #1 Steps 1–2.

### Spec references
- Architect #1 §2 (Step 1), §3 (Step 2)
- Architect #4 §M2.2

### Scope
**Step 1**
- Fields: product_url, product_name*, category*, commercial_objective*, target_market, target_audience
- Uploads: logo* (1), product_images* (1–10), brand_guide (optional PDF)
- Store in `project_assets` with types
- Continue gate: #1 §2.4

**Step 2**
- Add references: YouTube/TikTok/IG/Pinterest/Behance URL + MP4 (≤50MB) + image
- Grid list with note, delete, reorder
- Store in `project_references`
- Continue gate: ≥1 reference

### Out of scope
- URL fetch / OG scrape (stub button OK)
- Video analysis

### Acceptance criteria
- [ ] Step 1 Continue blocked until required fields + logo + ≥1 product image
- [ ] Step 2 Continue blocked until ≥1 valid reference
- [ ] Assets persist in store and reload on draft resume
- [ ] Invalid URL shows inline error

### Dependencies
- Blocked by: M2.1
- Blocks: M2.3

---

## M2.3 — Wizard Step 3: AI Analysis (template mode)

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `area:ai`, `priority:p0`

### Context
Generate Creative Brief v1 from assets + references. Phase 0 uses template fallback; real AI later.

### Spec references
- Architect #1 §4 (Step 3)
- Architect #4 §M2.3

### Scope
- On enter step 3 (or Continue from step 2): create/update `creative_briefs` v1
- Template generator uses: category, objective, reference count, product_name
- Populate all #1 §4.3 structured fields + `executive_summary` + `full_brief_md`
- UI: analysis dimensions list + brief preview (read-only until M2.5 edit)
- Loading skeleton 2–3s (simulate AI)
- Badge: "Template analysis" when no API key
- Continue gate: brief exists with non-empty executive_summary

### Out of scope
- OpenAI / vision pipeline
- Re-run with real reference parsing

### Acceptance criteria
- [ ] Step 3 displays brief after load
- [ ] `creative_briefs.project_id` linked
- [ ] Continue disabled until brief ready
- [ ] Re-entering step 3 does not duplicate brief (updates v1)

### Dependencies
- Blocked by: M2.2
- Blocks: M2.5, M2.6

---

## M2.4 — Wizard Step 4: Production options

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `priority:p0`

### Context
Brand selects style, length, ratio, quantity, budget.

### Spec references
- Architect #1 §5 (Step 4)
- Architect #4 §M2.4

### Scope
- UI: style preset chips (10 options), length/ratio multi-select, quantity select, budget range, optional deadline
- Write to `projects` fields per #1 §5.3
- Estimate panel (static formula OK): suggested budget + delivery days
- Continue gate: #1 §5.4

### Out of scope
- Real pricing engine
- Studio-specific quotes

### Acceptance criteria
- [ ] All Step 4 fields persist on project
- [ ] Continue blocked until all required selections made
- [ ] Estimate panel updates when quantity/ratio changes

### Dependencies
- Blocked by: M2.1
- Blocks: M2.5, M2.6

---

## M2.5 — Wizard Step 5: Creative Pack (template mode)

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `area:ai`, `priority:p1`

### Context
Generate editable production pack from brief + options.

### Spec references
- Architect #1 §6 (Step 5)
- Architect #4 §M2.5

### Scope
- Create `creative_pack_items` for: `brief`, `storyboard`, `script` (minimum)
- Optional template items: shot_list, moodboard, prompt_package, voice_style, music_style, subtitle_style, cta_suggestions
- UI: left nav pack items + right editor (markdown/JSON form per type)
- Regenerate button re-runs template (increments version)
- Mark `human_edited` when user saves
- Continue gate: brief + storyboard + script exist

### Out of scope
- Real storyboard images
- Export to Runway

### Acceptance criteria
- [ ] User can view and edit the three core pack items
- [ ] Save persists to store
- [ ] Continue blocked until core three exist
- [ ] Pack linked to `project_id`

### Dependencies
- Blocked by: M2.3, M2.4
- Blocks: M2.6

---

## M2.6 — Wizard Step 6: Publish + validation gateway

**Labels:** `phase-0`, `milestone-2`, `area:wizard`, `priority:p0`

### Context
Final review and publish triggers `project.publish` → status `matching`.

### Spec references
- Architect #1 §7 (Step 6), §9 (Publish validation)
- Architect #2 `project.publish` event
- Architect #4 §M2.6

### Scope
- Summary card: product, options, refs count, brief confidence
- Editable project title*
- Visibility: invite-only (default)
- Matching preferences checkboxes (store in settings_json)
- Confirm checkbox required
- Publish button calls validation for steps 1–5 (#1 §9) then `transitionProject(publish)`
- On success: redirect `/brand/projects/[id]?tab=match`
- Save as draft stays `status=draft`

### Out of scope
- Match job execution (M3.1)
- Email notifications

### Acceptance criteria
- [ ] Publish disabled with checklist of missing requirements
- [ ] Successful publish sets `status=matching`, `published_at`
- [ ] `project_events` records `project.publish`
- [ ] Redirect to Project Hub match tab

### Dependencies
- Blocked by: M1.2, M2.2–M2.5
- Blocks: M3.1

---

## M2.7 — Redirect legacy Brief route to Wizard

**Labels:** `phase-0`, `milestone-2`, `area:migration`, `priority:p1`

### Context
Single entry for campaign creation.

### Spec references
- Architect #4 §4 (route table), §M2.7

### Scope
- `/brand/brief/new` → 302 `/brand/projects/new`
- `/start` → `/brand/projects/new` (if not already)
- Update internal nav links: Brand header CTA, dashboard empty state
- Keep old brief components until M6 if needed, but no new links to them

### Out of scope
- Delete old brief page files

### Acceptance criteria
- [ ] All old URLs redirect correctly with locale param preserved
- [ ] No visible nav links to `/brand/brief/new`
- [ ] Existing bookmarks land on wizard step 1

### Dependencies
- Blocked by: M2.1
- Blocks: M6.2

---

## M2.8 — Project Hub skeleton `/brand/projects/[id]`

**Labels:** `phase-0`, `milestone-2`, `area:brand-portal`, `priority:p0`

### Context
Single project command center with locked tabs by status.

### Spec references
- Architect #2 §16 (UI route mapping)
- Architect #4 §M2.8

### Scope
- Route: `/brand/projects/[id]`
- Header: title, status badge, published date
- Tabs: Brief | Match | Proposal | Contract | Production | Review | Delivery
- Tab lock rules (#2 §16): future tabs show lock + "Complete {step} first"
- After publish (`matching`): only Brief + Match active; others locked
- Brief tab: read-only summary of wizard data + link "Edit draft" if status=draft

### Out of scope
- Tab content implementation (except Brief summary)
- Match results (M3.1)

### Acceptance criteria
- [ ] Hub loads for draft and matching projects
- [ ] Locked tabs cannot navigate; show helper text
- [ ] Dashboard row click opens hub
- [ ] Correct tab active from `?tab=` query param

### Dependencies
- Blocked by: M1.5, M2.6
- Blocks: M3.1, M3.3

---

# Suggested GitHub Milestones

| Milestone | Issues |
|-----------|--------|
| **Phase 0 — M1 Foundation** | M1.1 – M1.6 |
| **Phase 0 — M2 Wizard** | M2.1 – M2.8 |

---

# Suggested dependency graph (issue linking)

```
M1.1 ─┬─ M1.2 ─ M1.3
      ├─ M1.4 ─ M1.6
      └─ M1.5 ─ M2.8

M2.1 ─ M2.2 ─ M2.3 ─ M2.5 ─ M2.6 ─ (M3.1)
  │      │
  │      └─ M2.4 ────────────────┘
  ├─ M2.7
  └─ M2.8
```

---

# Bulk create with GitHub CLI (optional)

```bash
# Example — repeat with each title/body file
gh issue create \
  --title "[M1.1] Define projects entity schema" \
  --label "phase-0,milestone-1,priority:p0" \
  --body-file docs/product/issues/M1.1.md
```

Create label set first:

```bash
gh label create "phase-0" --color "0E8A16" --description "Phase 0 migration"
gh label create "milestone-1" --color "1D76DB"
gh label create "milestone-2" --color "5319E7"
gh label create "area:wizard" --color "FBCA04"
gh label create "area:schema" --color "C5DEF5"
gh label create "priority:p0" --color "B60205"
```
