alter table if exists public.portfolio_contracts
  add column if not exists payout_frequency text not null default 'endfaellig',
  add column if not exists lock_months integer not null default 0;

create index if not exists idx_portfolio_contracts_user_product
  on public.portfolio_contracts(user_id, product_type, is_active);
