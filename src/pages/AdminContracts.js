import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MetricCard from '@/components/admin/MetricCard';
import StatusBadge from '@/components/admin/StatusBadge';
import TableFilterBar from '@/components/admin/TableFilterBar';
import FormModal from '@/components/admin/FormModal';
import { toast } from 'sonner';

const PRODUCT_OPTIONS = ['Festgeld', 'Tagesgeld', 'Flexgeld'];
const DOCUMENT_BUCKET = 'portfolio-documents';
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;
const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp';
const PAYOUT_OPTIONS = [
  { value: 'endfaellig', label: 'Endfällig' },
  { value: 'taeglich', label: 'Täglich' },
  { value: 'monatlich', label: 'Monatlich' },
];
const FEE_MODEL_OPTIONS = [
  { value: 'none', label: 'Keine Gebühr' },
  { value: 'percent_of_interest', label: 'Prozent auf Zinsertrag' },
  { value: 'percent_of_assets', label: 'Prozent auf Anlagebetrag (p.a.)' },
  { value: 'fixed_annual', label: 'Fix pro Jahr (EUR)' },
];

const PRODUCT_RULES = {
  Festgeld: { term_months: 12, lock_months: 12, payout_frequency: 'endfaellig' },
  Tagesgeld: { lock_months: 0, payout_frequency: 'taeglich' },
  Flexgeld: { lock_months: 3, payout_frequency: 'monatlich' },
};

/** Festgeld: feste 12 Monate. Tagesgeld/Flexgeld: Laufzeit (Monate) frei — Zinslogik bleibt täglich bzw. Sperrfrist über lock_months. */
const applyProductRules = (productType, values = {}) => {
  const rules = PRODUCT_RULES[productType] || PRODUCT_RULES.Festgeld;
  const next = {
    ...values,
    product_type: productType,
    lock_months: String(rules.lock_months),
    payout_frequency: rules.payout_frequency,
  };
  if (productType === 'Festgeld') {
    next.term_months = String(rules.term_months ?? 12);
  } else {
    const raw = values.term_months;
    next.term_months = raw === undefined || raw === null ? '' : String(raw);
  }
  return next;
};

const addMonthsISO = (isoDate, months) => {
  if (!isoDate) return '';
  if (Number(months || 0) <= 0) return '';
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';
  const next = new Date(base);
  next.setMonth(next.getMonth() + Number(months || 0));
  return next.toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  user_id: '',
  user_name: '',
  user_email: '',
  bank_id: '',
  bank_name: '',
  contract_number: '',
  product_type: 'Festgeld',
  amount_eur: '',
  interest_rate: '',
  term_months: '12',
  lock_months: '12',
  payout_frequency: 'endfaellig',
  withholding_tax_rate_pct: '0',
  fee_model: 'none',
  fee_rate_pct: '0',
  fee_fixed_annual_eur: '0',
  church_tax_enabled: false,
  church_tax_rate_pct: '8',
  active_from: '',
  active_until: '',
  status: 'aktiv',
  note: '',
  is_active: true,
  document_type: 'Vertragsdokument',
  document_title: '',
};

