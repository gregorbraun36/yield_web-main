import { computeContractSnapshot } from '@/lib/portfolioMath';

const DAY_MS = 86400000;
const DEPOSIT_PROTECTION_LIMIT_EUR = 1000000;

const toDateKey = (date) => date.toISOString().slice(0, 10);

export const computeNetYieldMetrics = ({
  snapshots = [],
  taxWithheldEur = 0,
  feesEur = 0,
  annualized = true,
}) => {
  const principal = snapshots.reduce((sum, row) => sum + Number(row.snapshot?.amount || 0), 0);
  const grossAccrued = snapshots.reduce((sum, row) => sum + Number(row.snapshot?.accruedInterest || 0), 0);
  const dailyGross = snapshots.reduce((sum, row) => sum + Number(row.snapshot?.dailyEarningsToday || 0), 0);
  const netAccrued = grossAccrued - Number(taxWithheldEur || 0) - Number(feesEur || 0);

  const grossYieldPct = principal > 0 ? (grossAccrued / principal) * 100 : 0;
  const netYieldPct = principal > 0 ? (netAccrued / principal) * 100 : 0;
  const annualizedNetYieldPct = annualized ? netYieldPct * (365 / 30) : netYieldPct;
  const effectiveTaxRate = grossAccrued > 0
    ? Math.max(0, Math.min(0.55, Number(taxWithheldEur || 0) / grossAccrued))
    : 0;
  const proportionalFeeRate = grossAccrued > 0
    ? Math.max(0, Number(feesEur || 0) / grossAccrued)
    : 0;
  const dailyTaxEstimate = dailyGross * effectiveTaxRate;
  const dailyFeeEstimate = dailyGross * proportionalFeeRate;
  const dailyNet = Math.max(0, dailyGross - dailyTaxEstimate - dailyFeeEstimate);

  return {
    principal,
    grossAccrued,
    netAccrued,
    grossYieldPct,
    netYieldPct,
    annualizedNetYieldPct,
    dailyGross,
    dailyNet,
    dailyNetAvailable: principal > 0,
    taxWithheldEur: Number(taxWithheldEur || 0),
    feesEur: Number(feesEur || 0),
    effectiveTaxRate,
  };
};

export const computeTaxTotalsFromSnapshot = (taxSnapshot = {}) => {
  const abgeltungsteuerEur = Number(taxSnapshot.abgeltungsteuer_eur ?? taxSnapshot.tax_withheld_eur ?? 0);
  const solidaritaetszuschlagEur = Number(taxSnapshot.solidaritaetszuschlag_eur || 0);
  const kirchensteuerEur = Number(taxSnapshot.kirchensteuer_eur || 0);
  const quellensteuerEur = Number(taxSnapshot.quellensteuer_eur || 0);
  const feesEur = Number(taxSnapshot.fees_eur || 0);

  return {
    abgeltungsteuerEur,
    solidaritaetszuschlagEur,
    kirchensteuerEur,
    quellensteuerEur,
    feesEur,
    totalTaxEur: abgeltungsteuerEur + solidaritaetszuschlagEur + kirchensteuerEur + quellensteuerEur,
  };
};

export const computeRiskMetrics = (snapshots = []) => {
  const exposures = snapshots.reduce((acc, row) => {
    const bank = row.contract?.bank_name || 'Unbekannte Bank';
    acc[bank] = (acc[bank] || 0) + Number(row.snapshot?.amount || 0);
    return acc;
  }, {});

  const total = Object.values(exposures).reduce((sum, v) => sum + Number(v || 0), 0);
  const topBankSharePct = total > 0 ? (Math.max(...Object.values(exposures), 0) / total) * 100 : 0;
  const protectionBreaches = Object.entries(exposures)
    .filter(([, amount]) => Number(amount) > DEPOSIT_PROTECTION_LIMIT_EUR)
    .map(([bank, amount]) => ({
      bank,
      amount: Number(amount),
      excess: Number(amount) - DEPOSIT_PROTECTION_LIMIT_EUR,
    }));

  return {
    bankExposures: exposures,
    topBankSharePct,
    protectionBreaches,
    concentrationScore: topBankSharePct > 50 ? 'high' : topBankSharePct > 30 ? 'medium' : 'low',
  };
};

