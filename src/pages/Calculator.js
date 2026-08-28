import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  BadgeEuro,
  CalendarClock,
  Euro,
  Percent,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

const Calculator = () => {
  const [amount, setAmount] = useState(10000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(3.0);

  const calculateResults = () => {
    const rate = interestRate / 100;
    const years = termMonths / 12;
    const totalInterest = amount * rate * years;
    const finalAmount = amount + totalInterest;
    const monthlyAverage = termMonths > 0 ? totalInterest / termMonths : 0;
    const annualizedYield = amount > 0 ? (totalInterest / amount) * (12 / termMonths) * 100 : 0;

    return {
      finalAmount: Math.round(finalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      monthlyAverage: Math.round(monthlyAverage * 100) / 100,
      annualizedYield: Math.round(annualizedYield * 100) / 100,
    };
  };

  const results = useMemo(
    () => calculateResults(),
    [amount, termMonths, interestRate],
  );

  const formatAmount = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatTerm = (months) => {
    if (months < 12) {
      return `${months} ${months === 1 ? 'Monat' : 'Monate'}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'Jahr' : 'Jahre'}`;
    }
    return `${years} ${years === 1 ? 'Jahr' : 'Jahre'} ${remainingMonths} ${remainingMonths === 1 ? 'Monat' : 'Monate'}`;
  };

  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  const quickTerms = [
    { label: '6 Mon.', value: 6 },
    { label: '1 Jahr', value: 12 },
    { label: '2 Jahre', value: 24 },
    { label: '3 Jahre', value: 36 },
    { label: '5 Jahre', value: 60 }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 border border-slate-200 bg-white rounded-full px-3 py-1">
            <BadgeEuro size={14} className="text-teal-600" />
            Festgeld Kalkulation
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[#0B1E33]">Zinsrechner</h1>
          <p className="mt-2 text-slate-600 max-w-3xl">
            Simulieren Sie Endbetrag, Zinsertrag und monatlichen Durchschnittsertrag für Ihre Festgeldanlage.
            Alle Werte dienen als transparente Orientierung für Ihre Planung.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr,1fr] gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Euro size={19} className="text-teal-600" />
                  Anlagebetrag
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-40 text-right font-semibold text-lg pr-8"
                    data-testid="calc-amount-input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                </div>
              </div>
              <Slider
                value={[amount]}
                onValueChange={(value) => setAmount(value[0])}
                min={1000}
                max={500000}
                step={1000}
                className="mb-4"
                data-testid="calc-amount-slider"
              />
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      amount === val
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    data-testid={`calc-quick-amount-${val}`}
                  >
                    {formatAmount(val)}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <CalendarClock size={19} className="text-teal-600" />
                  Anlagedauer
                </label>
                <div className="text-right">
                  <span className="font-semibold text-lg text-slate-800">{formatTerm(termMonths)}</span>
                </div>
              </div>
              <Slider
                value={[termMonths]}
                onValueChange={(value) => setTermMonths(value[0])}
                min={1}
                max={120}
                step={1}
                className="mb-4"
                data-testid="calc-term-slider"
              />
              <div className="flex flex-wrap gap-2">
                {quickTerms.map((term) => (
                  <button
                    key={term.value}
                    onClick={() => setTermMonths(term.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      termMonths === term.value
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    data-testid={`calc-quick-term-${term.value}`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Percent size={19} className="text-teal-600" />
                  Zinssatz (p.a.)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right font-semibold text-lg pr-8"
                    data-testid="calc-rate-input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>
              <Slider
                value={[interestRate * 10]}
                onValueChange={(value) => setInterestRate(value[0] / 10)}
                min={0}
                max={100}
                step={1}
                className="mb-2"
                data-testid="calc-rate-slider"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0,0%</span>
                <span>10,0%</span>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-gradient-to-br from-[#0b1e33] to-[#0f304f] rounded-2xl p-6 border border-[#18324c] shadow-sm text-white">
              <div className="flex items-center gap-2 text-slate-200 mb-5">
                <TrendingUp size={18} />
                <span className="text-xs uppercase tracking-[0.2em]">Ergebnis</span>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-xs text-slate-200">Endbetrag</p>
                  <p className="text-3xl font-semibold mt-1" data-testid="calc-result-final">
                    {formatAmount(results.finalAmount)}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-xs text-slate-200">Zinsertrag gesamt</p>
                  <p className="text-3xl font-semibold mt-1" data-testid="calc-result-interest">
                    +{formatAmount(results.totalInterest)}
                  </p>
                </div>
              </div>

              <p className="mt-5 pt-4 border-t border-white/15 text-sm text-slate-200 leading-relaxed">
                Bei <strong className="text-white">{formatAmount(amount)}</strong> Anlagebetrag,{' '}
                <strong className="text-white">{formatTerm(termMonths)}</strong> Laufzeit und{' '}
                <strong className="text-white">{interestRate.toFixed(1)}% p.a.</strong> beträgt Ihr prognostizierter
                Zinsertrag <strong className="text-white">{formatAmount(results.totalInterest)}</strong>.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Kennzahlen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Durchschnitt pro Monat</span>
                  <span className="font-medium text-slate-900">{formatAmount(results.monthlyAverage)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Effektiver Jahreszins</span>
                  <span className="font-medium text-slate-900">{results.annualizedYield.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Laufzeit</span>
                  <span className="font-medium text-slate-900">{formatTerm(termMonths)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Hinweis zur Berechnung</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Der Rechner verwendet eine einfache Festgeld-Zinslogik und dient der Orientierung.
              Konditionen, Steuerabzug und bankindividuelle Regeln können im finalen Angebot abweichen.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <WalletCards size={16} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Transparente Planung</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nutzen Sie die Simulation als Grundlage für den Produktvergleich und die Liquiditätsplanung.
              Für eine verbindliche Empfehlung gelten die aktuellen Vertragskonditionen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
