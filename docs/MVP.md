# StudioOS MVP — Review & Approval Workspace

Video ad review and approval — **not** chat, **not** a marketplace, **not** an editor.

## Quick start (demo mode)

```bash
npm run dev
```

1. Sign in at `/login` with demo accounts (`TempAdBridge2026!`):
   - **Brand:** `client.arc@adbridge.test`
   - **Studio:** `creator.nova@adbridge.test`
   - **Admin:** `admin@adbridge.test`
2. Open **Review Workspace:** [/workspace](/workspace)
3. Demo project review: [/workspace/projects/proj_mvp_demo_01/review](/workspace/projects/proj_mvp_demo_01/review)

## Supabase setup

1. Create a Supabase project
2. Run `supabase/mvp-schema.sql` in the SQL editor
3. Set env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Sign up at `/signup` (brand or studio role)

## Routes

| Route | Role |
|-------|------|
| `/workspace/brand` | Brand dashboard |
| `/workspace/studio` | Studio dashboard |
| `/workspace/admin` | Admin overview |
| `/workspace/projects/new` | Create project |
| `/workspace/projects/[id]/review` | **Core review page** |

## Database tables

- `profiles` — brand / studio / admin
- `review_projects` — campaign projects
- `video_versions` — MP4 versions per project
- `video_comments` — timestamp issues (open / resolved / reopened)

Local demo uses `.data/mvp-store.json` when Supabase is not configured.
