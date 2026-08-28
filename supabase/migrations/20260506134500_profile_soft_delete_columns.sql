alter table if exists public.profiles
  add column if not exists deleted_at timestamptz null,
  add column if not exists delete_requested_at timestamptz null,
  add column if not exists delete_reason text null;

create index if not exists idx_profiles_deleted_at on public.profiles(deleted_at);
