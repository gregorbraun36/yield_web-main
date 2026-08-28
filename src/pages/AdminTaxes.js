import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const CURRENCY_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const formatCurrency = (value) => CURRENCY_FORMAT.format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('de-DE');
};

const STATUS_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'pending', label: 'Offen' },
  { key: 'approved', label: 'Genehmigt' },
  { key: 'rejected', label: 'Abgelehnt' },
];

const AdminTaxes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [profilesByUser, setProfilesByUser] = useState({});
  const [profileNames, setProfileNames] = useState({});
  const [actionDrafts, setActionDrafts] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: requestRows, error: requestError } = await supabase
        .from('portfolio_tax_exemption_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (requestError) throw requestError;

      const rows = requestRows || [];
      setRequests(rows);

      const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
      if (userIds.length === 0) {
        setProfilesByUser({});
        setProfileNames({});
        return;
      }

      const [{ data: profileRows, error: profileError }, { data: taxProfileRows, error: taxProfileError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', userIds),
        supabase
          .from('portfolio_tax_profiles')
          .select('*')
          .in('user_id', userIds),
      ]);

      if (profileError) throw profileError;
      if (taxProfileError) throw taxProfileError;

      const namesMap = {};
      (profileRows || []).forEach((row) => {
        const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
        namesMap[row.id] = {
          displayName: fullName || row.email || row.id,
          email: row.email || '—',
        };
      });
      setProfileNames(namesMap);

      const taxMap = {};
      (taxProfileRows || []).forEach((row) => {
        taxMap[row.user_id] = row;
      });
      setProfilesByUser(taxMap);
    } catch (error) {
      toast.error(error.message || 'Steueranträge konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRequests = useMemo(() => (
    requests.filter((row) => (statusFilter === 'all' ? true : row.status === statusFilter))
  ), [requests, statusFilter]);

  const stats = useMemo(() => ({
    pending: requests.filter((row) => row.status === 'pending').length,
    approved: requests.filter((row) => row.status === 'approved').length,
    rejected: requests.filter((row) => row.status === 'rejected').length,
  }), [requests]);

  const handleDraftChange = (requestId, field, value) => {
    setActionDrafts((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value,
      },
    }));
  };

  const processRequest = async (row, nextStatus) => {
    if (!user?.id) return;
    setSavingId(row.id);
    try {
      const draft = actionDrafts[row.id] || {};
      const approvedAmount = Number(draft.approved_amount_eur || row.requested_amount_eur || 0);
      const adminNote = draft.admin_note || null;

      const updatePayload = {
        status: nextStatus,
        approved_amount_eur: nextStatus === 'approved' ? approvedAmount : null,
        admin_note: adminNote,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('portfolio_tax_exemption_requests')
        .update(updatePayload)
        .eq('id', row.id);
      if (updateError) throw updateError;

      if (nextStatus === 'approved') {
        const existing = profilesByUser[row.user_id] || {};
        const targetTaxYear = Number(row.request_year || new Date().getFullYear());
        const { error: profileError } = await supabase
          .from('portfolio_tax_profiles')
          .upsert({
            user_id: row.user_id,
            church_tax_enabled: existing.church_tax_enabled || false,
            church_tax_rate_pct: Number(existing.church_tax_rate_pct || 0),
            freistellungsauftrag_limit_eur: approvedAmount,
            freistellungsauftrag_used_eur: Number(existing.freistellungsauftrag_used_eur || 0),
            tax_residency_country: existing.tax_residency_country || 'DE',
            steuer_id: existing.steuer_id || null,
          });
        if (profileError) throw profileError;

        const { error: refreshError } = await supabase.rpc('refresh_user_tax_snapshot', {
          p_user_id: row.user_id,
          p_tax_year: targetTaxYear,
        });
        if (refreshError) throw refreshError;
      }

      toast.success(nextStatus === 'approved' ? 'Antrag wurde genehmigt.' : 'Antrag wurde abgelehnt.');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Antrag konnte nicht verarbeitet werden.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Administration</p>
          <h1 className="text-3xl font-semibold text-[#0B1E33]">Steuern</h1>
          <p className="text-sm text-slate-500">
            Bearbeitung von Freistellungsaufträgen und Steuerprofilen.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchData}>
          <RefreshCw size={14} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SnapshotMetricCard context="Offene Anträge" value={`${stats.pending}`} period="Status: pending" />
        <SnapshotMetricCard context="Genehmigt" value={`${stats.approved}`} period="Status: approved" />
        <SnapshotMetricCard context="Abgelehnt" value={`${stats.rejected}`} period="Status: rejected" />
      </div>

      <SectionCard title="Anträge verwalten" icon={Clock3}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-[#0B1E33] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Anträge werden geladen...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Anträge für den ausgewählten Status.</p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((row) => {
                const draft = actionDrafts[row.id] || {};
                const profile = profilesByUser[row.user_id] || null;
                const userInfo = profileNames[row.user_id] || { displayName: row.user_id, email: '—' };
                const isPending = row.status === 'pending';
                return (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-4 bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{userInfo.displayName}</p>
                        <p className="text-xs text-slate-500">{userInfo.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Antrag: {formatCurrency(row.requested_amount_eur)} · Jahr {row.request_year || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Eingereicht: {formatDateTime(row.created_at)}
                          {row.processed_at ? ` · Bearbeitet: ${formatDateTime(row.processed_at)}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        row.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                      >
                        {row.status === 'approved' ? 'Genehmigt' : row.status === 'rejected' ? 'Abgelehnt' : 'Offen'}
                      </span>
                    </div>

                    {row.note && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Kundennotiz</p>
                        <p className="text-sm text-slate-700 mt-1">{row.note}</p>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Aktuelles Limit im Steuerprofil</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(profile?.freistellungsauftrag_limit_eur || 0)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Genutzter Betrag</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(profile?.freistellungsauftrag_used_eur || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!isPending || savingId === row.id}
                        value={draft.approved_amount_eur ?? row.requested_amount_eur ?? ''}
                        onChange={(event) => handleDraftChange(row.id, 'approved_amount_eur', event.target.value)}
                        placeholder="Genehmigter Betrag (EUR)"
                      />
                      <Textarea
                        rows={2}
                        disabled={!isPending || savingId === row.id}
                        value={draft.admin_note ?? row.admin_note ?? ''}
                        onChange={(event) => handleDraftChange(row.id, 'admin_note', event.target.value)}
                        placeholder="Admin-Notiz"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        disabled={!isPending || savingId === row.id}
                        onClick={() => processRequest(row, 'approved')}
                      >
                        <CheckCircle2 size={14} />
                        Genehmigen
                      </Button>
                      <Button
                        variant="destructive"
                        className="gap-1"
                        disabled={!isPending || savingId === row.id}
                        onClick={() => processRequest(row, 'rejected')}
                      >
                        <XCircle size={14} />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminTaxes;
