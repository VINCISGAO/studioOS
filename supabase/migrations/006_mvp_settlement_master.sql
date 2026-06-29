-- Settlement + master delivery fields on MVP review projects
alter table public.review_projects
  add column if not exists review_approved_at timestamptz,
  add column if not exists settled_at timestamptz,
  add column if not exists master_file_url text,
  add column if not exists master_file_name text,
  add column if not exists master_uploaded_at timestamptz;

alter table public.review_projects drop constraint if exists review_projects_status_check;

alter table public.review_projects
  add constraint review_projects_status_check
  check (status in (
    'draft',
    'in_review',
    'revision',
    'pending_settlement',
    'settled',
    'approved',
    'delivered'
  ));

update public.review_projects
set status = 'pending_settlement'
where status = 'approved';

update public.review_projects
set status = 'settled'
where status = 'delivered' and master_file_url is not null;
