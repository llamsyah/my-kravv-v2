-- READ ONLY. Run only after separately approved 002 deployment.
do $verify$
declare f record;col record;
begin
 if public.v3_research_contract() is distinct from 1 or public.v3_research_ai_contract() is distinct from 1 or not exists(select 1 from v3_internal.environment where project_id='kjcvgjfwlmyfroiqlbmw' and purpose='disposable-v3-slice0-cloud' and schema_version=1 and singleton) then raise exception 'Wrong AI target';end if;
 if not exists(select 1 from pg_class where oid='public.research_ai_runs'::regclass and relrowsecurity) then raise exception 'AI RLS missing';end if;
 for col in select column_name from information_schema.columns where table_schema='public' and table_name='research_ai_runs' loop
  if has_column_privilege('authenticated','public.research_ai_runs',col.column_name,'INSERT') or has_column_privilege('authenticated','public.research_ai_runs',col.column_name,'UPDATE') or has_column_privilege('anon','public.research_ai_runs',col.column_name,'SELECT') then raise exception 'Unexpected AI column access';end if;
  if has_column_privilege('authenticated','public.research_ai_runs',col.column_name,'SELECT') is distinct from (col.column_name not in ('reserved_idr','payload_hash')) then raise exception 'Wrong AI projection';end if;
 end loop;
 if has_table_privilege('authenticated','public.research_ai_runs','DELETE') or has_table_privilege('authenticated','public.research_ai_runs','TRUNCATE') then raise exception 'Destructive AI access';end if;
 if (select count(*) from pg_policy where polrelid='public.research_ai_runs'::regclass)<>1 or not exists(select 1 from pg_policy p where p.polrelid='public.research_ai_runs'::regclass and p.polcmd='r' and p.polpermissive and p.polroles=array[(select oid from pg_roles where rolname='authenticated')] and replace(regexp_replace(lower(pg_get_expr(p.polqual,p.polrelid)),'[[:space:]()]','','g'),'asuid','')='selectauth.uid=user_id') then raise exception 'AI owner policy differs';end if;
 for f in select * from pg_proc where oid in ('public.v3_reserve_research_ai(uuid,uuid,uuid,integer,text,text,text,jsonb,numeric,numeric,integer)'::regprocedure,'public.v3_finish_research_ai(uuid,uuid,text,jsonb,text)'::regprocedure) loop
  if not f.prosecdef or not exists(select 1 from unnest(f.proconfig) s where s ~ '^search_path=(""|)$') or has_function_privilege('authenticated',f.oid,'EXECUTE') or has_function_privilege('anon',f.oid,'EXECUTE') or not has_function_privilege('service_role',f.oid,'EXECUTE') then raise exception 'Accounting RPC privilege differs';end if;
 end loop;
end;$verify$;
select jsonb_build_object('assertions','PASS: catalog checks only; definition review, budget races and provider acceptance pending',
 'constraints',(select jsonb_agg(pg_get_constraintdef(oid)) from pg_constraint where conrelid='public.research_ai_runs'::regclass),
 'indexes',(select jsonb_agg(pg_get_indexdef(indexrelid)) from pg_index where indrelid='public.research_ai_runs'::regclass),
 'functions',(select jsonb_agg(pg_get_functiondef(oid)) from pg_proc where oid in ('public.v3_reserve_research_ai(uuid,uuid,uuid,integer,text,text,text,jsonb,numeric,numeric,integer)'::regprocedure,'public.v3_finish_research_ai(uuid,uuid,text,jsonb,text)'::regprocedure))) as verification;
