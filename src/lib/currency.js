const FALLBACK_TO_EUR = {
  EUR: 1,
  USD: 0.92,
  CHF: 1.07,
  GBP: 1.17,
};

let ratesToEur = { ...FALLBACK_TO_EUR };
let loadPromise = null;

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

export const loadEurRates = () => {
  if (!loadPromise) {
    loadPromise = fetch('https://api.frankfurter.app/latest?from=EUR')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const next = { ...FALLBACK_TO_EUR };
        Object.entries(data?.rates || {}).forEach(([code, perEur]) => {
          const rate = Number(perEur);
          if (rate > 0) next[code] = 1 / rate;
        });
        ratesToEur = next;
        return ratesToEur;
      })
      .catch(() => ratesToEur);
  }
  return loadPromise;
};

export const toEur = (amount, currency = 'EUR') => {
  const code = String(currency || 'EUR').toUpperCase();
  const rate = ratesToEur[code] ?? FALLBACK_TO_EUR[code] ?? 1;
  return roundMoney(Number(amount || 0) * rate);
};

export const formatEur = (value) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

export const offerInEur = (offer) => {
  if (!offer) return offer;
  const sourceCurrency = String(offer.source_currency || offer.currency || 'EUR').toUpperCase();
  return {
    ...offer,
    min_deposit: toEur(offer.min_deposit, sourceCurrency),
    max_deposit: offer.max_deposit == null || offer.max_deposit === ''
      ? offer.max_deposit
      : toEur(offer.max_deposit, sourceCurrency),
    currency: 'EUR',
    source_currency: sourceCurrency,
  };
};
