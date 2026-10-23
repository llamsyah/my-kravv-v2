-- REVIEW ONLY: additive Slice 1 migration. Not wired into any startup/reset command.
begin;
do $guard$
begin
  if (select count(*) from v3_internal.environment) <> 1 or not exists (
    select 1 from v3_internal.environment where singleton and schema_version = 1 and
      ((project_id = 'kjcvgjfwlmyfroiqlbmw' and purpose = 'disposable-v3-slice0-cloud') or
       (project_id = 'my-kravv-v3-local-01a14897' and purpose = 'disposable-v3-slice0'))
  ) then raise exception 'Refusing unknown V3 environment'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and
    ((table_name = 'companies' and column_name in ('ticker','exchange','sector','short_note')) or
     (table_name = 'user_settings' and column_name = 'theme'))) then
    raise exception 'Existing management columns require explicit reconciliation';
  end if;
  if (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('companies','user_settings') and c.relrowsecurity) <> 2 then
    raise exception 'Required V3 RLS is missing';
  end if;
end;
$guard$;

alter table public.companies
  add column ticker text check (ticker is null or (length(btrim(ticker)) between 1 and 32 and ticker !~ '[[:cntrl:]]')),
  add column exchange text check (exchange is null or (length(btrim(exchange)) between 1 and 80 and exchange !~ '[[:cntrl:]]')),
  add column sector text check (sector is null or (length(btrim(sector)) between 1 and 120 and sector !~ '[[:cntrl:]]')),
  add column short_note text check (short_note is null or length(btrim(short_note)) between 1 and 2000);
alter table public.user_settings add column theme text not null default 'light' check (theme in ('light','dark'));

grant insert (ticker, exchange, sector, short_note), update (ticker, exchange, sector, short_note) on public.companies to authenticated;
grant insert (theme), update (theme) on public.user_settings to authenticated;
create policy settings_update_own on public.user_settings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A capability version, not execution approval or an authorization bypass.
create function public.v3_company_management_contract()
returns integer language sql stable security invoker set search_path = '' as $$ select 1; $$;
revoke all on function public.v3_company_management_contract() from public, anon;
grant execute on function public.v3_company_management_contract() to authenticated;

create function public.v3_company_directory(p_query text, p_page integer)
returns setof public.companies language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_query is null or length(p_query) > 200 or p_page is null or p_page < 0 or p_page > 10000 then
    raise exception 'Invalid company directory request';
  end if;
  return query select c.* from public.companies c
    where c.user_id = (select auth.uid()) and
      (p_query = '' or position(lower(p_query) in lower(c.name)) > 0 or
       position(lower(p_query) in lower(coalesce(c.ticker, ''))) > 0)
    order by c.created_at, c.id limit 25 offset p_page * 24;
end;
$$;
revoke all on function public.v3_company_directory(text, integer) from public, anon;
grant execute on function public.v3_company_directory(text, integer) to authenticated;
-- No ownership/id/timestamp UPDATE, DELETE permission, deletion RPC or RLS bypass.
notify pgrst, 'reload schema';
commit;
