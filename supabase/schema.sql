create type public.user_role as enum ('client', 'creator', 'admin');
create type public.project_status as enum (
  'submitted',
  'approved',
  'waiting_payment',
  'paid',
  'matching',
  'assigned',
  'matched',
  'in_production',
  'review',
  'revision',
  'delivered',
  'completed',
  'cancelled',
  'disputed',
  'refunded'
);
create type public.creator_status as enum ('pending', 'approved', 'rejected', 'suspended', 'deposit_required', 'active');
create type public.deposit_status as enum ('unpaid', 'paid', 'frozen', 'refund_requested', 'refunded', 'partially_deducted', 'deducted');
create type public.escrow_status as enum ('unpaid', 'escrowed', 'released', 'refund_requested', 'refunded', 'partially_refunded', 'failed');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  email text not null,
  product_url text,
  category text,
  target_platform text,
  video_format text,
  video_count integer not null default 1 check (video_count > 0),
  budget_range text,
  deadline date,
  brand_style text,
  reference_links text,
  campaign_goal text,
  notes text,
  status public.project_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  headline text,
  bio text,
  country text,
  email text not null unique,
  portfolio_url text,
  specialties text[] not null default '{}',
  tools text[] not null default '{}',
  rating numeric(2, 1) not null default 0,
  delivery_speed text,
  status public.creator_status not null default 'pending',
  deposit_status public.deposit_status not null default 'unpaid',
  deposit_amount integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.creator_works (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  title text not null,
  category text,
  platform text,
  format text,
  thumbnail_url text,
  video_url text,
  description text,
  turnaround text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  work_id uuid references public.creator_works(id) on delete set null,
  client_name text,
  client_email text not null,
  company_name text,
  budget_range text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  plan_name text not null,
  amount integer not null check (amount >= 0),
  stripe_session_id text unique,
  payment_status text not null default 'open',
  assigned_creator_id uuid references public.creators(id) on delete set null,
  status public.project_status not null default 'submitted',
  platform_fee integer not null default 0,
  creator_payout integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  file_url text not null,
  thumbnail_url text,
  notes text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now()
);

create table public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  proposed_amount integer not null check (proposed_amount >= 0),
  timeline text,
  proposal text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (project_id, creator_id)
);

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  amount integer not null check (amount >= 0),
  status public.deposit_status not null default 'unpaid',
  reason text,
  refundable_after date,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table public.escrow_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payer_user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null check (amount >= 0),
  platform_fee integer not null default 0,
  creator_payout integer not null default 0,
  status public.escrow_status not null default 'unpaid',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  requester_user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null check (amount >= 0),
  reason text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by public.user_role not null,
  reason text,
  status text not null default 'open',
  proposed_resolution text,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  amount integer not null check (amount >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index orders_user_id_idx on public.orders(user_id);
create index orders_project_id_idx on public.orders(project_id);
create index deliverables_order_id_idx on public.deliverables(order_id);
create index creator_works_creator_id_idx on public.creator_works(creator_id);
create index inquiries_creator_id_idx on public.inquiries(creator_id);
create index inquiries_work_id_idx on public.inquiries(work_id);

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender text not null check (sender in ('brand', 'creator', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

create index inquiry_messages_inquiry_id_idx on public.inquiry_messages(inquiry_id);

alter table public.inquiry_messages enable row level security;

create policy "Anyone can read inquiry messages"
  on public.inquiry_messages for select
  using (true);

create policy "Anyone can post brand inquiry messages"
  on public.inquiry_messages for insert
  with check (sender in ('brand', 'creator', 'system'));

create index project_applications_project_id_idx on public.project_applications(project_id);
create index project_applications_creator_id_idx on public.project_applications(creator_id);
create index deposits_creator_id_idx on public.deposits(creator_id);
create index escrow_payments_order_id_idx on public.escrow_payments(order_id);
create index refund_requests_order_id_idx on public.refund_requests(order_id);
create index disputes_order_id_idx on public.disputes(order_id);
create index payouts_creator_id_idx on public.payouts(creator_id);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.orders enable row level security;
alter table public.creators enable row level security;
alter table public.creator_works enable row level security;
alter table public.inquiries enable row level security;
alter table public.deliverables enable row level security;
alter table public.project_applications enable row level security;
alter table public.deposits enable row level security;
alter table public.escrow_payments enable row level security;
alter table public.refund_requests enable row level security;
alter table public.disputes enable row level security;
alter table public.payouts enable row level security;

create policy "Users can read themselves"
  on public.users for select
  using (auth.uid() = id);

create policy "Clients can read their projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Clients can create their projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Clients can read their orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Clients can read their deliverables"
  on public.deliverables for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = deliverables.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Admins can manage all users"
  on public.users for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all projects"
  on public.projects for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all orders"
  on public.orders for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all creators"
  on public.creators for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Anyone can read approved creators"
  on public.creators for select
  using (status in ('approved', 'active'));

create policy "Anyone can read approved creator works"
  on public.creator_works for select
  using (
    exists (
      select 1 from public.creators
      where creators.id = creator_works.creator_id
      and creators.status in ('approved', 'active')
    )
  );

create policy "Anyone can create inquiries"
  on public.inquiries for insert
  with check (true);

create policy "Admins can manage all creator works"
  on public.creator_works for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all inquiries"
  on public.inquiries for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all deliverables"
  on public.deliverables for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all project applications"
  on public.project_applications for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all deposits"
  on public.deposits for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all escrow payments"
  on public.escrow_payments for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all refund requests"
  on public.refund_requests for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all disputes"
  on public.disputes for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admins can manage all payouts"
  on public.payouts for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', false),
       ('deliverables', 'deliverables', false)
on conflict (id) do nothing;
