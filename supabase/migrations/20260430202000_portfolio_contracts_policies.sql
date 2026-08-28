-- RLS policies for portfolio_contracts
-- Admin can manage all contracts; users can only read their own contracts.

alter table public.portfolio_contracts enable row level security;

drop policy if exists "admins_select_portfolio_contracts" on public.portfolio_contracts;
create policy "admins_select_portfolio_contracts"
  on public.portfolio_contracts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "admins_insert_portfolio_contracts" on public.portfolio_contracts;
create policy "admins_insert_portfolio_contracts"
  on public.portfolio_contracts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "admins_update_portfolio_contracts" on public.portfolio_contracts;
create policy "admins_update_portfolio_contracts"
  on public.portfolio_contracts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "admins_delete_portfolio_contracts" on public.portfolio_contracts;
create policy "admins_delete_portfolio_contracts"
  on public.portfolio_contracts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "users_select_own_portfolio_contracts" on public.portfolio_contracts;
create policy "users_select_own_portfolio_contracts"
  on public.portfolio_contracts
  for select
  to authenticated
  using (user_id = auth.uid());
