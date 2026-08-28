import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createAdminProvisionedUser, getProvisionedCredential } from '@/lib/adminProvisioning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileAvatar from '@/components/ProfileAvatar';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import { saveProfileAvatarUrl, uploadProfileAvatar } from '@/lib/profileAvatar';
import { downloadDocumentViaProxy } from '@/lib/documentDownload';
import { toast } from 'sonner';
import {
  Search, RefreshCw, UserPlus, User, Users, Mail, Globe, Eye, Copy,
  CheckCircle, XCircle, Clock, AlertTriangle, UploadCloud,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Ausstehend', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Freigeschaltet', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Abgelehnt', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [credentialModal, setCredentialModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [avatarUploadingFor, setAvatarUploadingFor] = useState(null);
  const [onlineMap, setOnlineMap] = useState({});

  const handleDocumentDownload = async (documentRow) => {
    try {
      await downloadDocumentViaProxy(documentRow);
    } catch (error) {
      toast.error(error.message || 'Dokument konnte nicht heruntergeladen werden.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (!users.length) return undefined;
    const intervalId = setInterval(() => {
      fetchPresence(users.map((row) => row.id));
    }, 30000);
    return () => clearInterval(intervalId);
  }, [users]);

  const fetchPresence = async (ids) => {
    if (!ids?.length) {
      setOnlineMap({});
      return;
    }

    const { data: presenceRows, error: presenceError } = await supabase
      .from('user_presence')
      .select('user_id, is_online, last_seen_at')
      .in('user_id', ids);

    if (presenceError) {
      setOnlineMap({});
      return;
    }

    const now = Date.now();
    const nextMap = {};
    (presenceRows || []).forEach((entry) => {
      const seenAt = entry.last_seen_at ? new Date(entry.last_seen_at).getTime() : 0;
      const recentlyActive = now - seenAt <= 120000;
      nextMap[entry.user_id] = Boolean(entry.is_online && recentlyActive);
    });
    setOnlineMap(nextMap);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, country, address, phone, avatar_url, role, status, verified, created_at, admin_created, must_reset_password, onboarding_required, onboarding_completed')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      setUsers(rows);
      await fetchPresence(rows.map((row) => row.id));
    } catch (err) {
      toast.error('Fehler beim Laden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('In Zwischenablage kopiert');
    } catch {
      toast.error('Konnte nicht kopiert werden');
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreateLoading(true);
    try {
      const result = await createAdminProvisionedUser({
        email: newUserEmail,
        firstName: newUserFirstName,
        lastName: newUserLastName,
      });
      setCredentialModal({
        userId: result.user.id,
        email: result.user.email,
        temporaryPassword: result.temporaryPassword,
        revealedCount: 1,
        createdNow: true,
      });
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      await fetchUsers();
      if (result?.reprovisioned) {
        toast.success('Bestehenden Benutzer re-provisioniert: Profil wurde freigeschaltet und neues Passwort gesetzt.');
      } else {
        toast.success('Benutzer wurde erstellt und automatisch freigeschaltet.');
      }
      if (result?.mailSent === false) {
        toast.error(`Hinweis: E-Mail konnte nicht gesendet werden (${result.mailError || 'unbekannter Fehler'}).`);
      }
    } catch (err) {
      toast.error(`Erstellung fehlgeschlagen: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const revealCredential = async (row) => {
    try {
      const credential = await getProvisionedCredential(row.id);
      setCredentialModal({
        userId: row.id,
        email: row.email,
        temporaryPassword: credential.temporary_password,
        revealedCount: credential.revealed_count,
        createdNow: false,
      });
    } catch (err) {
      toast.error(`Kein temporäres Passwort gefunden: ${err.message}`);
    }
  };

  const openDetails = async (row) => {
    setDetailLoading(true);
    setDetailModal({
      profile: row,
      contracts: [],
      cashflows: [],
      documents: [],
      notifications: [],
      taxSnapshots: [],
      dailySnapshots: [],
      supportTickets: [],
    });
    try {
      const userId = row.id;
      const [
        contractsResult,
        cashflowResult,
        documentsResult,
        notificationsResult,
        taxResult,
        dailyResult,
        supportResult,
      ] = await Promise.all([
        supabase
          .from('portfolio_contracts')
          .select('id, product_type, bank_name, contract_number, amount_eur, interest_rate, term_months, active_from, active_until, status, is_active')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolio_cashflows')
          .select('id, flow_type, amount_eur, flow_date')
          .eq('user_id', userId)
          .order('flow_date', { ascending: false })
          .limit(12),
        supabase
          .from('portfolio_documents')
          .select('id, title, document_type, created_at, file_url')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('portfolio_notifications')
          .select('id, title, message, severity, is_read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('portfolio_tax_snapshots')
          .select('id, tax_year, gross_interest_eur, tax_withheld_eur, fees_eur, net_interest_eur')
          .eq('user_id', userId)
          .order('tax_year', { ascending: false })
          .limit(5),
        supabase
          .from('portfolio_daily_snapshots')
          .select('id, snapshot_date, total_value_eur, available_eur, accrued_interest_eur, daily_yield_eur')
          .eq('user_id', userId)
          .order('snapshot_date', { ascending: false })
          .limit(14),
        supabase
          .from('support_tickets')
          .select('id, subject, status, priority, last_message_at, unread_admin_count, unread_user_count')
          .eq('user_id', userId)
          .order('last_message_at', { ascending: false })
          .limit(10),
      ]);

      const hasError = [
        contractsResult.error,
        cashflowResult.error,
        documentsResult.error,
        notificationsResult.error,
        taxResult.error,
        dailyResult.error,
        supportResult.error,
      ].find(Boolean);
      if (hasError) throw hasError;

      setDetailModal({
        profile: row,
        contracts: contractsResult.data || [],
        cashflows: cashflowResult.data || [],
        documents: documentsResult.data || [],
        notifications: notificationsResult.data || [],
        taxSnapshots: taxResult.data || [],
        dailySnapshots: dailyResult.data || [],
        supportTickets: supportResult.data || [],
      });
    } catch (err) {
      toast.error(`Details konnten nicht geladen werden: ${err.message}`);
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdminAvatarUpload = async (event, row) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploadingFor(row.id);
    try {
      const avatarUrl = await uploadProfileAvatar({ file, userId: row.id });
      await saveProfileAvatarUrl({ userId: row.id, avatarUrl });
      setUsers((prev) => prev.map((item) => (item.id === row.id ? { ...item, avatar_url: avatarUrl } : item)));
      setDetailModal((prev) => {
        if (!prev || prev.profile.id !== row.id) return prev;
        return { ...prev, profile: { ...prev.profile, avatar_url: avatarUrl } };
      });
      toast.success('Profilfoto gespeichert.');
    } catch (err) {
      toast.error(`Profilfoto konnte nicht gespeichert werden: ${err.message}`);
    } finally {
      setAvatarUploadingFor(null);
      event.target.value = '';
    }
  };

  const handleApprove = async (userId, name) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved', verified: true })
        .eq('id', userId);
      if (error) throw error;
      toast.success(`${name} wurde erfolgreich freigeschaltet.`);
      await fetchUsers();
    } catch (err) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (userId, name) => {
    setRejectModal({ userId, name });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          verified: false,
          rejection_reason: rejectReason?.trim() ? rejectReason.trim() : null,
        })
        .eq('id', rejectModal.userId);
      if (error) throw error;
      toast.success(`${rejectModal.name} wurde abgelehnt.`);
      setRejectModal(null);
      await fetchUsers();
    } catch (err) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((row) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const name = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    return name.includes(term) || (row.email || '').toLowerCase().includes(term) || (row.country || '').toLowerCase().includes(term);
  });

  const tabs = [
    { key: 'all', label: 'Alle' },
    { key: 'pending', label: 'Ausstehend' },
    { key: 'approved', label: 'Freigeschaltet' },
    { key: 'rejected', label: 'Abgelehnt' },
  ];
  const pendingCount = users.filter((row) => row.status === 'pending').length;
  const approvedCount = users.filter((row) => row.status === 'approved').length;
  const rejectedCount = users.filter((row) => row.status === 'rejected').length;
  const adminProvisionedCount = users.filter((row) => row.admin_created).length;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Benutzer</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Benutzerverwaltung</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registrierungen prüfen, Benutzer anlegen und Detailprofile öffnen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <SnapshotMetricCard
          context="User Registry"
          value={`${users.length}`}
          period="Gesamte Benutzer"
          deltaLabel={`${adminProvisionedCount} admin erstellt`}
          deltaPositive
        />
        <SnapshotMetricCard
          context="Freigaben"
          value={`${pendingCount}`}
          period="Pending Reviews"
          deltaLabel={pendingCount > 0 ? 'Freigabe offen' : 'Kein Backlog'}
          deltaPositive={pendingCount === 0}
        />
        <SnapshotMetricCard
          context="Approved"
          value={`${approvedCount}`}
          period="Aktive Nutzer"
          deltaLabel={`${Math.round((approvedCount / Math.max(1, users.length)) * 100)}% quote`}
          deltaPositive
        />
        <SnapshotMetricCard
          context="Rejected"
          value={`${rejectedCount}`}
          period="Abgelehnte Nutzer"
          deltaLabel={rejectedCount > 0 ? 'Prüfung nötig' : 'Kein Risiko'}
          deltaPositive={rejectedCount === 0}
        />
        <SnapshotMetricCard
          context="Search Scope"
          value={`${filteredUsers.length}`}
          period="Gefilterte Ergebnisse"
          deltaLabel={searchTerm ? 'Filter aktiv' : 'Alle sichtbar'}
          deltaPositive
        />
      </div>

      <SectionCard title="Neuen Benutzer anlegen" icon={UserPlus}>
        <div className="rounded-2xl p-2">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <UserPlus size={22} />
            </div>
            <div className="w-full">
              <h2 className="text-xl font-medium text-[#0B1E33]">Neuen Benutzer anlegen</h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Admin-Provisioning: Konto ist sofort freigeschaltet, erster Login erzwingt Passwortwechsel.
              </p>
              <form className="space-y-3" onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder="Vorname"
                    required
                    className="sm:col-span-1"
                  />
                  <Input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder="Nachname"
                    required
                    className="sm:col-span-1"
                  />
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="kunde@beispiel.de"
                    required
                    className="sm:col-span-1"
                  />
                </div>
                <div className="flex">
                  <Button
                    disabled={createLoading}
                    className="bg-[#0B1E33] hover:bg-[#1E293B] text-white gap-2"
                    type="submit"
                  >
                    {createLoading ? <RefreshCw size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    Benutzer erstellen
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Filter & Aktionen" icon={Search}>
        <div className="rounded-2xl p-1">
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.key
                    ? 'bg-white text-[#0B1E33] shadow-sm font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-[260px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, E-Mail oder Land..."
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={fetchUsers} className="gap-2">
                <RefreshCw size={15} /> Aktualisieren
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Benutzerliste" icon={Users}>
        <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw size={24} className="animate-spin text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Wird geladen...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <User size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {searchTerm ? 'Keine Ergebnisse für Ihre Suche.' : 'Keine Benutzer gefunden.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Benutzer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">E-Mail</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Land</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Registriert</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Quelle</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || '–';
                  const isActing = actionLoading === row.id;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <ProfileAvatar
                              avatarUrl={row.avatar_url}
                              fullName={fullName !== '–' ? fullName : row.email}
                              size="sm"
                            />
                            {onlineMap[row.id] && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"
                                title="Online"
                              />
                            )}
                          </div>
                          <span className="font-medium text-slate-900 text-sm">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          {row.email || '–'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Globe size={13} className="text-slate-400 shrink-0" />
                          {row.country || '–'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                          : '–'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {row.admin_created ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            Admin erstellt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                            Self-Register
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {row.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(row.id, fullName)}
                                disabled={isActing}
                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                              >
                                {isActing ? <RefreshCw size={12} className="animate-spin" /> : 'Freischalten'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRejectModal(row.id, fullName)}
                                disabled={isActing}
                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 text-xs"
                              >
                                Ablehnen
                              </Button>
                            </>
                          )}
                          {(row.admin_created || row.must_reset_password) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revealCredential(row)}
                              className="h-8 px-3 text-xs gap-1.5"
                            >
                              <Eye size={12} />
                              Öffnen
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(row)}
                            className="h-8 px-3 text-xs gap-1.5"
                          >
                            <Eye size={12} />
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {credentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 text-xl mb-1">Temporäres Passwort</h3>
              <p className="text-sm text-slate-500 mb-5">{credentialModal.email}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Passwort</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-[#0B1E33] break-all">{credentialModal.temporaryPassword}</code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyText(credentialModal.temporaryPassword)}
                  >
                    <Copy size={13} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Der Benutzer muss beim ersten Login das Passwort zurücksetzen.
                {!credentialModal.createdNow && ` Anzeigen insgesamt: ${credentialModal.revealedCount}`}
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setCredentialModal(null)} className="bg-[#0B1E33] hover:bg-[#1E293B] text-white">
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-xl">Benutzerdetails</h3>
              <p className="text-sm text-slate-500">{detailModal.profile.email}</p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-88px)]">
              {detailLoading ? (
                <div className="py-10 text-center text-slate-500">Details werden geladen...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <ProfileAvatar
                        avatarUrl={detailModal.profile.avatar_url}
                        fullName={`${detailModal.profile.first_name || ''} ${detailModal.profile.last_name || ''}`.trim() || detailModal.profile.email}
                        size="xl"
                        className="mx-auto"
                      />
                      <label className="mt-4 inline-flex w-full justify-center items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-100 cursor-pointer">
                        <UploadCloud size={14} />
                        {avatarUploadingFor === detailModal.profile.id ? 'Wird hochgeladen...' : 'Profilfoto setzen'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => handleAdminAvatarUpload(event, detailModal.profile)}
                          disabled={avatarUploadingFor === detailModal.profile.id}
                        />
                      </label>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-500">Name:</span> <span className="font-medium">{`${detailModal.profile.first_name || ''} ${detailModal.profile.last_name || ''}`.trim() || '—'}</span></div>
                        <div><span className="text-slate-500">Status:</span> <span className="font-medium">{detailModal.profile.status || '—'}</span></div>
                        <div><span className="text-slate-500">E-Mail:</span> <span className="font-medium break-all">{detailModal.profile.email || '—'}</span></div>
                        <div><span className="text-slate-500">Telefon:</span> <span className="font-medium">{detailModal.profile.phone || '—'}</span></div>
                        <div><span className="text-slate-500">Land:</span> <span className="font-medium">{detailModal.profile.country || '—'}</span></div>
                        <div><span className="text-slate-500">Adresse:</span> <span className="font-medium">{detailModal.profile.address || '—'}</span></div>
                        <div><span className="text-slate-500">Onboarding:</span> <span className="font-medium">{detailModal.profile.onboarding_completed ? 'Abgeschlossen' : 'Offen'}</span></div>
                        <div><span className="text-slate-500">Mitglied seit:</span> <span className="font-medium">{detailModal.profile.created_at ? new Date(detailModal.profile.created_at).toLocaleDateString('de-DE') : '—'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Verträge</p>
                      <p className="text-lg font-semibold text-slate-900">{detailModal.contracts.length}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Portfolio Summe</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {detailModal.contracts.reduce((sum, row) => sum + Number(row.amount_eur || 0), 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Support Tickets</p>
                      <p className="text-lg font-semibold text-slate-900">{detailModal.supportTickets.length}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Benachrichtigungen</p>
                      <p className="text-lg font-semibold text-slate-900">{detailModal.notifications.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Depotverträge</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {detailModal.contracts.length === 0 && <p className="text-sm text-slate-500">Keine Verträge.</p>}
                        {detailModal.contracts.map((row) => (
                          <div key={row.id} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                            <p className="font-medium text-slate-900">{row.product_type} · {row.bank_name || '—'}</p>
                            <p className="text-xs text-slate-500">
                              {row.contract_number || '—'} · {Number(row.interest_rate || 0).toFixed(2)} % · {Number(row.amount_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Cashflows / Meldungen</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {detailModal.cashflows.map((row) => (
                          <div key={row.id} className="border border-slate-200 rounded-lg p-2.5 text-sm flex items-center justify-between">
                            <span>{row.flow_type} · {row.flow_date}</span>
                            <span className="font-medium">{Number(row.amount_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                        ))}
                        {detailModal.notifications.map((row) => (
                          <div key={row.id} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                            <p className="font-medium text-slate-900">{row.title}</p>
                            <p className="text-xs text-slate-500">{row.message}</p>
                          </div>
                        ))}
                        {detailModal.cashflows.length === 0 && detailModal.notifications.length === 0 && (
                          <p className="text-sm text-slate-500">Keine Einträge vorhanden.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Dokumente</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detailModal.documents.length === 0 && <p className="text-sm text-slate-500">Keine Dokumente.</p>}
                        {detailModal.documents.map((doc) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleDocumentDownload(doc)}
                            className="w-full text-left border border-slate-200 rounded-lg p-2.5 text-sm hover:bg-slate-50"
                          >
                            <p className="font-medium text-slate-900">{doc.title}</p>
                            <p className="text-xs text-slate-500">{doc.document_type || 'Dokument'} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString('de-DE') : '—'}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Steuer-Snapshots</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detailModal.taxSnapshots.length === 0 && <p className="text-sm text-slate-500">Keine Steuerdaten.</p>}
                        {detailModal.taxSnapshots.map((tax) => (
                          <div key={tax.id} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                            <p className="font-medium text-slate-900">{tax.tax_year}</p>
                            <p className="text-xs text-slate-500">
                              Brutto {Number(tax.gross_interest_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} · Netto {Number(tax.net_interest_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Support & Tageswerte</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detailModal.supportTickets.map((ticket) => (
                          <div key={ticket.id} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                            <p className="font-medium text-slate-900">{ticket.subject}</p>
                            <p className="text-xs text-slate-500">{ticket.status} · {ticket.last_message_at ? new Date(ticket.last_message_at).toLocaleString('de-DE') : '—'}</p>
                          </div>
                        ))}
                        {detailModal.dailySnapshots.slice(0, 4).map((snap) => (
                          <div key={snap.id} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                            <p className="font-medium text-slate-900">{snap.snapshot_date}</p>
                            <p className="text-xs text-slate-500">Depot {Number(snap.total_value_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} · Tageszins {Number(snap.daily_yield_eur || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                          </div>
                        ))}
                        {detailModal.supportTickets.length === 0 && detailModal.dailySnapshots.length === 0 && (
                          <p className="text-sm text-slate-500">Keine Einträge vorhanden.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setDetailModal(null)} className="bg-[#0B1E33] hover:bg-[#1E293B] text-white">
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Benutzer ablehnen</h3>
                  <p className="text-sm text-slate-500">{rejectModal.name}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Der Benutzer erhält nach der Ablehnung eine Benachrichtigung per E-Mail.
              </p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ablehnungsgrund <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                  placeholder="z.B. Unvollständige Angaben, außerhalb des Zielmarkts..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRejectModal(null)}
                  className="flex-1"
                  disabled={actionLoading === rejectModal.userId}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal.userId}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  {actionLoading === rejectModal.userId ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Ablehnen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;