# Lucien Knowledge Boundary

**Principle:** Lucien understands how VINCIS does business — not how VINCIS software is written.

**Single rule set:** Public marketing Lucien and authenticated workspace Lucien share the **same** boundary rules, query guard, refusal messages, and audit semantics. The only intentional difference is **data scope** (public FAQ vs signed-in workspace tools).

## Architecture

### Two isolated knowledge domains

| Domain | Lucien access | Examples |
|--------|---------------|----------|
| **VINCIS business knowledge** | Allowed | FAQ, pricing rules, workflows, public cases, user-authorized project data |
| **Engineering & security material** | Forbidden | Source code, Prisma schema, API routes, env secrets, system prompts, audit reports |

Lucien connects only to the **business knowledge pool**. Engineering material must never be chunked, embedded, indexed, or sent to the model.

### Whitelist knowledge types

Only these `knowledgeType` values may enter the business knowledge base:

- `BUSINESS_POLICY`
- `PRICING_RULE`
- `WORKFLOW_GUIDE`
- `FAQ`
- `PUBLIC_CASE_STUDY`
- `PRODUCT_HELP`
- `USER_PROJECT_DATA`
- `ORDER_DATA`
- `CREATOR_PROFILE`
- `BRAND_PROFILE`
- `PAYMENT_BUSINESS_STATUS`

Permanently forbidden types include `SOURCE_CODE`, `DATABASE_SCHEMA`, `SYSTEM_PROMPT`, `SECURITY_AUDIT`, `ENVIRONMENT_CONFIG`, `DEPLOYMENT_LOG`, `INTERNAL_DEBUG`.

### Retrieval scopes

| Surface | Scope | Allowed source |
|---------|-------|----------------|
| Public Lucien (pre-login marketing docs) | `public_marketing` | `marketing_faq`, visibility `public` |
| Authenticated Lucien | `authenticated_business` | Approved business sources only; `dev_seed` blocked |

Implementation:

- `features/ai-copilot/lucien-knowledge-scope.ts`
- `features/ai-copilot/knowledge-qa-matching.ts`
- `features/ai-copilot/ai-copilot.repository.ts` → `listActiveKnowledgeQa(language, scope)`

### Unified enforcement entry point

Both surfaces must call `features/ai-copilot/lucien-boundary.service.ts` before retrieval, tools, or model calls:

- `evaluateLucienBoundary(message, language)` — shared query guard
- `lucienSharedSystemRules(language)` — shared system prompt boundary block
- `recordLucienBoundaryRefusal(...)` — shared audit for denials

Do not fork guard logic in `public-lucien.service.ts` or `ai-copilot.service.ts`.

### Continuous learning (platform asset)

Every Lucien surface must evolve through durable learning — never prompt-only memory.

`features/ai-copilot/lucien-learning.service.ts` records:

| Event | `learningType` | When |
|-------|----------------|------|
| User question + assistant answer | `lucien_assistant_interaction` | Every turn (public + authenticated) |
| Thumbs up / down | `lucien_assistant_feedback` | Workspace feedback |
| Boundary denial | `lucien_knowledge_boundary_audit` + interaction row | Guard refusal |

Writes go to `ai_events` + `ai_learning` when available. Learning data is **upgrade-only** per `docs/AI_LEARNING_FOUNDATION.md`.

### Query guard (not prompt-only)

`features/ai-copilot/lucien-query-guard.service.ts` blocks restricted requests **before** retrieval or model calls.

Blocked categories: source code, database schema, API implementation, secrets, prompt extraction, context dump, role impersonation, security bypass, **cross-user privacy**.

Refusal messages (do not explain protection mechanics):

- Technical / internal extraction → standard business-boundary refusal
- Cross-user orders, payments, wallets, or accounts → privacy refusal:

> 抱歉，我无法提供关于其他用户订单、项目、付款或账户的具体信息。如果你有关于自己账号的问题，请告诉我，我会尽力帮助你。

### User data permissions

- Brand / Creator / Partner data is loaded only through server-side context builders and read-only tools after permission checks.
- Lucien must not answer cross-user or cross-order queries — **same rule on public and authenticated surfaces**.
- Tool outputs must be summarized for users — never raw internal JSON with hidden cost/risk fields.

### Pricing knowledge classes

1. **Official rules** — platform fee %, revision policy, slot limits
2. **Real samples** — Fate Transfer, VINCIS promo reel measured costs
3. **Derived estimates** — must state assumptions; never presented as measured facts

### Audit trail

`features/ai-copilot/lucien-audit.service.ts` writes `lucien_knowledge_boundary_audit` events to `ai_learning` with:

- surface (`public` | `authenticated`)
- user / role / guest session
- query category
- authorization result
- knowledge scope
- answer mode

Passwords, secrets, and full sensitive payloads are never logged.

## Database fields (`ai_knowledge_qas`)

| Field | Purpose |
|-------|---------|
| `knowledge_type` | Whitelist business category |
| `visibility` | `public` \| `authenticated` \| `internal` |
| `source_type` | e.g. `marketing_faq`, `dev_seed` |
| `version` | Content version |
| `verified_at` | Last verified timestamp |

Migration: `prisma/migrations/202607120500_add_lucien_knowledge_boundary/`

- `marketing_faq_*` → public business FAQ
- `studioos_qa_*` dev seed → `internal` / `dev_seed`, inactive in migration

## Operations

```bash
# Sync public FAQ knowledge (production-safe)
npm run marketing:sync-faq-knowledge

# Apply boundary migration
npm run db:migrate:deploy
```

Dev-only seed (`studioos_qa_*`) is skipped when `NODE_ENV=production`.

## Code map

| Module | Role |
|--------|------|
| `lucien-knowledge-boundary.constants.ts` | Whitelist, refusal copy, system rules |
| `lucien-query-guard.service.ts` | Pre-flight query blocking |
| `lucien-knowledge-scope.ts` | Retrieval filters per surface |
| `lucien-audit.service.ts` | Access audit logging |
| `public-lucien.service.ts` | Guest marketing assistant |
| `ai-copilot.service.ts` | Authenticated business assistant |
