-- REVIEW ONLY: additive V3 Research Core. Run ONCE after separate owner approval.
begin;
do $guard$
begin
 if (select count(*) from v3_internal.environment) <> 1 or not exists(select 1 from v3_internal.environment where singleton and project_id='kjcvgjfwlmyfroiqlbmw' and purpose='disposable-v3-slice0-cloud' and schema_version=1) then raise exception 'Unknown V3 target'; end if;
 if public.v3_capture_contract() is distinct from 1 or public.v3_company_management_contract() is distinct from 1 then raise exception 'Prerequisite missing'; end if;
 if to_regclass('public.research_drafts') is not null or to_regclass('public.research_versions') is not null or to_regclass('v3_internal.research_operations') is not null then raise exception 'Existing research objects require reconciliation'; end if;
 if has_table_privilege('authenticated','public.companies','DELETE') then raise exception 'Company deletion must remain closed'; end if;
end;$guard$;

create table public.research_drafts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
 company_id uuid, source_capture_id uuid references public.captures(id) on delete restrict,
 title text not null check(length(btrim(title)) between 1 and 200),
 body text not null default '' check(length(body)<=100000 and octet_length(body)<=262144),
 mode text not null default 'blank' check(mode in ('blank','guided','assisted')),
 revision integer not null default 1 check(revision>=1),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,user_id), unique(user_id,source_capture_id),
 foreign key(company_id,user_id) references public.companies(id,user_id) on delete restrict
);
create index research_drafts_owner_updated_idx on public.research_drafts(user_id,updated_at desc,id desc);
create index research_drafts_company_owner_idx on public.research_drafts(company_id,user_id) where company_id is not null;
-- A Thought is created only by the first explicit commit, separately from Draft.
-- One Thought lineage per document in this milestone; neither autosave nor AI
-- creates it. No draft/Thought/version deletion is exposed.
create table public.research_thoughts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null,draft_id uuid not null,
 created_at timestamptz not null default now(),unique(draft_id,user_id),unique(id,draft_id,user_id),
 foreign key(draft_id,user_id) references public.research_drafts(id,user_id) on delete restrict
);
create index research_thoughts_owner_idx on public.research_thoughts(user_id,draft_id);
create table public.research_versions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 draft_id uuid not null, thought_id uuid not null, number integer not null check(number>=1),draft_revision integer not null check(draft_revision>=1),
 title text not null check(length(btrim(title)) between 1 and 200),body text not null check(length(btrim(body,E' \t\n\r\f'||chr(11)))>0 and length(body)<=100000 and octet_length(body)<=262144),
 company_id uuid, message text not null default '' check(length(message)<=500),created_at timestamptz not null default now(),
 unique(draft_id,number), unique(id,user_id),
 foreign key(thought_id,draft_id,user_id) references public.research_thoughts(id,draft_id,user_id) on delete restrict,
 foreign key(company_id,user_id) references public.companies(id,user_id) on delete restrict
);
create index research_versions_owner_draft_idx on public.research_versions(user_id,draft_id,number desc);
create index research_versions_company_owner_idx on public.research_versions(company_id,user_id) where company_id is not null;
create table v3_internal.research_operations (
 user_id uuid not null,operation_id uuid not null,kind text not null,payload_hash text not null,
 result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,operation_id)
);
revoke all on v3_internal.research_operations from public,anon,authenticated,service_role;
alter table public.research_drafts enable row level security;
alter table public.research_versions enable row level security;
alter table public.research_thoughts enable row level security;
revoke all on public.research_drafts,public.research_thoughts,public.research_versions from public,anon,authenticated,service_role;
grant select on public.research_drafts,public.research_thoughts,public.research_versions to authenticated;
create policy research_drafts_select_own on public.research_drafts for select to authenticated using((select auth.uid())=user_id);
create policy research_versions_select_own on public.research_versions for select to authenticated using((select auth.uid())=user_id);
create policy research_thoughts_select_own on public.research_thoughts for select to authenticated using((select auth.uid())=user_id);
create function v3_internal.research_source_owner() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.source_capture_id is not null then
  perform 1 from public.captures where id=new.source_capture_id and user_id=new.user_id for key share;
  if not found then raise exception 'Research capture owner mismatch';end if;
 end if;
 return new;
