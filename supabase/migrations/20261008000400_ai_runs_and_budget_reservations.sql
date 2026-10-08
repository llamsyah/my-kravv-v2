begin;

-- Execution metadata only: no prompts, raw Thoughts, responses, or secrets.
-- The extra accounting fields distinguish a configured estimate from billing,
-- and retain a worst-case hold when usage is unknown or a process is interrupted.
create table public.ai_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid,
  role text not null check (role in (
    'REFINE', 'STRUCTURE', 'GUIDE', 'CHALLENGE', 'COMPARE', 'REFLECT'
  )),
  provider text not null check (provider in ('groq', 'openai')),
  model text not null check (model ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$'),
  prompt_version text not null check (prompt_version ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'),
  output_schema_version text not null check (output_schema_version ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  input_refs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(input_refs) = 'array' and jsonb_array_length(input_refs) <= 20),
  input_context_hash text check (input_context_hash ~ '^[a-f0-9]{64}$'),
  input_token_limit integer not null check (input_token_limit between 1 and 32768),
  output_token_limit integer not null check (output_token_limit between 1 and 4096),
  max_attempts integer not null check (max_attempts in (1, 2)),
  input_tokens bigint check (input_tokens >= 0),
  output_tokens bigint check (output_tokens >= 0),
  input_usd_per_million numeric(16,8) not null check (input_usd_per_million >= 0),
  output_usd_per_million numeric(16,8) not null check (output_usd_per_million >= 0),
  usd_to_idr numeric(16,4) not null check (usd_to_idr > 0),
  pricing_version text not null check (pricing_version ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'),
  reserved_cost_idr numeric(12,4) not null check (reserved_cost_idr > 0),
  estimated_cost_idr numeric(12,4) check (estimated_cost_idr >= 0),
  budget_charge_idr numeric(12,4) not null check (budget_charge_idr >= 0),
  accounting_status text not null default 'RESERVED'
    check (accounting_status in ('RESERVED', 'ESTIMATED', 'UNKNOWN', 'NOT_REQUESTED')),
  error_code text check (error_code in (
    'PROVIDER_TIMEOUT', 'PROVIDER_RATE_LIMIT', 'PROVIDER_UNAVAILABLE',
    'PROVIDER_REJECTED', 'INVALID_PROVIDER_RESPONSE', 'UNKNOWN_USAGE',
    'DATABASE_LOGGING_FAILED', 'CANCELLED'
  )),
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (id, user_id),
  -- SET NULL must name ONLY company_id: the accounting owner is never nullable.
  -- This keeps spend/holds after Company deletion without retaining its content.
  foreign key (company_id, user_id) references public.companies(id, user_id)
    on delete set null (company_id),
  check (input_usd_per_million + output_usd_per_million > 0),
  check ((status = 'PENDING') = (completed_at is null))
);

-- One row per actual provider attempt, including the single permitted repair.
-- STARTED is committed BEFORE transmission; a crash cannot free its budget.
create table public.ai_run_attempts (
  ai_run_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number in (1, 2)),
  status text not null default 'STARTED'
    check (status in ('STARTED', 'COMPLETED', 'FAILED')),
  provider_model text check (length(provider_model) between 1 and 200),
  provider_request_id text check (provider_request_id ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$'),
  input_tokens integer check (input_tokens between 0 and 1000000000),
  output_tokens integer check (output_tokens between 0 and 1000000000),
  usage_status text not null default 'UNKNOWN' check (usage_status in ('REPORTED', 'UNKNOWN')),
  estimated_cost_idr numeric(12,4) check (estimated_cost_idr >= 0),
  error_code text check (error_code in (
    'PROVIDER_TIMEOUT', 'PROVIDER_RATE_LIMIT', 'PROVIDER_UNAVAILABLE',
    'PROVIDER_REJECTED', 'INVALID_PROVIDER_RESPONSE', 'UNKNOWN_USAGE'
  )),
  duration_ms integer check (duration_ms between 0 and 120000),
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  primary key (ai_run_id, attempt_number),
  foreign key (ai_run_id, user_id) references public.ai_runs(id, user_id) on delete cascade,
  check (usage_status <> 'REPORTED' or (input_tokens is not null and output_tokens is not null)),
  check ((status = 'STARTED') = (completed_at is null))
);

create index ai_runs_user_created_idx on public.ai_runs(user_id, created_at desc);
create index ai_runs_company_idx on public.ai_runs(company_id, user_id) where company_id is not null;
create index ai_run_attempts_user_created_idx on public.ai_run_attempts(user_id, created_at desc);

alter table public.ai_runs enable row level security;
alter table public.ai_run_attempts enable row level security;
revoke all on public.ai_runs, public.ai_run_attempts from public, anon, authenticated;
grant select on public.ai_runs, public.ai_run_attempts to authenticated;
create policy ai_runs_select_own on public.ai_runs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_run_attempts_select_own on public.ai_run_attempts
  for select to authenticated using ((select auth.uid()) = user_id);

-- Owners must not manufacture cheap runs, release reservations, change prices,
-- or delete spending to reset their budget. Accounting writes are server-only.
-- These INVOKER functions are callable ONLY by service_role; the gateway must
-- independently verify getUser() and authorize context with the user's RLS client
-- before using its separate, narrow accounting client. No elevated context read.
grant select, insert, update on public.ai_runs, public.ai_run_attempts to service_role;

create function public.reserve_ai_run(
  p_user_id uuid, p_run_id uuid, p_company_id uuid,
  p_role text, p_provider text, p_model text,
  p_prompt_version text, p_output_schema_version text,
  p_input_refs jsonb, p_input_context_hash text,
  p_input_token_limit integer, p_output_token_limit integer, p_max_attempts integer,
  p_input_usd_per_million numeric, p_output_usd_per_million numeric,
  p_usd_to_idr numeric, p_pricing_version text,
  p_monthly_limit_idr numeric, p_daily_call_limit integer
)
returns setof public.ai_runs language plpgsql security invoker set search_path = '' as $$
declare
  v_settings public.user_settings%rowtype;
  v_ref jsonb;
  v_reserved numeric(12,4);
  v_spend numeric;
  v_calls bigint;
  v_month timestamptz := date_trunc('month', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
  v_day timestamptz := date_trunc('day', clock_timestamp() at time zone 'UTC') at time zone 'UTC';
begin
  if p_user_id is null or p_run_id is null
    or p_input_token_limit is null or p_input_token_limit not between 1 and 32768
    or p_output_token_limit is null or p_output_token_limit not between 1 and 4096
    or p_max_attempts is null or p_max_attempts not in (1, 2)
    or p_monthly_limit_idr is null or p_monthly_limit_idr < 0 or p_monthly_limit_idr > 99999999
    or p_daily_call_limit is null or p_daily_call_limit not between 1 and 1000
    or p_input_usd_per_million is null or p_input_usd_per_million < 0 or p_input_usd_per_million > 10000
    or p_output_usd_per_million is null or p_output_usd_per_million < 0 or p_output_usd_per_million > 10000
    or p_input_usd_per_million + p_output_usd_per_million <= 0
    or p_usd_to_idr is null or p_usd_to_idr <= 0 or p_usd_to_idr > 1000000
    or p_input_refs is null or jsonb_typeof(p_input_refs) <> 'array' then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;
  if jsonb_array_length(p_input_refs) > 20 then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;

  -- A stable user lock survives settings deletion/recreation, serializing all
  -- reservations and commits. Hash collisions only serialize unrelated owners.
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:ai:' || p_user_id::text, 0));
  insert into public.user_settings(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select s.* into v_settings from public.user_settings s
    where s.user_id = p_user_id for share;
  if not found or not v_settings.ai_enabled then
    raise exception 'AI_DISABLED' using errcode = '42501';
  end if;

  if p_company_id is not null then
    perform 1 from public.companies c
      where c.id = p_company_id and c.user_id = p_user_id for key share;
    if not found then
      raise exception 'AI_RESOURCE_UNAVAILABLE' using errcode = '42501';
    end if;
  end if;
  for v_ref in select value from jsonb_array_elements(p_input_refs) loop
    if jsonb_typeof(v_ref) <> 'object'
      or not (v_ref ? 'id' and v_ref ? 'type')
      or v_ref - 'id' - 'type' <> '{}'::jsonb
      or v_ref->>'type' is distinct from 'THOUGHT'
      or coalesce(v_ref->>'id', '') !~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' then
      raise exception 'AI_INVALID_CONTEXT' using errcode = '22023';
    end if;
    perform 1 from public.thoughts t where t.id = (v_ref->>'id')::uuid
      and t.user_id = p_user_id and (p_company_id is null or t.company_id = p_company_id);
    if not found then
      raise exception 'AI_RESOURCE_UNAVAILABLE' using errcode = '42501';
    end if;
  end loop;

  -- Ceiling at 4 decimal places prevents a small positive estimate rounding to
  -- zero. Snapshot rates/FX at their stored precision BEFORE computing the hold.
  v_reserved := ceil((
    p_input_token_limit::numeric * round(p_input_usd_per_million, 8)
    + p_output_token_limit::numeric * round(p_output_usd_per_million, 8)
  ) / 1000000 * round(p_usd_to_idr, 4) * 10000) / 10000 * p_max_attempts;
  if v_reserved is null or v_reserved <= 0 then
    raise exception 'AI_PRICING_UNAVAILABLE' using errcode = '22023';
  end if;
  select coalesce(sum(r.budget_charge_idr), 0) into v_spend
    from public.ai_runs r where r.user_id = p_user_id and r.created_at >= v_month;
  if v_spend + v_reserved > least(p_monthly_limit_idr, v_settings.monthly_ai_budget_idr) then
    raise exception 'AI_BUDGET_EXHAUSTED' using errcode = 'P0001';
  end if;
  select coalesce(sum(case when r.status = 'PENDING' then r.max_attempts else (
    select count(*) from public.ai_run_attempts a where a.ai_run_id = r.id and a.user_id = p_user_id
  ) end), 0) into v_calls from public.ai_runs r
    where r.user_id = p_user_id and r.created_at >= v_day;
  if v_calls + p_max_attempts > p_daily_call_limit then
    raise exception 'AI_RATE_LIMIT' using errcode = 'P0001';
  end if;

  return query insert into public.ai_runs (
    id, user_id, company_id, role, provider, model, prompt_version, output_schema_version,
    input_refs, input_context_hash, input_token_limit, output_token_limit, max_attempts,
    input_usd_per_million, output_usd_per_million, usd_to_idr, pricing_version,
    reserved_cost_idr, budget_charge_idr
  ) values (
    p_run_id, p_user_id, p_company_id, p_role, p_provider, p_model, p_prompt_version, p_output_schema_version,
    p_input_refs, p_input_context_hash, p_input_token_limit, p_output_token_limit, p_max_attempts,
    p_input_usd_per_million, p_output_usd_per_million, p_usd_to_idr, p_pricing_version,
    v_reserved, v_reserved
  ) returning *;
  -- Duplicate run IDs fail instead of authorizing another transmission.
end;
$$;

create function public.start_ai_run_attempt(p_user_id uuid, p_run_id uuid, p_attempt_number integer)
returns setof public.ai_run_attempts language plpgsql security invoker set search_path = '' as $$
declare
  v_run public.ai_runs%rowtype;
begin
  if p_user_id is null or p_run_id is null or p_attempt_number is null then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:ai:' || p_user_id::text, 0));
  select r.* into v_run from public.ai_runs r where r.id = p_run_id and r.user_id = p_user_id for update;
  if not found or v_run.status <> 'PENDING'
    or p_attempt_number not between 1 and v_run.max_attempts then
    raise exception 'AI_RUN_UNAVAILABLE' using errcode = '42501';
  end if;
  -- Do not let an old reservation fund new-month/day transmissions outside the
  -- window in which it was budgeted. Crossing UTC midnight fails before calling.
  if (v_run.created_at at time zone 'UTC')::date <> (clock_timestamp() at time zone 'UTC')::date then
    raise exception 'AI_RESERVATION_EXPIRED' using errcode = 'P0001';
  end if;
  if p_attempt_number = 2 and not exists (
    select 1 from public.ai_run_attempts a where a.ai_run_id = p_run_id and a.user_id = p_user_id
      and a.attempt_number = 1 and a.status = 'FAILED' and a.error_code = 'INVALID_PROVIDER_RESPONSE'
  ) then
    raise exception 'AI_REPAIR_NOT_ALLOWED' using errcode = '22023';
  end if;
  -- No ON CONFLICT: ambiguous acknowledgement of STARTED must NOT send twice.
  return query insert into public.ai_run_attempts(ai_run_id, user_id, attempt_number)
    values (p_run_id, p_user_id, p_attempt_number) returning *;
  update public.ai_runs set started_at = coalesce(started_at, clock_timestamp())
    where id = p_run_id and user_id = p_user_id;
end;
$$;

create function public.record_ai_run_attempt(
  p_user_id uuid, p_run_id uuid, p_attempt_number integer,
  p_provider_model text, p_provider_request_id text,
  p_input_tokens integer, p_output_tokens integer, p_error_code text, p_duration_ms integer
)
returns setof public.ai_run_attempts language plpgsql security invoker set search_path = '' as $$
declare
  v_run public.ai_runs%rowtype;
  v_attempt public.ai_run_attempts%rowtype;
  v_cost numeric(12,4);
begin
  if p_user_id is null or p_run_id is null or p_attempt_number is null then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:ai:' || p_user_id::text, 0));
  select r.* into v_run from public.ai_runs r where r.id = p_run_id and r.user_id = p_user_id for update;
  if not found then
    raise exception 'AI_RUN_UNAVAILABLE' using errcode = '42501';
  end if;
  select a.* into v_attempt from public.ai_run_attempts a
    where a.ai_run_id = p_run_id and a.user_id = p_user_id and a.attempt_number = p_attempt_number for update;
  if not found then
    raise exception 'AI_RUN_UNAVAILABLE' using errcode = '42501';
  end if;
  if v_attempt.status <> 'STARTED' then
    if v_attempt.provider_model is distinct from p_provider_model
      or v_attempt.provider_request_id is distinct from p_provider_request_id
      or v_attempt.input_tokens is distinct from p_input_tokens
      or v_attempt.output_tokens is distinct from p_output_tokens
      or v_attempt.error_code is distinct from p_error_code
      or v_attempt.duration_ms is distinct from p_duration_ms then
      raise exception 'AI_ACCOUNTING_CONFLICT' using errcode = '23505';
    end if;
    return next v_attempt;
    return;
  end if;
  if v_run.status <> 'PENDING' then
    raise exception 'AI_RUN_UNAVAILABLE' using errcode = '42501';
  end if;
  -- Actual usage is retained even on schema failures. Missing usage or an
  -- unexpected model has NULL cost, never a fabricated zero estimate.
  if p_input_tokens is not null and p_output_tokens is not null
    and p_provider_model collate "C" = v_run.model collate "C" then
    v_cost := ceil((p_input_tokens::numeric * v_run.input_usd_per_million
      + p_output_tokens::numeric * v_run.output_usd_per_million)
      / 1000000 * v_run.usd_to_idr * 10000) / 10000;
  end if;
  return query update public.ai_run_attempts a set
    status = case when p_error_code is null then 'COMPLETED' else 'FAILED' end,
    provider_model = p_provider_model, provider_request_id = p_provider_request_id,
    input_tokens = p_input_tokens, output_tokens = p_output_tokens,
    usage_status = case when p_input_tokens is not null and p_output_tokens is not null then 'REPORTED' else 'UNKNOWN' end,
    estimated_cost_idr = v_cost, error_code = p_error_code, duration_ms = p_duration_ms,
    completed_at = clock_timestamp()
    where a.ai_run_id = p_run_id and a.user_id = p_user_id and a.attempt_number = p_attempt_number
    returning a.*;
end;
$$;

create function public.finish_ai_run(p_user_id uuid, p_run_id uuid, p_status text, p_error_code text)
returns setof public.ai_runs language plpgsql security invoker set search_path = '' as $$
declare
  v_run public.ai_runs%rowtype;
  v_count integer;
  v_unknown integer;
  v_input bigint;
  v_output bigint;
  v_known_cost numeric;
  v_charge numeric;
begin
  if p_user_id is null or p_run_id is null or p_status is null
    or p_status not in ('SUCCEEDED', 'FAILED', 'CANCELLED')
    or (p_status = 'SUCCEEDED' and p_error_code is not null)
    or (p_status <> 'SUCCEEDED' and p_error_code is null) then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:ai:' || p_user_id::text, 0));
  select r.* into v_run from public.ai_runs r where r.id = p_run_id and r.user_id = p_user_id for update;
  if not found then
    raise exception 'AI_RUN_UNAVAILABLE' using errcode = '42501';
  end if;
  if v_run.status <> 'PENDING' then
    if v_run.status <> p_status or v_run.error_code is distinct from p_error_code then
      raise exception 'AI_ACCOUNTING_CONFLICT' using errcode = '23505';
    end if;
    return next v_run;
    return;
  end if;
  if exists (select 1 from public.ai_run_attempts a
    where a.ai_run_id = p_run_id and a.user_id = p_user_id and a.status = 'STARTED') then
    raise exception 'AI_ACCOUNTING_INCOMPLETE' using errcode = 'P0001';
  end if;
  select count(*), count(*) filter (where a.estimated_cost_idr is null),
    sum(a.input_tokens), sum(a.output_tokens), sum(a.estimated_cost_idr),
    coalesce(sum(coalesce(a.estimated_cost_idr, v_run.reserved_cost_idr / v_run.max_attempts)), 0)
    into v_count, v_unknown, v_input, v_output, v_known_cost, v_charge
    from public.ai_run_attempts a where a.ai_run_id = p_run_id and a.user_id = p_user_id;
  if (p_status = 'CANCELLED' and v_count <> 0)
    or (p_status = 'SUCCEEDED' and not exists (
      select 1 from public.ai_run_attempts a where a.ai_run_id = p_run_id and a.user_id = p_user_id
        and a.attempt_number = v_count and a.status = 'COMPLETED'
    )) then
    raise exception 'AI_INVALID_REQUEST' using errcode = '22023';
  end if;
  return query update public.ai_runs r set status = p_status, error_code = p_error_code,
    input_tokens = case when not exists (
      select 1 from public.ai_run_attempts a where a.ai_run_id = p_run_id and a.user_id = p_user_id and a.input_tokens is null
    ) then v_input else null end,
    output_tokens = case when not exists (
      select 1 from public.ai_run_attempts a where a.ai_run_id = p_run_id and a.user_id = p_user_id and a.output_tokens is null
    ) then v_output else null end,
    estimated_cost_idr = case when v_unknown = 0 then v_known_cost else null end,
    budget_charge_idr = v_charge,
    accounting_status = case when v_count = 0 then 'NOT_REQUESTED'
      when v_unknown > 0 then 'UNKNOWN' else 'ESTIMATED' end,
    completed_at = clock_timestamp()
    where r.id = p_run_id and r.user_id = p_user_id returning r.*;
  -- Only unattempted capacity and confirmed known-cost excess are released.
  -- PENDING/STARTED holds have no unsafe automatic expiry/reaper.
end;
$$;

revoke all on function public.reserve_ai_run(uuid, uuid, uuid, text, text, text, text, text, jsonb, text, integer, integer, integer, numeric, numeric, numeric, text, numeric, integer)
  from public, anon, authenticated;
revoke all on function public.start_ai_run_attempt(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.record_ai_run_attempt(uuid, uuid, integer, text, text, integer, integer, text, integer)
  from public, anon, authenticated;
revoke all on function public.finish_ai_run(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_run(uuid, uuid, uuid, text, text, text, text, text, jsonb, text, integer, integer, integer, numeric, numeric, numeric, text, numeric, integer)
  to service_role;
grant execute on function public.start_ai_run_attempt(uuid, uuid, integer) to service_role;
grant execute on function public.record_ai_run_attempt(uuid, uuid, integer, text, text, integer, integer, text, integer)
  to service_role;
grant execute on function public.finish_ai_run(uuid, uuid, text, text) to service_role;

-- Existing Company/Thought/settings policies and immutable originals unchanged.
-- Apply ONCE to the configured DEVELOPMENT project after Milestone 3.5.
notify pgrst, 'reload schema';
commit;
