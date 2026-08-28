alter table if exists public.portfolio_contracts
  add column if not exists bank_id uuid references public.banks(id);

create index if not exists idx_portfolio_contracts_bank_id
  on public.portfolio_contracts(bank_id);
