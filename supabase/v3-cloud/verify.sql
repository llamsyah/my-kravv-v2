-- REVIEW ONLY: requires separate live-read authorization after bootstrap.
-- Run the entire file in the independently confirmed V3 project SQL editor.
-- Read-only catalog evidence; no DDL, fixture creation or automatic repair.
begin transaction read only;
select current_database(), current_user, version();
select public.v3_target_identity() as persisted_identity;
select singleton, project_id, purpose, schema_version from v3_internal.environment;
select nspname, nspowner::regrole, nspacl from pg_namespace
where nspname = 'v3_internal';
select c.relname, c.relowner::regrole, c.relrowsecurity, c.relacl
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in ('companies', 'user_settings'))
or (n.nspname = 'v3_internal' and c.relname = 'environment');
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public'
and tablename in ('companies', 'user_settings');
select grantee, table_name, privilege_type from information_schema.table_privileges
where table_schema = 'public' and table_name in ('companies', 'user_settings');
select grantee, table_name, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('companies', 'user_settings');
select p.oid::regprocedure, p.proowner::regrole, p.prosecdef, p.proconfig,
p.proacl, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where (n.nspname = 'public' and p.proname = 'v3_target_identity')
or (n.nspname = 'v3_internal' and p.proname = 'touch_company');
select r.rolname, r.rolsuper, r.rolbypassrls,
has_schema_privilege(r.oid, 'v3_internal', 'USAGE') as private_schema_usage,
has_function_privilege(r.oid, 'public.v3_target_identity()', 'EXECUTE') as identity_execute,
has_function_privilege(r.oid, 'v3_internal.touch_company()', 'EXECUTE') as trigger_execute,
has_table_privilege(r.oid, 'v3_internal.environment', 'SELECT') as private_marker_select,
has_table_privilege(r.oid, 'public.companies', 'DELETE') as company_delete
from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role');
select conrelid::regclass, conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid in
('public.companies'::regclass, 'public.user_settings'::regclass,
'v3_internal.environment'::regclass);
select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('companies', 'user_settings');
select tgname, pg_get_triggerdef(oid) from pg_trigger
where tgrelid = 'public.companies'::regclass and not tgisinternal;
rollback;
