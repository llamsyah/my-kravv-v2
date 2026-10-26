-- REVIEW ONLY. Additive Quick Capture MVP; never executed by startup tooling.
-- Run ONCE only after owner approval on the dedicated V3 database.
begin;
do $guard$
begin
  if (select count(*) from v3_internal.environment) <> 1 or not exists (
    select 1 from v3_internal.environment where singleton and schema_version = 1 and
      ((project_id = 'kjcvgjfwlmyfroiqlbmw' and purpose = 'disposable-v3-slice0-cloud') or
       (project_id = 'my-kravv-v3-local-01a14897' and purpose = 'disposable-v3-slice0'))
  ) then raise exception 'Refusing unknown V3 environment'; end if;
  if to_regclass('public.captures') is not null or
     to_regprocedure('public.v3_capture_contract()') is not null or
     to_regprocedure('public.v3_create_capture(uuid,text,uuid)') is not null then
    raise exception 'Existing capture objects require explicit reconciliation';
  end if;
  if public.v3_company_management_contract() is distinct from 1 or not exists (
    select 1 from pg_class where oid = 'public.companies'::regclass and relrowsecurity
  ) or has_table_privilege('authenticated','public.companies','DELETE') or
    has_table_privilege('anon','public.companies','DELETE') then
    raise exception 'Required V3 company contract or deletion restriction missing';
  end if;
end;
$guard$;

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  request_id uuid not null,
  company_id uuid,
  raw_text text not null,
  created_at timestamptz not null default now(),
  constraint captures_text_check check (
    length(btrim(raw_text, E' \t\n\r\f' || chr(11))) >= 1 and
    length(raw_text) <= 8000 and octet_length(raw_text) <= 32000
  ),
  constraint captures_owner_request_key unique (user_id, request_id),
  constraint captures_company_owner_fkey foreign key (company_id, user_id)
    references public.companies(id, user_id) on delete restrict
);
create index captures_owner_created_idx on public.captures(user_id, created_at desc, id desc);
create index captures_company_owner_idx on public.captures(company_id, user_id) where company_id is not null;
alter table public.captures enable row level security;
revoke all on public.captures from public, anon, authenticated, service_role;
grant select on public.captures to authenticated;
grant insert (user_id, request_id, company_id, raw_text) on public.captures to authenticated;
create policy captures_select_own on public.captures for select to authenticated
using ((select auth.uid()) = user_id);
create policy captures_insert_own on public.captures for insert to authenticated
with check ((select auth.uid()) = user_id);

create function public.v3_capture_contract()
returns integer language sql stable security invoker set search_path = '' as $$ select 1; $$;
revoke all on function public.v3_capture_contract() from public, anon, service_role;
grant execute on function public.v3_capture_contract() to authenticated;

-- One request identity per intentional capture. Lost-response retries return the
-- same row only for an exactly matching payload; changed payloads fail closed.
-- No UPDATE grant or upsert. Parent lock + composite RESTRICT FK preserve C1.
create function public.v3_create_capture(p_request_id uuid, p_raw_text text, p_company_id uuid)
returns setof public.captures language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := (select auth.uid()); saved public.captures%rowtype;
begin
  if owner_id is null or p_request_id is null or p_raw_text is null or
     length(btrim(p_raw_text, E' \t\n\r\f' || chr(11))) < 1 or length(p_raw_text) > 8000 or octet_length(p_raw_text) > 32000 then
    raise exception 'Invalid capture request';
  end if;
  if p_company_id is not null then
    perform 1 from public.companies where id = p_company_id and user_id = owner_id for key share;
    if not found then raise exception 'Company unavailable'; end if;
  end if;
  insert into public.captures(user_id, request_id, raw_text, company_id)
    values (owner_id, p_request_id, p_raw_text, p_company_id)
    on conflict (user_id, request_id) do nothing;
  select * into saved from public.captures where user_id = owner_id and request_id = p_request_id;
  if not found or saved.raw_text is distinct from p_raw_text or saved.company_id is distinct from p_company_id then
    raise exception 'Capture request conflicts with existing payload';
  end if;
  return next saved;
end;
$$;
revoke all on function public.v3_create_capture(uuid,text,uuid) from public, anon, service_role;
grant execute on function public.v3_create_capture(uuid,text,uuid) to authenticated;

-- No edit/archive/move/delete RPC, AI, Thought creation or Company deletion.
-- A future empty-company deletion routine must include captures and pass races
-- before receiving an execution grant. Existing company DELETE stays denied.
notify pgrst, 'reload schema';
commit;
