-- REVIEW ONLY. Read-only catalog assertions after separately approved migration.
-- A successful catalog check does NOT replace two-user live Auth/RLS/HTTP tests.
do $verify$
declare f record; col record;
begin
  if not exists (select 1 from v3_internal.environment where singleton and schema_version = 1 and
    ((project_id = 'kjcvgjfwlmyfroiqlbmw' and purpose = 'disposable-v3-slice0-cloud') or
     (project_id = 'my-kravv-v3-local-01a14897' and purpose = 'disposable-v3-slice0'))) then
    raise exception 'Wrong V3 marker';
  end if;
  if (select count(*) from information_schema.columns where table_schema='public' and
      ((table_name='companies' and column_name in ('ticker','exchange','sector','short_note')) or
       (table_name='user_settings' and column_name='theme'))) <> 5 then raise exception 'Missing management columns'; end if;
  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
      and c.relname in ('companies','user_settings') and c.relrowsecurity) <> 2 then raise exception 'RLS missing'; end if;
  if has_column_privilege('authenticated','public.companies','user_id','UPDATE') or
     has_column_privilege('authenticated','public.companies','id','UPDATE') or
     has_column_privilege('authenticated','public.user_settings','user_id','UPDATE') or
     has_table_privilege('authenticated','public.companies','DELETE') or
     has_table_privilege('anon','public.companies','SELECT') or
     has_schema_privilege('authenticated','v3_internal','USAGE') then raise exception 'Unexpected effective privilege'; end if;
  if not has_column_privilege('authenticated','public.companies','short_note','UPDATE') or
     not has_column_privilege('authenticated','public.user_settings','theme','UPDATE') then raise exception 'Required column privileges missing'; end if;
  for col in select * from (values ('companies','ticker'),('companies','exchange'),('companies','sector'),('companies','short_note'),('user_settings','theme')) as fields(table_name,column_name) loop
    if not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'SELECT') or
       not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'INSERT') or
       not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'UPDATE') then raise exception 'Required metadata access missing'; end if;
    if not exists (select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
      where c.conrelid=('public.' || col.table_name)::regclass and c.contype='c' and c.convalidated and a.attname=col.column_name) then raise exception 'Validated field constraint missing'; end if;
  end loop;
  if not exists (select 1 from pg_policy where polrelid='public.user_settings'::regclass and polname='settings_update_own'
    and polcmd='w' and pg_get_expr(polqual,polrelid) like '%auth.uid()%'
    and pg_get_expr(polwithcheck,polrelid) like '%auth.uid()%') then raise exception 'Owned settings update policy missing'; end if;
  for f in select * from pg_proc where oid in ('public.v3_company_management_contract()'::regprocedure,'public.v3_company_directory(text,integer)'::regprocedure) loop
    if f.prosecdef or not exists (select 1 from unnest(f.proconfig) setting where setting ~ '^search_path=(""|)$') then raise exception 'Unsafe function configuration'; end if;
    if has_function_privilege('anon',f.oid,'EXECUTE') or not has_function_privilege('authenticated',f.oid,'EXECUTE') then raise exception 'Unexpected function privileges'; end if;
  end loop;
  if public.v3_company_management_contract() <> 1 then raise exception 'Wrong management contract'; end if;
end;
$verify$;
select 'PASS: catalog assertions only; live two-user acceptance remains required' as result;
