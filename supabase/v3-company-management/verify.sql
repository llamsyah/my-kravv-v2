-- REVIEW ONLY. Read-only catalog assertions after separately approved migration.
-- A successful catalog check does NOT replace two-user live Auth/RLS/HTTP tests.
do $verify$
declare f record; col record; policy record; privilege text; expected_insert boolean; expected_update boolean;
begin
  if (select count(*) from v3_internal.environment) <> 1 or not exists (select 1 from v3_internal.environment where singleton and schema_version = 1 and
    ((project_id = 'kjcvgjfwlmyfroiqlbmw' and purpose = 'disposable-v3-slice0-cloud') or
     (project_id = 'my-kravv-v3-local-01a14897' and purpose = 'disposable-v3-slice0'))) then
    raise exception 'Wrong V3 marker';
  end if;
  if (select count(*) from information_schema.columns where table_schema='public' and
      ((table_name='companies' and column_name in ('ticker','exchange','sector','short_note')) or
       (table_name='user_settings' and column_name='theme'))) <> 5 then raise exception 'Missing management columns'; end if;
  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
      and c.relname in ('companies','user_settings') and c.relrowsecurity) <> 2 then raise exception 'RLS missing'; end if;
  -- Effective checks include inherited/PUBLIC and column-level privileges.
  for col in select table_name, column_name from information_schema.columns
    where table_schema='public' and table_name in ('companies','user_settings') loop
    expected_insert := (col.table_name='companies' and col.column_name in ('user_id','name','ticker','exchange','sector','short_note'))
      or (col.table_name='user_settings' and col.column_name in ('user_id','theme'));
    expected_update := (col.table_name='companies' and col.column_name in ('name','ticker','exchange','sector','short_note'))
      or (col.table_name='user_settings' and col.column_name='theme');
    if not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'SELECT') or
       has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'INSERT') is distinct from expected_insert or
       has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'UPDATE') is distinct from expected_update then
      raise exception 'Unexpected authenticated column access: %.%', col.table_name, col.column_name;
    end if;
    foreach privilege in array array['SELECT','INSERT','UPDATE','REFERENCES'] loop
      if has_column_privilege('anon','public.' || col.table_name,col.column_name,privilege) or
        (privilege='REFERENCES' and has_column_privilege('authenticated','public.' || col.table_name,col.column_name,privilege)) then
        raise exception 'Unexpected effective column privilege';
      end if;
    end loop;
  end loop;
  foreach privilege in array array['DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege('authenticated','public.companies',privilege) or
       has_table_privilege('authenticated','public.user_settings',privilege) or
       has_table_privilege('anon','public.companies',privilege) or
       has_table_privilege('anon','public.user_settings',privilege) then raise exception 'Unexpected table privilege'; end if;
  end loop;
  if has_schema_privilege('authenticated','v3_internal','USAGE') or has_schema_privilege('anon','v3_internal','USAGE') or
     has_schema_privilege('authenticated','public','CREATE') or has_schema_privilege('anon','public','CREATE') then
    raise exception 'Unexpected schema access';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and
    ((table_name='companies' and column_name in ('ticker','exchange','sector','short_note') and
      (data_type<>'text' or is_nullable<>'YES' or column_default is not null)) or
     (table_name='user_settings' and column_name='theme' and
      (data_type<>'text' or is_nullable<>'NO' or column_default is distinct from $$'light'::text$$)))) then
    raise exception 'Wrong metadata type, nullability or theme default';
  end if;
  for col in select * from (values ('companies','ticker'),('companies','exchange'),('companies','sector'),('companies','short_note'),('user_settings','theme')) as fields(table_name,column_name) loop
    if not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'SELECT') or
       not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'INSERT') or
       not has_column_privilege('authenticated','public.' || col.table_name,col.column_name,'UPDATE') then raise exception 'Required metadata access missing'; end if;
    if not exists (select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
      where c.conrelid=('public.' || col.table_name)::regclass and c.contype='c' and c.convalidated and a.attname=col.column_name) then raise exception 'Validated field constraint missing'; end if;
  end loop;
  -- Exact policy set, commands, roles and normalized owner expressions. A substring
  -- match would incorrectly accept auth.uid() = user_id OR true.
  if (select count(*) from pg_policy where polrelid in ('public.companies'::regclass,'public.user_settings'::regclass)) <> 6 then
    raise exception 'Unexpected ownership policy set';
  end if;
  for policy in select * from (values
    ('companies','companies_select_own','r',true,false),
    ('companies','companies_insert_own','a',false,true),
    ('companies','companies_update_own','w',true,true),
    ('user_settings','settings_select_own','r',true,false),
    ('user_settings','settings_insert_own','a',false,true),
    ('user_settings','settings_update_own','w',true,true)
  ) as expected(table_name,policy_name,command,has_using,has_check) loop
    if not exists (select 1 from pg_policy p where p.polrelid=('public.' || policy.table_name)::regclass and
      p.polname=policy.policy_name and p.polcmd::text=policy.command and p.polpermissive and
      p.polroles=array[(select oid from pg_roles where rolname='authenticated')] and
      case when policy.has_using then
        replace(regexp_replace(lower(pg_get_expr(p.polqual,p.polrelid)), '[[:space:]()]', '', 'g'),'asuid','')='selectauth.uid=user_id'
        else p.polqual is null end and
      case when policy.has_check then
        replace(regexp_replace(lower(pg_get_expr(p.polwithcheck,p.polrelid)), '[[:space:]()]', '', 'g'),'asuid','')='selectauth.uid=user_id'
        else p.polwithcheck is null end) then
      raise exception 'Ownership policy differs: %', policy.policy_name;
    end if;
  end loop;
  for f in select * from pg_proc where oid in ('public.v3_company_management_contract()'::regprocedure,'public.v3_company_directory(text,integer)'::regprocedure) loop
    if f.prosecdef or not exists (select 1 from unnest(f.proconfig) setting where setting ~ '^search_path=(""|)$') then raise exception 'Unsafe function configuration'; end if;
    if has_function_privilege('anon',f.oid,'EXECUTE') or not has_function_privilege('authenticated',f.oid,'EXECUTE') then raise exception 'Unexpected function privileges'; end if;
  end loop;
  if public.v3_company_management_contract() <> 1 then raise exception 'Wrong management contract'; end if;
end;
$verify$;
-- One final result survives SQL Editor's last-result display. Definitions below
-- are OBSERVATIONS requiring owner comparison with the reviewed SQL, not proof.
select jsonb_build_object(
  'assertions', 'PASS: catalog assertions only; definition review and live acceptance still required',
  'observed_constraints', (select jsonb_agg(jsonb_build_object('table', conrelid::regclass::text,
    'name', conname, 'definition', pg_get_constraintdef(oid), 'validated', convalidated))
    from pg_constraint where conrelid in ('public.companies'::regclass,'public.user_settings'::regclass)),
  'observed_indexes', (select jsonb_agg(jsonb_build_object('name', indexrelid::regclass::text,
    'definition', pg_get_indexdef(indexrelid), 'valid', indisvalid, 'ready', indisready))
    from pg_index where indrelid in ('public.companies'::regclass,'public.user_settings'::regclass)),
  'observed_triggers', (select jsonb_agg(jsonb_build_object('definition', pg_get_triggerdef(oid),
    'enabled', tgenabled)) from pg_trigger where tgrelid='public.companies'::regclass and not tgisinternal)
) as verification;
