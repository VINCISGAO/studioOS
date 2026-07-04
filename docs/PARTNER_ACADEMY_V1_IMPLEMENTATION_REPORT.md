# Partner & Academy V1 Implementation Report

Status: implemented from available product context.  
Source document note: `/Users/linkele/Desktop/合伙人开发文档 Partner & Academy 技术开发需求 V1.pdf` could not be read by the current tool session, so V1 was built from existing StudioOS Partner/Academy stubs, membership/commission/referral context, and current admin portal patterns.

## What Was Added

### Database

- `PartnerProgram`
  - Stores partner roster, tier, status, referral code, commission rate, attributed brands/creators, attributed revenue, pending commission, and paid commission.
  - Keeps `campaign_id` nullable for future campaign-specific partner programs.

- `AcademyCourse`
  - Stores Academy courses, audience, publish status, level, duration, lesson count, completion count, owner, outcomes, and publish timestamp.
  - Keeps `campaign_id` nullable for future campaign-linked training or case-study lessons.

New enums:

- `PartnerStatus`
- `PartnerTier`
- `AcademyAudience`
- `AcademyContentStatus`

Migration:

- `prisma/migrations/202607041006_partner_academy_v1/migration.sql`

### Seed

`prisma/seed.ts` now seeds:

- 3 partner programs
- 4 academy courses

The seed is idempotent using `slug`, so it can be rerun safely.

### Service Layer

Added:

- `features/partner-academy/partner-academy-admin.service.ts`

The admin service provides:

- Partner dashboard summary
- Partner status/tier breakdown
- Partner roster
- Academy course summary
- Academy audience/status breakdown
- Course library

Permissions use `admin.overview.read`.

### UI

Replaced stubs with real DB-backed admin pages:

- `app/admin/partners/page.tsx`
- `app/admin/academy/page.tsx`

Both pages include:

- Back to admin link
- Localized English/Chinese copy
- KPI cards
- DB-backed list
- Empty state
- Status/tier/audience breakdown

## Verification

Run:

```bash
npm run db:migrate
npm run db:seed
npx prisma generate
npm run typecheck
npm run build
npm run production:verify
```

Expected seed log:

```text
Seeded Partner & Academy V1: 3 partners, 4 courses
```

## Notes For Next Pass

When the source PDF becomes readable, compare it against this V1 and add any missing:

- Partner application workflow
- Partner commission payout lifecycle
- Academy lesson detail pages
- Course enrollment/progress per user
- Public Academy marketing surface
- Partner-facing dashboard
