# Phase 1 Database Binding Report

Generated during the Phase 1 database binding pass.

## Completed DB-First Areas

- User authentication and registration now prefer Prisma when `DATABASE_URL` is configured.
- Creator and brand profile writes avoid shadow JSON writes after successful database persistence.
- Avatar uploads use object storage and record metadata in `storage_files`.
- Creator portfolio reads use `creator_portfolio_works` in DB mode and stop merging static seed works.
- Creator AI support config, conversations, messages, handoff, attribution, and connected channels are Prisma-backed.
- Performance source creation and analysis synchronizes `connected_channels`.
- Campaign draft/start flow uses Campaign DB services in DB mode.
- Order reads (`getOrder`, `listOrdersForProject`, `listOrdersForClient`, `listOrdersForCreator`) prefer `orders`.
- Quote acceptance creates a Prisma `Order` when the client and creator can be resolved.
- Creator income snapshots resolve legacy `creator_*` ids to Prisma creator users.
- Payout methods read/write `payment_methods` in DB mode.
- Withdrawal history and new withdrawal requests use `withdrawal_requests` in DB mode.
- Admin DB overview is available at `/admin/database` for core module counts and recent records.

## Remaining Legacy Compatibility

These files still contain JSON/local demo fallbacks for offline or partially migrated flows. They should stay until every route calling them has a Prisma replacement and test coverage:

- `lib/project-service.ts`
- `lib/order-service.ts`
- `lib/studioos/withdrawal-service.ts`
- `lib/onboarding-service.ts`
- `lib/project-events-service-core.ts`
- `lib/project-adapters.ts`
- `lib/data.ts`
- `seed/*.json`
- `.data/*.json` runtime stores

## Acceptance Notes

- In DB mode, the main user/profile/storage/works/AI support/conversation/channel/campaign/order/wallet-withdrawal paths no longer depend on browser `localStorage` business drafts or static seed merging.
- Demo constants remain for non-database fallback and seed/demo reset scripts. They are not safe to delete blindly because several legacy pages still import their types and copy.
- Final removal of `lib/data.ts` and `.data/*.json` requires replacing onboarding, event history, and remaining quote/deliverable compatibility flows with Prisma-native services.

## Verification Targets

Run these before sign-off:

```bash
npm run typecheck
npm run build
npm run production:verify
```
