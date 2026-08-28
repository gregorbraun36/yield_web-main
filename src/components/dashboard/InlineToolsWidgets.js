import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Calculator, Euro, PiggyBank } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BankLogo from '@/components/BankLogo';
import { Input } from '@/components/ui/input';
import { loadEurRates, offerInEur } from '@/lib/currency';

const formatCurrency = (value) => new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const getInvestmentType = (offer) => {
  if (offer?.investment_type) return offer.investment_type;
  return Number(offer?.deposit_term || 0) === 0 ? 'Tagesgeld' : 'Festgeld';
};

const computeFixedDeposit = ({ amount, termMonths, annualRate }) => {
  const principal = Math.max(0, Number(amount || 0));
  const months = Math.max(1, Number(termMonths || 1));
  const rate = Math.max(0, Number(annualRate || 0)) / 100;
  const years = months / 12;
  const totalInterest = principal * rate * years;
  const finalAmount = principal + totalInterest;
  const monthlyAverage = totalInterest / months;
  return { totalInterest, finalAmount, monthlyAverage };
};

const computeInflation = ({ amount, inflationRate, years }) => {
  const principal = Math.max(0, Number(amount || 0));
  const rate = Math.max(0, Number(inflationRate || 0)) / 100;
  const periodYears = Math.max(1, Number(years || 1));
  const realValue = principal / ((1 + rate) ** periodYears);
  const valueLoss = principal - realValue;
  return { realValue, valueLoss };
};

const computeSavingsPlan = ({ monthlyContribution, annualRate, years }) => {
  const monthly = Math.max(0, Number(monthlyContribution || 0));
  const periodYears = Math.max(1, Number(years || 1));
  const months = periodYears * 12;
  const monthlyRate = (Math.max(0, Number(annualRate || 0)) / 100) / 12;

  const finalAmount = monthlyRate > 0
    ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate)
    : monthly * months;
  const investedAmount = monthly * months;
  const interestGain = finalAmount - investedAmount;
  return { finalAmount, investedAmount, interestGain };
};

const cardClassName = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

