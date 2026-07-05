-- Run this in the Supabase SQL Editor after creating a project.

create table if not exists schedules (
  id          uuid primary key default gen_random_uuid(),
  group_id    text not null,
  date_key    text not null,
  type        text not null,
  start_time  text default '',
  memo        text default '',
  range_start text,
  range_end   text,
  created_at  timestamptz default now()
);

create index if not exists schedules_date_key_idx on schedules(date_key);
create index if not exists schedules_group_id_idx on schedules(group_id);

create table if not exists fanart (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  image_url   text not null,
  storage_path text,
  created_at  timestamptz default now()
);

create table if not exists hotclips (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  title       text not null default '',
  href        text not null,
  thumbnail   text default '',
  embed_url   text default '',
  created_at  timestamptz default now()
);

create index if not exists hotclips_category_created_at_idx on hotclips(category, created_at desc);

create table if not exists upbo_files (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  file_name    text not null default '',
  file_url     text not null,
  storage_path text,
  content_type text default '',
  size_bytes   integer default 0,
  created_at   timestamptz default now()
);

create index if not exists upbo_files_created_at_idx on upbo_files(created_at desc);

alter table schedules enable row level security;
alter table fanart enable row level security;
alter table hotclips enable row level security;
alter table upbo_files enable row level security;

drop policy if exists "public read schedules" on schedules;
drop policy if exists "public insert schedules" on schedules;
drop policy if exists "public delete schedules" on schedules;
drop policy if exists "public read fanart" on fanart;
drop policy if exists "public insert fanart" on fanart;
drop policy if exists "public delete fanart" on fanart;
drop policy if exists "public read hotclips" on hotclips;
drop policy if exists "public insert hotclips" on hotclips;
drop policy if exists "public delete hotclips" on hotclips;
drop policy if exists "public read upbo files" on upbo_files;
drop policy if exists "public insert upbo files" on upbo_files;
drop policy if exists "public delete upbo files" on upbo_files;

create policy "public read schedules" on schedules for select using (true);
create policy "public insert schedules" on schedules for insert with check (true);
create policy "public delete schedules" on schedules for delete using (true);

create policy "public read fanart" on fanart for select using (true);
create policy "public insert fanart" on fanart for insert with check (true);
create policy "public delete fanart" on fanart for delete using (true);

create policy "public read hotclips" on hotclips for select using (true);
create policy "public insert hotclips" on hotclips for insert with check (true);
create policy "public delete hotclips" on hotclips for delete using (true);

create policy "public read upbo files" on upbo_files for select using (true);
create policy "public insert upbo files" on upbo_files for insert with check (true);
create policy "public delete upbo files" on upbo_files for delete using (true);

insert into storage.buckets (id, name, public)
values ('fanart', 'fanart', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('upbo', 'upbo', true)
on conflict (id) do update set public = true;

drop policy if exists "public read fanart storage" on storage.objects;
drop policy if exists "public insert fanart storage" on storage.objects;
drop policy if exists "public delete fanart storage" on storage.objects;
drop policy if exists "public read upbo storage" on storage.objects;
drop policy if exists "public insert upbo storage" on storage.objects;
drop policy if exists "public delete upbo storage" on storage.objects;

create policy "public read fanart storage"
  on storage.objects for select
  using (bucket_id = 'fanart');

create policy "public insert fanart storage"
  on storage.objects for insert
  with check (bucket_id = 'fanart');

create policy "public delete fanart storage"
  on storage.objects for delete
  using (bucket_id = 'fanart');

create policy "public read upbo storage"
  on storage.objects for select
  using (bucket_id = 'upbo');

create policy "public insert upbo storage"
  on storage.objects for insert
  with check (bucket_id = 'upbo');

create policy "public delete upbo storage"
  on storage.objects for delete
  using (bucket_id = 'upbo');
