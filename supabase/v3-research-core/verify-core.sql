-- READ ONLY catalog assertions. No repairs, migration execution or fixtures.
do $verify$
declare t text;col record;f record;privilege text;
begin
 if (select count(*) from v3_internal.environment)<>1 or not exists(select 1 from v3_internal.environment where project_id='kjcvgjfwlmyfroiqlbmw' and purpose='disposable-v3-slice0-cloud' and schema_version=1 and singleton) then raise exception 'Wrong V3 environment';end if;
 if public.v3_research_contract() is distinct from 1 then raise exception 'Wrong research contract';end if;
 foreach t in array array['research_drafts','research_thoughts','research_versions'] loop
  if not exists(select 1 from pg_class where oid=('public.'||t)::regclass and relrowsecurity) then raise exception 'Missing RLS: %',t;end if;
  if (select count(*) from pg_policy where polrelid=('public.'||t)::regclass)<>1 or not exists(select 1 from pg_policy p where p.polrelid=('public.'||t)::regclass and p.polcmd='r' and p.polpermissive and p.polroles=array[(select oid from pg_roles where rolname='authenticated')] and p.polwithcheck is null and replace(regexp_replace(lower(pg_get_expr(p.polqual,p.polrelid)),'[[:space:]()]','','g'),'asuid','')='selectauth.uid=user_id') then raise exception 'Wrong owner policy: %',t;end if;
  for col in select column_name from information_schema.columns where table_schema='public' and table_name=t loop
   if not has_column_privilege('authenticated','public.'||t,col.column_name,'SELECT') then raise exception 'Missing owner read';end if;
   foreach privilege in array array['INSERT','UPDATE','REFERENCES'] loop
    if has_column_privilege('authenticated','public.'||t,col.column_name,privilege) or has_column_privilege('anon','public.'||t,col.column_name,privilege) then raise exception 'Unexpected write privilege';end if;
   end loop;
   if has_column_privilege('anon','public.'||t,col.column_name,'SELECT') then raise exception 'Anonymous read';end if;
  end loop;
  foreach privilege in array array['DELETE','TRUNCATE','TRIGGER'] loop
   if has_table_privilege('authenticated','public.'||t,privilege) or has_table_privilege('anon','public.'||t,privilege) then raise exception 'Unexpected destructive privilege';end if;
  end loop;
  if exists(select 1 from pg_constraint where conrelid=('public.'||t)::regclass and (not convalidated or contype='f' and confdeltype<>'r')) then raise exception 'Unsafe FK or invalid constraint';end if;
  if exists(select 1 from pg_index where indrelid=('public.'||t)::regclass and (not indisvalid or not indisready)) then raise exception 'Invalid index';end if;
 end loop;
 if not exists(select 1 from pg_trigger where tgrelid='public.research_versions'::regclass and tgname='research_versions_immutable' and tgenabled='O' and tgfoid='v3_internal.research_immutable()'::regprocedure) or not exists(select 1 from pg_trigger where tgrelid='public.research_drafts'::regclass and tgname='research_source_owner' and tgenabled='O' and tgfoid='v3_internal.research_source_owner()'::regprocedure) then raise exception 'Required trigger missing';end if;
 if has_schema_privilege('authenticated','v3_internal','USAGE') or has_schema_privilege('anon','v3_internal','USAGE') or has_table_privilege('authenticated','v3_internal.research_operations','SELECT') or has_table_privilege('authenticated','public.companies','DELETE') then raise exception 'Internal/Company boundary changed';end if;
 for f in select * from pg_proc where oid in ('public.v3_research_contract()'::regprocedure,'public.v3_create_research(uuid,text,uuid,uuid,text)'::regprocedure,'public.v3_save_research(uuid,uuid,integer,text,text,uuid,text)'::regprocedure,'public.v3_commit_research(uuid,uuid,integer,integer,text)'::regprocedure,'public.v3_restore_research(uuid,uuid,integer,uuid)'::regprocedure) loop
  if not exists(select 1 from unnest(f.proconfig) s where s ~ '^search_path=(""|)$') or has_function_privilege('anon',f.oid,'EXECUTE') or not has_function_privilege('authenticated',f.oid,'EXECUTE') or (f.oid<>'public.v3_research_contract()'::regprocedure and not f.prosecdef) then raise exception 'Unsafe RPC configuration';end if;
 end loop;
end;$verify$;
select jsonb_build_object(
 'assertions','PASS: catalog checks only; inspect every definition and separately test transactions/RLS',
 'constraints',(select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'definition',pg_get_constraintdef(oid))) from pg_constraint where conrelid in ('public.research_drafts'::regclass,'public.research_thoughts'::regclass,'public.research_versions'::regclass)),
 'indexes',(select jsonb_agg(pg_get_indexdef(indexrelid)) from pg_index where indrelid in ('public.research_drafts'::regclass,'public.research_thoughts'::regclass,'public.research_versions'::regclass)),
 'triggers',(select jsonb_agg(pg_get_triggerdef(oid)) from pg_trigger where tgrelid in ('public.research_drafts'::regclass,'public.research_versions'::regclass) and not tgisinternal),
 'functions',(select jsonb_agg(pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname in ('v3_research_contract','v3_create_research','v3_save_research','v3_commit_research','v3_restore_research')) or (n.nspname='v3_internal' and p.proname like 'research_%'))
) as verification;
