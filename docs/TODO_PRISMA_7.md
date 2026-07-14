# TODO: Prisma 7 Upgrade

Deferred intentionally during Knowledge Center V1 stabilization.

## Current warning

```
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7.
Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
```

This is an official Prisma deprecation notice. It does **not** block typecheck, build, or `production:verify`.

## Upgrade scope (later)

1. Add `prisma.config.ts` per Prisma 7 migration guide
2. Remove `package.json#prisma` block after config migration
3. Re-run `npm run db:generate`, `npm run typecheck`, `npm run build`, `npm run production:verify`
4. Validate Neon migrations and CI deploy paths

Do not start this upgrade until Knowledge Center English publish flow and site-wide UX polish are complete.
