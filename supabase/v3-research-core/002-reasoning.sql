-- REVIEW ONLY. Requires 001. AI remains disabled in source; no live calls authorized.
begin;
do $guard$ begin
 if (select count(*) from v3_internal.environment)<>1 or not exists(select 1 from v3_internal.environment where singleton and project_id='kjcvgjfwlmyfroiqlbmw' and purpose='disposable-v3-slice0-cloud' and schema_version=1) or public.v3_research_contract() is distinct from 1 then raise exception 'Wrong Research Core target';end if;
 if to_regclass('public.research_ai_runs') is not null then raise exception 'Existing AI objects require reconciliation';end if;
end;$guard$;
create table public.research_ai_runs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null,draft_id uuid not null,
 operation_id uuid not null,source_revision integer not null check(source_revision>0),mode text not null check(mode in ('CLARIFY','CHALLENGE','GAP_CHECK')),
 status text not null default 'reserved' check(status in ('reserved','completed','failed','uncertain')),
 provider text not null check(provider in ('openai','groq')),model text not null check(length(model) between 1 and 200),prompt_version text not null default 'research-v1' check(prompt_version='research-v1'),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=40000),
 output jsonb check(output is null or (jsonb_typeof(output)='object' and octet_length(output::text)<=65536)),
 error_code text check(error_code in ('PROVIDER_TIMEOUT','PROVIDER_RATE_LIMIT','PROVIDER_REJECTED','PROVIDER_UNAVAILABLE','INVALID_PROVIDER_RESPONSE','UNKNOWN_USAGE')),
 reserved_idr numeric(14,4) not null check(reserved_idr>0),payload_hash text not null,
 created_at timestamptz not null default now(),unique(user_id,operation_id),
 foreign key(draft_id,user_id) references public.research_drafts(id,user_id) on delete restrict
);
create index research_ai_runs_owner_draft_idx on public.research_ai_runs(user_id,draft_id,created_at desc,id desc);
create index research_ai_runs_budget_idx on public.research_ai_runs(user_id,created_at);
alter table public.research_ai_runs enable row level security;
revoke all on public.research_ai_runs from public,anon,authenticated,service_role;
grant select(id,user_id,draft_id,operation_id,source_revision,mode,status,provider,model,prompt_version,snapshot,output,error_code,created_at) on public.research_ai_runs to authenticated;
create policy research_ai_runs_select_own on public.research_ai_runs for select to authenticated using((select auth.uid())=user_id);
-- Only server accounting may reserve/complete a run. Ordinary users cannot forge
-- provider results, release a cost hold or trigger provider execution through SQL.
create function public.v3_research_ai_contract() returns integer language sql stable security invoker set search_path='' as $$select 1;$$;
create function public.v3_reserve_research_ai(p_owner uuid,p_operation uuid,p_draft uuid,p_expected integer,p_mode text,p_provider text,p_model text,p_snapshot jsonb,p_quote numeric,p_monthly_limit numeric,p_daily_limit integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.research_ai_runs%rowtype;h text:=encode(sha256(convert_to(jsonb_build_array(p_draft,p_expected,p_mode,p_provider,p_model,p_snapshot,p_quote)::text,'UTF8')),'hex');total numeric;counted integer;
begin
 if p_owner is null or p_operation is null or p_quote is null or p_quote<=0 or p_monthly_limit is null or p_monthly_limit<0 or p_monthly_limit>99999999 or p_daily_limit is null or p_daily_limit not between 1 and 20 then raise exception 'AI budget invalid';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,731));
 select * into r from public.research_ai_runs where user_id=p_owner and operation_id=p_operation;
 if found then if r.payload_hash<>h then raise exception 'AI operation conflict';end if;return jsonb_build_object('id',r.id,'execute',false);end if;
 perform 1 from public.research_drafts where id=p_draft and user_id=p_owner and revision=p_expected for key share;if not found then raise exception 'AI source conflict';end if;
 select coalesce(sum(reserved_idr),0) into total from public.research_ai_runs where user_id=p_owner and created_at>=date_trunc('month',now());
 select count(*) into counted from public.research_ai_runs where user_id=p_owner and created_at>=date_trunc('day',now());
 if total+p_quote>p_monthly_limit or counted>=p_daily_limit then raise exception 'AI budget exhausted';end if;
 insert into public.research_ai_runs(user_id,draft_id,operation_id,source_revision,mode,provider,model,snapshot,reserved_idr,payload_hash) values(p_owner,p_draft,p_operation,p_expected,p_mode,p_provider,p_model,p_snapshot,p_quote,h) returning * into r;
 return jsonb_build_object('id',r.id,'execute',true);
end;$$;
create function public.v3_finish_research_ai(p_owner uuid,p_run uuid,p_status text,p_output jsonb,p_error text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_status is null or p_status not in ('completed','failed','uncertain') or (p_status='completed' and (p_output is null or p_error is not null)) or (p_status<>'completed' and (p_output is not null or p_error is null)) then raise exception 'Invalid AI completion';end if;
 update public.research_ai_runs set status=p_status,output=p_output,error_code=p_error where id=p_run and user_id=p_owner and status='reserved';
 if not found then raise exception 'AI completion unavailable';end if;
 -- Full worst-case reservation is retained for all outcomes. No invented usage,
 -- automatic refund, retry, stale-claim reaper or data cleanup.
end;$$;
revoke all on function public.v3_research_ai_contract() from public,anon,service_role;
grant execute on function public.v3_research_ai_contract() to authenticated;
revoke all on function public.v3_reserve_research_ai(uuid,uuid,uuid,integer,text,text,text,jsonb,numeric,numeric,integer),public.v3_finish_research_ai(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.v3_reserve_research_ai(uuid,uuid,uuid,integer,text,text,text,jsonb,numeric,numeric,integer),public.v3_finish_research_ai(uuid,uuid,text,jsonb,text) to service_role;
notify pgrst,'reload schema';commit;