export const computeLiquidityProjection = (contracts = [], now = new Date()) => {
  const horizons = [7, 30, 90];
  const projection = horizons.reduce((acc, days) => ({ ...acc, [days]: 0 }), {});

  contracts.forEach((contract) => {
    const snapshot = computeContractSnapshot(contract, now);
    const available = Number(snapshot.availableAmount || 0);
    const maturityAmount = Number(snapshot.amount || 0) + Number(snapshot.maturityInterest || 0);
    const daysLeft = Number(snapshot.daysLeft ?? 0);

    horizons.forEach((days) => {
      if (snapshot.productType === 'Tagesgeld') {
        projection[days] += available;
      } else if (daysLeft <= days) {
        projection[days] += maturityAmount;
      } else if (snapshot.productType === 'Flexgeld' && snapshot.availabilityLabel !== 'Sperrfrist aktiv') {
        projection[days] += available;
      }
    });
  });

  return horizons.map((days) => ({
    horizonDays: days,
    amount: Number(projection[days].toFixed(2)),
  }));
};

export const computeMaturityLadder = (contracts = [], now = new Date()) => contracts
  .map((contract) => ({ contract, snapshot: computeContractSnapshot(contract, now) }))
  .filter((item) => item.snapshot.endDate)
  .sort((a, b) => a.snapshot.endDate - b.snapshot.endDate)
  .map((item) => ({
    contractId: item.contract.id,
    bankName: item.contract.bank_name || '—',
    productType: item.contract.product_type || '—',
    contractNumber: item.contract.contract_number || '—',
    date: toDateKey(item.snapshot.endDate),
    amount: Number((item.snapshot.amount + item.snapshot.maturityInterest).toFixed(2)),
  }));

export const computeCashflowCalendar = (contracts = [], cashflows = [], now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + 120);

  const bucket = {};
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY_MS)) {
    bucket[toDateKey(d)] = { inflow: 0, outflow: 0, interest: 0 };
  }

  cashflows.forEach((flow) => {
    if (!flow?.flow_date || !bucket[flow.flow_date]) return;
    const amount = Number(flow.amount_eur || 0);
    if (flow.flow_type === 'inflow') bucket[flow.flow_date].inflow += amount;
    else if (flow.flow_type === 'outflow') bucket[flow.flow_date].outflow += amount;
    else bucket[flow.flow_date].interest += amount;
  });

  contracts.forEach((contract) => {
    const snapshot = computeContractSnapshot(contract, now);
    if (!snapshot.endDate) return;
    const key = toDateKey(snapshot.endDate);
    if (!bucket[key]) return;
    bucket[key].inflow += Number(snapshot.amount || 0);
    bucket[key].interest += Number(snapshot.maturityInterest || 0);
  });

  return Object.entries(bucket).map(([date, values]) => ({
    date,
    ...values,
    net: Number((values.inflow + values.interest - values.outflow).toFixed(2)),
  }));
};

