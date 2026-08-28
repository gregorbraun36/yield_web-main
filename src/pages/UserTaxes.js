import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  FileText,
  Heart,
  Landmark,
  LogOut,
  MessageSquareMore,
  Percent,
  PieChart,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import UserAreaShell from '@/components/dashboard/UserAreaShell';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { downloadDocumentViaProxy } from '@/lib/documentDownload';

const CURRENCY_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const formatCurrency = (value) => CURRENCY_FORMAT.format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('de-DE');
};

const isTaxDocument = (doc) => {
  const haystack = `${doc?.document_type || ''} ${doc?.title || ''}`.toLowerCase();
  return ['steuer', 'tax', 'quellen', 'freistellung', 'jahres', 'ertrag'].some((keyword) => haystack.includes(keyword));
};

const TABS = [
  { key: 'overview', label: 'Steuerübersicht' },
  { key: 'exemption', label: 'Freistellungsauftrag' },
  { key: 'documents', label: 'Steuerdokumente' },
  { key: 'withholding', label: 'Quellensteuer' },
  { key: 'faq', label: 'Steuerhäufige Fragen' },
];

const UserTaxes = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [taxSnapshots, setTaxSnapshots] = useState([]);
  const [taxDocuments, setTaxDocuments] = useState([]);
  const [taxProfile, setTaxProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [submitLoading, setSubmitLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requested_amount_eur: '',
    request_year: String(new Date().getFullYear()),
    valid_from: '',
    valid_until: '',
    note: '',
  });

  const fetchTaxData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [snapshotResult, docsResult, profileResult, requestsResult] = await Promise.all([
        supabase
          .from('portfolio_tax_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .order('tax_year', { ascending: false }),
        supabase
          .from('portfolio_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolio_tax_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('portfolio_tax_exemption_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (snapshotResult.error) throw snapshotResult.error;
      if (docsResult.error) throw docsResult.error;
      if (profileResult.error) throw profileResult.error;
      if (requestsResult.error) throw requestsResult.error;

      const snapshotRows = snapshotResult.data || [];
      setTaxSnapshots(snapshotRows);
      if (snapshotRows.length > 0) {
        setSelectedYear(String(snapshotRows[0].tax_year));
      }
      setTaxDocuments((docsResult.data || []).filter(isTaxDocument));
      setTaxProfile(profileResult.data || null);
      setRequests(requestsResult.data || []);
    } catch (error) {
      toast.error(error.message || 'Steuerdaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const yearlyRows = useMemo(() => (
    (taxSnapshots || []).map((row) => {
      const abgeltung = Number(row.abgeltungsteuer_eur ?? row.tax_withheld_eur ?? 0);
      const soli = Number(row.solidaritaetszuschlag_eur || 0);
      const kirche = Number(row.kirchensteuer_eur || 0);
      const quellen = Number(row.quellensteuer_eur || 0);
      const totalTax = abgeltung + soli + kirche + quellen;
      return {
        ...row,
        abgeltung,
        soli,
        kirche,
        quellen,
        totalTax,
      };
    })
  ), [taxSnapshots]);

  const selectedYearRow = useMemo(
    () => yearlyRows.find((row) => String(row.tax_year) === selectedYear) || yearlyRows[0] || null,
    [yearlyRows, selectedYear],
  );

  const summaryCards = useMemo(() => {
    const row = selectedYearRow;
    const allowanceLimit = selectedYearRow?.freistellungsauftrag_limit_eur ?? taxProfile?.freistellungsauftrag_limit_eur ?? 0;
    const allowanceUsed = selectedYearRow?.freistellungsauftrag_used_eur ?? taxProfile?.freistellungsauftrag_used_eur ?? 0;
    if (!row) {
      return [
        { context: 'Bruttozinsen', value: formatCurrency(0), period: 'Ausgewähltes Jahr' },
        { context: 'Steuerabzug gesamt', value: formatCurrency(0), period: 'Abgeltung + Soli + Kirche + Quelle' },
        { context: 'Nettozinsen', value: formatCurrency(0), period: 'Nach Steuern und Gebühren' },
        { context: 'Freistellungsauftrag', value: formatCurrency(taxProfile?.freistellungsauftrag_limit_eur || 0), period: 'Hinterlegtes Limit' },
      ];
    }
    return [
      {
        context: 'Bruttozinsen',
        value: formatCurrency(row.gross_interest_eur),
        period: `Steuerjahr ${row.tax_year}`,
      },
      {
        context: 'Steuerabzug gesamt',
        value: formatCurrency(row.totalTax),
        period: 'Abgeltung + Soli + Kirche + Quelle',
      },
      {
        context: 'Nettozinsen',
        value: formatCurrency(row.net_interest_eur),
        period: `Gebühren: ${formatCurrency(row.fees_eur)}`,
      },
      {
        context: 'Freistellungsauftrag',
        value: formatCurrency(allowanceLimit),
        period: `Genutzt: ${formatCurrency(allowanceUsed)}`,
      },
    ];
  }, [selectedYearRow, taxProfile]);

  const requestStats = useMemo(() => ({
    pending: requests.filter((item) => item.status === 'pending').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    rejected: requests.filter((item) => item.status === 'rejected').length,
  }), [requests]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    if (!user?.id) return;
    const amount = Number(requestForm.requested_amount_eur || 0);
    if (!amount || amount <= 0) {
      toast.error('Bitte einen gültigen Betrag eingeben.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        user_id: user.id,
        requested_amount_eur: amount,
        request_year: requestForm.request_year ? Number(requestForm.request_year) : null,
        valid_from: requestForm.valid_from || null,
        valid_until: requestForm.valid_until || null,
        note: requestForm.note || null,
        status: 'pending',
      };
      const { error } = await supabase.from('portfolio_tax_exemption_requests').insert(payload);
      if (error) throw error;
      toast.success('Freistellungsauftrag wurde eingereicht.');
      setRequestForm((prev) => ({
        ...prev,
        requested_amount_eur: '',
        valid_from: '',
        valid_until: '',
        note: '',
      }));
      fetchTaxData();
      setActiveTab('exemption');
    } catch (error) {
      toast.error(error.message || 'Antrag konnte nicht gespeichert werden.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDocumentDownload = async (documentRow) => {
    try {
      await downloadDocumentViaProxy(documentRow);
    } catch (error) {
      toast.error(error.message || 'Dokument konnte nicht heruntergeladen werden.');
    }
  };

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

  const handleShellNavSelect = (item) => {
    if (item?.action === 'logout') {
      handleLogout();
      return;
    }
    if (item?.to) navigate(item.to);
  };

  return (
    <UserAreaShell navItems={shellNavItems} activeKey="steuern" onNavSelect={handleShellNavSelect}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Steuercenter</p>
            <h1 className="text-4xl font-semibold text-[#0B1E33]">Steuern</h1>
            <p className="text-sm text-slate-500">
              Jahreswerte, Freistellungsauftrag und steuerrelevante Dokumente in einer Ansicht.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right">
            <p className="text-xs text-slate-500">Ausgewähltes Jahr</p>
            <select
              className="text-sm font-semibold text-[#0B1E33] bg-transparent outline-none"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {yearlyRows.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
              {yearlyRows.map((row) => (
                <option key={row.tax_year} value={String(row.tax_year)}>
                  {row.tax_year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <SnapshotMetricCard
              key={card.context}
              context={card.context}
              value={card.value}
              period={card.period}
            />
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#0B1E33] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            Steuerdaten werden geladen...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                  <Calendar size={16} className="text-slate-500" />
                  <h3 className="font-semibold text-[#0B1E33]">Jahresvergleich</h3>
                </div>
                {yearlyRows.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">Noch keine Steuer-Snapshots vorhanden.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-slate-600">Jahr</th>
                          <th className="text-right px-4 py-3 text-slate-600">Bruttozinsen</th>
                          <th className="text-right px-4 py-3 text-slate-600">Abgeltungsteuer</th>
                          <th className="text-right px-4 py-3 text-slate-600">Soli</th>
                          <th className="text-right px-4 py-3 text-slate-600">Kirchensteuer</th>
                          <th className="text-right px-4 py-3 text-slate-600">Quellensteuer</th>
                          <th className="text-right px-4 py-3 text-slate-600">Gebühren</th>
                          <th className="text-right px-4 py-3 text-slate-600">Nettozinsen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyRows.map((row) => (
                          <tr key={row.tax_year} className="border-b border-slate-100">
                            <td className="px-4 py-3 font-medium text-slate-900">{row.tax_year}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.gross_interest_eur)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.abgeltung)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.soli)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.kirche)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.quellen)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.fees_eur)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                              {formatCurrency(row.net_interest_eur)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exemption' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1.8fr] gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-[#0B1E33]">Neuer Freistellungsauftrag</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Stellen Sie hier einen Antrag. Die Bearbeitung erfolgt durch das Admin-Team.
                  </p>
                  <form className="mt-4 space-y-3" onSubmit={handleSubmitRequest}>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Beantragter Betrag (EUR)"
                      value={requestForm.requested_amount_eur}
                      onChange={(event) => setRequestForm((prev) => ({
                        ...prev,
                        requested_amount_eur: event.target.value,
                      }))}
                      required
                    />
                    <Input
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="Steuerjahr"
                      value={requestForm.request_year}
                      onChange={(event) => setRequestForm((prev) => ({
                        ...prev,
                        request_year: event.target.value,
                      }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={requestForm.valid_from}
                        onChange={(event) => setRequestForm((prev) => ({
                          ...prev,
                          valid_from: event.target.value,
                        }))}
                      />
                      <Input
                        type="date"
                        value={requestForm.valid_until}
                        onChange={(event) => setRequestForm((prev) => ({
                          ...prev,
                          valid_until: event.target.value,
                        }))}
                      />
                    </div>
                    <Textarea
                      rows={4}
                      placeholder="Zusätzliche Hinweise (optional)"
                      value={requestForm.note}
                      onChange={(event) => setRequestForm((prev) => ({
                        ...prev,
                        note: event.target.value,
                      }))}
                    />
                    <Button type="submit" className="w-full bg-[#0B1E33] text-white" disabled={submitLoading}>
                      {submitLoading ? 'Wird eingereicht...' : 'Antrag einreichen'}
                    </Button>
                  </form>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#0B1E33]">Antragsverlauf</h3>
                    <div className="text-xs text-slate-500">
                      Offen {requestStats.pending} · Genehmigt {requestStats.approved} · Abgelehnt {requestStats.rejected}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {requests.length === 0 && (
                      <p className="text-sm text-slate-500">Noch keine Freistellungsaufträge vorhanden.</p>
                    )}
                    {requests.map((row) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(row.requested_amount_eur)} · Jahr {row.request_year || '—'}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            row.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.status === 'rejected'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                          >
                            {row.status === 'approved' ? 'Genehmigt' : row.status === 'rejected' ? 'Abgelehnt' : 'In Prüfung'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Eingereicht am {formatDate(row.created_at)}
                          {row.valid_from || row.valid_until
                            ? ` · Gültigkeit: ${formatDate(row.valid_from)} bis ${formatDate(row.valid_until)}`
                            : ''}
                        </p>
                        {row.note && <p className="text-sm text-slate-700 mt-2">{row.note}</p>}
                        {row.admin_note && (
                          <p className="text-xs text-slate-600 mt-2 border-t border-slate-200 pt-2">
                            Admin-Hinweis: {row.admin_note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-slate-500" />
                  <h3 className="font-semibold text-[#0B1E33]">Steuerdokumente</h3>
                </div>
                <div className="space-y-2">
                  {taxDocuments.length === 0 && (
                    <p className="text-sm text-slate-500">Keine steuerrelevanten Dokumente vorhanden.</p>
                  )}
                  {taxDocuments.map((doc) => (
                    <div key={doc.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.document_type || 'Dokument'} · {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDocumentDownload(doc)}
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'withholding' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-[#0B1E33]">Quellensteuer</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Übersicht zu einbehaltener Quellensteuer aus dem ausgewählten Steuerjahr.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Quellensteuer</p>
                    <p className="text-lg font-semibold text-[#0B1E33]">
                      {formatCurrency(selectedYearRow?.quellen || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Steuerland</p>
                    <p className="text-lg font-semibold text-[#0B1E33]">
                      {taxProfile?.tax_residency_country || 'DE'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Kirchensteuer aktiv</p>
                    <p className="text-lg font-semibold text-[#0B1E33]">
                      {taxProfile?.church_tax_enabled ? 'Ja' : 'Nein'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-semibold text-[#0B1E33]">Steuerhäufige Fragen</h3>
                {[
                  {
                    q: 'Wann werden Steuerwerte aktualisiert?',
                    a: 'Die jährlichen Steuerwerte werden mit den tax snapshots aktualisiert und im Steuerjahr aggregiert.',
                  },
                  {
                    q: 'Wie funktioniert der Freistellungsauftrag?',
                    a: 'Sie reichen den Antrag digital ein. Nach Freigabe durch das Admin-Team wird Ihr Limit im Steuerprofil angepasst.',
                  },
                  {
                    q: 'Wo finde ich meine Steuerdokumente?',
                    a: 'Im Tab Steuerdokumente. Dort können Sie verfügbare Dokumente direkt herunterladen.',
                  },
                ].map((item) => (
                  <div key={item.q} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                    <p className="text-sm text-slate-600 mt-1">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </UserAreaShell>
  );
};

export default UserTaxes;
