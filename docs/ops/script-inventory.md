# Script Inventory

This file separates active operational scripts from archive candidates. Keep package scripts stable unless a follow-up change updates every caller.

## Keep Active

- `scripts/prisma-with-env.sh`, `scripts/migrate-deploy.sh`, `scripts/db-init.sh`, `scripts/db-recover.sh`
- `scripts/start-dev.sh`, `scripts/dev-local.sh`, `scripts/free-dev-ports.sh`
- `scripts/copy-marketing-assets.mjs`
- `scripts/bootstrap-admin-profile.mjs`, `scripts/generate-admin-totp-secret.mjs`, `scripts/verify-admin-totp.mjs`
- `scripts/production-ready-verify.ts`, `scripts/verify-local.sh`, `scripts/payment-collection-verify.ts`, `scripts/alipay-oauth-verify.ts`
- `scripts/happy-path-transaction-verify.ts`, `scripts/revision-five-round-verify.ts`, `scripts/membership-ui-verify.ts`
- `scripts/membership-expiration.ts`, `scripts/worker-video.ts`, `scripts/generate-openapi-sdk.mjs`
- `scripts/helpers/*`
- `scripts/backup/*`

## Demo/Reset Scripts

Keep while demo environments depend on them:

- `scripts/reset-demo-prisma.ts`
- `scripts/reset-demo-accounts.mjs`
- `scripts/reset-demo-review-flow.ts`
- `scripts/ensure-demo-review-video.mjs`
- `scripts/purge-review-media.mjs`

Archive candidates after demo fixtures are replaced by seed data or documented runbooks:

- `scripts/reset-mvp-demo.mjs`
- `scripts/reset-and-deploy.sh`
- `scripts/anchor-homepage-golden.mjs`
- `scripts/ensure-demo-review-video.mjs` can move with demo media docs once `ord_demo_*` review routes no longer depend on bundled media.

## Sprint Verify Scripts

The following are historical sprint checks. They can move to `scripts/archive/sprint-verifiers/` after their package aliases are removed or replaced by one maintained verification runner:

- `scripts/sprint1-verify.ts` through `scripts/sprint18-verify.ts`
- `scripts/sprint20-verify.ts`
- `scripts/sprint21-verify.ts`
- `scripts/sprint6b-verify.ts`

## Deployment/Git Helper Candidates

These are workflow-specific and should move to docs or archive once CI/CD owns the flow:

- `scripts/connect-github.sh`
- `scripts/prepare-github.sh`
- `scripts/setup-github-remote.sh`
- `scripts/sync-github-main.sh`
- `scripts/push-session-changes.sh`
- `scripts/git-push-all.mjs`
- `scripts/git-push-homepage.mjs`
- `scripts/deploy-homepage-github.sh`
- `scripts/deploy-vercel.sh`
- `scripts/deploy-fast.sh`

## Asset Copy Candidates

Keep only the asset copy script referenced by the build. Archive older one-off variants after confirming no manual runbook still references them:

- `scripts/copy-hero-video.mjs`
- `scripts/copy-login-backgrounds.mjs`
- `scripts/copy-login-bg.mjs`
- `scripts/install-hero-bg.sh`

## Diagnostics / One-Off Candidates

Move these to `scripts/archive/diagnostics/` or document them under `docs/ops/` if no current runbook calls them:

- `scripts/backup-workflow.mjs`
- `scripts/capture-typecheck.mjs`
- `scripts/find-build-risks.mjs`
- `scripts/membership-verify.ts`
- `scripts/run-verify.sh`
- `scripts/verify-escrow-notify-flow.mts`
- `scripts/sprint-deliver.mjs`
- `scripts/night-shift-deliver.mjs`
