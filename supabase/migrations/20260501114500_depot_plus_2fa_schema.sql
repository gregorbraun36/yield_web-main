-- Depot Plus + Mail OTP 2FA schema and RLS baseline.

alter table if exists public.profiles
  add column if not exists two_factor_enabled boolean not null default false,
  add column if not exists two_factor_channel text not null default 'email',
  add column if not exists two_factor_enabled_at timestamptz null;

create table if not exists public.auth_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  purpose text not null default 'login_2fa',
  otp_hash text not null,
  code_expires_at timestamptz not null,
  consumed_at timestamptz null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  cooldown_until timestamptz null,
  device_fingerprint_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint_hash text not null,
  device_label text null,
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (user_id, device_fingerprint_hash)
);

create table if not exists public.portfolio_cashflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_id uuid null references public.portfolio_contracts(id) on delete set null,
  flow_type text not null,
  amount_eur numeric not null,
  flow_date date not null,
  source text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_benchmarks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_benchmark_points (
  id uuid primary key default gen_random_uuid(),
  benchmark_id uuid not null references public.portfolio_benchmarks(id) on delete cascade,
  point_date date not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  unique (benchmark_id, point_date)
);

create table if not exists public.portfolio_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_id uuid null references public.portfolio_contracts(id) on delete set null,
  document_type text not null,
  title text not null,
  file_url text not null,
  mime_type text null,
  file_size_bytes bigint null,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  severity text not null default 'info',
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  total_value_eur numeric not null default 0,
  available_eur numeric not null default 0,
  accrued_interest_eur numeric not null default 0,
  daily_yield_eur numeric not null default 0,
  net_flow_eur numeric not null default 0,
  weighted_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create table if not exists public.portfolio_tax_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year integer not null,
  gross_interest_eur numeric not null default 0,
  tax_withheld_eur numeric not null default 0,
  fees_eur numeric not null default 0,
  net_interest_eur numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tax_year)
);

create table if not exists public.portfolio_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_otp_challenges_user_created on public.auth_otp_challenges(user_id, created_at desc);
create index if not exists idx_auth_otp_challenges_email_purpose on public.auth_otp_challenges(email, purpose, consumed_at);
create index if not exists idx_trusted_devices_user on public.trusted_devices(user_id, expires_at desc);
create index if not exists idx_portfolio_cashflows_user_date on public.portfolio_cashflows(user_id, flow_date desc);
create index if not exists idx_portfolio_documents_user_created on public.portfolio_documents(user_id, created_at desc);
create index if not exists idx_portfolio_notifications_user_created on public.portfolio_notifications(user_id, created_at desc);
create index if not exists idx_portfolio_activity_log_user_created on public.portfolio_activity_log(user_id, created_at desc);

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'admin'
  );
$$;

drop trigger if exists trg_auth_otp_challenges_updated_at on public.auth_otp_challenges;
create trigger trg_auth_otp_challenges_updated_at
before update on public.auth_otp_challenges
for each row execute function public.set_updated_at();

drop trigger if exists trg_portfolio_tax_snapshots_updated_at on public.portfolio_tax_snapshots;
create trigger trg_portfolio_tax_snapshots_updated_at
before update on public.portfolio_tax_snapshots
for each row execute function public.set_updated_at();

alter table public.auth_otp_challenges enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.portfolio_cashflows enable row level security;
alter table public.portfolio_benchmarks enable row level security;
alter table public.portfolio_benchmark_points enable row level security;
alter table public.portfolio_documents enable row level security;
alter table public.portfolio_notifications enable row level security;
alter table public.portfolio_daily_snapshots enable row level security;
alter table public.portfolio_tax_snapshots enable row level security;
alter table public.portfolio_activity_log enable row level security;

drop policy if exists "otp_select_own_or_admin" on public.auth_otp_challenges;
create policy "otp_select_own_or_admin"
  on public.auth_otp_challenges for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "otp_insert_own_or_admin" on public.auth_otp_challenges;
create policy "otp_insert_own_or_admin"
  on public.auth_otp_challenges for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "otp_update_own_or_admin" on public.auth_otp_challenges;
