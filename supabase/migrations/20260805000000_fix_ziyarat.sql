-- Ziyarat / Munajat fix — complete re-creation script.
-- Run this in the Supabase SQL Editor after dropping the old `ziyarat` table.
-- (If you prefer to keep existing rows, use the ALTER variant at the bottom instead.)

-- 1) Drop old table (and its triggers/policies) cleanly.
drop table if exists public.ziyarat cascade;

-- 2) Recreate with correct FKs against public.users (matches majalis/books/hadiths).
create table public.ziyarat (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  content_ar text not null,
  content_en text not null,
  classification text not null check (classification in ('ziyarat', 'munajat')),
  slug text not null unique,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  updated_by uuid references public.users(id) on delete set null default auth.uid()
);

create index if not exists ziyarat_published_classification_idx on public.ziyarat (is_published, classification);
create index if not exists ziyarat_created_at_idx on public.ziyarat (created_at desc);

-- 3) Audit trigger: fill created_by/updated_by from auth.uid() only when a real
--    Supabase user is present. Service-role writes (auth.uid() is null) keep the
--    values supplied by the app's server functions.
create or replace function public.set_ziyarat_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
begin
  new.updated_at = now();
  if current_uid is not null then
    new.updated_by = current_uid;
  end if;
  if tg_op = 'INSERT' and current_uid is not null then
    new.created_by = coalesce(new.created_by, current_uid);
  end if;
  return new;
end;
$$;

drop trigger if exists set_ziyarat_audit_fields on public.ziyarat;
create trigger set_ziyarat_audit_fields
before insert or update on public.ziyarat
for each row execute function public.set_ziyarat_audit_fields();

-- 4) Row Level Security.
alter table public.ziyarat enable row level security;

drop policy if exists "Public can read published ziyarat" on public.ziyarat;
create policy "Public can read published ziyarat"
on public.ziyarat
for select
using (
  is_published = true
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'editor')
);

drop policy if exists "Admins and editors can insert ziyarat" on public.ziyarat;
create policy "Admins and editors can insert ziyarat"
on public.ziyarat
for insert
to authenticated
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'editor'));

drop policy if exists "Admins and editors can update ziyarat" on public.ziyarat;
create policy "Admins and editors can update ziyarat"
on public.ziyarat
for update
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'editor'))
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'editor'));

drop policy if exists "Admins can delete ziyarat" on public.ziyarat;
create policy "Admins can delete ziyarat"
on public.ziyarat
for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

grant select on public.ziyarat to anon, authenticated;
grant insert, update on public.ziyarat to authenticated;
grant delete on public.ziyarat to authenticated;

-- 5) Realtime registration (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ziyarat'
  ) then
    alter publication supabase_realtime add table public.ziyarat;
  end if;
end $$;

-- ============================================================================
-- ALTERNATIVE: If you want to KEEP existing rows instead of dropping the table,
-- run only the block below (skip/comment the drop + recreate above).
-- ============================================================================
-- alter table public.ziyarat drop constraint if exists ziyarat_created_by_fkey;
-- alter table public.ziyarat drop constraint if exists ziyarat_updated_by_fkey;
-- alter table public.ziyarat
--   add constraint ziyarat_created_by_fkey
--   foreign key (created_by) references public.users(id) on delete set null;
-- alter table public.ziyarat
--   add constraint ziyarat_updated_by_fkey
--   foreign key (updated_by) references public.users(id) on delete set null;
-- create or replace function public.set_ziyarat_audit_fields() ... (same as above)
-- do $$ ... add to supabase_realtime ... $$;
