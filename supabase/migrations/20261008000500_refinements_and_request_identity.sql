begin;

create function public.valid_refinement_text(p_text text)
returns boolean language sql immutable set search_path = '' as $$
  select p_text is not null and length(p_text) between 1 and 3000
    and length(btrim(p_text, E' \t\n\r\f\v' || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194)
      || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201)
      || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279))) > 0;
$$;

-- Additive Refine slice: original content, applied migrations and budgets stay intact.
alter table public.thoughts add constraint thoughts_refinement_owner_parent_unique
  unique (id, user_id, company_id);

-- Durable claim before any gateway call. Unknown/interrupted claims never resend.
create table public.refinement_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  thought_id uuid not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCEEDED', 'FAILED')),
  ai_run_id uuid,
  error_code text check (error_code ~ '^[A-Z_]{1,80}$'),
  created_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  unique (id, user_id),
  foreign key (thought_id, user_id, company_id)
    references public.thoughts(id, user_id, company_id) on delete cascade,
  foreign key (ai_run_id, user_id) references public.ai_runs(id, user_id)
    on delete set null (ai_run_id),
  check ((status = 'PENDING') = (completed_at is null)),
  check ((status = 'FAILED') = (error_code is not null))
);
create unique index refinement_one_pending_per_thought_idx
  on public.refinement_requests(user_id, thought_id) where status = 'PENDING';
create index refinement_requests_owner_created_idx
  on public.refinement_requests(user_id, company_id, thought_id, created_at desc);

create table public.refinements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  thought_id uuid not null,
  generation_request_id uuid not null unique,
  ai_run_id uuid,
  ai_content text not null check (public.valid_refinement_text(ai_content)),
  user_final_content text check (user_final_content is null or public.valid_refinement_text(user_final_content)),
  status text not null default 'SUGGESTED'
    check (status in ('SUGGESTED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED')),
  prompt_version text not null check (prompt_version = 'refine-v1'),
  output_schema_version text not null check (output_schema_version = 'refine-schema-v1'),
  provider text not null check (provider in ('groq', 'openai')),
  model text not null check (model ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$'),
  warnings jsonb not null default '[]'::jsonb
    check (jsonb_typeof(warnings) = 'array' and jsonb_array_length(warnings) <= 3),
  created_at timestamptz not null default clock_timestamp(),
  resolved_at timestamptz,
  foreign key (thought_id, user_id, company_id)
    references public.thoughts(id, user_id, company_id) on delete cascade,
  foreign key (generation_request_id, user_id)
    references public.refinement_requests(id, user_id) on delete cascade,
  foreign key (ai_run_id, user_id) references public.ai_runs(id, user_id)
    on delete set null (ai_run_id),
  check ((status = 'SUGGESTED') = (resolved_at is null)),
  check (status in ('ACCEPTED', 'SUPERSEDED') or user_final_content is null)
);
create index refinements_thought_created_idx
  on public.refinements(user_id, company_id, thought_id, created_at desc, id asc);
create unique index refinement_one_accepted_per_thought_idx
  on public.refinements(user_id, thought_id) where status = 'ACCEPTED';

alter table public.refinement_requests enable row level security;
alter table public.refinements enable row level security;
revoke all on public.refinement_requests, public.refinements from public, anon, authenticated;
grant select on public.refinement_requests, public.refinements to authenticated;
grant select, insert, update on public.refinement_requests, public.refinements to service_role;
create policy refinement_requests_select_own on public.refinement_requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy refinements_select_own on public.refinements
  for select to authenticated using ((select auth.uid()) = user_id);

