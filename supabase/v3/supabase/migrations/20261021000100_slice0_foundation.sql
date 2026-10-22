begin;

-- Fresh V3 only: no V2 migrations/data, capture/draft/history/AI schema or delete RPC.
create schema v3_internal;
revoke all on schema v3_internal from public, anon, authenticated, service_role;
create table v3_internal.environment (
  singleton boolean primary key default true check (singleton),
  project_id text not null,
  purpose text not null check (purpose = 'disposable-v3-slice0'),
  schema_version integer not null check (schema_version = 1)
);
insert into v3_internal.environment values
  (true, 'my-kravv-v3-local-01a14897', 'disposable-v3-slice0', 1);
revoke all on v3_internal.environment from public, anon, authenticated, service_role;

-- Public non-private environment identity, never owner/research records.
create function public.v3_target_identity()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('project_id', e.project_id, 'purpose', e.purpose,
    'schema_version', e.schema_version)
  from v3_internal.environment e where e.singleton = true;
$$;
revoke all on function public.v3_target_identity() from public, anon, authenticated;
grant execute on function public.v3_target_identity() to anon, authenticated, service_role;

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index companies_owner_created_idx on public.companies(user_id, created_at, id);

create function v3_internal.touch_company()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function v3_internal.touch_company() from public, anon, authenticated;
create trigger companies_touch_updated before update on public.companies
for each row execute function v3_internal.touch_company();

alter table public.user_settings enable row level security;
alter table public.companies enable row level security;
revoke all on public.user_settings, public.companies from public, anon, authenticated;
grant select on public.user_settings, public.companies to authenticated;
grant insert (user_id) on public.user_settings to authenticated;
grant insert (user_id, name) on public.companies to authenticated;
grant update (name) on public.companies to authenticated;
-- Service use is scoped synthetic fixture setup/cleanup, never app content access.
grant select, insert, update, delete on public.user_settings, public.companies to service_role;

create policy settings_select_own on public.user_settings
for select to authenticated using ((select auth.uid()) = user_id);
create policy settings_insert_own on public.user_settings
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy companies_select_own on public.companies
for select to authenticated using ((select auth.uid()) = user_id);
create policy companies_insert_own on public.companies
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy companies_update_own on public.companies
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- C1: no Company DELETE grant/policy, archive field or deletion RPC in Slice 0.
-- Future content requires indexed composite FK (company_id,user_id) referencing
-- companies(id,user_id) ON DELETE RESTRICT. A later narrow empty-delete RPC must
-- enumerate all children and pass create/delete race tests before exposure.
-- Never add research CASCADE/SET NULL edges or resurrect V2 delete_company.
notify pgrst, 'reload schema';
commit;