export const computePerformanceStats = (series = []) => {
  if (!series.length) {
    return {
      volatilityPct: 0,
      maxDrawdownPct: 0,
      totalReturnPct: 0,
    };
  }

  const values = series.map((item) => Number(item.value || 0));
  const start = values[0] || 0;
  const end = values[values.length - 1] || 0;
  const totalReturnPct = start > 0 ? ((end - start) / start) * 100 : 0;

  const returns = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1];
    if (prev > 0) returns.push((values[i] - prev) / prev);
  }
  const avg = returns.length ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
  const variance = returns.length
    ? returns.reduce((sum, r) => sum + (r - avg) ** 2, 0) / returns.length
    : 0;
  const volatilityPct = Math.sqrt(variance) * 100;

  let peak = values[0];
  let maxDrawdown = 0;
  values.forEach((v) => {
    if (v > peak) peak = v;
    const drawdown = peak > 0 ? (peak - v) / peak : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  return {
    volatilityPct,
    maxDrawdownPct: maxDrawdown * 100,
    totalReturnPct,
  };
};

export const computeDrawdownSeries = (series = []) => {
  let peak = 0;
  return series.map((row) => {
    const value = Number(row?.value || 0);
    if (value > peak) peak = value;
    const drawdownPct = peak > 0 ? ((peak - value) / peak) * 100 : 0;
    return {
      label: row.label || row.date || '',
      drawdownPct: Number(drawdownPct.toFixed(4)),
    };
  });
};

export const computeContributionBreakdown = (snapshots = []) => {
  const byProduct = {};
  const byBank = {};
  snapshots.forEach((row) => {
    const product = row.contract?.product_type || 'Unbekannt';
    const bank = row.contract?.bank_name || 'Unbekannte Bank';
    const accrued = Number(row.snapshot?.accruedInterest || 0);
    const principal = Number(row.snapshot?.amount || 0);
    byProduct[product] = (byProduct[product] || 0) + accrued;
    byBank[bank] = {
      accrued: Number(((byBank[bank]?.accrued || 0) + accrued).toFixed(2)),
      principal: Number(((byBank[bank]?.principal || 0) + principal).toFixed(2)),
    };
  });

  const productRows = Object.entries(byProduct).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  const bankRows = Object.entries(byBank).map(([name, metrics]) => ({ name, ...metrics }));
  return { productRows, bankRows };
};

export const computeRiskLimitAlerts = (snapshots = [], {
  depositLimit = 1000000,
  topBankShareLimitPct = 100,
} = {}) => {
  const risk = computeRiskMetrics(snapshots);
  const alerts = [];
  if (risk.topBankSharePct > topBankShareLimitPct) {
    alerts.push({
      id: 'concentration',
      severity: 'warning',
      title: 'Konzentrationsrisiko',
      message: `Top-Bank Anteil ${risk.topBankSharePct.toFixed(1)}% über Limit ${topBankShareLimitPct}%.`,
    });
  }
  risk.protectionBreaches.forEach((row) => {
    alerts.push({
      id: `deposit-${row.bank}`,
      severity: 'critical',
      title: 'Einlagensicherung überschritten',
      message: `${row.bank}: ${row.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} (Limit ${depositLimit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}).`,
    });
  });
  return alerts;
};

export const computeBenchmarkComparison = (portfolioSeries = [], benchmarkSeries = []) => {
  if (!portfolioSeries.length) {
    return {
      relativeReturnPct: 0,
      portfolioReturnPct: 0,
      benchmarkReturnPct: 0,
      alignedSeries: [],
    };
  }

  const benchmarkMap = benchmarkSeries.reduce((acc, row) => {
    if (row?.label) acc[row.label] = Number(row.value || 0);
    return acc;
  }, {});
  const alignedSeries = portfolioSeries.map((row) => {
    const bench = benchmarkMap[row.label];
    return {
      ...row,
      benchmark: Number.isFinite(bench) ? Number(bench.toFixed(2)) : null,
    };
  });

  const benchmarkValues = alignedSeries
    .map((row) => row.benchmark)
    .filter((value) => Number.isFinite(value));
  const hasBenchmark = benchmarkValues.length >= 2;

  const pStart = Number(alignedSeries[0]?.value || 0);
  const pEnd = Number(alignedSeries[alignedSeries.length - 1]?.value || 0);
  const bStart = hasBenchmark ? Number(benchmarkValues[0]) : 0;
  const bEnd = hasBenchmark ? Number(benchmarkValues[benchmarkValues.length - 1]) : 0;
  const portfolioReturnPct = pStart > 0 ? ((pEnd - pStart) / pStart) * 100 : 0;
  const benchmarkReturnPct = hasBenchmark && bStart > 0 ? ((bEnd - bStart) / bStart) * 100 : 0;

  return {
    portfolioReturnPct,
    benchmarkReturnPct,
    relativeReturnPct: hasBenchmark ? portfolioReturnPct - benchmarkReturnPct : null,
    hasBenchmark,
    alignedSeries,
  };
};

export const computeTransactionTimeline = (cashflows = []) => (
  (cashflows || [])
    .slice()
    .sort((a, b) => new Date(b.flow_date) - new Date(a.flow_date))
    .slice(0, 20)
    .map((row) => ({
      id: row.id,
      date: row.flow_date,
      type: row.flow_type || 'interest',
      amount: Number(row.amount_eur || 0),
      source: row.source || null,
    }))
);