-- Caller identity comes only from Auth. No ordinary INSERT/UPDATE/DELETE grants.
create function public.claim_refinement_request(p_company_id uuid, p_thought_id uuid, p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.refinement_requests%rowtype;
  v_state text;
begin
  if v_user_id is null then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  if p_company_id is null or p_thought_id is null or p_operation_id is null then
    raise exception 'REFINEMENT_INVALID_REQUEST' using errcode = '22023';
  end if;
  -- Parent-first locking matches archive/capture/permanent deletion.
  select c.state into v_state from public.companies c
    where c.id = p_company_id and c.user_id = v_user_id for share;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  perform 1 from public.thoughts t where t.id = p_thought_id and t.user_id = v_user_id
    and t.company_id = p_company_id;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:refine:' || v_user_id::text || ':' || p_thought_id::text, 0));
  select r.* into v_request from public.refinement_requests r
    where r.id = p_operation_id and r.user_id = v_user_id;
  if found then
    if v_request.company_id <> p_company_id or v_request.thought_id <> p_thought_id then
      raise exception 'REFINEMENT_OPERATION_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object('request', to_jsonb(v_request), 'claimed', false);
  end if;
  if v_state = 'ARCHIVED' then raise exception 'REFINEMENT_ARCHIVED' using errcode = '42501'; end if;
  if exists (select 1 from public.refinement_requests r where r.user_id = v_user_id
    and r.thought_id = p_thought_id and r.status = 'PENDING') then
    raise exception 'REFINEMENT_BUSY' using errcode = 'P0001';
  end if;
  insert into public.refinement_requests(id, user_id, company_id, thought_id)
    values (p_operation_id, v_user_id, p_company_id, p_thought_id) returning * into v_request;
  return jsonb_build_object('request', to_jsonb(v_request), 'claimed', true);
end;
$$;

-- Refine-specific gate on the EXISTING accounting start path; no second budget.
-- A durable request is required, and archive/deletion wins before transmission.
create function public.check_refinement_attempt_source()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_company_id uuid; v_thought_id uuid; v_state text;
begin
  if exists (select 1 from public.ai_runs a where a.id = new.ai_run_id and a.user_id = new.user_id
    and a.role = 'REFINE' and a.prompt_version = 'refine-v1') then
    select r.company_id, r.thought_id into v_company_id, v_thought_id
      from public.refinement_requests r where r.id = new.ai_run_id and r.user_id = new.user_id
      and r.status = 'PENDING';
    if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
    select c.state into v_state from public.companies c where c.id = v_company_id
      and c.user_id = new.user_id for share;
    if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
    if v_state = 'ARCHIVED' then raise exception 'REFINEMENT_ARCHIVED' using errcode = '42501'; end if;
    perform 1 from public.thoughts t where t.id = v_thought_id and t.user_id = new.user_id
      and t.company_id = v_company_id;
    if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger ai_attempt_refinement_source before insert on public.ai_run_attempts
  for each row execute function public.check_refinement_attempt_source();

-- Only the server may persist generated content, after the existing run settles.
create function public.complete_refinement_request(
  p_user_id uuid, p_operation_id uuid, p_ai_run_id uuid,
  p_ai_content text, p_warnings jsonb, p_error_code text
)
returns setof public.refinement_requests language plpgsql security invoker set search_path = '' as $$
declare
  v_request public.refinement_requests%rowtype;
  v_run public.ai_runs%rowtype;
  v_warning jsonb;
begin
  if p_user_id is null or p_operation_id is null or (p_ai_run_id is not null and p_ai_run_id <> p_operation_id) then
    raise exception 'REFINEMENT_INVALID_REQUEST' using errcode = '22023';
  end if;
  select r.* into v_request from public.refinement_requests r
    where r.id = p_operation_id and r.user_id = p_user_id;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  perform 1 from public.companies c where c.id = v_request.company_id and c.user_id = p_user_id for share;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  select r.* into v_request from public.refinement_requests r
    where r.id = p_operation_id and r.user_id = p_user_id for update;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  if v_request.status <> 'PENDING' then
    if (v_request.status = 'SUCCEEDED' and p_error_code is null and exists (
      select 1 from public.refinements f where f.generation_request_id = p_operation_id and f.user_id = p_user_id
        and f.ai_content collate "C" = p_ai_content collate "C" and f.warnings = p_warnings
    )) or (v_request.status = 'FAILED' and v_request.error_code = p_error_code and p_ai_content is null) then
      return next v_request; return;
    end if;
    raise exception 'REFINEMENT_OPERATION_CONFLICT' using errcode = '23505';
  end if;
  if p_ai_run_id is not null then
    select a.* into v_run from public.ai_runs a where a.id = p_ai_run_id and a.user_id = p_user_id;
  end if;
  if p_error_code is null then
    if v_run.id is null or v_run.status <> 'SUCCEEDED' or v_run.role <> 'REFINE'
      or v_run.company_id is distinct from v_request.company_id
      or v_run.prompt_version <> 'refine-v1' or v_run.output_schema_version <> 'refine-schema-v1'
      or v_run.input_refs <> jsonb_build_array(jsonb_build_object('type', 'THOUGHT', 'id', v_request.thought_id))
      or not public.valid_refinement_text(p_ai_content)
      or p_warnings is null or jsonb_typeof(p_warnings) <> 'array' then
      raise exception 'REFINEMENT_INVALID_RESULT' using errcode = '22023';
    end if;
    if jsonb_array_length(p_warnings) > 3 then raise exception 'REFINEMENT_INVALID_RESULT' using errcode = '22023'; end if;
    for v_warning in select value from jsonb_array_elements(p_warnings) loop
      if jsonb_typeof(v_warning) <> 'string' or length(v_warning #>> '{}') > 160 then
        raise exception 'REFINEMENT_INVALID_RESULT' using errcode = '22023';
      end if;
    end loop;
    insert into public.refinements(user_id, company_id, thought_id, generation_request_id,
      ai_run_id, ai_content, warnings, prompt_version, output_schema_version, provider, model)
      values (p_user_id, v_request.company_id, v_request.thought_id, p_operation_id,
      v_run.id, p_ai_content, p_warnings, v_run.prompt_version, v_run.output_schema_version, v_run.provider, v_run.model);
  elsif p_error_code !~ '^[A-Z_]{1,80}$' or p_ai_content is not null then
    raise exception 'REFINEMENT_INVALID_RESULT' using errcode = '22023';
  end if;
  return query update public.refinement_requests r set
    status = case when p_error_code is null then 'SUCCEEDED' else 'FAILED' end,
    ai_run_id = v_run.id, error_code = p_error_code, completed_at = clock_timestamp()
    where r.id = p_operation_id and r.user_id = p_user_id returning r.*;
end;
$$;

-- Explicit owner decision; accepted originals and AI proposals are never edited.
create function public.resolve_refinement(p_refinement_id uuid, p_status text, p_user_final_content text)
returns setof public.refinements language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_refinement public.refinements%rowtype;
  v_company_id uuid;
  v_final text := p_user_final_content;
begin
  if v_user_id is null then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('ACCEPTED', 'REJECTED')
    or (p_status = 'REJECTED' and v_final is not null)
    or (v_final is not null and not public.valid_refinement_text(v_final)) then
    raise exception 'REFINEMENT_INVALID_REQUEST' using errcode = '22023';
  end if;
  select f.company_id into v_company_id from public.refinements f
    where f.id = p_refinement_id and f.user_id = v_user_id;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  -- Existing saved proposals may still be reviewed in an archived workspace;
  -- archive blocks NEW generation, as it blocks new Thought capture.
  perform 1 from public.companies c where c.id = v_company_id and c.user_id = v_user_id for share;
  if not found then raise exception 'REFINEMENT_UNAVAILABLE' using errcode = '42501'; end if;
  select f.* into v_refinement from public.refinements f
    where f.id = p_refinement_id and f.user_id = v_user_id;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:refine:' || v_user_id::text || ':' || v_refinement.thought_id::text, 0));
  select f.* into v_refinement from public.refinements f
    where f.id = p_refinement_id and f.user_id = v_user_id for update;
  if v_final collate "C" = v_refinement.ai_content collate "C" then v_final := null; end if;
  if v_refinement.status <> 'SUGGESTED' then
    if v_refinement.status = p_status and v_refinement.user_final_content is not distinct from v_final then
      return next v_refinement; return;
    end if;
    raise exception 'REFINEMENT_ALREADY_RESOLVED' using errcode = '23505';
  end if;
  if p_status = 'ACCEPTED' then
    update public.refinements f set status = 'SUPERSEDED'
      where f.user_id = v_user_id and f.thought_id = v_refinement.thought_id and f.status = 'ACCEPTED';
  end if;
  return query update public.refinements f set status = p_status,
    user_final_content = v_final, resolved_at = clock_timestamp()
    where f.id = p_refinement_id and f.user_id = v_user_id returning f.*;
  if p_status = 'ACCEPTED' then
    insert into public.timeline_events(user_id, company_id, event_type, entity_type, entity_id, title)
      values (v_user_id, v_company_id, 'REFINEMENT_ACCEPTED', 'REFINEMENT', p_refinement_id, 'Versi dirapikan disimpan');
  end if;
end;
$$;

create function public.remove_deleted_refinement_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.timeline_events e where e.user_id = old.user_id
    and e.entity_type = 'REFINEMENT' and e.entity_id = old.id;
  return old;
end;
$$;
create trigger refinements_remove_deleted_history after delete on public.refinements
  for each row execute function public.remove_deleted_refinement_history();

revoke all on function public.claim_refinement_request(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_refinement_request(uuid, uuid, uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.resolve_refinement(uuid, text, text) from public, anon, authenticated;
revoke all on function public.check_refinement_attempt_source() from public, anon, authenticated;
revoke all on function public.remove_deleted_refinement_history() from public, anon, authenticated;
grant execute on function public.claim_refinement_request(uuid, uuid, uuid) to authenticated;
grant execute on function public.resolve_refinement(uuid, text, text) to authenticated;
grant execute on function public.complete_refinement_request(uuid, uuid, uuid, text, jsonb, text) to service_role;

notify pgrst, 'reload schema';
commit;
