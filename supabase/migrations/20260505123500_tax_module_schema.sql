-- Tax module expansion: detailed yearly tax fields + exemption request workflow.

alter table if exists public.portfolio_tax_snapshots
  add column if not exists abgeltungsteuer_eur numeric not null default 0,
  add column if not exists solidaritaetszuschlag_eur numeric not null default 0,
  add column if not exists kirchensteuer_eur numeric not null default 0,
  add column if not exists quellensteuer_eur numeric not null default 0;

create table if not exists public.portfolio_tax_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  church_tax_enabled boolean not null default false,
  church_tax_rate_pct numeric not null default 0,
  freistellungsauftrag_limit_eur numeric not null default 0,
  freistellungsauftrag_used_eur numeric not null default 0,
  tax_residency_country text not null default 'DE',
  steuer_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_tax_exemption_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_amount_eur numeric not null,
  request_year integer null,
  valid_from date null,
  valid_until date null,
  note text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_amount_eur numeric null,
  admin_note text null,
  processed_by uuid null references auth.users(id) on delete set null,
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tax_exemption_requests_user_created
  on public.portfolio_tax_exemption_requests(user_id, created_at desc);
create index if not exists idx_tax_exemption_requests_status_created
  on public.portfolio_tax_exemption_requests(status, created_at desc);

drop trigger if exists trg_portfolio_tax_profiles_updated_at on public.portfolio_tax_profiles;
create trigger trg_portfolio_tax_profiles_updated_at
before update on public.portfolio_tax_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_portfolio_tax_exemption_requests_updated_at on public.portfolio_tax_exemption_requests;
create trigger trg_portfolio_tax_exemption_requests_updated_at
before update on public.portfolio_tax_exemption_requests
for each row execute function public.set_updated_at();

alter table public.portfolio_tax_profiles enable row level security;
alter table public.portfolio_tax_exemption_requests enable row level security;

drop policy if exists "portfolio_tax_profiles_select_own_or_admin" on public.portfolio_tax_profiles;
create policy "portfolio_tax_profiles_select_own_or_admin"
  on public.portfolio_tax_profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_profiles_insert_own_or_admin" on public.portfolio_tax_profiles;
create policy "portfolio_tax_profiles_insert_own_or_admin"
  on public.portfolio_tax_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_profiles_update_own_or_admin" on public.portfolio_tax_profiles;
create policy "portfolio_tax_profiles_update_own_or_admin"
  on public.portfolio_tax_profiles for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_exemption_requests_select_own_or_admin" on public.portfolio_tax_exemption_requests;
create policy "portfolio_tax_exemption_requests_select_own_or_admin"
  on public.portfolio_tax_exemption_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_exemption_requests_insert_own_or_admin" on public.portfolio_tax_exemption_requests;
create policy "portfolio_tax_exemption_requests_insert_own_or_admin"
  on public.portfolio_tax_exemption_requests for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists "portfolio_tax_exemption_requests_update_admin_only" on public.portfolio_tax_exemption_requests;
create policy "portfolio_tax_exemption_requests_update_admin_only"
  on public.portfolio_tax_exemption_requests for update to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));
