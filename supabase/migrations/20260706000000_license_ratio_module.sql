create table if not exists public.database_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_editable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists database_modules_set_updated_at on public.database_modules;
create trigger database_modules_set_updated_at
before update on public.database_modules
for each row execute function public.set_updated_at();

insert into public.database_modules (slug, name, description, is_editable)
values (
  'capacity_license_ratio',
  '备案产能和自动进口证发放比例',
  '按企业维护备案产能、年度自动进口许可证额度，并自动计算发放比例。',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_editable = excluded.is_editable,
  updated_at = now();

alter table public.enterprises
  add column if not exists module_id uuid references public.database_modules(id),
  add column if not exists region_label text,
  add column if not exists license_2025_tons numeric(14, 2),
  add column if not exists license_2026_tons numeric(14, 2);

update public.enterprises
set module_id = (select id from public.database_modules where slug = 'capacity_license_ratio')
where module_id is null;

create index if not exists enterprises_module_id_idx on public.enterprises(module_id);
create index if not exists enterprises_region_label_idx on public.enterprises(region_label);

create or replace view public.enterprise_license_dashboard
with (security_invoker = true)
as
select
  e.*,
  m.slug as module_slug,
  m.name as module_name,
  case
    when e.capacity_10k_tons > 0 and e.license_2025_tons is not null
      then e.license_2025_tons / nullif(e.capacity_10k_tons * 10000, 0)
    else null
  end as license_2025_ratio,
  case
    when e.capacity_10k_tons > 0 and e.license_2026_tons is not null
      then e.license_2026_tons / nullif(e.capacity_10k_tons * 10000, 0)
    else null
  end as license_2026_ratio
from public.enterprises e
left join public.database_modules m on m.id = e.module_id;

create table if not exists public.record_audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reverted_at timestamptz,
  reverted_by uuid references auth.users(id)
);

create index if not exists record_audit_logs_record_idx
on public.record_audit_logs(table_name, record_id, created_at desc);

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

create or replace function public.log_enterprise_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  if coalesce(current_setting('app.skip_audit', true), '') = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    actor := coalesce(new.created_by, new.updated_by, auth.uid());
    insert into public.record_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values ('enterprises', new.id, 'INSERT', null, to_jsonb(new), actor);
    return new;
  elsif tg_op = 'UPDATE' then
    actor := coalesce(new.updated_by, new.created_by, auth.uid());
    insert into public.record_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values ('enterprises', new.id, 'UPDATE', to_jsonb(old), to_jsonb(new), actor);
    return new;
  elsif tg_op = 'DELETE' then
    actor := coalesce(old.updated_by, old.created_by, auth.uid());
    insert into public.record_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values ('enterprises', old.id, 'DELETE', to_jsonb(old), null, actor);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enterprises_audit_log on public.enterprises;
create trigger enterprises_audit_log
after insert or update or delete on public.enterprises
for each row execute function public.log_enterprise_change();

