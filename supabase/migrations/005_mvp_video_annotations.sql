-- SVG annotation fields on video_comments
alter table public.video_comments
  add column if not exists annotation_type text check (annotation_type in ('circle', 'arrow', 'rect', 'text', 'pin')),
  add column if not exists pos_x numeric,
  add column if not exists pos_y numeric,
  add column if not exists width numeric,
  add column if not exists height numeric,
  add column if not exists color text;