end;$$;
revoke all on function v3_internal.research_source_owner() from public,anon,authenticated,service_role;
create trigger research_source_owner before insert or update of source_capture_id,user_id on public.research_drafts for each row execute function v3_internal.research_source_owner();
create function v3_internal.research_immutable() returns trigger language plpgsql security invoker set search_path='' as $$begin raise exception 'Immutable research revision'; end;$$;
revoke all on function v3_internal.research_immutable() from public,anon,authenticated,service_role;
create trigger research_versions_immutable before update or delete on public.research_versions for each row execute function v3_internal.research_immutable();

-- Serialize short owner mutations. Receipts contain only opaque IDs/revisions and
-- a server-derived SHA-256, never a second content history or client authority.
create function v3_internal.research_replay(p_operation uuid,p_kind text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r v3_internal.research_operations%rowtype; owner_id uuid := auth.uid();
begin
 if owner_id is null or p_operation is null then raise exception 'Research access denied';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 731));
 select * into r from v3_internal.research_operations where user_id=owner_id and operation_id=p_operation;
 if found then
  if r.kind<>p_kind or r.payload_hash<>encode(sha256(convert_to(p_payload::text,'UTF8')),'hex') then raise exception 'Research operation conflict';end if;
  return r.result;
 end if;
 return null;
