begin;

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  app_language text not null default 'id-ID'
    check (app_language in ('id-ID', 'en-US')),
  guidance_mode text not null default 'ADAPTIVE'
    check (guidance_mode in ('MORE', 'ADAPTIVE', 'MINIMAL')),
  challenge_intensity text not null default 'STANDARD'
    check (challenge_intensity in ('LIGHT', 'STANDARD', 'DEEP')),
  refine_tone text not null default 'NATURAL',
  theme_key text not null default 'HYBRID_KRAVV',
  monthly_ai_budget_idr numeric(12,2)
    check (monthly_ai_budget_idr is null or monthly_ai_budget_idr >= 0),
  ai_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_user_settings_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_user_settings_updated_at();

alter table public.user_settings enable row level security;

revoke all on public.user_settings from anon, authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

create policy user_settings_select_own on public.user_settings
for select to authenticated using ((select auth.uid()) = user_id);

create policy user_settings_insert_own on public.user_settings
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy user_settings_update_own on public.user_settings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_settings_delete_own on public.user_settings
for delete to authenticated using ((select auth.uid()) = user_id);

commit;
