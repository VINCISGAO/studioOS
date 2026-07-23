# VINCIS

VINCIS is a Next.js App Router application for managed AI commercial production. It coordinates brand campaign intake, AI-assisted creative planning, creator recruitment, production review, payments, and an independent platform-admin console.

This README is written for future developers and AI agents. Prefer the current `/brand`, `/studio`, and `/admin` surfaces over older compatibility routes unless a task explicitly targets legacy behavior.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma ORM
- Neon PostgreSQL in production-like environments
- Supabase Auth / Supabase SSR for configured Google OAuth and Supabase-backed auth flows
- Resend for email OTP and notification email
- Stripe-oriented payment and escrow foundations
- Playwright for E2E coverage

## Architecture

VINCIS has three main product surfaces:

- Brand Workspace: campaign creation, project hub, creative DNA, proposal/review surfaces, finance/payment views, and messaging.
- Creator Workspace: invitations, project workspace, review/upload center, income, settings, quality/certification, and AI support.
- Admin System: independent `/admin` authentication backed by `AdminUser` and `AdminSession`. Admin access must not depend on ordinary `User.role === "ADMIN"` sessions.

Ordinary users may have both Brand and Creator capabilities. Access checks should prefer profile/capability ownership over a single role flag.

## Core Flows

Campaign creation starts in `/brand/projects/new`. The wizard creates or resumes a Prisma-backed project/campaign draft, collects brand inputs and assets, and prepares the campaign for matching and production.

AI creative proposal generation is wired through the project wizard and AI job/service layers. Treat AI outputs as assistive draft material unless a flow explicitly freezes or approves them.

Production Brief freezing is represented on campaign records through `productionBrief` data and related brief/pack helpers. Downstream creator work should use the frozen/confirmed brief rather than mutable wizard input.

Creator recruitment and response flows use creator invitations, creator response actions, and creator workspace pages such as `/studio/invitations`, `/studio/projects`, and `/studio/review`.

Payment work is in progress. The codebase includes Stripe configuration points, checkout/demo checkout routes, escrow payment models, admin payment views, wallet/withdrawal foundations, and verification scripts. Do not assume the entire payment lifecycle is production-complete without checking the current feature files, migrations, and verification results.

## Auth

Brand/creator auth supports Google OAuth through Supabase when Supabase env vars are configured. Supabase SSR clients are still used in callback and signup paths.

Email OTP is implemented through the auth security service and Resend. Configure `RESEND_API_KEY` and sender env vars before relying on email delivery.

Alipay OAuth has a code skeleton and diagnostics under the Alipay auth routes/services. It requires Alipay app credentials and RSA2 key configuration before it should be considered live.

Admin auth is separate from public auth. Use `/admin/login`, TOTP-backed admin sessions, and admin API guards for admin-only behavior.

## Important Routes

- `/` marketing home
- `/login`, `/signup` public auth entry
- `/brand` Brand Workspace
- `/brand/projects/new` campaign wizard
- `/brand/projects/[id]` brand project hub
- `/brand/projects/[id]/review` brand review room
- `/studio` Creator Workspace home
- `/studio/invitations` creator invitation queue
- `/studio/projects` creator project list
- `/studio/review` creator review/upload center
- `/studio/review/[orderId]` creator upload and review workspace
- `/admin` independent admin console
- `/admin/login` admin login

Some `/workspace/*`, `/dashboard/*`, and older proposal/brief routes still exist for compatibility. Verify current behavior before linking to them from new work.

## Local Development

Use the Node version declared by the repo (`.nvmrc` / `package.json` engines).

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

Useful local commands:

```bash
npm run dev:quick
npm run typecheck
npm run lint
npm run build
npm run e2e
```

`npm run build` generates Prisma client, copies bundled marketing assets, clears build caches, and runs `next build`.

## Database And Migrations

Local Prisma client generation:

```bash
npm run db:generate
```

Production-like migration deploy:

```bash
npm run db:migrate:deploy
```

Important: do not run `prisma migrate dev` casually against Neon, staging, production, or any shared database. In this repo, `npm run db:migrate` maps to `prisma migrate dev`; use it only when intentionally creating local migrations against a disposable/local database. Use `npm run db:migrate:deploy` for production-like databases.

For Neon, keep `DATABASE_URL` server-only. If using a pooled URL, provide or allow the helper scripts to derive `DIRECT_DATABASE_URL` for migration operations.

## Admin Bootstrap

Bootstrap an independent admin account:

```bash
npm run bootstrap:admin -- admin@example.com
```

For a master admin:

```bash
npm run bootstrap:admin -- --master admin@example.com
```

Production bootstrap requires strong auth secrets and:

```bash
ADMIN_BOOTSTRAP_CONFIRM=yes-i-own-this-server npm run bootstrap:admin -- --master admin@example.com
```

If you need a known TOTP secret, generate or provide `ADMIN_TOTP_SECRET` and store it securely.

## Environment Notes

Start from `.env.example`. Common required groups:

- `DATABASE_URL` / optional `DIRECT_DATABASE_URL` for Prisma and Neon PostgreSQL
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and Supabase service credentials for Supabase-backed auth paths
- `RESEND_API_KEY` and sender env vars for email OTP/notifications
- `STRIPE_SECRET_KEY`, publishable key, and webhook secret for Stripe-oriented payment work
- `ENABLE_DEMO_PAYMENTS=false` in production — creator deposit demo auto-confirm is opt-in for local dev only
- OpenAI model keys for AI proposal and creative assistance features
- Alipay OAuth env vars only when enabling the Alipay skeleton

Never expose database URLs or server secrets through `NEXT_PUBLIC_*`.

### GitHub Actions secrets (required for CI integration job)

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL — deposit reconcile + migration deploy in CI |
| `DIRECT_DATABASE_URL` | Recommended | Unpooled URL for Prisma migrate on Neon |
| `AUTH_SECURITY_SECRET` | Production | Auth cookie signing (32+ chars) |
| `RESEND_API_KEY` | Production | Email OTP / notifications |

Without `DATABASE_URL`, the **Static gates** job still runs (typecheck, lint, build, deposit security scan). The **Database integration** job fails until the secret is set.

## Verification

Recommended checks before handing off changes:

```bash
npm run typecheck
npm run lint
npm run build
npm run production:verify
```

E2E requires Playwright browser binaries and a host environment that can launch Chromium:

```bash
npx playwright install
npm run e2e
```

Some verification scripts require a reachable database and seeded/demo data. A failure to reach Neon or missing browser binaries is an environment failure, not necessarily an application regression.
