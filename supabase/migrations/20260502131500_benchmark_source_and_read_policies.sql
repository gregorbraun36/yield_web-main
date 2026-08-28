-- Phase 2: real benchmark source metadata + read/write policy split.

alter table if exists public.portfolio_benchmarks
  add column if not exists source text not null default 'manual',
  add column if not exists source_code text null,
  add column if not exists description text null,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.portfolio_benchmark_points
  add column if not exists as_of timestamptz null,
  add column if not exists is_provisional boolean not null default false,
  add column if not exists source_ref text null,
  add column if not exists raw_value numeric null;

create index if not exists idx_portfolio_benchmark_points_benchmark_date
  on public.portfolio_benchmark_points(benchmark_id, point_date desc);

drop trigger if exists trg_portfolio_benchmarks_updated_at on public.portfolio_benchmarks;
create trigger trg_portfolio_benchmarks_updated_at
before update on public.portfolio_benchmarks
for each row execute function public.set_updated_at();

-- Replace broad admin-only policy with explicit read/write split.
drop policy if exists "portfolio_benchmarks_admin_only" on public.portfolio_benchmarks;
drop policy if exists "portfolio_benchmark_points_admin_only" on public.portfolio_benchmark_points;

drop policy if exists "portfolio_benchmarks_select_authenticated" on public.portfolio_benchmarks;
create policy "portfolio_benchmarks_select_authenticated"
  on public.portfolio_benchmarks for select to authenticated
  using (true);

drop policy if exists "portfolio_benchmarks_write_admin_only" on public.portfolio_benchmarks;
create policy "portfolio_benchmarks_write_admin_only"
  on public.portfolio_benchmarks for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "portfolio_benchmark_points_select_authenticated" on public.portfolio_benchmark_points;
create policy "portfolio_benchmark_points_select_authenticated"
  on public.portfolio_benchmark_points for select to authenticated
  using (true);

drop policy if exists "portfolio_benchmark_points_write_admin_only" on public.portfolio_benchmark_points;
create policy "portfolio_benchmark_points_write_admin_only"
  on public.portfolio_benchmark_points for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

insert into public.portfolio_benchmarks (code, label, currency, source, source_code, description)
values (
  'ESTR_ECB',
  '€STR Cash Benchmark (ECB)',
  'EUR',
  'ecb',
  'EST/B.EU000A2X2A25.WT',
  'ECB €STR daily series transformed to cumulative cash index.'
)
on conflict (code) do update
set
  label = excluded.label,
  currency = excluded.currency,
  source = excluded.source,
  source_code = excluded.source_code,
  description = excluded.description,
  updated_at = now();
