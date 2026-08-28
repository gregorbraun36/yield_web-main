-- Extend contract tax/fee rules and improve yearly tax snapshot automation.

alter table if exists public.portfolio_contracts
  add column if not exists withholding_tax_rate_pct numeric not null default 0,
  add column if not exists fee_model text not null default 'none',
  add column if not exists fee_rate_pct numeric not null default 0,
  add column if not exists fee_fixed_annual_eur numeric not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_contracts_fee_model_check'
  ) then
    alter table public.portfolio_contracts
      add constraint portfolio_contracts_fee_model_check
      check (fee_model in ('none', 'percent_of_interest', 'percent_of_assets', 'fixed_annual'));
  end if;
end $$;

alter table if exists public.portfolio_tax_snapshots
  add column if not exists freistellungsauftrag_limit_eur numeric not null default 0,
  add column if not exists freistellungsauftrag_used_eur numeric not null default 0;

create or replace function public.refresh_user_tax_snapshot(
  p_user_id uuid,
  p_tax_year integer default extract(year from timezone('Europe/Berlin', now()))::integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_today_berlin date := (timezone('Europe/Berlin', now()))::date;
  v_tax_year integer := coalesce(p_tax_year, extract(year from timezone('Europe/Berlin', now()))::integer);
  v_year_start date := make_date(v_tax_year, 1, 1);
  v_year_end date := make_date(v_tax_year, 12, 31);
  v_cutoff_date date;
  v_gross_interest numeric := 0;
  v_contract_gross_estimate numeric := 0;
  v_allowance_limit numeric := 0;
  v_allowance_used_year numeric := 0;
  v_taxable_base numeric := 0;
  v_abgeltungsteuer numeric := 0;
  v_solidaritaetszuschlag numeric := 0;
  v_kirchensteuer numeric := 0;
  v_kirchensteuer_enabled boolean := false;
  v_kirchensteuer_rate numeric := 0;
  v_quellensteuer numeric := 0;
  v_fees numeric := 0;
  v_tax_total numeric := 0;
  v_net_interest numeric := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if v_actor_user_id is not null
     and v_actor_user_id <> p_user_id
     and not public.is_admin(v_actor_user_id) then
    raise exception 'Not allowed to refresh tax snapshots for other users';
  end if;

  v_cutoff_date := case
    when v_tax_year < extract(year from v_today_berlin)::integer then v_year_end
    when v_tax_year > extract(year from v_today_berlin)::integer then v_year_start
    else v_today_berlin
  end;

  select
    coalesce(sum(ds.daily_yield_eur), 0)::numeric
  into v_gross_interest
  from public.portfolio_daily_snapshots ds
  where ds.user_id = p_user_id
    and extract(year from ds.snapshot_date)::integer = v_tax_year
    and ds.snapshot_date <= v_cutoff_date;

  with contract_rows as (
    select
      coalesce(c.amount_eur, 0)::numeric as amount_eur,
      (coalesce(c.interest_rate, 0)::numeric / 100.0) as annual_rate,
      coalesce(c.withholding_tax_rate_pct, 0)::numeric as withholding_rate_pct,
      coalesce(c.fee_model, 'none') as fee_model,
      coalesce(c.fee_rate_pct, 0)::numeric as fee_rate_pct,
      coalesce(c.fee_fixed_annual_eur, 0)::numeric as fee_fixed_annual_eur,
      coalesce(c.active_from::date, c.created_at::date) as start_date,
      case
        when coalesce(c.term_months, case when c.product_type = 'Tagesgeld' then 0 else 12 end) > 0
          then coalesce(c.active_until::date, (coalesce(c.active_from::date, c.created_at::date) + (coalesce(c.term_months, 12) || ' months')::interval)::date)
        else c.active_until::date
      end as end_date
    from public.portfolio_contracts c
    where c.user_id = p_user_id
      and coalesce(c.is_active, true) = true
      and coalesce(c.status, 'aktiv') <> 'rejected'
  ),
  contract_active_days as (
    select
      amount_eur,
      annual_rate,
      withholding_rate_pct,
      fee_model,
      fee_rate_pct,
      fee_fixed_annual_eur,
      case
        when least(coalesce(end_date, v_cutoff_date), v_cutoff_date) >= greatest(start_date, v_year_start)
          then (least(coalesce(end_date, v_cutoff_date), v_cutoff_date) - greatest(start_date, v_year_start) + 1)::numeric
        else 0::numeric
      end as active_days
    from contract_rows
  ),
  contract_calc as (
    select
      amount_eur,
      annual_rate,
      withholding_rate_pct,
      fee_model,
      fee_rate_pct,
      fee_fixed_annual_eur,
      active_days,
      (amount_eur * annual_rate * (active_days / 365.0))::numeric as gross_interest_eur
    from contract_active_days
  )
  select
    coalesce(sum(gross_interest_eur), 0)::numeric as contract_gross_estimate,
    coalesce(sum(gross_interest_eur * (withholding_rate_pct / 100.0)), 0)::numeric as quellensteuer_auto,
    coalesce(sum(
      case fee_model
        when 'percent_of_interest' then gross_interest_eur * (fee_rate_pct / 100.0)
        when 'percent_of_assets' then amount_eur * (fee_rate_pct / 100.0) * (active_days / 365.0)
        when 'fixed_annual' then fee_fixed_annual_eur * (active_days / 365.0)
        else 0::numeric
      end
    ), 0)::numeric as fees_auto
  into
    v_contract_gross_estimate,
    v_quellensteuer,
    v_fees
  from contract_calc;

  if v_gross_interest <= 0 and v_contract_gross_estimate > 0 then
    v_gross_interest := v_contract_gross_estimate;
  end if;

  select
    coalesce(tp.freistellungsauftrag_limit_eur, 0)::numeric,
    coalesce(tp.church_tax_enabled, false),
    coalesce(tp.church_tax_rate_pct, 0)::numeric
  into
    v_allowance_limit,
    v_kirchensteuer_enabled,
    v_kirchensteuer_rate
  from public.portfolio_tax_profiles tp
  where tp.user_id = p_user_id;

  if not found then
    v_allowance_limit := 0;
    v_kirchensteuer_enabled := false;
    v_kirchensteuer_rate := 0;
  end if;

  v_allowance_used_year := least(v_gross_interest, v_allowance_limit);
  v_taxable_base := greatest(v_gross_interest - v_allowance_used_year, 0);

  v_abgeltungsteuer := round(v_taxable_base * 0.25, 2);
  v_solidaritaetszuschlag := round(v_abgeltungsteuer * 0.055, 2);
  v_kirchensteuer := round(
    case when v_kirchensteuer_enabled
      then v_abgeltungsteuer * (v_kirchensteuer_rate / 100.0)
      else 0
    end,
    2
  );

  v_quellensteuer := round(coalesce(v_quellensteuer, 0), 2);
  v_fees := round(coalesce(v_fees, 0), 2);
  v_tax_total := round(v_abgeltungsteuer + v_solidaritaetszuschlag + v_kirchensteuer + v_quellensteuer, 2);
  v_net_interest := round(v_gross_interest - v_tax_total - v_fees, 2);

  insert into public.portfolio_tax_snapshots (
    user_id,
    tax_year,
    gross_interest_eur,
    tax_withheld_eur,
    abgeltungsteuer_eur,
    solidaritaetszuschlag_eur,
    kirchensteuer_eur,
    quellensteuer_eur,
    fees_eur,
    net_interest_eur,
    freistellungsauftrag_limit_eur,
    freistellungsauftrag_used_eur
  )
  values (
    p_user_id,
    v_tax_year,
    round(v_gross_interest, 2),
    v_tax_total,
    v_abgeltungsteuer,
    v_solidaritaetszuschlag,
    v_kirchensteuer,
    v_quellensteuer,
    v_fees,
    v_net_interest,
    round(v_allowance_limit, 2),
    round(v_allowance_used_year, 2)
  )
  on conflict (user_id, tax_year)
  do update set
    gross_interest_eur = excluded.gross_interest_eur,
    tax_withheld_eur = excluded.tax_withheld_eur,
    abgeltungsteuer_eur = excluded.abgeltungsteuer_eur,
    solidaritaetszuschlag_eur = excluded.solidaritaetszuschlag_eur,
    kirchensteuer_eur = excluded.kirchensteuer_eur,
    quellensteuer_eur = excluded.quellensteuer_eur,
    fees_eur = excluded.fees_eur,
    net_interest_eur = excluded.net_interest_eur,
    freistellungsauftrag_limit_eur = excluded.freistellungsauftrag_limit_eur,
    freistellungsauftrag_used_eur = excluded.freistellungsauftrag_used_eur;
end;
$$;

-- One-time refresh after deploying this migration.
select public.refresh_tax_snapshots((timezone('Europe/Berlin', now()))::date);