create policy "otp_update_own_or_admin"
  on public.auth_otp_challenges for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "trusted_devices_select_own_or_admin" on public.trusted_devices;
create policy "trusted_devices_select_own_or_admin"
  on public.trusted_devices for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "trusted_devices_insert_own_or_admin" on public.trusted_devices;
create policy "trusted_devices_insert_own_or_admin"
  on public.trusted_devices for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "trusted_devices_update_own_or_admin" on public.trusted_devices;
create policy "trusted_devices_update_own_or_admin"
  on public.trusted_devices for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "trusted_devices_delete_own_or_admin" on public.trusted_devices;
create policy "trusted_devices_delete_own_or_admin"
  on public.trusted_devices for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_cashflows_select_own_or_admin" on public.portfolio_cashflows;
create policy "portfolio_cashflows_select_own_or_admin"
  on public.portfolio_cashflows for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_cashflows_insert_own_or_admin" on public.portfolio_cashflows;
create policy "portfolio_cashflows_insert_own_or_admin"
  on public.portfolio_cashflows for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_cashflows_update_own_or_admin" on public.portfolio_cashflows;
create policy "portfolio_cashflows_update_own_or_admin"
  on public.portfolio_cashflows for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_documents_select_own_or_admin" on public.portfolio_documents;
create policy "portfolio_documents_select_own_or_admin"
  on public.portfolio_documents for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_documents_insert_own_or_admin" on public.portfolio_documents;
create policy "portfolio_documents_insert_own_or_admin"
  on public.portfolio_documents for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_documents_delete_own_or_admin" on public.portfolio_documents;
create policy "portfolio_documents_delete_own_or_admin"
  on public.portfolio_documents for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_notifications_select_own_or_admin" on public.portfolio_notifications;
create policy "portfolio_notifications_select_own_or_admin"
  on public.portfolio_notifications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_notifications_insert_admin_or_owner" on public.portfolio_notifications;
create policy "portfolio_notifications_insert_admin_or_owner"
  on public.portfolio_notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_notifications_update_own_or_admin" on public.portfolio_notifications;
create policy "portfolio_notifications_update_own_or_admin"
  on public.portfolio_notifications for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_daily_snapshots_select_own_or_admin" on public.portfolio_daily_snapshots;
create policy "portfolio_daily_snapshots_select_own_or_admin"
  on public.portfolio_daily_snapshots for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_daily_snapshots_insert_own_or_admin" on public.portfolio_daily_snapshots;
create policy "portfolio_daily_snapshots_insert_own_or_admin"
  on public.portfolio_daily_snapshots for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_daily_snapshots_update_own_or_admin" on public.portfolio_daily_snapshots;
create policy "portfolio_daily_snapshots_update_own_or_admin"
  on public.portfolio_daily_snapshots for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_snapshots_select_own_or_admin" on public.portfolio_tax_snapshots;
create policy "portfolio_tax_snapshots_select_own_or_admin"
  on public.portfolio_tax_snapshots for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_snapshots_insert_own_or_admin" on public.portfolio_tax_snapshots;
create policy "portfolio_tax_snapshots_insert_own_or_admin"
  on public.portfolio_tax_snapshots for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_snapshots_update_own_or_admin" on public.portfolio_tax_snapshots;
create policy "portfolio_tax_snapshots_update_own_or_admin"
  on public.portfolio_tax_snapshots for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_activity_log_select_own_or_admin" on public.portfolio_activity_log;
create policy "portfolio_activity_log_select_own_or_admin"
  on public.portfolio_activity_log for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_activity_log_insert_own_or_admin" on public.portfolio_activity_log;
create policy "portfolio_activity_log_insert_own_or_admin"
  on public.portfolio_activity_log for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_benchmarks_admin_only" on public.portfolio_benchmarks;
create policy "portfolio_benchmarks_admin_only"
  on public.portfolio_benchmarks for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "portfolio_benchmark_points_admin_only" on public.portfolio_benchmark_points;
create policy "portfolio_benchmark_points_admin_only"
  on public.portfolio_benchmark_points for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));
