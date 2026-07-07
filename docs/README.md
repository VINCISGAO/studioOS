# VINCIS Documentation Index

> Documentation v2 structure — per Developer Documentation Vol 18

## Quick Start

1. Read [Architecture Overview](./architecture/system-architecture.md)
2. Read [State Machines](./architecture/state-machine.md)
3. Read [AI Preference Engine](./AI_PREFERENCE_ENGINE.md)
4. Read [AI Learning Foundation](./AI_LEARNING_FOUNDATION.md)
5. Read [Sprint Plan](./SPRINT_PLAN.md)
6. Follow [Cursor Rules](./prompts/CURSOR_RULES.md) before any development

## Documentation Map

```
docs/
├── README.md                    ← you are here
├── STUDIOOS_ROADMAP.md          ← 12-phase product roadmap
├── AI_PREFERENCE_ENGINE.md      ← AI learning rules + brand taste engine
├── AI_LEARNING_FOUNDATION.md    ← protected AI memory/database inventory
├── SPRINT_PLAN.md               ← Sprint 1–18 breakdown
├── architecture/
│   ├── system-architecture.md
│   └── state-machine.md         ← Vol 18 + Mermaid diagrams
├── design/
│   └── DESIGN_SYSTEM.md         ← tokens, spacing, components
├── prompts/
│   ├── CURSOR_RULES.md          ← AI must read before coding
│   └── AI_CONSTITUTION.md       ← 21 articles
├── adr/
│   ├── 001-feature-first.md
│   ├── 002-hls-not-mp4.md
│   ├── 003-escrow-required.md
│   └── 004-event-driven.md
├── openapi/
│   └── openapi.yaml
└── features/
    ├── campaign/
    ├── review/
    └── payment/
```

## Source of Truth (Article 1)

Only these define business rules:

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database |
| `docs/openapi/openapi.yaml` | API contract |
| `features/**/**.state-machine.ts` | State transitions |
| `docs/features/**/*.md` | Feature specs |
| `docs/AI_PREFERENCE_ENGINE.md` | AI preference learning rules |
| `docs/AI_LEARNING_FOUNDATION.md` | Protected AI memory and learning database inventory |
| `docs/design/DESIGN_SYSTEM.md` | UI tokens |

## Tech Stack

- Next.js 15 · TypeScript Strict · Tailwind · shadcn/ui
- PostgreSQL + Prisma · Redis + BullMQ (Phase 6+)
- Cloudflare R2 · Stripe · Resend · OpenAI
