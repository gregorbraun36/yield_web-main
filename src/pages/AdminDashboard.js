import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import { toast } from 'sonner';
import { formatEur, toEur, loadEurRates } from '@/lib/currency';
import {
  Plus, Edit, Trash2, FileText, ChevronRight, X, Save, RefreshCw, Building2, Users, Send, WalletCards, MessageSquareMore, Activity,
} from 'lucide-react';

const formatCountDelta = (value) => `${value} aktiv`;

const EMPTY_FORM = {
  bank_id: '',
  interest_rate: '',
  deposit_term: '',
  min_deposit: '',
  deposit_protection: '',
  description: '',
  bank_link: '',
  is_active: true,
};

const AdminDashboard = () => {
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [pendingUserCount, setPendingUserCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [twoFactorUsers, setTwoFactorUsers] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [riskBreachCount, setRiskBreachCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
    fetchOffers();
    fetchPendingCount();
    fetchApplicationStats();
    fetchTwoFactorStats();
    fetchSupportStats();
    fetchRiskStats();
  }, []);

  const fetchBanks = async () => {
    const { data } = await supabase
      .from('banks')
      .select('id, name, country')
      .eq('is_active', true)
      .order('name', { ascending: true });
    setBanks(data || []);
  };

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from('savings_offers')
      .select('*, banks(id, name, country)')
      .order('interest_rate', { ascending: false });
    await loadEurRates();
    if (error) {
      toast.error('Fehler beim Laden der Angebote');
    } else {
      setOffers(data || []);
    }
  };

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingUserCount(count || 0);
  };

  const fetchTwoFactorStats = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('two_factor_enabled', true);
    setTwoFactorUsers(count || 0);
  };

  const fetchApplicationStats = async () => {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'Abgeschlossen');
    setPendingApplicationsCount(count || 0);
  };

  const fetchSupportStats = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('unread_admin_count');
    const unread = (data || []).reduce((sum, row) => sum + Number(row.unread_admin_count || 0), 0);
    setSupportUnreadCount(unread);
  };

  const fetchRiskStats = async () => {
    const { data } = await supabase
      .from('portfolio_contracts')
      .select('bank_name, amount_eur')
      .eq('is_active', true);
    const bankSum = (data || []).reduce((acc, row) => {
      const bank = row.bank_name || 'Unbekannte Bank';
      acc[bank] = (acc[bank] || 0) + Number(row.amount_eur || 0);
      return acc;
    }, {});
    const breaches = Object.values(bankSum).filter((amount) => Number(amount) > 100000).length;
    setRiskBreachCount(breaches);
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setOfferForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setOfferForm({
      bank_id: offer.bank_id || '',
      interest_rate: String(offer.interest_rate ?? ''),
      deposit_term: String(offer.deposit_term ?? ''),
      min_deposit: String(offer.min_deposit ?? ''),
      deposit_protection: offer.deposit_protection || '',
      description: offer.description || '',
      bank_link: offer.bank_link || '',
      is_active: offer.is_active ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setOfferForm(EMPTY_FORM);
  };

  const field = (key) => (e) =>
    setOfferForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      bank_id: offerForm.bank_id,
      interest_rate: parseFloat(offerForm.interest_rate),
      deposit_term: parseInt(offerForm.deposit_term),
      min_deposit: parseFloat(offerForm.min_deposit),
      deposit_protection: offerForm.deposit_protection,
      description: offerForm.description,
      bank_link: offerForm.bank_link || null,
      is_active: offerForm.is_active,
      currency: 'EUR',
    };

    let error;
    if (editingOffer) {
      ({ error } = await supabase.from('savings_offers').update(payload).eq('id', editingOffer.id));
      if (!error) toast.success('Angebot erfolgreich aktualisiert');
    } else {
      ({ error } = await supabase.from('savings_offers').insert(payload));
      if (!error) toast.success('Angebot erfolgreich erstellt');
    }

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      await fetchOffers();
      closeModal();
    }
    setSaving(false);
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Angebot löschen möchten?')) return;
    const { error } = await supabase.from('savings_offers').delete().eq('id', id);
    if (error) {
      toast.error('Fehler beim Löschen: ' + error.message);
    } else {
      toast.success('Angebot gelöscht');
      fetchOffers();
    }
  };

  const isFormValid =
    offerForm.bank_id &&
    offerForm.interest_rate &&
    offerForm.deposit_term &&
    offerForm.min_deposit &&
    offerForm.deposit_protection &&
    offerForm.description;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Übersicht</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Willkommen im Admin-Bereich</h1>
        <p className="text-sm text-slate-500 mt-1">Schnellzugriff auf alle Module und zentrale Angebotsverwaltung.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <SnapshotMetricCard
          context="Security Snapshot"
          value={`${twoFactorUsers}`}
          period="2FA Aktivierungen"
          deltaLabel={formatCountDelta(twoFactorUsers)}
          deltaPositive
        />
        <SnapshotMetricCard
          context="Support Inbox"
          value={`${supportUnreadCount}`}
          period="Ungelesene Nachrichten"
          deltaLabel={supportUnreadCount > 0 ? 'Action needed' : 'Clean'}
          deltaPositive={supportUnreadCount === 0}
        />
        <SnapshotMetricCard
          context="Risk Exposure"
          value={`${riskBreachCount}`}
          period="Banken über Limit"
          deltaLabel={riskBreachCount > 0 ? 'Limit breach' : 'Im Rahmen'}
          deltaPositive={riskBreachCount === 0}
        />
        <SnapshotMetricCard
          context="Pending Applications"
          value={`${pendingApplicationsCount}`}
          period="Offene Anträge"
          deltaLabel={pendingApplicationsCount > 0 ? 'Review offen' : 'Keine'}
          deltaPositive={pendingApplicationsCount === 0}
        />
        <SnapshotMetricCard
          context="Pending Users"
          value={`${pendingUserCount}`}
          period="Ausstehende Freigaben"
          deltaLabel={pendingUserCount > 0 ? 'Freigabe nötig' : 'Alles freigegeben'}
          deltaPositive={pendingUserCount === 0}
        />
      </div>

      <SectionCard title="Admin Modules" icon={ChevronRight}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Benutzerverwaltung */}
          <Link to="/admin/users" className="block group">
            <div className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-amber-300/80 transition-all h-full">
              {pendingUserCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingUserCount}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Users size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Benutzer</h3>
                    <p className="text-xs text-slate-500">{pendingUserCount} ausstehend</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Banken */}
          <Link to="/admin/banks" className="block group">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-teal-300/80 transition-all h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Banken</h3>
                    <p className="text-xs text-slate-500">{banks.length} insgesamt</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Angebote */}
          <Link to="/admin/offers" className="block group">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300/80 transition-all h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Plus size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Angebote</h3>
                    <p className="text-xs text-slate-500">{offers.length} insgesamt</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Anträge */}
          <Link to="/admin/applications" className="block group">
            <div className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-violet-300/80 transition-all h-full">
              {pendingApplicationsCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingApplicationsCount > 99 ? '99+' : pendingApplicationsCount}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Anträge</h3>
                    <p className="text-xs text-slate-500">{pendingApplicationsCount} offen</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Interessenten (Neu) */}
          <Link to="/admin/offer-interests" className="block group">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-pink-300/80 transition-all h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Send size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Interessenten</h3>
                    <p className="text-xs text-slate-500">Info-Anfragen</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-pink-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Depotverträge */}
          <Link to="/admin/contracts" className="block group">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300/80 transition-all h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <WalletCards size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Depot</h3>
                    <p className="text-xs text-slate-500">Verträge</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Support */}
          <Link to="/admin/support-mailbox" className="block group">
            <div className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all h-full">
              {supportUnreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MessageSquareMore size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Support</h3>
                    <p className="text-xs text-slate-500">{supportUnreadCount} ungelesen</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Aktivität */}
          <Link to="/admin/activity-feed" className="block group">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-cyan-300/80 transition-all h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Activity size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Aktivität</h3>
                    <p className="text-xs text-slate-500">Live Feed</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-cyan-600 transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </SectionCard>

        {/* Offers Table */}
        <SectionCard title="Angebote verwalten" icon={FileText}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Daten</p>
              <h2 className="text-xl md:text-2xl font-semibold text-[#0B1E33]">Savings Offers</h2>
            </div>
            <Button
              className="bg-[#0B1E33] hover:bg-[#1E293B] text-white shrink-0"
              onClick={openAddModal}
              data-testid="add-offer-btn"
            >
              <Plus size={18} className="mr-2" />
              Angebot hinzufügen
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Bank</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Land</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Zinssatz</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Laufzeit</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Mindesteinlage</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Keine Angebote vorhanden
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr
                      key={offer.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                      data-testid={`offer-row-${offer.id}`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">{offer.banks?.name || '–'}</td>
                      <td className="py-3 px-4 text-slate-600">{offer.banks?.country || '–'}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">{offer.interest_rate}%</td>
                      <td className="py-3 px-4 text-slate-600">{offer.deposit_term} M</td>
                      <td className="py-3 px-4 text-slate-600">{formatEur(toEur(offer.min_deposit, offer.currency))}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${offer.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                          {offer.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(offer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Bearbeiten" data-testid={`edit-offer-${offer.id}`}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteOffer(offer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Löschen" data-testid={`delete-offer-${offer.id}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingOffer ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form id="offer-form" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank <span className="text-red-500">*</span></label>
                <select value={offerForm.bank_id} onChange={field('bank_id')} required className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" data-testid="offer-bank-id">
                  <option value="">Bank auswählen...</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.country})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zinssatz (%) <span className="text-red-500">*</span></label>
                  <Input type="number" step="0.01" min="0" max="20" value={offerForm.interest_rate} onChange={field('interest_rate')} placeholder="z.B. 3.50" required data-testid="offer-interest-rate" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Laufzeit (Monate) <span className="text-red-500">*</span></label>
                  <Input type="number" min="1" value={offerForm.deposit_term} onChange={field('deposit_term')} placeholder="z.B. 12" required data-testid="offer-deposit-term" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mindesteinlage (€) <span className="text-red-500">*</span></label>
                  <Input type="number" min="0" value={offerForm.min_deposit} onChange={field('min_deposit')} placeholder="z.B. 1000" required data-testid="offer-min-deposit" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank-Link</label>
                  <Input type="url" value={offerForm.bank_link} onChange={field('bank_link')} placeholder="https://..." data-testid="offer-bank-link" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Einlagensicherung <span className="text-red-500">*</span></label>
                <Input value={offerForm.deposit_protection} onChange={field('deposit_protection')} placeholder="z.B. €100.000 (EU-Einlagensicherung)" required data-testid="offer-deposit-protection" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung <span className="text-red-500">*</span></label>
                <textarea value={offerForm.description} onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Kurze Beschreibung des Angebots..." rows={3} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2" data-testid="offer-description" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Angebot aktiv</p>
                  <p className="text-xs text-slate-500 mt-0.5">Inaktive Angebote werden Nutzern nicht angezeigt</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={offerForm.is_active} onChange={(e) => setOfferForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="sr-only peer" data-testid="offer-is-active" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                </label>
              </div>
            </form>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
              <Button type="button" variant="outline" onClick={closeModal}>Abbrechen</Button>
              <Button type="submit" form="offer-form" disabled={saving || !isFormValid} className="bg-[#0B1E33] hover:bg-[#1E293B] text-white" data-testid="offer-submit-btn">
                {saving ? <><RefreshCw size={16} className="mr-2 animate-spin" />Speichern...</> : <><Save size={16} className="mr-2" />{editingOffer ? 'Änderungen speichern' : 'Angebot erstellen'}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;