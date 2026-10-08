begin;

-- Canonical names/fields follow docs/09-database-schema.md. Intent stays
-- optional; capture does not classify the user's writing or invoke AI.
create table public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  raw_content text not null,
  intent text check (intent is null or intent in (
    'RAW_THOUGHT', 'RESEARCH_NOTE', 'EVIDENCE_UPDATE', 'OPEN_QUESTION',
    'THESIS_THOUGHT', 'DECISION_NOTE', 'REVIEW_REFLECTION', 'UNKNOWN_MIXED'
  )),
  created_at timestamptz not null default now(),
  foreign key (company_id, user_id)
    references public.companies(id, user_id) on delete cascade,
  -- Validate blanks without trimming or changing the stored original.
  -- Includes Unicode whitespace recognized by the application's trim check.
  check (length(btrim(raw_content,
    E' \t\n\r\f' || chr(11) ||
    U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'
  )) > 0)
);

create index thoughts_company_created_idx
on public.thoughts (user_id, company_id, created_at desc, id asc);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  title text not null,
  summary text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  foreign key (company_id, user_id)
    references public.companies(id, user_id) on delete cascade
);

create index timeline_company_created_idx
on public.timeline_events (user_id, company_id, created_at desc, id asc);

create unique index timeline_thought_created_once_idx
on public.timeline_events (entity_id)
where event_type = 'THOUGHT_CREATED' and entity_type = 'THOUGHT';

alter table public.thoughts enable row level security;
alter table public.timeline_events enable row level security;

revoke all on public.thoughts from public, anon, authenticated;
revoke all on public.timeline_events from public, anon, authenticated;

grant select on public.thoughts to authenticated;
grant insert (user_id, company_id, raw_content)
on public.thoughts to authenticated;
grant select on public.timeline_events to authenticated;

create policy thoughts_select_own on public.thoughts
for select to authenticated using ((select auth.uid()) = user_id);

create policy thoughts_insert_own_active_company on public.thoughts
for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.companies c
    where c.id = thoughts.company_id and c.user_id = thoughts.user_id
      and c.state <> 'ARCHIVED'
  )
);

create policy timeline_events_select_own on public.timeline_events
for select to authenticated using ((select auth.uid()) = user_id);

-- Runs with the caller's RLS session. SHARE conflicts with the Company's
-- metadata/archive UPDATE, closing the check-then-archive race. Existing
-- Company column UPDATE grants satisfy PostgreSQL's row-lock privilege rule.
create function public.prepare_thought_capture()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.companies c
  where c.id = new.company_id and c.user_id = new.user_id
    and c.state <> 'ARCHIVED'
  for share;
  if not found then
    raise exception 'Perusahaan tidak tersedia untuk menyimpan pemikiran.'
      using errcode = '42501';
  end if;
  new.created_at = now();
  return new;
end;
$$;

create trigger thoughts_prepare_capture
before insert on public.thoughts
for each row execute function public.prepare_thought_capture();

-- Only this trigger can append initial history. The restricted definer
-- writes authoritative NEW-row fields, never caller-supplied event metadata.
-- Both writes share one transaction: failure leaves neither row behind.
-- No application request uses the elevated Supabase secret key.
create function public.record_thought_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.timeline_events (
    user_id, company_id, event_type, entity_type, entity_id, title, created_at
  ) values (
    new.user_id, new.company_id, 'THOUGHT_CREATED', 'THOUGHT', new.id,
    'Pemikiran asli disimpan', new.created_at
  );
  return new;
end;
$$;

create trigger thoughts_record_created
after insert on public.thoughts
for each row execute function public.record_thought_created();

-- Trigger functions are not ordinary callable API operations.
revoke all on function public.prepare_thought_capture()
from public, anon, authenticated;
revoke all on function public.record_thought_created()
from public, anon, authenticated;

-- No ordinary UPDATE/DELETE grants or policies on either table. Originals,
-- capture identity/time, and history cannot be overwritten through the API.
-- Auth account deletion still cascades; no deletion UI is added in this slice.
commit;
