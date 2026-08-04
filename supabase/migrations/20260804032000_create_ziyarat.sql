create table if not exists public.ziyarat (
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
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists ziyarat_published_classification_idx on public.ziyarat (is_published, classification);
create index if not exists ziyarat_created_at_idx on public.ziyarat (created_at desc);

create or replace function public.set_ziyarat_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  if tg_op = 'INSERT' then
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists set_ziyarat_audit_fields on public.ziyarat;
create trigger set_ziyarat_audit_fields
before insert or update on public.ziyarat
for each row execute function public.set_ziyarat_audit_fields();

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
