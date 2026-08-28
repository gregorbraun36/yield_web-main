create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_presence_online on public.user_presence(is_online, last_seen_at desc);

alter table public.user_presence enable row level security;

drop policy if exists "users_upsert_own_presence" on public.user_presence;
create policy "users_upsert_own_presence"
  on public.user_presence
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users_update_own_presence" on public.user_presence;
create policy "users_update_own_presence"
  on public.user_presence
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins_select_all_presence" on public.user_presence;
create policy "admins_select_all_presence"
  on public.user_presence
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or user_id = auth.uid()
  );

drop trigger if exists trg_user_presence_updated_at on public.user_presence;
create trigger trg_user_presence_updated_at
before update on public.user_presence
for each row execute function public.set_updated_at();
