begin;

-- Existing originals remain unchanged. NULL keeps legacy captures valid;
-- uniqueness applies only when a client supplies an operation identity.
alter table public.thoughts add column capture_operation_id uuid;
alter table public.thoughts add constraint thoughts_capture_operation_unique
  unique (user_id, capture_operation_id);
grant insert (capture_operation_id) on public.thoughts to authenticated;

-- Capture retains the caller's RLS, the active-Company locking trigger, and
-- the atomic THOUGHT_CREATED trigger. There is deliberately no UPDATE/upsert.
create function public.capture_thought(
  p_company_id uuid, p_raw_content text, p_operation_id uuid
)
returns setof public.thoughts
language plpgsql security invoker set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_thought public.thoughts%rowtype;
begin
  if v_user_id is null then
    raise exception 'Silakan masuk kembali.' using errcode = '42501';
  end if;
  if p_company_id is null or p_operation_id is null or p_raw_content is null
    or length(p_raw_content) > 100000 then
    raise exception 'Permintaan simpan tidak valid.' using errcode = '22023';
  end if;

  -- A committed retry is readable even if the Company has since been archived.
  select t.* into v_thought from public.thoughts t
  where t.user_id = v_user_id and t.capture_operation_id = p_operation_id;
  if found then
    if v_thought.company_id <> p_company_id
      or v_thought.raw_content collate "C" <> p_raw_content collate "C" then
      raise exception 'Identitas simpan sudah digunakan untuk pemikiran berbeda.'
        using errcode = '23505';
    end if;
    return next v_thought;
    return;
  end if;

  insert into public.thoughts as t (
    user_id, company_id, raw_content, capture_operation_id
  ) values (v_user_id, p_company_id, p_raw_content, p_operation_id)
  on conflict on constraint thoughts_capture_operation_unique do nothing
  returning t.* into v_thought;
  if found then
    return next v_thought;
    return;
  end if;

  -- A concurrent identical request may have committed while INSERT waited.
  -- A separate statement gets its committed row at READ COMMITTED isolation.
  select t.* into v_thought from public.thoughts t
  where t.user_id = v_user_id and t.capture_operation_id = p_operation_id;
  if not found then
    raise exception 'Status simpan belum pasti. Coba lagi dengan identitas yang sama.'
      using errcode = '40001';
  end if;
  if v_thought.company_id <> p_company_id
    or v_thought.raw_content collate "C" <> p_raw_content collate "C" then
    raise exception 'Identitas simpan sudah digunakan untuk pemikiran berbeda.'
      using errcode = '23505';
  end if;
  return next v_thought;
end;
$$;

-- Every deletion, including a Company/account cascade, removes associated
-- Thought history. It creates no tombstone containing deleted text. Failure
-- of a restrictive dependent FK rolls back this cleanup along with deletion.
create function public.remove_deleted_thought_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.timeline_events e
  where e.user_id = old.user_id and e.company_id = old.company_id
    and e.entity_type = 'THOUGHT' and e.entity_id = old.id;
  return old;
end;
$$;
create trigger thoughts_remove_deleted_history
after delete on public.thoughts
for each row execute function public.remove_deleted_thought_history();

-- RLS remains enabled. These owner-only policies also constrain DELETE if
-- table-level rights are ever granted later. Today there is NO ordinary table
-- DELETE grant: the two narrow RPCs below are the only user deletion path.
create policy thoughts_delete_own on public.thoughts
for delete to authenticated using ((select auth.uid()) = user_id);
create policy companies_delete_own on public.companies
for delete to authenticated using ((select auth.uid()) = user_id);

-- Definer functions can bypass owner-table RLS, so each operation explicitly
-- derives and checks auth.uid(); there is no caller-supplied owner, dynamic
-- SQL, elevated application client, or unqualified application identifier.
create function public.delete_thought(p_thought_id uuid, p_confirmed boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_deleted_id uuid;
begin
  if v_user_id is null then
    raise exception 'Silakan masuk kembali.' using errcode = '42501';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Konfirmasi penghapusan diperlukan.' using errcode = '22023';
  end if;
  select t.company_id into v_company_id from public.thoughts t
  where t.id = p_thought_id and t.user_id = v_user_id;
  if not found then
    raise exception 'Pemikiran tidak tersedia.' using errcode = '42501';
  end if;

  -- Parent-first lock order matches Company deletion and excludes capture.
  perform 1 from public.companies c
  where c.id = v_company_id and c.user_id = v_user_id for update;
  if not found then
    raise exception 'Pemikiran tidak tersedia.' using errcode = '42501';
  end if;
  delete from public.thoughts t
  where t.id = p_thought_id and t.user_id = v_user_id
    and t.company_id = v_company_id returning t.id into v_deleted_id;
  if not found then
    raise exception 'Pemikiran tidak tersedia.' using errcode = '42501';
  end if;
  return v_deleted_id;
exception when foreign_key_violation then
  raise exception 'Pemikiran masih digunakan oleh catatan terkait dan belum dapat dihapus.'
    using errcode = '23503';
end;
$$;

create function public.delete_company(
  p_company_id uuid, p_confirmed boolean, p_company_name text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_company_name text;
  v_deleted_id uuid;
begin
  if v_user_id is null then
    raise exception 'Silakan masuk kembali.' using errcode = '42501';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Konfirmasi penghapusan diperlukan.' using errcode = '22023';
  end if;
  select c.name into v_company_name from public.companies c
  where c.id = p_company_id and c.user_id = v_user_id for update;
  if not found then
    raise exception 'Perusahaan tidak tersedia.' using errcode = '42501';
  end if;

  -- The parent lock conflicts with capture's SHARE lock: no new Thought can
  -- slip between this check and deletion. A stale empty-Company form fails
  -- safely if a capture committed first. Rename likewise requires rechecking.
  if exists (
    select 1 from public.thoughts t
    where t.company_id = p_company_id and t.user_id = v_user_id
  ) and (p_company_name collate "C" is distinct from v_company_name collate "C") then
    raise exception 'Ketik nama perusahaan persis untuk menghapus seluruh pemikirannya.'
      using errcode = '22023';
  end if;

  -- Existing composite ownership FKs cascade Thoughts and Company history.
  -- Future analysis FKs must use RESTRICT/NO ACTION when deletion is unsafe;
  -- PostgreSQL then rejects and rolls back the entire operation.
  delete from public.companies c
  where c.id = p_company_id and c.user_id = v_user_id
  returning c.id into v_deleted_id;
  return v_deleted_id;
exception when foreign_key_violation then
  raise exception 'Perusahaan masih digunakan oleh catatan terkait dan belum dapat dihapus.'
    using errcode = '23503';
end;
$$;

-- New functions are created and PUBLIC rights revoked in the same transaction.
-- Anonymous callers cannot execute them; trigger helpers are never callable.
revoke all on function public.remove_deleted_thought_history()
from public, anon, authenticated;
revoke all on function public.capture_thought(uuid, text, uuid)
from public, anon, authenticated;
revoke all on function public.delete_thought(uuid, boolean)
from public, anon, authenticated;
revoke all on function public.delete_company(uuid, boolean, text)
from public, anon, authenticated;
grant execute on function public.capture_thought(uuid, text, uuid) to authenticated;
grant execute on function public.delete_thought(uuid, boolean) to authenticated;
grant execute on function public.delete_company(uuid, boolean, text) to authenticated;

-- Immutable original/identity/time and history UPDATE permissions are unchanged.
-- Apply once after Milestone 3 to the configured DEVELOPMENT project only.
notify pgrst, 'reload schema';
commit;