const InlineToolsWidgets = ({ activeTool }) => {
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [compareType, setCompareType] = useState('Festgeld');
  const [compareAmount, setCompareAmount] = useState(10000);
  const [compareTerm, setCompareTerm] = useState(12);

  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcTerm, setCalcTerm] = useState(12);
  const [calcRate, setCalcRate] = useState(3);

  const [inflationAmount, setInflationAmount] = useState(10000);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [inflationYears, setInflationYears] = useState(5);

  const [savingsMonthly, setSavingsMonthly] = useState(250);
  const [savingsRate, setSavingsRate] = useState(3.5);
  const [savingsYears, setSavingsYears] = useState(10);

  useEffect(() => {
    let cancelled = false;
    const loadOffers = async () => {
      setOffersLoading(true);
      setOffersError('');
      try {
        const { data, error } = await supabase
          .from('savings_offers')
          .select('id, interest_rate, deposit_term, min_deposit, max_deposit, investment_type, currency, banks(name, logo_url, country)')
          .order('interest_rate', { ascending: false })
          .limit(120);
        if (error) throw error;
        await loadEurRates();
        if (!cancelled) setOffers((data || []).map(offerInEur));
      } catch (err) {
        if (!cancelled) {
          setOffers([]);
          setOffersError(err?.message || 'Vergleichsdaten konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    };
    loadOffers();
    return () => { cancelled = true; };
  }, []);

  const compareRows = useMemo(() => {
    const amount = Number(compareAmount || 0);
    const term = Number(compareTerm || 0);
    return (offers || [])
      .filter((offer) => {
        const type = getInvestmentType(offer);
        if (compareType && type !== compareType) return false;
        if (amount > 0 && Number(offer?.min_deposit || 0) > amount) return false;
        if (amount > 0 && Number(offer?.max_deposit || 0) > 0 && Number(offer.max_deposit) < amount) return false;
        if (type === 'Festgeld' && term > 0 && Number(offer?.deposit_term || 0) > 0 && Number(offer.deposit_term) !== term) return false;
        return true;
      })
      .sort((a, b) => Number(b?.interest_rate || 0) - Number(a?.interest_rate || 0))
      .slice(0, 6);
  }, [offers, compareType, compareAmount, compareTerm]);

  const rechnerResult = useMemo(() => computeFixedDeposit({
    amount: calcAmount,
    termMonths: calcTerm,
    annualRate: calcRate,
  }), [calcAmount, calcTerm, calcRate]);

  const inflationResult = useMemo(() => computeInflation({
    amount: inflationAmount,
    inflationRate,
    years: inflationYears,
  }), [inflationAmount, inflationRate, inflationYears]);

  const sparplanResult = useMemo(() => computeSavingsPlan({
    monthlyContribution: savingsMonthly,
    annualRate: savingsRate,
    years: savingsYears,
  }), [savingsMonthly, savingsRate, savingsYears]);

  return (
    <div className="space-y-4">
      {(activeTool === 'vergleich' || activeTool === 'all') && (
        <section id="tools-vergleich" className={cardClassName}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-500" />
              <h4 className="font-semibold text-[#0B1E33]">Vergleich</h4>
            </div>
            {!offersLoading && !offersError ? (
              <span className="text-xs rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                {compareRows.length} Treffer
              </span>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <label className="text-xs font-medium text-slate-600">
              Typ
              <select
                value={compareType}
                onChange={(e) => setCompareType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm h-9"
              >
                <option value="Festgeld">Festgeld</option>
                <option value="Tagesgeld">Tagesgeld</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Anlagebetrag
              <Input
                type="number"
                min="0"
                value={compareAmount}
                onChange={(e) => setCompareAmount(e.target.value)}
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Laufzeit (Monate)
              <Input
                type="number"
                min="1"
                value={compareTerm}
                onChange={(e) => setCompareTerm(e.target.value)}
                className="mt-1 h-9"
                disabled={compareType !== 'Festgeld'}
              />
            </label>
            </div>
          </div>

          {offersLoading && <p className="text-sm text-slate-500">Vergleichsdaten werden geladen...</p>}
          {!offersLoading && offersError && <p className="text-sm text-amber-700">{offersError}</p>}
          {!offersLoading && !offersError && compareRows.length === 0 && (
            <p className="text-sm text-slate-500">Keine Angebote für die gewählten Filter.</p>
          )}
          {!offersLoading && !offersError && compareRows.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              {compareRows.map((offer) => (
                <div key={offer.id} className="rounded-lg border border-slate-200 px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <BankLogo
                      logo={offer?.banks?.logo_url || null}
                      bankName={offer?.banks?.name || 'Bank'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {offer?.banks?.name || 'Bank'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {getInvestmentType(offer)}{Number(offer.deposit_term || 0) > 0 ? ` · ${offer.deposit_term} M` : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 whitespace-nowrap">{Number(offer.interest_rate || 0).toFixed(2)}%</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(activeTool === 'rechner' || activeTool === 'all') && (
        <section id="tools-rechner" className={cardClassName}>
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-slate-500" />
            <h4 className="font-semibold text-[#0B1E33]">Rechner</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm text-slate-600">Anlagebetrag
              <Input type="number" min="0" className="mt-1" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Laufzeit (Monate)
              <Input type="number" min="1" className="mt-1" value={calcTerm} onChange={(e) => setCalcTerm(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Zinssatz p.a. (%)
              <Input type="number" min="0" step="0.1" className="mt-1" value={calcRate} onChange={(e) => setCalcRate(e.target.value)} />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Endbetrag</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(rechnerResult.finalAmount)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Zinsertrag</p>
              <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(rechnerResult.totalInterest)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Ø pro Monat</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(rechnerResult.monthlyAverage)}</p>
            </div>
          </div>
        </section>
      )}

      {(activeTool === 'inflation' || activeTool === 'all') && (
        <section id="tools-inflation" className={cardClassName}>
          <div className="flex items-center gap-2 mb-3">
            <Euro size={16} className="text-slate-500" />
            <h4 className="font-semibold text-[#0B1E33]">Inflationsrechner</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm text-slate-600">Startkapital
              <Input type="number" min="0" className="mt-1" value={inflationAmount} onChange={(e) => setInflationAmount(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Inflation p.a. (%)
              <Input type="number" min="0" step="0.1" className="mt-1" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Zeitraum (Jahre)
              <Input type="number" min="1" className="mt-1" value={inflationYears} onChange={(e) => setInflationYears(e.target.value)} />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Realer Wert</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(inflationResult.realValue)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Kaufkraftverlust</p>
              <p className="text-sm font-semibold text-red-600">-{formatCurrency(inflationResult.valueLoss)}</p>
            </div>
          </div>
        </section>
      )}

      {(activeTool === 'sparplan' || activeTool === 'all') && (
        <section id="tools-sparplan" className={cardClassName}>
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank size={16} className="text-slate-500" />
            <h4 className="font-semibold text-[#0B1E33]">Sparplan-Rechner</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm text-slate-600">Monatliche Rate
              <Input type="number" min="0" className="mt-1" value={savingsMonthly} onChange={(e) => setSavingsMonthly(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Rendite p.a. (%)
              <Input type="number" min="0" step="0.1" className="mt-1" value={savingsRate} onChange={(e) => setSavingsRate(e.target.value)} />
            </label>
            <label className="text-sm text-slate-600">Laufzeit (Jahre)
              <Input type="number" min="1" className="mt-1" value={savingsYears} onChange={(e) => setSavingsYears(e.target.value)} />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Endkapital</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(sparplanResult.finalAmount)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Einzahlungen</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(sparplanResult.investedAmount)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Ertrag</p>
              <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(sparplanResult.interestGain)}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default InlineToolsWidgets;
