create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

insert into public.database_modules (slug, name, description, is_editable)
values (
  'port_agency_info',
  '港口与船代信息',
  '维护港口吃水、码头泊位、最大载重吨、特殊要求和船代通讯录。',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_editable = excluded.is_editable,
  updated_at = now();

create table if not exists public.port_berths (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.database_modules(id),
  code text not null unique,
  location text,
  port_name text not null,
  terminal_name text,
  berth text,
  draft_m numeric(8, 2),
  max_dwt_tons numeric(14, 2),
  summer_density text,
  special_requirements text,
  source_document text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_agents (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.database_modules(id),
  code text not null unique,
  port_name text not null,
  agency_name text,
  address text,
  tel text,
  fax text,
  email text,
  contact_persons text,
  raw_text text,
  source_document text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists port_berths_set_updated_at on public.port_berths;
create trigger port_berths_set_updated_at
before update on public.port_berths
for each row execute function public.set_updated_at();

drop trigger if exists shipping_agents_set_updated_at on public.shipping_agents;
create trigger shipping_agents_set_updated_at
before update on public.shipping_agents
for each row execute function public.set_updated_at();

create index if not exists port_berths_module_id_idx on public.port_berths(module_id);
create index if not exists port_berths_port_name_idx on public.port_berths(port_name);
create index if not exists port_berths_location_idx on public.port_berths(location);
create index if not exists port_berths_draft_idx on public.port_berths(draft_m);
create index if not exists shipping_agents_module_id_idx on public.shipping_agents(module_id);
create index if not exists shipping_agents_port_name_idx on public.shipping_agents(port_name);

create or replace function public.log_module_record_change()
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
    values (tg_table_name, new.id, 'INSERT', null, to_jsonb(new), actor);
    return new;
  elsif tg_op = 'UPDATE' then
    actor := coalesce(new.updated_by, new.created_by, auth.uid());
    insert into public.record_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id, 'UPDATE', to_jsonb(old), to_jsonb(new), actor);
    return new;
  elsif tg_op = 'DELETE' then
    actor := coalesce(old.updated_by, old.created_by, auth.uid());
    insert into public.record_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, old.id, 'DELETE', to_jsonb(old), null, actor);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists port_berths_audit_log on public.port_berths;
create trigger port_berths_audit_log
after insert or update or delete on public.port_berths
for each row execute function public.log_module_record_change();

drop trigger if exists shipping_agents_audit_log on public.shipping_agents;
create trigger shipping_agents_audit_log
after insert or update or delete on public.shipping_agents
for each row execute function public.log_module_record_change();

alter table public.port_berths enable row level security;
alter table public.shipping_agents enable row level security;

drop policy if exists "port_berths_select_authenticated" on public.port_berths;
create policy "port_berths_select_authenticated"
on public.port_berths
for select
to authenticated
using (true);

drop policy if exists "port_berths_insert_authenticated" on public.port_berths;
create policy "port_berths_insert_authenticated"
on public.port_berths
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "port_berths_update_authenticated" on public.port_berths;
create policy "port_berths_update_authenticated"
on public.port_berths
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "port_berths_delete_authenticated" on public.port_berths;
create policy "port_berths_delete_authenticated"
on public.port_berths
for delete
to authenticated
using (public.can_edit());

drop policy if exists "shipping_agents_select_authenticated" on public.shipping_agents;
create policy "shipping_agents_select_authenticated"
on public.shipping_agents
for select
to authenticated
using (true);

drop policy if exists "shipping_agents_insert_authenticated" on public.shipping_agents;
create policy "shipping_agents_insert_authenticated"
on public.shipping_agents
for insert
to authenticated
with check (public.can_edit());

drop policy if exists "shipping_agents_update_authenticated" on public.shipping_agents;
create policy "shipping_agents_update_authenticated"
on public.shipping_agents
for update
to authenticated
using (public.can_edit())
with check (public.can_edit());

drop policy if exists "shipping_agents_delete_authenticated" on public.shipping_agents;
create policy "shipping_agents_delete_authenticated"
on public.shipping_agents
for delete
to authenticated
using (public.can_edit());

grant select, insert, update, delete on public.port_berths to authenticated;
grant select, insert, update, delete on public.shipping_agents to authenticated;
