create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enterprises (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  enterprise_name text not null,
  province text,
  city text,
  group_name text not null default '其他',
  capacity_10k_tons numeric(12, 2) not null default 0,
  status text not null default '已备案',
  source_document text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_reports (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null references public.enterprises(id) on delete cascade,
  product_name text not null default '原糖',
  contract_volume_tons numeric(14, 2),
  arrival_port text,
  origin_country text,
  report_status text not null default '待填报',
  license_quota_deduction_tons numeric(14, 2),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid references public.enterprises(id) on delete set null,
  import_report_id uuid references public.import_reports(id) on delete set null,
  file_name text not null,
  document_type text,
  storage_path text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists enterprises_set_updated_at on public.enterprises;
create trigger enterprises_set_updated_at
before update on public.enterprises
for each row execute function public.set_updated_at();

drop trigger if exists import_reports_set_updated_at on public.import_reports;
create trigger import_reports_set_updated_at
before update on public.import_reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer');
$$;

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'editor');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_edit() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.enterprises enable row level security;
alter table public.import_reports enable row level security;
alter table public.documents enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "enterprises_select_authenticated" on public.enterprises;
create policy "enterprises_select_authenticated"
on public.enterprises
for select
to authenticated
using (true);

drop policy if exists "enterprises_insert_editors" on public.enterprises;
create policy "enterprises_insert_editors"
on public.enterprises
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "enterprises_update_editors" on public.enterprises;
create policy "enterprises_update_editors"
on public.enterprises
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "enterprises_delete_admins" on public.enterprises;
create policy "enterprises_delete_admins"
on public.enterprises
for delete
to authenticated
using (public.is_admin());

drop policy if exists "import_reports_select_authenticated" on public.import_reports;
create policy "import_reports_select_authenticated"
on public.import_reports
for select
to authenticated
using (true);

drop policy if exists "import_reports_insert_editors" on public.import_reports;
create policy "import_reports_insert_editors"
on public.import_reports
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "import_reports_update_editors" on public.import_reports;
create policy "import_reports_update_editors"
on public.import_reports
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "import_reports_delete_admins" on public.import_reports;
create policy "import_reports_delete_admins"
on public.import_reports
for delete
to authenticated
using (public.is_admin());

drop policy if exists "documents_select_authenticated" on public.documents;
create policy "documents_select_authenticated"
on public.documents
for select
to authenticated
using (true);

drop policy if exists "documents_insert_editors" on public.documents;
create policy "documents_insert_editors"
on public.documents
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "documents_update_editors" on public.documents;
create policy "documents_update_editors"
on public.documents
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "documents_delete_admins" on public.documents;
create policy "documents_delete_admins"
on public.documents
for delete
to authenticated
using (public.is_admin());
