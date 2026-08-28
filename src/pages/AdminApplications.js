import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import { toast } from 'sonner';
import {
  FileText, RefreshCw, Eye, Loader2, CheckCircle,
  Clock, Send, Filter, Search, User, Building2,
  Calendar, Mail, Phone, MapPin, Trash2,
} from 'lucide-react';

const statusOptions = [
  { value: 'Neu', label: 'Neu', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { value: 'In Bearbeitung', label: 'In Bearbeitung', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { value: 'Weitergeleitet', label: 'Weitergeleitet', icon: Send, color: 'bg-violet-100 text-violet-700' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
];

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    let query = supabase
      .from('applications')
      .select('id, personal_data, investment_data, status, pdf_url, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Fehler beim Laden der Anträge');
    } else {
      // Listeyi düzenle — personal_data ve investment_data'dan düz alanlar çıkar
      const result = (data || []).map((app) => ({
        id: app.id,
        applicant_name: `${app.personal_data?.first_name || ''} ${app.personal_data?.last_name || ''}`.trim(),
        bank_name: app.investment_data?.bank_name || '–',
        investment_amount: app.investment_data?.investment_amount,
        term_months: app.investment_data?.term_months,
        email: app.personal_data?.email || '–',
        status: app.status,
        has_pdf: !!app.pdf_url,
        pdf_url: app.pdf_url || null,
        created_at: app.created_at,
        // raw data detail modal için
        personal_data: app.personal_data,
        investment_data: app.investment_data,
      }));
      setApplications(result);
      setSelectedIds((prev) => prev.filter((id) => result.some((item) => item.id === id)));
    }
    setLoading(false);
  };

  const fetchApplicationDetail = async (appId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (error) {
      toast.error('Fehler beim Laden des Antrags');
    } else {
      setSelectedApp(data);
      setDetailModalOpen(true);
    }
  };

  const updateStatus = async (appId, newStatus) => {
    setStatusUpdateLoading(true);

    // status_history'ye yeni entry ekle
    const currentHistory = selectedApp?.status_history || [];
    const newEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: statusNote || null,
    };

    const { error } = await supabase
      .from('applications')
      .update({
        status: newStatus,
        status_history: [...currentHistory, newEntry],
      })
      .eq('id', appId);

    if (error) {
      toast.error('Fehler beim Aktualisieren des Status');
    } else {
      toast.success('Status aktualisiert');
      setStatusNote('');
      // Detail'ı ve listeyi yenile
      await fetchApplications();
      await fetchApplicationDetail(appId);
    }
    setStatusUpdateLoading(false);
  };

  const deleteApplication = async (appId) => {
    const proceed = window.confirm('Diesen Antrag wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.');
    if (!proceed) return;

    const { data: deletedRows, error } = await supabase
      .from('applications')
      .delete()
      .eq('id', appId)
      .select('id');

    if (error) {
      toast.error(`Antrag konnte nicht gelöscht werden: ${error.message}`);
      return;
    }

    if (!deletedRows?.length) {
      toast.error('Antrag konnte nicht gelöscht werden (keine Berechtigung oder Datensatz bereits entfernt).');
      return;
    }

    toast.success('Antrag wurde gelöscht.');
    if (selectedApp?.id === appId) {
      setDetailModalOpen(false);
      setSelectedApp(null);
    }
    setSelectedIds((prev) => prev.filter((id) => id !== appId));
    fetchApplications();
  };

  const toggleSelected = (appId) => {
    setSelectedIds((prev) => (
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    ));
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicant_name.toLowerCase().includes(q) ||
      app.bank_name.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q)
    );
  });

  const allVisibleSelected = filteredApplications.length > 0
    && filteredApplications.every((app) => selectedIds.includes(app.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredApplications.map((app) => app.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }
    const visibleIds = filteredApplications.map((app) => app.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const deleteSelectedApplications = async () => {
    if (!selectedIds.length) return;
    const proceed = window.confirm(`${selectedIds.length} ausgewählte Anträge wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`);
    if (!proceed) return;

    const { data: deletedRows, error } = await supabase
      .from('applications')
      .delete()
      .in('id', selectedIds)
      .select('id');

    if (error) {
      toast.error(`Ausgewählte Anträge konnten nicht gelöscht werden: ${error.message}`);
      return;
    }

    const deletedCount = deletedRows?.length || 0;
    if (!deletedCount) {
      toast.error('Keine ausgewählten Anträge wurden gelöscht (fehlende Berechtigung).');
      return;
    }

    if (deletedCount < selectedIds.length) {
      toast.warning(`${deletedCount}/${selectedIds.length} Anträge gelöscht. Einige konnten nicht entfernt werden.`);
    } else {
      toast.success(`${deletedCount} Antrag/Anträge wurden gelöscht.`);
    }
    if (selectedApp?.id && selectedIds.includes(selectedApp.id)) {
      setDetailModalOpen(false);
      setSelectedApp(null);
    }
    setSelectedIds([]);
    fetchApplications();
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatCurrency = (amount) =>
    amount
      ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount)
      : '–';

  const getStatusBadge = (status) => {
    const option = statusOptions.find((o) => o.value === status) || statusOptions[0];
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${option.color}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const stats = {
    total: applications.length,
    neu: applications.filter((app) => app.status === 'Neu').length,
    inProgress: applications.filter((app) => app.status === 'In Bearbeitung').length,
    closed: applications.filter((app) => app.status === 'Abgeschlossen').length,
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Anträge</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Festgeldanträge verwalten</h1>
        <p className="text-sm text-slate-500 mt-1">Übersicht aller eingegangenen Festgeldanträge mit Bulk-Workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <SnapshotMetricCard context="Antragsvolumen" value={`${stats.total}`} period="Gesamt" deltaLabel={`${filteredApplications.length} sichtbar`} deltaPositive />
        <SnapshotMetricCard context="Neu" value={`${stats.neu}`} period="Erstprüfung" deltaLabel={stats.neu > 0 ? 'Action needed' : 'Clean'} deltaPositive={stats.neu === 0} />
        <SnapshotMetricCard context="In Bearbeitung" value={`${stats.inProgress}`} period="Aktive Fälle" deltaLabel={stats.inProgress > 0 ? 'In progress' : 'Leerlauf'} deltaPositive />
        <SnapshotMetricCard context="Abgeschlossen" value={`${stats.closed}`} period="Abgeschlossene Fälle" deltaLabel={`${Math.round((stats.closed / Math.max(1, stats.total)) * 100)}% Abschluss`} deltaPositive />
        <SnapshotMetricCard context="Auswahl" value={`${selectedIds.length}`} period="Bulk Delete Scope" deltaLabel={selectedIds.length ? 'Ausgewählt' : 'Keine Auswahl'} deltaPositive />
      </div>

      {/* Filters */}
      <SectionCard title="Filter & Aktionen" icon={Filter}>
        <div className="rounded-xl p-1">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                  data-testid="search-applications"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={deleteSelectedApplications}
                disabled={loading || !selectedIds.length}
                data-testid="btn-bulk-delete"
              >
                <Trash2 size={16} className="mr-2" />
                Auswahl löschen ({selectedIds.length})
              </Button>
              <Button variant="outline" onClick={fetchApplications} disabled={loading} data-testid="btn-refresh">
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Table */}
      <SectionCard title="Antragsliste" icon={FileText}>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600">Keine Anträge gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="applications-table">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        aria-label="Alle sichtbaren Anträge auswählen"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Anlagebetrag</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Laufzeit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Datum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors" data-testid={`app-row-${app.id}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => toggleSelected(app.id)}
                          aria-label={`Antrag ${app.id} auswählen`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{app.applicant_name || '–'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />{app.email}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">{app.bank_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{formatCurrency(app.investment_amount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{app.term_months ? `${app.term_months} Monate` : '–'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-600 text-sm flex items-center gap-1">
                          <Calendar size={13} />{formatDate(app.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {app.pdf_url && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-blue-600 hover:bg-blue-50"
                              onClick={() => window.open(app.pdf_url, '_blank')}
                              title="PDF öffnen"
                              data-testid={`btn-open-${app.id}`}
                            >
                              PDF
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="sm"
                            className="text-slate-600 hover:bg-slate-100"
                            onClick={() => fetchApplicationDetail(app.id)}
                            data-testid={`btn-view-${app.id}`}
                          >
                            <Eye size={16} className="mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteApplication(app.id)}
                            data-testid={`btn-delete-${app.id}`}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredApplications.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
              {filteredApplications.length} Antrag{filteredApplications.length !== 1 ? 'e' : ''} gefunden
            </div>
          )}
        </div>
      </SectionCard>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Antragsdetails
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Aktueller Status</p>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Antragsnummer</p>
                  <p className="font-mono font-bold">{selectedApp.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Personal Data */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User size={18} />Persönliche Daten
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Name</p>
                    <p className="font-medium">
                      {selectedApp.personal_data?.first_name} {selectedApp.personal_data?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Geburtsdatum</p>
                    <p className="font-medium">{selectedApp.personal_data?.birth_date || '–'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">E-Mail</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail size={14} />{selectedApp.personal_data?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Telefon</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone size={14} />{selectedApp.personal_data?.phone || '–'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Adresse</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin size={14} />{selectedApp.personal_data?.address || '–'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Data */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 size={18} />Anlagedetails
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Bank</p>
                    <p className="font-medium">{selectedApp.investment_data?.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Anlagebetrag</p>
                    <p className="font-medium">{formatCurrency(selectedApp.investment_data?.investment_amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Laufzeit</p>
                    <p className="font-medium">{selectedApp.investment_data?.term_months} Monate</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Zinssatz</p>
                    <p className="font-medium text-teal-600">{selectedApp.investment_data?.interest_rate}% p.a.</p>
                  </div>
                </div>
              </div>

              {/* PDF */}
              {selectedApp.pdf_url && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Festgeldvertrag (PDF)</p>
                      <p className="text-xs text-emerald-600">Automatisch generiertes Vertragsdokument</p>
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    onClick={() => window.open(selectedApp.pdf_url, '_blank')}
                  >
                    Öffnen
                  </Button>
                </div>
              )
              }

              {selectedApp.documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Hochgeladene Dokumente ({selectedApp.documents.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {doc.type?.replace(/_/g, ' ')} · {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('de-DE') : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 shrink-0 ml-3"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          Öffnen
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedApp.status_history?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock size={18} />Status-Verlauf
                  </h3>
                  <div className="space-y-2">
                    {selectedApp.status_history.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">{entry.status}</p>
                          <p className="text-slate-500 text-xs">{formatDate(entry.timestamp)}</p>
                          {entry.note && <p className="text-slate-600 text-xs mt-0.5">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Status aktualisieren</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedApp.status === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateStatus(selectedApp.id, option.value)}
                        disabled={statusUpdateLoading || selectedApp.status === option.value}
                        className="rounded-full"
                      >
                        <option.icon size={14} className="mr-1" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="status-note">Notiz (optional)</Label>
                    <Textarea
                      id="status-note"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Hinweis zur Statusänderung..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminApplications;