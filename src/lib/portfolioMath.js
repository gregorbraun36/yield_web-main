const DAY_MS = 86400000;
const CUT_OFF_TIMEZONE = 'Europe/Berlin';

const PRODUCT_DEFAULTS = {
  Festgeld: { termMonths: 12, lockMonths: 12 },
  Tagesgeld: { termMonths: 0, lockMonths: 0 },
  Flexgeld: { termMonths: 12, lockMonths: 3 },
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPartsInTimeZone = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = getPartsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
};

const getCutoffStart = (date) => {
  const local = getPartsInTimeZone(date, CUT_OFF_TIMEZONE);
  const utcGuess = new Date(Date.UTC(local.year, local.month - 1, local.day, 0, 0, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, CUT_OFF_TIMEZONE);
  return new Date(utcGuess.getTime() - offsetMs);
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(months || 0));
  return next;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

export const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} Mrd €`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)} Mio €`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)} Tsd €`;
  return `${amount.toFixed(2)} €`;
};

export const computeContractSnapshot = (contract, now = new Date()) => {
  const productType = contract.product_type || 'Festgeld';
  const defaults = PRODUCT_DEFAULTS[productType] || PRODUCT_DEFAULTS.Festgeld;

  const amount = Number(contract.amount_eur || 0);
  const annualRate = Number(contract.interest_rate || 0) / 100;
  const termMonths = Number(contract.term_months ?? defaults.termMonths);
  const lockMonths = Number(contract.lock_months ?? defaults.lockMonths);

  const startDate = safeDate(contract.active_from || contract.created_at) || new Date();
  const explicitEndDate = safeDate(contract.active_until);
  const hasFixedEnd = termMonths > 0;
  const endDate = hasFixedEnd ? explicitEndDate || addMonths(startDate, termMonths) : null;

  const startCutoff = getCutoffStart(startDate);
  const currentCutoff = getCutoffStart(now);
  const elapsedDays = Math.max(0, Math.floor((currentCutoff - startCutoff) / DAY_MS));
  const totalDays = hasFixedEnd && endDate ? Math.max(1, Math.floor((endDate - startDate) / DAY_MS)) : 1;
  const daysLeft = hasFixedEnd && endDate ? Math.max(0, Math.ceil((endDate - now) / DAY_MS)) : null;

  const accruedInterest = amount * annualRate * (elapsedDays / 365);
  const dailyEarningsToday = amount * annualRate / 365;
  const maturityInterest = termMonths > 0 ? amount * annualRate * (termMonths / 12) : 0;

  let availabilityLabel = 'Aktuell verfügbar';
  let availableAmount = amount + accruedInterest;

  if (productType === 'Festgeld' && endDate) {
    availableAmount = now >= endDate ? amount + maturityInterest : 0;
    availabilityLabel = 'Auszahlung bei Fälligkeit';
  } else if (productType === 'Flexgeld') {
    const lockDays = Math.floor(lockMonths * 30.44);
    if (elapsedDays < lockDays) {
      availableAmount = 0;
    }
    availabilityLabel = elapsedDays < lockDays ? 'Sperrfrist aktiv' : 'Aktuell verfügbar';
  } else if (productType === 'Tagesgeld') {
    availabilityLabel = 'Täglich verfügbar';
  }

  const progress = productType === 'Tagesgeld'
    ? 100
    : Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  return {
    productType,
    amount,
    annualRate,
    termMonths,
    lockMonths,
    startDate,
    endDate,
    hasFixedEnd,
    daysLeft,
    elapsedDays,
    accruedInterest,
    dailyEarningsToday,
    maturityInterest,
    availableAmount,
    availabilityLabel,
    progress,
    cutOffLabel: '00:00 Europe/Berlin',
  };
};

export const computePortfolioValueAtDate = (contracts, atDate) => {
  const snapshots = contracts.map((contract) => computeContractSnapshot(contract, atDate));
  return snapshots.reduce((sum, snapshot) => sum + snapshot.amount + snapshot.accruedInterest, 0);
};
