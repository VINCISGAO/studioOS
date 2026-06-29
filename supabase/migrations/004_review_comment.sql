-- Simple review comments (spatial + timecode)
create table if not exists review_comment (
  id text primary key,
  order_id text not null,
  version integer not null default 1,
  time_seconds numeric not null,
  pos_x numeric,
  pos_y numeric,
  content text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists review_comment_order_version_idx
  on review_comment (order_id, version, time_seconds);