const sanitizeFileName = (name) =>
  String(name || 'dokument')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const AdminContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [documentFile, setDocumentFile] = useState(null);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_contracts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(`Verträge konnten nicht geladen werden: ${error.message}`);
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
    fetchBanks();
    fetchUsers();
  }, []);

  useEffect(() => {
    const computedEnd = form.active_from ? addMonthsISO(form.active_from, form.term_months) : '';
    setForm((previous) => {
      if (previous.active_until === computedEnd) return previous;
      return { ...previous, active_until: computedEnd };
    });
  }, [form.active_from, form.term_months]);

  useEffect(() => {
    if (!showModal || !form.user_id) return undefined;
    let isCancelled = false;

    const loadTaxProfile = async () => {
      const { data, error } = await supabase
        .from('portfolio_tax_profiles')
        .select('church_tax_enabled, church_tax_rate_pct')
        .eq('user_id', form.user_id)
        .maybeSingle();

      if (isCancelled || error) return;

      setForm((previous) => ({
        ...previous,
        church_tax_enabled: Boolean(data?.church_tax_enabled),
        church_tax_rate_pct: String(data?.church_tax_rate_pct ?? previous.church_tax_rate_pct ?? '8'),
      }));
    };

    loadTaxProfile();
    return () => {
      isCancelled = true;
    };
  }, [showModal, form.user_id]);

  const fetchBanks = async () => {
    const { data, error } = await supabase
      .from('banks')
      .select('id, name, country, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) {
      toast.error(`Bankliste konnte nicht geladen werden: ${error.message}`);
      return;
    }
    setBanks(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, status, role')
      .eq('role', 'user')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Benutzerliste konnte nicht geladen werden: ${error.message}`);
      return;
    }

    setUsers(data || []);
  };

  const filteredContracts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((contract) => (
      `${contract.user_name || ''} ${contract.user_email || ''} ${contract.contract_number || ''} ${contract.bank_name || ''}`.toLowerCase().includes(q)
    ));
  }, [contracts, search]);

  const stats = useMemo(() => {
    const totalAmount = contracts.reduce((sum, contract) => sum + Number(contract.amount_eur || 0), 0);
    const activeCount = contracts.filter((contract) => contract.status === 'aktiv').length;
    return {
      totalAmount,
      activeCount,
      totalCount: contracts.length,
    };
  }, [contracts]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(applyProductRules('Festgeld', EMPTY_FORM));
    setShowModal(true);
  };

  const openEditModal = (row) => {
    setEditing(row);
    const base = {
      user_id: row.user_id || '',
      user_name: row.user_name || '',
      user_email: row.user_email || '',
      bank_id: row.bank_id || '',
      bank_name: row.bank_name || '',
      contract_number: row.contract_number || '',
      product_type: row.product_type || 'Festgeld',
      amount_eur: String(row.amount_eur || ''),
      interest_rate: String(row.interest_rate || ''),
      term_months: String(row.term_months || 0),
      lock_months: String(row.lock_months || 0),
      payout_frequency: row.payout_frequency || 'endfaellig',
      withholding_tax_rate_pct: String(row.withholding_tax_rate_pct || 0),
      fee_model: row.fee_model || 'none',
      fee_rate_pct: String(row.fee_rate_pct || 0),
      fee_fixed_annual_eur: String(row.fee_fixed_annual_eur || 0),
      church_tax_enabled: false,
      church_tax_rate_pct: '8',
      active_from: row.active_from || '',
      active_until: row.active_until || '',
      status: row.status || 'aktiv',
      note: row.note || '',
      is_active: row.is_active ?? true,
      document_type: 'Vertragsdokument',
      document_title: '',
    };
    setForm(applyProductRules(base.product_type, base));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setDocumentFile(null);
  };

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleProductSelect = (productType) => {
    setForm((previous) => applyProductRules(productType, previous));
  };

  const handleUserSelect = (event) => {
    const selectedId = event.target.value;
    const selected = users.find((user) => user.id === selectedId);
    const fullName = `${selected?.first_name || ''} ${selected?.last_name || ''}`.trim();
    setForm((previous) => ({
      ...previous,
      user_id: selectedId,
      user_name: fullName || selected?.email || '',
      user_email: selected?.email || '',
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    const selectedUser = users.find((user) => user.id === form.user_id);
    if (!selectedUser) {
      toast.error('Bitte wählen Sie einen gültigen Benutzer aus.');
      setSaving(false);
      return;
    }
    const selectedUserName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email || '';
    const selectedUserEmail = selectedUser.email || '';
    const normalized = applyProductRules(form.product_type, form);
    const payload = {
      user_id: selectedUser.id,
      user_name: selectedUserName,
      user_email: selectedUserEmail,
      bank_id: normalized.bank_id || null,
      bank_name: (
        banks.find((bank) => bank.id === normalized.bank_id)?.name || normalized.bank_name || ''
      ).trim(),
      contract_number: normalized.contract_number.trim(),
      product_type: normalized.product_type,
      amount_eur: Number(normalized.amount_eur || 0),
      interest_rate: Number(normalized.interest_rate || 0),
      term_months: Number(normalized.term_months || 0),
      lock_months: Number(normalized.lock_months || 0),
      payout_frequency: normalized.payout_frequency,
      withholding_tax_rate_pct: Number(normalized.withholding_tax_rate_pct || 0),
      fee_model: normalized.fee_model || 'none',
      fee_rate_pct: Number(normalized.fee_rate_pct || 0),
      fee_fixed_annual_eur: Number(normalized.fee_fixed_annual_eur || 0),
      active_from: normalized.active_from || null,
      active_until: normalized.active_until || null,
      status: normalized.is_active ? 'aktiv' : 'inaktiv',
      note: normalized.note?.trim() || null,
      is_active: normalized.is_active,
    };

    let error;
    let persistedContractId = editing?.id || null;
    if (editing?.id) {
      ({ error } = await supabase.from('portfolio_contracts').update(payload).eq('id', editing.id));
    } else {
      const { data, error: insertError } = await supabase
        .from('portfolio_contracts')
        .insert(payload)
        .select('id')
        .single();
      error = insertError;
      persistedContractId = data?.id || null;
    }

    if (error) {
      toast.error(`Vertrag konnte nicht gespeichert werden: ${error.message}`);
    } else {
      if (documentFile) {
        try {
          if (documentFile.size > MAX_DOCUMENT_SIZE) {
            throw new Error('Datei ist zu groß. Maximal 15 MB erlaubt.');
          }
          const extension = documentFile.name?.split('.').pop()?.toLowerCase() || 'pdf';
          const baseName = sanitizeFileName(documentFile.name?.replace(/\.[^.]+$/, '') || 'vertragsdokument');
          const filePath = `${selectedUser.id}/${persistedContractId || 'unassigned'}/${Date.now()}-${baseName}.${extension}`;

          const { error: uploadError } = await supabase
            .storage
            .from(DOCUMENT_BUCKET)
            .upload(filePath, documentFile, { upsert: false, cacheControl: '3600' });
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(filePath);
          const fileUrl = publicData?.publicUrl;
          if (!fileUrl) throw new Error('Dokument-URL konnte nicht erzeugt werden.');

          const { error: documentInsertError } = await supabase
            .from('portfolio_documents')
            .insert({
              user_id: selectedUser.id,
              contract_id: persistedContractId,
              document_type: (form.document_type || 'Vertragsdokument').trim(),
              title: (form.document_title || documentFile.name || 'Vertragsdokument').trim(),
              file_url: fileUrl,
              mime_type: documentFile.type || null,
              file_size_bytes: Number(documentFile.size || 0),
            });
          if (documentInsertError) throw documentInsertError;
        } catch (documentError) {
          toast.error(`Vertragsdokument konnte nicht gespeichert werden: ${documentError.message}`);
        }
      }
      try {
        const { data: existingTaxProfile, error: taxProfileLoadError } = await supabase
          .from('portfolio_tax_profiles')
          .select('freistellungsauftrag_limit_eur, freistellungsauftrag_used_eur, tax_residency_country, steuer_id')
          .eq('user_id', selectedUser.id)
          .maybeSingle();
        if (taxProfileLoadError) throw taxProfileLoadError;

        const { error: taxProfileUpsertError } = await supabase
          .from('portfolio_tax_profiles')
          .upsert({
            user_id: selectedUser.id,
            church_tax_enabled: Boolean(form.church_tax_enabled),
            church_tax_rate_pct: Number(form.church_tax_rate_pct || 0),
            freistellungsauftrag_limit_eur: Number(existingTaxProfile?.freistellungsauftrag_limit_eur || 0),
            freistellungsauftrag_used_eur: Number(existingTaxProfile?.freistellungsauftrag_used_eur || 0),
            tax_residency_country: existingTaxProfile?.tax_residency_country || 'DE',
            steuer_id: existingTaxProfile?.steuer_id || null,
          });
        if (taxProfileUpsertError) throw taxProfileUpsertError;
      } catch (taxProfileError) {
        toast.error(`Steuerprofil konnte nicht aktualisiert werden: ${taxProfileError.message}`);
      }
      await supabase.rpc('refresh_user_daily_snapshot', {
        p_user_id: selectedUser.id,
      });
      await supabase.rpc('refresh_user_tax_snapshot', {
        p_user_id: selectedUser.id,
        p_tax_year: new Date().getFullYear(),
      });
      toast.success(editing ? 'Vertrag aktualisiert.' : 'Vertrag erstellt.');
      closeModal();
      fetchContracts();
    }
    setSaving(false);
  };

  const removeContract = async (contractId) => {
    const proceed = window.confirm('Diesen Vertrag wirklich löschen?');
    if (!proceed) return;

    const row = contracts.find((contract) => contract.id === contractId);
    const { error } = await supabase.from('portfolio_contracts').delete().eq('id', contractId);
    if (error) {
      toast.error(`Löschen fehlgeschlagen: ${error.message}`);
    } else {
      if (row?.user_id) {
        await supabase.rpc('refresh_user_daily_snapshot', {
          p_user_id: row.user_id,
        });
        await supabase.rpc('refresh_user_tax_snapshot', {
          p_user_id: row.user_id,
          p_tax_year: new Date().getFullYear(),
        });
      }
      toast.success('Vertrag gelöscht.');
      fetchContracts();
    }
  };

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Depot</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Depotverträge</h1>
            <p className="text-sm text-slate-500 mt-1">Festgeld, Tagesgeld und Flexgeld-Verträge verwalten.</p>
          </div>
          <Button onClick={openCreateModal} className="bg-[#0B1E33] hover:bg-[#1E293B] text-white gap-2 shrink-0">
            <Plus size={15} />
            Neuer Vertrag
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <MetricCard label="Gesamt Verträge" value={stats.totalCount} hint="inkl. aktive und inaktive" />
          <MetricCard label="Aktive Verträge" value={stats.activeCount} hint="Status aktiv" />
          <MetricCard
            label="Gesamtes Volumen"
            value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.totalAmount)}
            hint="Angelegtes Kapital"
          />
        </div>

        <TableFilterBar
          query={search}
          setQuery={setSearch}
          queryPlaceholder="Vertragsnr., Name, E-Mail..."
          onRefresh={fetchContracts}
          refreshing={loading}
          rightSlot={null}
        />

        <div className="bg-white border border-slate-200 rounded-xl mt-4 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Benutzer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Bank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Vertragsnr.</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Produkt</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Betrag</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Zins</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Laufzeit</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Aktiv ab</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Aktiv bis</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-sm text-slate-900">{row.user_name || '—'}</p>
                    <p className="text-xs text-slate-500">{row.user_email || '—'}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.bank_name || '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.contract_number || '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.product_type || '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(row.amount_eur || 0))}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">{Number(row.interest_rate || 0).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.term_months || 0} M</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.active_from || '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{row.active_until || '—'}</td>
                  <td className="py-3 px-4"><StatusBadge value={row.status} label={row.status || '—'} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(row)}
                        className="w-8 h-8 rounded-lg text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeContract(row.id)}
                        className="w-8 h-8 rounded-lg text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredContracts.length && (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400 text-sm">
                    Keine Verträge gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {showModal && (
        <FormModal
          title={editing ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}
          subtitle="Produkt auswählen und Vertragsdaten pflegen."
          onClose={closeModal}
        >
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Benutzer *</label>
              <select
                value={form.user_id}
                onChange={handleUserSelect}
                required
                className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Benutzer auswählen...</option>
                {users.map((user) => {
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  const label = fullName ? `${fullName} (${user.email})` : user.email;
                  return (
                    <option key={user.id} value={user.id}>{label}</option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PRODUCT_OPTIONS.map((product) => (
                <button
                  key={product}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className={`h-10 rounded-md border text-sm font-medium transition-colors ${form.product_type === product
                    ? 'bg-[#0B1E33] text-white border-[#0B1E33]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {product}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
                <select
                  value={form.bank_id}
                  onChange={(event) => {
                    const selectedId = event.target.value;
                    const selected = banks.find((bank) => bank.id === selectedId);
                    setForm((previous) => ({
                      ...previous,
                      bank_id: selectedId,
                      bank_name: selected?.name || '',
                    }));
                  }}
                  className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">— Keine Bank —</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>{bank.name} ({bank.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vertragsnummer</label>
                <Input value={form.contract_number} onChange={updateField('contract_number')} required placeholder="z.B. FR-2026-0001" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-800">Steuer- & Gebühren-Automatik</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quellensteuer (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.withholding_tax_rate_pct}
                    onChange={updateField('withholding_tax_rate_pct')}
                    placeholder="z.B. 10.00"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Wird automatisch auf den kontraktbezogenen Zinsertrag angewendet.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gebührenmodell</label>
                  <select
                    value={form.fee_model}
                    onChange={updateField('fee_model')}
                    className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {FEE_MODEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gebührensatz (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.fee_rate_pct}
                    onChange={updateField('fee_rate_pct')}
                    placeholder="z.B. 0.40"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Für Modelle „Prozent auf Zinsertrag“ oder „Prozent auf Anlagebetrag (p.a.)“.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixe Jahresgebühr (EUR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.fee_fixed_annual_eur}
                    onChange={updateField('fee_fixed_annual_eur')}
                    placeholder="z.B. 12.00"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Wird anteilig nach aktiven Tagen im Jahr berechnet.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.church_tax_enabled)}
                    onChange={(event) => setForm((previous) => ({
                      ...previous,
                      church_tax_enabled: event.target.checked,
                    }))}
                  />
                  Kirchensteuer aktiv
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kirchensteuer (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.church_tax_rate_pct}
                    onChange={updateField('church_tax_rate_pct')}
                    disabled={!form.church_tax_enabled}
                    className={!form.church_tax_enabled ? 'bg-slate-50' : ''}
                    placeholder="z.B. 8.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Betrag (EUR) *</label>
                <Input type="number" value={form.amount_eur} onChange={updateField('amount_eur')} required placeholder="z.B. 10000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zins-Auszahlung</label>
                <select
                  value={form.payout_frequency}
                  onChange={updateField('payout_frequency')}
                  className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {PAYOUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zinssatz (%) *</label>
                <Input type="number" step="0.01" value={form.interest_rate} onChange={updateField('interest_rate')} required placeholder="z.B. 3.45" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Laufzeit (Monate) *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.term_months}
                  onChange={updateField('term_months')}
                  disabled={form.product_type === 'Festgeld'}
                  className={form.product_type === 'Festgeld' ? 'bg-slate-50' : ''}
                  placeholder={form.product_type === 'Tagesgeld' ? 'z.B. 12 (0 = unbefristet)' : form.product_type === 'Flexgeld' ? 'z.B. 12' : undefined}
                />
                {form.product_type === 'Tagesgeld' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Tagesgeld ist täglich — hier tragen Sie die vertragliche Laufzeit in Monaten ein (0 = unbefristet, kein Enddatum).
                  </p>
                )}
                {form.product_type === 'Flexgeld' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Gesamtlaufzeit in Monaten; die ersten {form.lock_months} Monate bleiben gesperrt (Produktregel).
                  </p>
                )}
              </div>
            </div>

            {form.product_type === 'Flexgeld' && (
              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Flexgeld-Regel: Erste {form.lock_months} Monate ist keine Auszahlung möglich, danach flexibel bis Laufzeitende.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aktiv ab</label>
                <Input type="date" value={form.active_from} onChange={updateField('active_from')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aktiv bis</label>
                <Input
                  type="date"
                  value={form.active_until}
                  readOnly
                  className="bg-slate-50"
                  placeholder={Number(form.term_months || 0) <= 0 ? 'Unbefristet' : undefined}
                />
                {form.product_type === 'Tagesgeld' && Number(form.term_months || 0) <= 0 && (
                  <p className="text-xs text-slate-500 mt-1">Ohne Laufzeit (0 Monate): unbefristet — kein automatisches Enddatum.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notizen (intern)</label>
              <textarea
                value={form.note}
                onChange={updateField('note')}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                placeholder="Optionaler Vermerk"
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-800">Vertragsdokument (optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dokumenttyp</label>
                  <Input
                    value={form.document_type}
                    onChange={updateField('document_type')}
                    placeholder="z.B. Vertragsdokument"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel</label>
                  <Input
                    value={form.document_title}
                    onChange={updateField('document_title')}
                    placeholder="z.B. Festgeld Vertrag 2026"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datei</label>
                <Input
                  type="file"
                  accept={DOCUMENT_ACCEPT}
                  onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Erlaubt: PDF, DOC, DOCX, PNG, JPG, WEBP (max. 15 MB).
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
              />
              Vertrag ist aktiv
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>Abbrechen</Button>
              <Button disabled={saving} type="submit" className="bg-[#0B1E33] hover:bg-[#1E293B] text-white">
                {saving ? 'Wird gespeichert...' : editing ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default AdminContracts;
