import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CalendarCheck2,
  Heart,
  Landmark,
  LogOut,
  MessageSquareMore,
  PieChart,
  Plus,
  Percent,
  ShieldCheck,
  UserRound,
  WalletCards,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ProductContractCard from '@/components/dashboard/ProductContractCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import UserAreaShell from '@/components/dashboard/UserAreaShell';
import { computeContractSnapshot, formatCurrency, formatCompactCurrency } from '@/lib/portfolioMath';
import { toast } from 'sonner';

const PRODUCT_RULES = {
  Festgeld: { termMonths: 12, lockMonths: 12, subtitleHint: 'Feste Laufzeit, Auszahlung bei Fälligkeit.' },
  Tagesgeld: { termMonths: 0, lockMonths: 0, subtitleHint: 'Täglich verfügbar.' },
  Flexgeld: { termMonths: 12, lockMonths: 3, subtitleHint: '3 Monate Sperrfrist, danach flexibel.' },
};

const PRODUCT_BENEFITS = {
  Festgeld: [
    {
      title: 'Planbare Laufzeit',
      description: 'Fester Zeitraum mit klar kalkulierbarer Auszahlung.',
      icon: CalendarCheck2,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Attraktiver Zinssatz',
      description: 'Profitieren Sie von stabilen Erträgen bis zur Fälligkeit.',
      icon: Percent,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Sichere Anlage',
      description: 'Ihr Kapital bleibt durch Einlagensicherung abgesichert.',
      icon: ShieldCheck,
      iconStyle: 'bg-slate-100 text-slate-700',
    },
  ],
  Tagesgeld: [
    {
      title: 'Täglich verfügbar',
      description: 'Flexible Verfügung über Ihr Geld - jederzeit.',
      icon: CalendarCheck2,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Attraktiver Zinssatz',
      description: 'Profitieren Sie von einem starken Zinssatz.',
      icon: Percent,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Sichere Anlage',
      description: 'Ihr Kapital bleibt durch Einlagensicherung abgesichert.',
      icon: ShieldCheck,
      iconStyle: 'bg-slate-100 text-slate-700',
    },
  ],
  Flexgeld: [
    {
      title: 'Nach Sperrfrist flexibel',
      description: 'Nach Ablauf der Sperrzeit bleibt Ihr Kapital flexibel nutzbar.',
      icon: CalendarCheck2,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Höherer Zinssatz',
      description: 'Nutzen Sie ein attraktives Renditeprofil gegenüber Tagesgeld.',
      icon: Percent,
      iconStyle: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Sichere Anlage',
      description: 'Ihr Kapital bleibt durch Einlagensicherung abgesichert.',
      icon: ShieldCheck,
      iconStyle: 'bg-slate-100 text-slate-700',
    },
  ],
};

