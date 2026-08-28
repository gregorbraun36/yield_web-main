import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SyncRequest = {
  startDate?: string;
  endDate?: string;
  benchmarkCode?: string;
};

type EcbRow = {
  pointDate: string;
  rawRatePct: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ECB_ESTR_CSV_URL = 'https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT';
const DEFAULT_BENCHMARK_CODE = 'ESTR_ECB';
const INDEX_BASE = 100;

const toIsoDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildEcbUrl = (startDate?: string, endDate?: string) => {
  const url = new URL(ECB_ESTR_CSV_URL);
  url.searchParams.set('format', 'csvdata');
  if (startDate) url.searchParams.set('startPeriod', startDate);
  if (endDate) url.searchParams.set('endPeriod', endDate);
  return url.toString();
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseEcbCsv = (csvText: string): EcbRow[] => {
  const lines = csvText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const headerCells = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').toUpperCase());
  const dateIdx = headerCells.findIndex((h) => h.includes('TIME_PERIOD') || h === 'DATE');
  const valueIdx = headerCells.findIndex((h) => h.includes('OBS_VALUE') || h === 'VALUE');
  if (dateIdx < 0 || valueIdx < 0) {
    throw new Error('Unexpected ECB CSV format: TIME_PERIOD/OBS_VALUE columns missing.');
  }

  const rows: EcbRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, ''));
    const pointDate = toIsoDate(cells[dateIdx]);
    const rawValue = Number(String(cells[valueIdx]).replace(',', '.'));
    if (!pointDate || !Number.isFinite(rawValue)) continue;
    rows.push({ pointDate, rawRatePct: rawValue });
  }

  return rows.sort((a, b) => a.pointDate.localeCompare(b.pointDate));
};

const toIndexSeries = (rows: EcbRow[]) => {
  let cumulativeIndex = INDEX_BASE;
  return rows.map((row, index) => {
    if (index === 0) {
      return {
        point_date: row.pointDate,
        value: Number(cumulativeIndex.toFixed(6)),
        raw_value: Number(row.rawRatePct.toFixed(6)),
      };
    }
    // €STR is an annualized overnight rate; we convert to daily accrual with ACT/360.
    const dailyFactor = 1 + (row.rawRatePct / 100) / 360;
    cumulativeIndex *= dailyFactor;
    return {
      point_date: row.pointDate,
      value: Number(cumulativeIndex.toFixed(6)),
      raw_value: Number(row.rawRatePct.toFixed(6)),
    };
  });
};

const getAdminClient = () =>
  createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

const assertAdmin = async (adminClient: SupabaseClient, req: Request) => {
  const syncKeyHeader = req.headers.get('x-sync-key') ?? '';
  const syncKeySecret = Deno.env.get('BENCHMARK_SYNC_KEY') ?? '';
  if (syncKeySecret && syncKeyHeader && syncKeyHeader === syncKeySecret) {
    return 'sync-key';
  }
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const apikey = req.headers.get('apikey') ?? '';
  if (serviceRoleKey && apikey === serviceRoleKey) {
    return 'service-role';
  }
  if (!authHeader) throw new Error('Missing auth header.');
  const token = authHeader.replace('Bearer ', '');
  if (serviceRoleKey && token === serviceRoleKey) {
    return 'service-role';
  }
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data: actorResult, error: actorError } = await userClient.auth.getUser();
  if (actorError || !actorResult.user) throw new Error('Unauthorized.');
  const { data: actorProfile, error: actorProfileError } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', actorResult.user.id)
    .single();
  if (actorProfileError || actorProfile?.role !== 'admin') throw new Error('Admin permissions required.');
  return actorResult.user.id;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminClient = getAdminClient();
    const actorUserId = await assertAdmin(adminClient, req);
    const body = (await req.json().catch(() => ({}))) as SyncRequest;
    const benchmarkCode = body.benchmarkCode || DEFAULT_BENCHMARK_CODE;
    const startDate = toIsoDate(body.startDate) || toIsoDate(new Date(Date.now() - 400 * 86400000).toISOString())!;
    const endDate = toIsoDate(body.endDate) || toIsoDate(new Date().toISOString())!;

    const ecbUrl = buildEcbUrl(startDate, endDate);
    const response = await fetch(ecbUrl, {
      headers: { Accept: 'text/csv' },
    });
    if (!response.ok) {
      throw new Error(`ECB request failed (${response.status}): ${await response.text()}`);
    }
    const csvText = await response.text();
    const rateRows = parseEcbCsv(csvText);
    if (!rateRows.length) {
      throw new Error('No benchmark rows returned from ECB.');
    }
    const pointRows = toIndexSeries(rateRows);

    const { data: benchmark, error: benchmarkError } = await adminClient
      .from('portfolio_benchmarks')
      .upsert({
        code: benchmarkCode,
        label: '€STR Cash Benchmark (ECB)',
        currency: 'EUR',
        source: 'ecb',
        source_code: 'EST/B.EU000A2X2A25.WT',
        description: 'Official ECB €STR daily rate transformed to cumulative index.',
      }, { onConflict: 'code' })
      .select('id, code')
      .single();
    if (benchmarkError || !benchmark?.id) {
      throw new Error(benchmarkError?.message || 'Benchmark upsert failed.');
    }

    const rowsForInsert = pointRows.map((row) => ({
      benchmark_id: benchmark.id,
      point_date: row.point_date,
      value: row.value,
      raw_value: row.raw_value,
      as_of: new Date().toISOString(),
      is_provisional: false,
      source_ref: ecbUrl,
    }));

    const { error: pointsError } = await adminClient
      .from('portfolio_benchmark_points')
      .upsert(rowsForInsert, { onConflict: 'benchmark_id,point_date' });
    if (pointsError) throw new Error(pointsError.message);

    await adminClient.from('admin_activity_feed').insert({
      user_id: actorUserId,
      event_type: 'benchmark_sync',
      summary: 'ECB €STR Benchmark synchronisiert',
      payload: {
        benchmark_code: benchmarkCode,
        inserted_rows: rowsForInsert.length,
        start_date: startDate,
        end_date: endDate,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      benchmarkCode,
      rowsSynced: rowsForInsert.length,
      startDate,
      endDate,
      source: 'ecb',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || 'unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
