-- REVIEW ONLY. Read-only catalog checks; no fixture writes, repair or live acceptance.
-- One consolidated result survives SQL Editor's final-result display.
do $verify$
declare col record; role_name text; privilege text; f record; p record;
begin
  if (select count(*) from v3_internal.environment) <> 1 or not exists (
    select 1 from v3_internal.environment where singleton and schema_version = 1 and
      ((project_id = 'kjcvgjfwlmyfroiqlbmw' and purpose = 'disposable-v3-slice0-cloud') or
       (project_id = 'my-kravv-v3-local-01a14897' and purpose = 'disposable-v3-slice0'))
  ) then raise exception 'Wrong V3 identity'; end if;
  if not exists (select 1 from pg_class where oid='public.captures'::regclass and relrowsecurity and relkind='r') then raise exception 'Capture RLS missing'; end if;
  if (select count(*) from information_schema.columns where table_schema='public' and table_name='captures') <> 6 then raise exception 'Unexpected capture columns'; end if;
  for col in select * from information_schema.columns where table_schema='public' and table_name='captures' loop
    if not has_column_privilege('authenticated','public.captures',col.column_name,'SELECT') or
       has_column_privilege('authenticated','public.captures',col.column_name,'INSERT') is distinct from
        (col.column_name in ('user_id','request_id','company_id','raw_text')) or
       has_column_privilege('authenticated','public.captures',col.column_name,'UPDATE') then
      raise exception 'Unexpected capture column privilege';
    end if;
    foreach role_name in array array['anon','service_role'] loop
      foreach privilege in array array['SELECT','INSERT','UPDATE','REFERENCES'] loop
        if has_column_privilege(role_name,'public.captures',col.column_name,privilege) then raise exception 'Unexpected non-user column privilege'; end if;
      end loop;
    end loop;
    if col.data_type is distinct from (case when col.column_name='raw_text' then 'text' when col.column_name='created_at' then 'timestamp with time zone' else 'uuid' end) or
       col.is_nullable is distinct from (case when col.column_name='company_id' then 'YES' else 'NO' end) then raise exception 'Wrong capture column contract'; end if;
  end loop;
  foreach role_name in array array['authenticated','anon','service_role'] loop
    foreach privilege in array array['DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
      if has_table_privilege(role_name,'public.captures',privilege) then raise exception 'Unexpected capture table privilege'; end if;
    end loop;
  end loop;
  if has_schema_privilege('authenticated','v3_internal','USAGE') or has_schema_privilege('anon','v3_internal','USAGE') or
     has_schema_privilege('authenticated','public','CREATE') or has_schema_privilege('anon','public','CREATE') or
     has_table_privilege('authenticated','public.companies','DELETE') then raise exception 'Schema/Company boundary changed'; end if;
  if (select count(*) from pg_policy where polrelid='public.captures'::regclass) <> 2 then raise exception 'Unexpected capture policies'; end if;
  for p in select * from pg_policy where polrelid='public.captures'::regclass loop
    if not p.polpermissive or p.polroles <> array[(select oid from pg_roles where rolname='authenticated')] or
      not ((p.polname='captures_select_own' and p.polcmd='r' and p.polwithcheck is null and
        replace(regexp_replace(lower(pg_get_expr(p.polqual,p.polrelid)), '[[:space:]()]', '', 'g'),'asuid','')='selectauth.uid=user_id') or
       (p.polname='captures_insert_own' and p.polcmd='a' and p.polqual is null and
        replace(regexp_replace(lower(pg_get_expr(p.polwithcheck,p.polrelid)), '[[:space:]()]', '', 'g'),'asuid','')='selectauth.uid=user_id')) then raise exception 'Ownership policy differs'; end if;
  end loop;
  if not exists (select 1 from pg_constraint where conrelid='public.captures'::regclass and conname='captures_company_owner_fkey' and
    contype='f' and confrelid='public.companies'::regclass and confdeltype='r' and convalidated and not condeferrable and
    pg_get_constraintdef(oid) = 'FOREIGN KEY (company_id, user_id) REFERENCES companies(id, user_id) ON DELETE RESTRICT') then
    raise exception 'Composite restrictive company ownership FK differs';
  end if;
  if (select count(*) from pg_constraint where conrelid='public.captures'::regclass and convalidated and
      conname in ('captures_pkey','captures_user_id_fkey','captures_owner_request_key','captures_company_owner_fkey','captures_text_check')) <> 5 then raise exception 'Capture constraints missing'; end if;
  if (select count(*) from pg_index where indrelid='public.captures'::regclass and indisvalid and indisready) <> 4 then raise exception 'Capture indexes missing or unexpected'; end if;
  if exists (select 1 from pg_trigger where tgrelid='public.captures'::regclass and not tgisinternal) then raise exception 'Unexpected capture trigger'; end if;
  for f in select * from pg_proc where oid in ('public.v3_capture_contract()'::regprocedure,'public.v3_create_capture(uuid,text,uuid)'::regprocedure) loop
    if f.prosecdef or not exists (select 1 from unnest(f.proconfig) setting where setting ~ '^search_path=(""|)$') or
      not has_function_privilege('authenticated',f.oid,'EXECUTE') or has_function_privilege('anon',f.oid,'EXECUTE') or
      has_function_privilege('service_role',f.oid,'EXECUTE') then raise exception 'Unsafe capture RPC'; end if;
  end loop;
  if public.v3_capture_contract() is distinct from 1 then raise exception 'Wrong capture version'; end if;
end;
$verify$;
select jsonb_build_object(
  'assertions', 'PASS: catalog checks only; inspect definitions and run separately authorized two-user acceptance',
  'columns', (select jsonb_agg(jsonb_build_object('name',column_name,'type',data_type,'nullable',is_nullable,'default',column_default)) from information_schema.columns where table_schema='public' and table_name='captures'),
  'constraints', (select jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid),'validated',convalidated)) from pg_constraint where conrelid='public.captures'::regclass),
  'indexes', (select jsonb_agg(pg_get_indexdef(indexrelid)) from pg_index where indrelid='public.captures'::regclass),
  'policies', (select jsonb_agg(jsonb_build_object('name',policyname,'using',qual,'check',with_check,'roles',roles)) from pg_policies where schemaname='public' and tablename='captures'),
  'functions', (select jsonb_agg(pg_get_functiondef(oid)) from pg_proc where oid in ('public.v3_capture_contract()'::regprocedure,'public.v3_create_capture(uuid,text,uuid)'::regprocedure)),
  'triggers', (select coalesce(jsonb_agg(pg_get_triggerdef(oid)), '[]'::jsonb) from pg_trigger where tgrelid='public.captures'::regclass and not tgisinternal)
) as verification;