const ProductDashboardPage = ({ title, subtitle, ctaLabel, productType = title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const fetchContracts = async () => {
    if (!user?.id) return;
    setLoading(true);
    const contractQuery = supabase
      .from('portfolio_contracts')
      .select('*, banks(id, name, logo_url)')
      .eq('product_type', productType)
      .order('created_at', { ascending: false });
    const { data, error } = await (user?.email
      ? contractQuery.or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
      : contractQuery.eq('user_id', user.id));

    if (error) {
      toast.error(`Verträge konnten nicht geladen werden: ${error.message}`);
    } else {
      const normalizedContracts = (data || []).map((row) => ({
        ...row,
        bank_name: row.bank_name || row.banks?.name || '—',
        bank_logo: row.banks?.logo_url || null,
      }));
      setContracts(normalizedContracts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [user?.id, productType]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const shellNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: WalletCards, to: '/dashboard' },
    { key: 'tagesgeld', label: 'Tagesgeld', icon: Landmark, to: '/dashboard/tagesgeld' },
    { key: 'festgeld', label: 'Festgeld', icon: Landmark, to: '/dashboard/festgeld' },
    { key: 'flexgeld', label: 'Flexgeld', icon: Landmark, to: '/dashboard/flexgeld' },
    { key: 'steuern', label: 'Steuern', icon: Percent, to: '/dashboard/taxes' },
    { key: 'vergleich', label: 'Vergleich', icon: PieChart, to: '/comparison' },
    { key: 'rechner', label: 'Rechner', icon: Calculator, to: '/calculator' },
    { key: 'favorites', label: 'Favoriten', icon: Heart, to: '/dashboard?section=favorites' },
    { key: 'support', label: 'Support', icon: MessageSquareMore, to: '/dashboard?section=support' },
    { key: 'profile', label: 'Profil', icon: UserRound, to: '/dashboard?section=profile' },
    { key: 'abmelden', label: 'Abmelden', icon: LogOut, action: 'logout' },
  ];
  const activeKey = productType === 'Tagesgeld'
    ? 'tagesgeld'
    : productType === 'Festgeld'
      ? 'festgeld'
      : productType === 'Flexgeld'
        ? 'flexgeld'
        : 'dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleShellNavSelect = (item) => {
    if (item?.action === 'logout') {
      handleLogout();
      return;
    }
    if (item?.to) navigate(item.to);
  };

  const derived = useMemo(() => {
    const active = contracts.filter((contract) => contract.is_active !== false && contract.status !== 'rejected');
    const snapshots = active.map((contract) => computeContractSnapshot(contract, now));
    const totalAmount = snapshots.reduce((sum, snapshot) => sum + snapshot.amount, 0);
    const totalAvailable = snapshots.reduce((sum, snapshot) => sum + snapshot.availableAmount, 0);
    const totalAccrued = snapshots.reduce((sum, snapshot) => sum + snapshot.accruedInterest, 0);
    const avgRate = active.length
      ? active.reduce((sum, contract) => sum + Number(contract.interest_rate || 0), 0) / active.length
      : 0;

    if (!active.length && !contracts.length) {
      return {
        stats: [
          { context: 'Gesamt angelegt', value: formatCompactCurrency(0), period: '0 aktive Verträge' },
          { context: 'Aktive Verträge', value: '0', period: '0 insgesamt' },
          { context: 'Ø Zinssatz', value: '0.00 %', period: 'aktive Verträge' },
          { context: 'Liquidität', value: formatCompactCurrency(0), period: 'sofort verfügbar' },
        ],
        contracts: [],
        trendSeries: [],
      };
    }

    const trendSeries = Array.from({ length: 30 }, (_, index) => {
      const daysAgo = 29 - index;
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      const accrued = active.reduce((sum, contract) => {
        const point = computeContractSnapshot(contract, date);
        if (point.startDate > date) return sum;
        return sum + point.accruedInterest;
      }, 0);
      return {
        label: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        accrued: Number(accrued.toFixed(2)),
      };
    });

    const cards = active.map((row) => {
      const snapshot = computeContractSnapshot(row, now);
      const lockEndDate = (() => {
        if (productType !== 'Flexgeld') return null;
        const lockEnd = new Date(snapshot.startDate);
        lockEnd.setMonth(lockEnd.getMonth() + Number(snapshot.lockMonths || 0));
        return lockEnd.toLocaleDateString('de-DE');
      })();

      return {
        id: row.id,
        productLabel: row.product_type,
        bankName: row.bank_name || '—',
        bankLogo: row.bank_logo || null,
        termLabel: snapshot.termMonths > 0 ? `${snapshot.termMonths} Monate` : 'Täglich verfügbar',
        contractNumber: row.contract_number || '—',
        amount: formatCurrency(snapshot.amount),
        interestRate: `${Number(row.interest_rate || 0).toFixed(2)}% p.a.`,
        accrued: `+${formatCurrency(productType === 'Festgeld'
          ? Math.max(snapshot.maturityInterest, snapshot.accruedInterest)
          : snapshot.accruedInterest)}`,
        available: formatCurrency(snapshot.availableAmount),
        availabilityLabel: snapshot.availabilityLabel,
        dailyEarningsLabel: `+${formatCurrency(snapshot.dailyEarningsToday)}`,
        startDate: snapshot.startDate.toLocaleDateString('de-DE'),
        endDate: snapshot.endDate ? snapshot.endDate.toLocaleDateString('de-DE') : 'Unbefristet',
        lockEndDate,
        lockInfoLabel: productType === 'Flexgeld' && lockEndDate
          ? (snapshot.availabilityLabel === 'Sperrfrist aktiv'
            ? `Auszahlung ab ${lockEndDate} möglich`
            : `Sperrfrist endete am ${lockEndDate}`)
          : null,
        daysLeft: productType === 'Tagesgeld' ? 'Unbefristet' : `${snapshot.daysLeft} Tage`,
        daysLeftLabel: productType === 'Tagesgeld' ? 'Verfügbarkeit' : 'Restlaufzeit',
        progress: snapshot.progress,
        note: productType === 'Flexgeld'
          ? `Sperrfrist: ${snapshot.lockMonths} Monate${snapshot.availabilityLabel === 'Sperrfrist aktiv' ? ' (Auszahlung noch gesperrt)' : ''}`
          : PRODUCT_RULES[productType]?.subtitleHint || '',
      };
    });

    return {
      stats: [
        {
          context: productType === 'Tagesgeld' ? 'Gesamt verfügbar' : 'Gesamt angelegt',
          value: formatCompactCurrency(totalAmount),
          period: `${active.length} aktive Verträge`,
          valueTitle: formatCurrency(totalAmount),
        },
        { context: 'Aktive Verträge', value: `${active.length}`, period: `${contracts.length} insgesamt` },
        { context: 'Ø Zinssatz', value: `${avgRate.toFixed(2)} %`, period: 'aktive Verträge' },
        { context: 'Liquidität', value: formatCompactCurrency(totalAvailable), period: `Aufgelaufen: ${formatCompactCurrency(totalAccrued)}` },
      ],
      contracts: cards,
      trendSeries,
    };
  }, [contracts, productType, now]);

  return (
    <UserAreaShell navItems={shellNavItems} activeKey={activeKey} onNavSelect={handleShellNavSelect}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Vermögen</p>
            <h1 className="text-4xl font-semibold text-[#0B1E33]">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <Button
            className="bg-[#0B1E33] hover:bg-[#1E293B] text-white gap-2 shrink-0"
            onClick={() => navigate('/apply')}
          >
            <Plus size={14} />
            {ctaLabel}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {derived.stats.map((card) => (
            <SnapshotMetricCard
              key={card.context}
              context={card.context}
              value={card.value}
              period={card.period}
              valueTitle={card.valueTitle}
            />
          ))}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            Wird geladen...
          </div>
        ) : derived.contracts.length > 0 ? (
          <div className="space-y-5">
            <div className="space-y-4">
              {derived.contracts.map((contractCard) => (
                <ProductContractCard key={contractCard.id} {...contractCard} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr,1fr] gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-[#0B1E33]">Zinsentwicklung</h3>
                  <span className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-500">Letzte 30 Tage</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={derived.trendSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v)} €`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Aufgelaufene Zinsen']} />
                      <Line type="monotone" dataKey="accrued" stroke="#0EA5E9" strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-[#0B1E33] mb-3">Ihre Vorteile</h3>
                <div className="space-y-4">
                  {(PRODUCT_BENEFITS[productType] || []).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${item.iconStyle}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#0B1E33]">{item.title}</p>
                          <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-[#0B1E33] mb-3">Schnellzugriff</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Neuen Vertrag eröffnen', to: '/apply' },
                    { label: 'Vertragsübersicht', to: '/dashboard?section=depot&focus=contracts' },
                    { label: 'Dokumente', to: '/dashboard?section=depot&focus=documents' },
                    { label: 'Konto & Sicherheit', to: '/dashboard?section=profile' },
                  ].map((link) => (
                    <button
                      key={link.label}
                      onClick={() => navigate(link.to)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 inline-flex items-center justify-between"
                    >
                      {link.label}
                      <ArrowRight size={14} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            Für dieses Produkt sind noch keine Verträge vorhanden.
          </div>
        )}
      </div>
    </UserAreaShell>
  );
};

export default ProductDashboardPage;
