-- Admin provisioning and forced onboarding flow.
alter table if exists public.profiles
  add column if not exists admin_created boolean not null default false,
  add column if not exists must_reset_password boolean not null default false,
  add column if not exists onboarding_required boolean not null default true,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz null,
  add column if not exists temporary_password_updated_at timestamptz null;

create table if not exists public.admin_provisioned_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  temporary_password text not null,
  revealed_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  target_user_id uuid references auth.users(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  subject text not null,
  status text not null default 'offen',
  priority text not null default 'normal',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_user_id uuid references auth.users(id),
  sender_role text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  user_name text,
  user_email text,
  bank_name text not null,
  contract_number text not null,
  product_type text not null,
  amount_eur numeric not null default 0,
  interest_rate numeric not null default 0,
  term_months integer not null default 0,
  active_from date,
  active_until date,
  status text not null default 'aktiv',
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_onboarding on public.profiles(onboarding_completed, onboarding_required);
create index if not exists idx_admin_activity_created_at on public.admin_activity_feed(created_at desc);
create index if not exists idx_support_tickets_status on public.support_tickets(status, last_message_at desc);
create index if not exists idx_portfolio_contracts_active on public.portfolio_contracts(status, is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_provisioned_credentials_updated_at on public.admin_provisioned_credentials;
create trigger trg_admin_provisioned_credentials_updated_at
before update on public.admin_provisioned_credentials
for each row execute function public.set_updated_at();

drop trigger if exists trg_portfolio_contracts_updated_at on public.portfolio_contracts;
create trigger trg_portfolio_contracts_updated_at
before update on public.portfolio_contracts
for each row execute function public.set_updated_at();

-- Basic RLS hardening hooks; policies should be adapted to your auth setup.
alter table public.admin_provisioned_credentials enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.admin_activity_feed enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.portfolio_contracts enable row level security;