end;$$;
create function v3_internal.research_receipt(p_operation uuid,p_kind text,p_payload jsonb,p_result jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 insert into v3_internal.research_operations(user_id,operation_id,kind,payload_hash,result) values(auth.uid(),p_operation,p_kind,encode(sha256(convert_to(p_payload::text,'UTF8')),'hex'),p_result);
 return p_result;
end;$$;
revoke all on function v3_internal.research_replay(uuid,text,jsonb),v3_internal.research_receipt(uuid,text,jsonb,jsonb) from public,anon,authenticated,service_role;

create function public.v3_research_contract() returns integer language sql stable security invoker set search_path='' as $$select 1;$$;
create function public.v3_create_research(p_operation uuid,p_title text,p_company uuid,p_capture uuid,p_mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(p_title,p_company,p_capture,p_mode); result jsonb; d public.research_drafts%rowtype;c public.captures%rowtype;
begin
 result:=v3_internal.research_replay(p_operation,'create',payload);if result is not null then return result;end if;
 if p_title is null or length(btrim(p_title)) not between 1 and 200 or p_mode is null or p_mode not in ('blank','guided','assisted') then raise exception 'Invalid research input';end if;
 if p_company is not null then perform 1 from public.companies where id=p_company and user_id=auth.uid() for key share;if not found then raise exception 'Research company unavailable';end if;end if;
 if p_capture is not null then
  select * into c from public.captures where id=p_capture and user_id=auth.uid() for key share;
  if not found then raise exception 'Research capture unavailable';end if;
  select * into d from public.research_drafts where user_id=auth.uid() and source_capture_id=p_capture;
  if found then return v3_internal.research_receipt(p_operation,'create',payload,jsonb_build_object('id',d.id,'revision',d.revision));end if;
 end if;
 insert into public.research_drafts(user_id,title,body,company_id,source_capture_id,mode) values(auth.uid(),p_title,coalesce(c.raw_text,''),p_company,p_capture,p_mode) returning * into d;
 return v3_internal.research_receipt(p_operation,'create',payload,jsonb_build_object('id',d.id,'revision',d.revision));
end;$$;
create function public.v3_save_research(p_operation uuid,p_draft uuid,p_expected integer,p_title text,p_body text,p_company uuid,p_mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(p_draft,p_expected,p_title,p_body,p_company,p_mode); result jsonb;d public.research_drafts%rowtype;
begin
 result:=v3_internal.research_replay(p_operation,'save',payload);if result is not null then return result;end if;
 if p_company is not null then perform 1 from public.companies where id=p_company and user_id=auth.uid() for key share;if not found then raise exception 'Research company unavailable';end if;end if;
 select * into d from public.research_drafts where id=p_draft and user_id=auth.uid() for update;
 if not found then raise exception 'Research unavailable';end if;
 if d.revision is distinct from p_expected then raise exception 'Research revision conflict';end if;
 update public.research_drafts set title=p_title,body=p_body,company_id=p_company,mode=p_mode,revision=revision+1,updated_at=clock_timestamp() where id=d.id returning * into d;
 return v3_internal.research_receipt(p_operation,'save',payload,jsonb_build_object('id',d.id,'revision',d.revision));
end;$$;
create function public.v3_commit_research(p_operation uuid,p_draft uuid,p_expected integer,p_latest integer,p_message text) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(p_draft,p_expected,p_latest,p_message);result jsonb;d public.research_drafts%rowtype;v public.research_versions%rowtype;latest integer;thought uuid;
begin
 result:=v3_internal.research_replay(p_operation,'commit',payload);if result is not null then return result;end if;
 select * into d from public.research_drafts where id=p_draft and user_id=auth.uid() for update;
 if not found then raise exception 'Research unavailable';end if;
 select coalesce(max(number),0) into latest from public.research_versions where draft_id=d.id and user_id=auth.uid();
 if d.revision is distinct from p_expected or latest is distinct from p_latest then raise exception 'Research revision conflict';end if;
 if latest>0 and exists(select 1 from public.research_versions where draft_id=d.id and number=latest and title=d.title and body=d.body and company_id is not distinct from d.company_id) then raise exception 'Research already committed';end if;
 select id into thought from public.research_thoughts where draft_id=d.id and user_id=auth.uid();
 if not found then insert into public.research_thoughts(user_id,draft_id) values(auth.uid(),d.id) returning id into thought;end if;
 insert into public.research_versions(user_id,draft_id,thought_id,number,draft_revision,title,body,company_id,message) values(auth.uid(),d.id,thought,latest+1,d.revision,d.title,d.body,d.company_id,p_message) returning * into v;
 return v3_internal.research_receipt(p_operation,'commit',payload,jsonb_build_object('id',v.id,'revision',v.number));
end;$$;
create function public.v3_restore_research(p_operation uuid,p_draft uuid,p_expected integer,p_version uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_array(p_draft,p_expected,p_version);result jsonb;d public.research_drafts%rowtype;v public.research_versions%rowtype;
begin
 result:=v3_internal.research_replay(p_operation,'restore',payload);if result is not null then return result;end if;
 select * into v from public.research_versions where id=p_version and draft_id=p_draft and user_id=auth.uid();if not found then raise exception 'Research version unavailable';end if;
 if v.company_id is not null then perform 1 from public.companies where id=v.company_id and user_id=auth.uid() for key share;if not found then raise exception 'Research company unavailable';end if;end if;
 select * into d from public.research_drafts where id=p_draft and user_id=auth.uid() for update;if not found then raise exception 'Research unavailable';end if;
 if d.revision is distinct from p_expected then raise exception 'Research revision conflict';end if;
 update public.research_drafts set title=v.title,body=v.body,company_id=v.company_id,revision=revision+1,updated_at=clock_timestamp() where id=d.id returning * into d;
 return v3_internal.research_receipt(p_operation,'restore',payload,jsonb_build_object('id',d.id,'revision',d.revision));
end;$$;
revoke all on function public.v3_research_contract(),public.v3_create_research(uuid,text,uuid,uuid,text),public.v3_save_research(uuid,uuid,integer,text,text,uuid,text),public.v3_commit_research(uuid,uuid,integer,integer,text),public.v3_restore_research(uuid,uuid,integer,uuid) from public,anon,service_role;
grant execute on function public.v3_research_contract(),public.v3_create_research(uuid,text,uuid,uuid,text),public.v3_save_research(uuid,uuid,integer,text,text,uuid,text),public.v3_commit_research(uuid,uuid,integer,integer,text),public.v3_restore_research(uuid,uuid,integer,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
