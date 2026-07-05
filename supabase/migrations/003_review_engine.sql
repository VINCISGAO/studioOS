-- VINCIS Review Engine v1 — Frame.io external review sessions
-- Apply via Supabase SQL editor or migration runner when Postgres is primary store.

create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  order_id uuid not null,
  creator_id uuid not null,
  brand_id uuid not null,

  frame_project_id text,
  frame_folder_id text,
  frame_asset_id text,
  frame_review_link text,

  version_number int default 1,
  status text default 'pending_upload',
  -- pending_upload / uploading / transcoding / ready_for_review / changes_requested / approved / failed

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists review_sessions_order_id_idx on public.review_sessions (order_id);
create index if not exists review_sessions_frame_asset_id_idx on public.review_sessions (frame_asset_id);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  review_session_id uuid references public.review_sessions(id) on delete cascade,
  frame_event_type text,
  frame_payload jsonb,
  created_at timestamptz default now()
);

create index if not exists review_events_session_id_idx on public.review_events (review_session_id);
