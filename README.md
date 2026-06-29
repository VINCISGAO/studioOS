# AdBridge

Production-ready MVP for AdBridge, a managed service that helps US brands order AI commercial videos from vetted global AI creative studios.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui-style components
- Supabase Auth, Postgres, and Storage
- Stripe Checkout
- Resend

## Routes

- `/` landing page
- `/pricing` packages
- `/start` project submission
- `/dashboard` client dashboard
- `/dashboard/orders/[id]` client order detail
- `/admin` admin dashboard
- `/admin/orders/[id]` admin order detail

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in Supabase, Stripe, and Resend keys.
3. Run the SQL in `supabase/schema.sql` inside Supabase.
4. Start locally with `npm run dev`.

The current UI uses typed sample data in `lib/data.ts`. Replace those reads with Supabase queries as credentials and row-level security policies are finalized.
