-- StudioOS MVP — Review & approval workspace
-- Run on a Supabase project (can coexist with legacy schema using separate tables)

create extension if not exists "pgcrypto";

-- Profiles (maps to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('brand', 'studio', 'admin')),
  name text not null default '',
  company_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_mvp_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'brand'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_mvp_auth_user_created on auth.users;
create trigger on_mvp_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_mvp_new_user();

-- Projects
create table if not exists public.review_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  brand_name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'revision', 'pending_settlement', 'settled', 'approved', 'delivered')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  assigned_studio_id uuid references public.profiles(id) on delete set null,
  review_approved_at timestamptz,
  settled_at timestamptz,
  master_file_url text,
  master_file_name text,
  master_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_projects_created_by_idx on public.review_projects(created_by);
create index if not exists review_projects_assigned_studio_idx on public.review_projects(assigned_studio_id);

-- Video versions
create table if not exists public.video_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.review_projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  file_url text not null,
  file_path text not null default '',
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index if not exists video_versions_project_id_idx on public.video_versions(project_id);

-- Timestamp comments / issues
create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.review_projects(id) on delete cascade,
  video_version_id uuid not null references public.video_versions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  timestamp_seconds numeric not null default 0 check (timestamp_seconds >= 0),
  comment_text text not null,
  status text not null default 'open'
    check (status in ('open', 'resolved', 'reopened')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists video_comments_project_id_idx on public.video_comments(project_id);
create index if not exists video_comments_version_id_idx on public.video_comments(video_version_id);

-- Storage bucket for MP4 uploads
insert into storage.buckets (id, name, public)
values ('review-videos', 'review-videos', true)
on conflict (id) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.review_projects enable row level security;
alter table public.video_versions enable row level security;
alter table public.video_comments enable row level security;

create policy "Profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Brand reads own projects"
  on public.review_projects for select to authenticated
  using (created_by = auth.uid() or assigned_studio_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Brand creates projects"
  on public.review_projects for insert to authenticated
  with check (created_by = auth.uid());

create policy "Participants update projects"
  on public.review_projects for update to authenticated
  using (created_by = auth.uid() or assigned_studio_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Video versions readable by participants"
  on public.video_versions for select to authenticated
  using (exists (
    select 1 from public.review_projects rp
    where rp.id = project_id
    and (rp.created_by = auth.uid() or rp.assigned_studio_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  ));

create policy "Studio uploads versions"
  on public.video_versions for insert to authenticated
  with check (exists (
    select 1 from public.review_projects rp
    where rp.id = project_id and rp.assigned_studio_id = auth.uid()
  ));

create policy "Comments readable by participants"
  on public.video_comments for select to authenticated
  using (exists (
    select 1 from public.review_projects rp
    where rp.id = project_id
    and (rp.created_by = auth.uid() or rp.assigned_studio_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  ));

create policy "Participants insert comments"
  on public.video_comments for insert to authenticated
  with check (user_id = auth.uid());

create policy "Participants update comments"
  on public.video_comments for update to authenticated
  using (exists (
    select 1 from public.review_projects rp
    where rp.id = project_id
    and (rp.created_by = auth.uid() or rp.assigned_studio_id = auth.uid())
  ));