create or replace function public.restore_enterprise_change(change_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  change public.record_audit_logs%rowtype;
  old_record jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select *
  into change
  from public.record_audit_logs
  where id = change_id and table_name = 'enterprises'
  for update;

  if not found then
    raise exception 'change not found';
  end if;

  if change.reverted_at is not null then
    raise exception 'change already reverted';
  end if;

  perform set_config('app.skip_audit', 'on', true);

  if change.action = 'INSERT' then
    delete from public.enterprises where id = change.record_id;
  elsif change.action = 'DELETE' then
    old_record := change.old_data;
    insert into public.enterprises (
      id, module_id, code, enterprise_name, province, city, region_label, group_name,
      capacity_10k_tons, license_2025_tons, license_2026_tons, status,
      source_document, notes, created_by, updated_by, created_at, updated_at
    )
    values (
      (old_record->>'id')::uuid,
      nullif(old_record->>'module_id', '')::uuid,
      old_record->>'code',
      old_record->>'enterprise_name',
      old_record->>'province',
      old_record->>'city',
      old_record->>'region_label',
      coalesce(old_record->>'group_name', '其他'),
      coalesce((old_record->>'capacity_10k_tons')::numeric, 0),
      nullif(old_record->>'license_2025_tons', '')::numeric,
      nullif(old_record->>'license_2026_tons', '')::numeric,
      coalesce(old_record->>'status', '已备案'),
      old_record->>'source_document',
      old_record->>'notes',
      nullif(old_record->>'created_by', '')::uuid,
      auth.uid(),
      coalesce((old_record->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do update
    set
      module_id = excluded.module_id,
      code = excluded.code,
      enterprise_name = excluded.enterprise_name,
      province = excluded.province,
      city = excluded.city,
      region_label = excluded.region_label,
      group_name = excluded.group_name,
      capacity_10k_tons = excluded.capacity_10k_tons,
      license_2025_tons = excluded.license_2025_tons,
      license_2026_tons = excluded.license_2026_tons,
      status = excluded.status,
      source_document = excluded.source_document,
      notes = excluded.notes,
      updated_by = auth.uid(),
      updated_at = now();
  elsif change.action = 'UPDATE' then
    old_record := change.old_data;
    update public.enterprises
    set
      module_id = nullif(old_record->>'module_id', '')::uuid,
      code = old_record->>'code',
      enterprise_name = old_record->>'enterprise_name',
      province = old_record->>'province',
      city = old_record->>'city',
      region_label = old_record->>'region_label',
      group_name = coalesce(old_record->>'group_name', '其他'),
      capacity_10k_tons = coalesce((old_record->>'capacity_10k_tons')::numeric, 0),
      license_2025_tons = nullif(old_record->>'license_2025_tons', '')::numeric,
      license_2026_tons = nullif(old_record->>'license_2026_tons', '')::numeric,
      status = coalesce(old_record->>'status', '已备案'),
      source_document = old_record->>'source_document',
      notes = old_record->>'notes',
      updated_by = auth.uid(),
      updated_at = now()
    where id = change.record_id;
  end if;

  update public.record_audit_logs
  set reverted_at = now(), reverted_by = auth.uid()
  where id = change.id;
end;
$$;

grant execute on function public.restore_enterprise_change(uuid) to authenticated;
grant select on public.enterprise_license_dashboard to authenticated;

alter table public.database_modules enable row level security;
alter table public.record_audit_logs enable row level security;

drop policy if exists "database_modules_select_authenticated" on public.database_modules;
create policy "database_modules_select_authenticated"
on public.database_modules
for select
to authenticated
using (true);

drop policy if exists "database_modules_insert_authenticated" on public.database_modules;
create policy "database_modules_insert_authenticated"
on public.database_modules
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "database_modules_update_authenticated" on public.database_modules;
create policy "database_modules_update_authenticated"
on public.database_modules
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "database_modules_delete_authenticated" on public.database_modules;
create policy "database_modules_delete_authenticated"
on public.database_modules
for delete
to authenticated
using (public.can_edit());

drop policy if exists "record_audit_logs_select_authenticated" on public.record_audit_logs;
create policy "record_audit_logs_select_authenticated"
on public.record_audit_logs
for select
to authenticated
using (true);

drop policy if exists "record_audit_logs_update_authenticated" on public.record_audit_logs;
create policy "record_audit_logs_update_authenticated"
on public.record_audit_logs
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "enterprises_insert_editors" on public.enterprises;
drop policy if exists "enterprises_update_editors" on public.enterprises;
drop policy if exists "enterprises_delete_admins" on public.enterprises;
drop policy if exists "enterprises_insert_authenticated" on public.enterprises;
drop policy if exists "enterprises_update_authenticated" on public.enterprises;
drop policy if exists "enterprises_delete_authenticated" on public.enterprises;

create policy "enterprises_insert_authenticated"
on public.enterprises
for insert
to authenticated
with check (public.can_edit());

create policy "enterprises_update_authenticated"
on public.enterprises
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

create policy "enterprises_delete_authenticated"
on public.enterprises
for delete
to authenticated
using (public.can_edit());

drop policy if exists "import_reports_insert_editors" on public.import_reports;
drop policy if exists "import_reports_update_editors" on public.import_reports;
drop policy if exists "import_reports_delete_admins" on public.import_reports;
drop policy if exists "import_reports_insert_authenticated" on public.import_reports;
drop policy if exists "import_reports_update_authenticated" on public.import_reports;
drop policy if exists "import_reports_delete_authenticated" on public.import_reports;

create policy "import_reports_insert_authenticated"
on public.import_reports
for insert
to authenticated
with check (public.can_edit());

create policy "import_reports_update_authenticated"
on public.import_reports
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

create policy "import_reports_delete_authenticated"
on public.import_reports
for delete
to authenticated
using (public.can_edit());

drop policy if exists "documents_insert_editors" on public.documents;
drop policy if exists "documents_update_editors" on public.documents;
drop policy if exists "documents_delete_admins" on public.documents;
drop policy if exists "documents_insert_authenticated" on public.documents;
drop policy if exists "documents_update_authenticated" on public.documents;
drop policy if exists "documents_delete_authenticated" on public.documents;

create policy "documents_insert_authenticated"
on public.documents
for insert
to authenticated
with check (public.can_edit());

create policy "documents_update_authenticated"
on public.documents
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

create policy "documents_delete_authenticated"
on public.documents
for delete
to authenticated
using (public.can_edit());
