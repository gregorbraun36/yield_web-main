-- Phase 4: deterministic daily snapshot refresh + daily cron schedule.

create or replace function public.refresh_user_daily_snapshot(
  p_user_id uuid,
  p_snapshot_date date default ((timezone('Europe/Berlin', now()))::date)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_date date := coalesce(p_snapshot_date, (timezone('Europe/Berlin', now()))::date);
  v_actor_user_id uuid := auth.uid();
  v_total_value numeric := 0;
  v_available numeric := 0;
  v_accrued numeric := 0;
  v_daily_yield numeric := 0;
  v_weighted_rate numeric := 0;
  v_net_flow numeric := 0;
begin
  if v_actor_user_id is not null
     and v_actor_user_id <> p_user_id
     and not public.is_admin(v_actor_user_id) then
    raise exception 'Not allowed to refresh snapshots for other users';
  end if;

  with contract_rows as (
    select
      c.user_id,
      c.product_type,
      coalesce(c.amount_eur, 0)::numeric as amount_eur,
      (coalesce(c.interest_rate, 0)::numeric / 100.0) as annual_rate,
      coalesce(c.term_months, case when c.product_type = 'Tagesgeld' then 0 else 12 end) as term_months,
      coalesce(c.lock_months, case when c.product_type = 'Flexgeld' then 3 else 0 end) as lock_months,
      coalesce(c.active_from::date, c.created_at::date) as start_date,
      c.active_until::date as explicit_end_date
    from public.portfolio_contracts c
    where c.user_id = p_user_id
      and coalesce(c.is_active, true) = true
      and coalesce(c.status, 'aktiv') <> 'rejected'
  ),
  snapshots as (
    select
      r.user_id,
      r.product_type,
      r.amount_eur,
      r.annual_rate,
      r.term_months,
      r.lock_months,
      r.start_date,
      case
        when r.term_months > 0 then coalesce(r.explicit_end_date, (r.start_date + (r.term_months || ' months')::interval)::date)
        else null
      end as end_date,
      greatest(0, (v_snapshot_date - r.start_date))::numeric as elapsed_days
    from contract_rows r
  ),
  snapshot_values as (
    select
      s.user_id,
      s.product_type,
      s.amount_eur,
      s.annual_rate,
      s.term_months,
      s.lock_months,
      s.end_date,
      s.elapsed_days,
      (s.amount_eur * s.annual_rate * (s.elapsed_days / 365.0))::numeric as accrued_interest,
      (s.amount_eur * s.annual_rate / 365.0)::numeric as daily_earnings,
      (s.amount_eur * s.annual_rate * (s.term_months::numeric / 12.0))::numeric as maturity_interest
    from snapshots s
  ),
  aggregate_values as (
    select
      coalesce(sum(v.amount_eur + v.accrued_interest), 0)::numeric as total_value_eur,
      coalesce(sum(v.accrued_interest), 0)::numeric as accrued_interest_eur,
      coalesce(sum(v.daily_earnings), 0)::numeric as daily_yield_eur,
      coalesce(
        sum(
          case
            when v.product_type = 'Festgeld' then
              case
                when v.end_date is not null and v_snapshot_date >= v.end_date
                  then v.amount_eur + v.maturity_interest
                else 0
              end
            when v.product_type = 'Flexgeld' then
              case
                when v.elapsed_days < floor(v.lock_months::numeric * 30.44)
                  then 0
                else v.amount_eur + v.accrued_interest
              end
            else
              v.amount_eur + v.accrued_interest
          end
        ),
        0
      )::numeric as available_eur,
      coalesce(
        sum(v.amount_eur * (v.annual_rate * 100.0))
        / nullif(sum(v.amount_eur), 0),
        0
      )::numeric as weighted_rate
    from snapshot_values v
  )
  select
    a.total_value_eur,
    a.available_eur,
    a.accrued_interest_eur,
    a.daily_yield_eur,
    a.weighted_rate
  into
    v_total_value,
    v_available,
    v_accrued,
    v_daily_yield,
    v_weighted_rate
  from aggregate_values a;

  select coalesce(sum(
    case
      when cf.flow_type = 'outflow' then -1 * coalesce(cf.amount_eur, 0)::numeric
      else coalesce(cf.amount_eur, 0)::numeric
    end
  ), 0)::numeric
  into v_net_flow
  from public.portfolio_cashflows cf
  where cf.user_id = p_user_id
    and cf.flow_date = v_snapshot_date;

  insert into public.portfolio_daily_snapshots (
    user_id,
    snapshot_date,
    total_value_eur,
    available_eur,
    accrued_interest_eur,
    daily_yield_eur,
    net_flow_eur,
    weighted_rate
  )
  values (
    p_user_id,
    v_snapshot_date,
    coalesce(v_total_value, 0),
    coalesce(v_available, 0),
    coalesce(v_accrued, 0),
    coalesce(v_daily_yield, 0),
    coalesce(v_net_flow, 0),
    coalesce(v_weighted_rate, 0)
  )
  on conflict (user_id, snapshot_date)
  do update set
    total_value_eur = excluded.total_value_eur,
    available_eur = excluded.available_eur,
    accrued_interest_eur = excluded.accrued_interest_eur,
    daily_yield_eur = excluded.daily_yield_eur,
    net_flow_eur = excluded.net_flow_eur,
    weighted_rate = excluded.weighted_rate;
end;
$$;

create or replace function public.refresh_daily_snapshots(
  p_snapshot_date date default ((timezone('Europe/Berlin', now()))::date)
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row record;
begin
  for v_row in
    select p.id
    from public.profiles p
    where p.role = 'user'
      and coalesce(p.status, 'pending') = 'approved'
  loop
    perform public.refresh_user_daily_snapshot(v_row.id, p_snapshot_date);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.refresh_user_daily_snapshot(uuid, date) from public;
revoke all on function public.refresh_daily_snapshots(date) from public;

grant execute on function public.refresh_user_daily_snapshot(uuid, date) to authenticated;
grant execute on function public.refresh_daily_snapshots(date) to service_role;

do $$
declare
  v_job_id integer;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    select jobid
      into v_job_id
    from cron.job
    where jobname = 'refresh_daily_snapshots_berlin';

    if v_job_id is not null then
      perform cron.unschedule(v_job_id);
    end if;

    perform cron.schedule(
      'refresh_daily_snapshots_berlin',
      '10 0 * * *',
      $cron$select public.refresh_daily_snapshots((timezone('Europe/Berlin', now()))::date);$cron$
    );
  end if;
end $$;
