begin;

-- Review and reading are independent. No backfill: absence means ORIGINAL.
alter table public.refinements add constraint refinements_display_owner_parent_unique
  unique (id, user_id, company_id, thought_id);

create table public.thought_display_preferences (
  thought_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  source text not null check (source in ('ORIGINAL', 'REFINEMENT')),
  refinement_id uuid,
  revision bigint not null check (revision > 0),
  updated_at timestamptz not null default clock_timestamp(),
  check ((source = 'ORIGINAL' and refinement_id is null)
    or (source = 'REFINEMENT' and refinement_id is not null)),
  foreign key (thought_id, user_id, company_id)
    references public.thoughts(id, user_id, company_id) on delete cascade,
  -- End-of-transaction checking permits existing Thought/Company cascade deletion.
  -- Deleting a selected refinement alone must not silently reset a preference.
  foreign key (refinement_id, user_id, company_id, thought_id)
    references public.refinements(id, user_id, company_id, thought_id)
    on delete no action deferrable initially deferred
);
create index thought_display_owner_company_idx
  on public.thought_display_preferences(user_id, company_id, thought_id);
create index thought_display_refinement_idx
  on public.thought_display_preferences(refinement_id) where refinement_id is not null;
alter table public.thought_display_preferences enable row level security;
revoke all on public.thought_display_preferences from public, anon, authenticated, service_role;
grant select on public.thought_display_preferences to authenticated, service_role;
create policy thought_display_select_own on public.thought_display_preferences
  for select to authenticated using ((select auth.uid()) = user_id);

create function public.set_thought_display(
  p_company_id uuid, p_thought_id uuid, p_source text,
  p_refinement_id uuid, p_expected_revision bigint
)
returns setof public.thought_display_preferences
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_previous public.thought_display_preferences%rowtype;
  v_status text;
  v_resolved timestamptz;
begin
  if v_user is null then raise exception 'DISPLAY_UNAVAILABLE' using errcode = '42501'; end if;
  if p_company_id is null or p_thought_id is null or p_source is null
    or p_source not in ('ORIGINAL', 'REFINEMENT') or p_expected_revision is null
    or p_expected_revision < 0
    or (p_source = 'ORIGINAL' and p_refinement_id is not null)
    or (p_source = 'REFINEMENT' and p_refinement_id is null) then
    raise exception 'DISPLAY_INVALID' using errcode = '22023';
  end if;
  -- Same parent-first and Thought-specific lock order as resolve_refinement.
  -- Archived owned Companies permit this reading preference, never generation.
  perform 1 from public.companies c where c.id = p_company_id and c.user_id = v_user for share;
  if not found then raise exception 'DISPLAY_UNAVAILABLE' using errcode = '42501'; end if;
  perform 1 from public.thoughts t where t.id = p_thought_id and t.company_id = p_company_id
    and t.user_id = v_user for share;
  if not found then raise exception 'DISPLAY_UNAVAILABLE' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('my-kravv:refine:' || v_user::text || ':' || p_thought_id::text, 0));
  select p.* into v_previous from public.thought_display_preferences p
    where p.thought_id = p_thought_id and p.user_id = v_user for update;
  if coalesce(v_previous.revision, 0) <> p_expected_revision then
    raise exception 'DISPLAY_CONFLICT' using errcode = '40001';
  end if;
  if p_source = 'REFINEMENT' then
    select f.status, f.resolved_at into v_status, v_resolved from public.refinements f
      where f.id = p_refinement_id and f.user_id = v_user
        and f.company_id = p_company_id and f.thought_id = p_thought_id for share;
    if not found then raise exception 'DISPLAY_UNAVAILABLE' using errcode = '42501'; end if;
    if v_status not in ('ACCEPTED', 'SUPERSEDED') or v_resolved is null then
      raise exception 'DISPLAY_INELIGIBLE' using errcode = '22023';
    end if;
  end if;
  if v_previous.source = p_source and v_previous.refinement_id is not distinct from p_refinement_id then
    return next v_previous; return;
  end if;
  return query insert into public.thought_display_preferences(thought_id, user_id, company_id, source, refinement_id, revision)
    values (p_thought_id, v_user, p_company_id, p_source, p_refinement_id, p_expected_revision + 1)
    on conflict (thought_id) do update set source = excluded.source,
      refinement_id = excluded.refinement_id, revision = excluded.revision, updated_at = clock_timestamp()
    returning *;
end;
$$;

-- One bounded, RLS-respecting network read for each reader's Thought batch.
create function public.read_thought_displays(p_thought_ids uuid[])
returns table(thought_id uuid, user_id uuid, company_id uuid,
  preference jsonb, selected_refinement jsonb, has_approved boolean)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_thought_ids is null
    or cardinality(p_thought_ids) > 40 or array_position(p_thought_ids, null) is not null then
    raise exception 'DISPLAY_UNAVAILABLE' using errcode = '42501';
  end if;
  return query select t.id, t.user_id, t.company_id, to_jsonb(p), to_jsonb(f),
    exists(select 1 from public.refinements a where a.thought_id = t.id
      and a.user_id = t.user_id and a.company_id = t.company_id
      and a.status in ('ACCEPTED', 'SUPERSEDED') and a.resolved_at is not null)
    from public.thoughts t
    left join public.thought_display_preferences p on p.thought_id = t.id
      and p.user_id = t.user_id and p.company_id = t.company_id
    left join public.refinements f on f.id = p.refinement_id and f.thought_id = t.id
      and f.user_id = t.user_id and f.company_id = t.company_id
    where t.user_id = auth.uid() and t.id = any(p_thought_ids);
end;
$$;
revoke all on function public.set_thought_display(uuid, uuid, text, uuid, bigint) from public, anon, authenticated;
revoke all on function public.read_thought_displays(uuid[]) from public, anon, authenticated;
grant execute on function public.set_thought_display(uuid, uuid, text, uuid, bigint) to authenticated;
grant execute on function public.read_thought_displays(uuid[]) to authenticated;
notify pgrst, 'reload schema';
commit;
