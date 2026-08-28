-- Auto-calculate yearly tax snapshots from daily portfolio snapshots.

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
  v_tax_year integer := coalesce(p_tax_year, extract(year from timezone('Europe/Berlin', now()))::integer);
  v_gross_interest numeric := 0;
  v_allowance_limit numeric := 0;
  v_allowance_used numeric := 0;
  v_allowance_remaining numeric := 0;
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

  select
    coalesce(sum(ds.daily_yield_eur), 0)::numeric
  into v_gross_interest
  from public.portfolio_daily_snapshots ds
  where ds.user_id = p_user_id
    and extract(year from ds.snapshot_date)::integer = v_tax_year;

  select
    coalesce(tp.freistellungsauftrag_limit_eur, 0)::numeric,
    coalesce(tp.freistellungsauftrag_used_eur, 0)::numeric,
    coalesce(tp.church_tax_enabled, false),
    coalesce(tp.church_tax_rate_pct, 0)::numeric
  into
    v_allowance_limit,
    v_allowance_used,
    v_kirchensteuer_enabled,
    v_kirchensteuer_rate
  from public.portfolio_tax_profiles tp
  where tp.user_id = p_user_id;

  if not found then
    v_allowance_limit := 0;
    v_allowance_used := 0;
    v_kirchensteuer_enabled := false;
    v_kirchensteuer_rate := 0;
  end if;

  v_allowance_remaining := greatest(v_allowance_limit - v_allowance_used, 0);
  v_taxable_base := greatest(v_gross_interest - v_allowance_remaining, 0);

  v_abgeltungsteuer := round(v_taxable_base * 0.25, 2);
  v_solidaritaetszuschlag := round(v_abgeltungsteuer * 0.055, 2);
  v_kirchensteuer := round(
    case when v_kirchensteuer_enabled
      then v_abgeltungsteuer * (v_kirchensteuer_rate / 100.0)
      else 0
    end,
    2
  );

  select
    coalesce(ts.quellensteuer_eur, 0)::numeric,
    coalesce(ts.fees_eur, 0)::numeric
  into
    v_quellensteuer,
    v_fees
  from public.portfolio_tax_snapshots ts
  where ts.user_id = p_user_id
    and ts.tax_year = v_tax_year;

  if not found then
    v_quellensteuer := 0;
    v_fees := 0;
  end if;

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
    net_interest_eur
  )
  values (
    p_user_id,
    v_tax_year,
    round(v_gross_interest, 2),
    v_tax_total,
    v_abgeltungsteuer,
    v_solidaritaetszuschlag,
    v_kirchensteuer,
    round(v_quellensteuer, 2),
    round(v_fees, 2),
    v_net_interest
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
    net_interest_eur = excluded.net_interest_eur;
end;
$$;

create or replace function public.refresh_tax_snapshots(
  p_snapshot_date date default ((timezone('Europe/Berlin', now()))::date)
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_tax_year integer := extract(year from coalesce(p_snapshot_date, (timezone('Europe/Berlin', now()))::date))::integer;
  v_row record;
begin
  for v_row in
    select p.id
    from public.profiles p
    where p.role = 'user'
      and coalesce(p.status, 'pending') = 'approved'
  loop
    perform public.refresh_user_tax_snapshot(v_row.id, v_tax_year);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.refresh_user_tax_snapshot(uuid, integer) from public;
revoke all on function public.refresh_tax_snapshots(date) from public;

grant execute on function public.refresh_user_tax_snapshot(uuid, integer) to authenticated;
grant execute on function public.refresh_tax_snapshots(date) to service_role;

do $$
declare
  v_job_id integer;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    select jobid
      into v_job_id
    from cron.job
    where jobname = 'refresh_tax_snapshots_berlin';

    if v_job_id is not null then
      perform cron.unschedule(v_job_id);
    end if;

    perform cron.schedule(
      'refresh_tax_snapshots_berlin',
      '20 0 * * *',
      $cron$select public.refresh_tax_snapshots((timezone('Europe/Berlin', now()))::date);$cron$
    );
  end if;
end $$;

-- One-time immediate refresh for current tax year after migration deployment.
select public.refresh_tax_snapshots((timezone('Europe/Berlin', now()))::date);
