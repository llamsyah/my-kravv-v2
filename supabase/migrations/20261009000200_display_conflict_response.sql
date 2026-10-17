begin;

-- A stale display revision is a terminal application conflict, not a transient
-- PostgreSQL serialization failure. PostgREST 14 retries SQLSTATE 40001, so use
-- its explicit HTTP 409 code. Preserve the already applied function and grants.
do $$
declare
  v_definition text;
  v_old text := 'raise exception ''DISPLAY_CONFLICT'' using errcode = ''40001'';';
begin
  select pg_get_functiondef('public.set_thought_display(uuid,uuid,text,uuid,bigint)'::regprocedure)
    into v_definition;
  if position(v_old in v_definition) = 0 then
    raise exception 'Expected Phase 4A display conflict branch not found';
  end if;
  execute replace(v_definition, v_old,
    'raise exception ''DISPLAY_CONFLICT'' using errcode = ''PT409'';');
end;
$$;

notify pgrst, 'reload schema';
commit;
