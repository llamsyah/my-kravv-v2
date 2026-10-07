begin;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  ticker text,
  exchange text,
  sector text,
  short_note text,
  state text not null default 'EXPLORING'
    check (state in (
      'EXPLORING', 'DEVELOPING', 'THESIS_FORMED',
      'TRACKING', 'REVIEWING', 'ARCHIVED'
    )),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((state = 'ARCHIVED') = (archived_at is not null))
);

create index companies_user_updated_idx
on public.companies (user_id, updated_at desc);

create function public.set_company_timestamps()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.state = 'ARCHIVED' then
    if tg_op = 'UPDATE' and old.state = 'ARCHIVED' then
      new.archived_at = old.archived_at;
    else
      new.archived_at = now();
    end if;
  else
    new.archived_at = null;
  end if;
  return new;
end;
$$;

create trigger companies_timestamps
before insert or update on public.companies
for each row execute function public.set_company_timestamps();

alter table public.companies enable row level security;

revoke all on public.companies from anon, authenticated;
grant select, insert on public.companies to authenticated;
-- Identity and ownership are immutable through the ordinary user API.
grant update (name, ticker, exchange, sector, short_note, state, archived_at)
on public.companies to authenticated;

create policy companies_select_own on public.companies
for select to authenticated using ((select auth.uid()) = user_id);

create policy companies_insert_own on public.companies
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy companies_update_own on public.companies
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- No DELETE grant or policy: this milestone uses archive semantics.
commit;
