import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import BankLogo from '@/components/BankLogo';
import ProfileAvatar from '@/components/ProfileAvatar';
import DepositProtectionBadge from '@/components/DepositProtectionBadge';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Shield,
  Calendar,
  Building2,
  WalletCards,
  Landmark,
  UserRound,
  LogOut,
  PieChart,
  TrendingUp,
  Clock3,
  AlertTriangle,
  Layers3,
  MessageSquareMore,
  FileText,
  X,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { logActivityEvent } from '@/lib/activityFeed';
import {
  computeContractSnapshot,
  formatCompactCurrency,
  formatCurrency,
} from '@/lib/portfolioMath';
import UserSupportSection from '@/components/dashboard/UserSupportSection';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import UserAreaShell from '@/components/dashboard/UserAreaShell';
import NewsVideoSection from '@/components/dashboard/NewsVideoSection';
import ToolsHubSection from '@/components/dashboard/ToolsHubSection';
import InlineToolsWidgets from '@/components/dashboard/InlineToolsWidgets';
import {
  computeCashflowCalendar,
  computeContributionBreakdown,
  computeBenchmarkComparison,
  computeMaturityLadder,
  computeNetYieldMetrics,
  computeTaxTotalsFromSnapshot,
  computeRiskLimitAlerts,
} from '@/lib/depotAnalytics';
import { loadEurRates, offerInEur } from '@/lib/currency';
import { saveProfileAvatarUrl, uploadProfileAvatar } from '@/lib/profileAvatar';
import { downloadDocumentViaProxy } from '@/lib/documentDownload';

const PIE_COLORS = ['#0B1E33', '#0EA5E9', '#8B5CF6'];
const DEPOSIT_PROTECTION_LIMIT = 1000000;
const PRODUCT_ROUTE_MAP = {
  Festgeld: '/dashboard/festgeld',
  Tagesgeld: '/dashboard/tagesgeld',
  Flexgeld: '/dashboard/flexgeld',
};
const normalizeProductType = (value) => {
  const normalized = String(value || '').trim();
  if (normalized === 'Flexgeld+') return 'Flexgeld';
  return normalized;
};

const UserDashboard = () => {
  const {
    user,
    logout,
    updateTwoFactorSettings,
    fetchTrustedDevices,
    revokeTrustedDevice,
    refreshUser,
  } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [taxSnapshots, setTaxSnapshots] = useState([]);
  const [dailySnapshots, setDailySnapshots] = useState([]);
  const [benchmarkPoints, setBenchmarkPoints] = useState([]);
  const [activeSection, setActiveSection] = useState('depot');
  const [activeTool, setActiveTool] = useState('vergleich');
  const [now, setNow] = useState(new Date());
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loadingTrustedDevices, setLoadingTrustedDevices] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [bankSelectorState, setBankSelectorState] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
  const [deleteFlowOpen, setDeleteFlowOpen] = useState(false);
  const [deleteFlowStep, setDeleteFlowStep] = useState(1);
  const [deleteChecks, setDeleteChecks] = useState([]);
  const [deleteChecksLoading, setDeleteChecksLoading] = useState(false);
  const [deleteFlowSaving, setDeleteFlowSaving] = useState(false);
  const [deleteFlowError, setDeleteFlowError] = useState('');
  const [deleteCompletedAt, setDeleteCompletedAt] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchContracts();
      fetchCashflows();
      fetchDocuments();
      fetchTaxSnapshots();
      fetchDailySnapshots();
      fetchBenchmarkPoints();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const focus = params.get('focus');
    const validSections = new Set(['depot', 'tools', 'favorites', 'support', 'profile']);

    if (section && validSections.has(section)) {
      setActiveSection(section);
    }

    if (!focus) return;

    const scrollToFocus = () => {
      const target = document.getElementById(`dashboard-${focus}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const timeoutId = window.setTimeout(scrollToFocus, 120);
    return () => window.clearTimeout(timeoutId);
  }, [location.search]);

  useEffect(() => {
    if (activeSection !== 'profile' || !user?.id) return;
    const loadTrustedDevices = async () => {
      setLoadingTrustedDevices(true);
      try {
        const rows = await fetchTrustedDevices();
        setTrustedDevices(rows);
      } catch (error) {
        toast.error(error.message || 'Geräte konnten nicht geladen werden');
      } finally {
        setLoadingTrustedDevices(false);
      }
    };
    loadTrustedDevices();
  }, [activeSection, user?.id, fetchTrustedDevices]);

  const fetchFavorites = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();
      if (error) throw error;

      const favoriteIds = profile?.favorites || [];
      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      const { data: offers, error: offersError } = await supabase
        .from('savings_offers')
        .select('*, banks(id, name, country, logo_url, website_url, deposit_protection, deposit_protection_amount)')
        .in('id', favoriteIds);
      if (offersError) throw offersError;
      await loadEurRates();
      setFavorites((offers || []).map((o) => offerInEur({
        ...o,
        bank_name: o.banks?.name || '',
        country: o.banks?.country || '',
        bank_logo: o.banks?.logo_url || null,
        website_url: o.banks?.website_url || null,
        deposit_protection: o.banks?.deposit_protection || '',
        deposit_protection_amount: o.banks?.deposit_protection_amount || '',
      })));
    } catch {
      toast.error('Fehler beim Laden der Favoriten');
    }
  };

  const fetchContracts = async () => {
    try {
      const contractQuery = supabase
        .from('portfolio_contracts')
        .select('*, banks(id, name, logo_url)')
        .order('created_at', { ascending: false });

      const { data, error } = await (user?.email
        ? contractQuery.or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
        : contractQuery.eq('user_id', user.id));
      if (error) throw error;
      setContracts((data || []).map((row) => ({
        ...row,
        bank_name: row.bank_name || row.banks?.name || '—',
        bank_logo: row.banks?.logo_url || null,
      })));
    } catch {
      toast.error('Fehler beim Laden der Depotverträge');
    }
  };

  const fetchCashflows = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_cashflows')
        .select('*')
        .eq('user_id', user.id)
        .order('flow_date', { ascending: false })
        .limit(400);
      if (error) throw error;
      setCashflows(data || []);
    } catch {
      setCashflows([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setDocuments(data || []);
    } catch {
      setDocuments([]);
    }
  };

  const fetchTaxSnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_tax_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('tax_year', { ascending: false })
        .limit(5);
      if (error) throw error;
      setTaxSnapshots(data || []);
    } catch {
      setTaxSnapshots([]);
    }
  };

  const fetchDailySnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_daily_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(120);
      if (error) throw error;
      setDailySnapshots(data || []);
    } catch {
      setDailySnapshots([]);
    }
  };

  const fetchBenchmarkPoints = async () => {
    try {
      const { data: benchmarkRows, error: benchmarkError } = await supabase
        .from('portfolio_benchmarks')
        .select('id, code')
        .eq('code', 'ESTR_ECB')
        .limit(1);
      if (benchmarkError) throw benchmarkError;
      const benchmarkId = benchmarkRows?.[0]?.id;
      if (!benchmarkId) {
        setBenchmarkPoints([]);
        return;
      }
      const { data, error } = await supabase
        .from('portfolio_benchmark_points')
        .select('point_date, value')
        .eq('benchmark_id', benchmarkId)
        .order('point_date', { ascending: true })
        .limit(180);
      if (error) throw error;
      setBenchmarkPoints(data || []);
    } catch {
      setBenchmarkPoints([]);
    }
  };

  const removeFavorite = async (offerId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      const newFavorites = (profile?.favorites || []).filter((id) => id !== offerId);
      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', user.id);
      if (error) throw error;

      setFavorites((prev) => prev.filter((o) => o.id !== offerId));
      toast.success('Aus Favoriten entfernt');
      const offer = favorites.find((item) => item.id === offerId);
      await logActivityEvent({
        event_type: 'favorite_removed',
        summary: 'Favorit entfernt',
        payload: {
          actor_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
          actor_email: user.email || null,
          offer_id: offerId,
          bank_name: offer?.bank_name || null,
          interest_rate: offer?.interest_rate || null,
        },
        user_id: user.id,
      });
    } catch {
      toast.error('Fehler beim Entfernen aus Favoriten');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleTwoFactorToggle = async (enabled) => {
    setTwoFactorSaving(true);
    try {
      await updateTwoFactorSettings(enabled);
      toast.success(enabled ? '2FA wurde aktiviert.' : '2FA wurde deaktiviert.');
      if (!enabled) {
        const rows = await fetchTrustedDevices();
        setTrustedDevices(rows);
      }
    } catch (error) {
      toast.error(error.message || '2FA konnte nicht aktualisiert werden.');
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    try {
      await revokeTrustedDevice(deviceId);
      setTrustedDevices((prev) => prev.map((item) => (item.id === deviceId
        ? { ...item, revoked_at: new Date().toISOString() }
        : item)));
      toast.success('Gerät wurde abgemeldet.');
    } catch (error) {
      toast.error(error.message || 'Gerät konnte nicht abgemeldet werden.');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarSaving(true);
    try {
      const avatarUrl = await uploadProfileAvatar({ file, userId: user.id });
      await saveProfileAvatarUrl({ userId: user.id, avatarUrl });
      await refreshUser();
      toast.success('Profilfoto aktualisiert.');
    } catch (error) {
      toast.error(error.message || 'Profilfoto konnte nicht hochgeladen werden.');
    } finally {
      setAvatarSaving(false);
      event.target.value = '';
    }
  };

  const handleDocumentDownload = async (documentRow) => {
    try {
      await downloadDocumentViaProxy(documentRow);
    } catch (error) {
      toast.error(error.message || 'Dokument konnte nicht heruntergeladen werden.');
    }
  };

  const buildDeleteChecksClientSide = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [contractsResult, snapshotResult, cashflowsResult] = await Promise.all([
      supabase
        .from('portfolio_contracts')
        .select('status, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('portfolio_daily_snapshots')
        .select('available_eur')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('portfolio_cashflows')
        .select('id, flow_date')
        .eq('user_id', user.id)
        .gte('flow_date', today),
    ]);

    const endedStatuses = new Set(['rejected', 'beendet', 'gekündigt', 'closed']);
    const activeContracts = contractsResult.error
      ? null
      : (contractsResult.data || []).filter((row) => !endedStatuses.has(String(row.status || '').toLowerCase())).length;
    const availableBalance = snapshotResult.error ? null : Number(snapshotResult.data?.available_eur || 0);
    const pendingTransactions = cashflowsResult.error ? null : (cashflowsResult.data || []).length;
    const activeSavingsPlans = 0;

    const checks = [
      {
        key: 'active_contracts',
        title: 'Keine offenen Anlagen',
        description: contractsResult.error
          ? `Prüfung fehlgeschlagen: ${contractsResult.error.message}`
          : activeContracts > 0
            ? `${activeContracts} aktive Anlage(n) vorhanden.`
            : 'Sie haben keine aktiven Anlagen oder alle Anlagen wurden beendet.',
        passed: !contractsResult.error && activeContracts === 0,
      },
      {
        key: 'available_balance',
        title: 'Kein vorhandenes Guthaben',
        description: snapshotResult.error
          ? `Prüfung fehlgeschlagen: ${snapshotResult.error.message}`
          : availableBalance > 0
            ? `Ihr verfügbares Guthaben beträgt ${availableBalance.toFixed(2)} €.`
            : 'Ihr Guthaben beträgt 0,00 €.',
        passed: !snapshotResult.error && availableBalance <= 0.009,
      },
      {
        key: 'pending_transactions',
        title: 'Keine ausstehenden Transaktionen',
        description: cashflowsResult.error
          ? `Prüfung fehlgeschlagen: ${cashflowsResult.error.message}`
          : pendingTransactions > 0
            ? `${pendingTransactions} ausstehende Transaktion(en) gefunden.`
            : 'Es sind keine Transaktionen in Bearbeitung.',
        passed: !cashflowsResult.error && pendingTransactions === 0,
      },
      {
        key: 'active_savings_plans',
        title: 'Keine laufenden Sparpläne',
        description: activeSavingsPlans > 0
          ? `${activeSavingsPlans} laufende Sparpläne vorhanden.`
          : 'Sie haben keine aktiven Sparpläne.',
        passed: activeSavingsPlans === 0,
      },
    ];
    return {
      checks,
      canDelete: checks.every((row) => row.passed),
    };
  };

  const callAccountDeleteApi = async ({ method = 'GET', password } = {}) => {
    const { data: sessionResult } = await supabase.auth.getSession();
    const token = sessionResult?.session?.access_token;
    if (!token) throw new Error('Sitzung ist abgelaufen. Bitte erneut anmelden.');

    let response;
    try {
      response = await fetch('/api/account-delete', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: method === 'POST' ? JSON.stringify({ password }) : undefined,
      });
    } catch (networkError) {
      throw new Error(`Netzwerkfehler bei Konto-Löschung: ${networkError?.message || 'Unbekannter Fehler'}`);
    }

    const raw = await response.text();
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = { raw };
    }
    if (!response.ok) {
      const rawMessage = typeof payload?.raw === 'string'
        ? payload.raw.replace(/\s+/g, ' ').trim().slice(0, 180)
        : '';
      const message = payload?.error || rawMessage || `Konto-Löschung fehlgeschlagen (HTTP ${response.status}).`;
      const error = new Error(message);
      error.payload = payload;
      error.httpStatus = response.status;
      throw error;
    }
    return payload;
  };

  const loadDeleteChecks = async () => {
    setDeleteChecksLoading(true);
    setDeleteFlowError('');
    try {
      const payload = await callAccountDeleteApi({ method: 'GET' });
      setDeleteChecks(payload?.checks || []);
      return payload;
    } catch (error) {
      try {
        const fallbackPayload = await buildDeleteChecksClientSide();
        if ((fallbackPayload?.checks || []).length > 0) {
          setDeleteChecks(fallbackPayload.checks);
          setDeleteFlowError('Server-Prüfung ist aktuell nicht erreichbar. Gründe wurden lokal geladen.');
          return fallbackPayload;
        }
      } catch {
        // ignore secondary fallback error
      }
      setDeleteChecks([]);
      setDeleteFlowError(error.message || 'Prüfung konnte nicht geladen werden.');
      return null;
    } finally {
      setDeleteChecksLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteFlowError('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletePasswordVisible(false);
  };

  const startDeleteFlow = async () => {
    if (!deletePassword.trim()) {
      setDeleteFlowError('Bitte geben Sie Ihr Passwort ein.');
      return;
    }
    setDeleteFlowStep(1);
    setDeleteFlowOpen(true);
    closeDeleteModal();
    await loadDeleteChecks();
  };

  const resetDeleteFlow = () => {
    setDeleteFlowOpen(false);
    setDeleteFlowStep(1);
    setDeleteChecks([]);
    setDeleteFlowError('');
    setDeleteFlowSaving(false);
    setDeleteCompletedAt(null);
  };

  const canContinueDeleteStep1 = deleteChecks.length > 0 && deleteChecks.every((item) => item.passed);

  const confirmSoftDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteFlowError('Bitte geben Sie Ihr Passwort ein.');
      return;
    }
    setDeleteFlowSaving(true);
    setDeleteFlowError('');
    try {
      const payload = await callAccountDeleteApi({ method: 'POST', password: deletePassword });
      setDeleteChecks(payload?.checks || deleteChecks);
      setDeleteCompletedAt(payload?.completedAt || new Date().toISOString());
      setDeleteFlowStep(3);
      toast.success('Ihr Konto wurde geschlossen.');
    } catch (error) {
      if (error?.payload?.checks) {
        setDeleteChecks(error.payload.checks);
      }
      setDeleteFlowError(error.message || 'Konto konnte nicht geschlossen werden.');
    } finally {
      setDeleteFlowSaving(false);
    }
  };

  const activeContracts = contracts.filter((contract) => contract.is_active !== false && contract.status !== 'rejected');
  const snapshots = activeContracts.map((contract) => ({
    contract,
    snapshot: computeContractSnapshot(contract, now),
  }));
  const bankOverviewRows = useMemo(() => {
    const grouped = snapshots.reduce((acc, entry) => {
      const bankName = entry.contract.bank_name || 'Unbekannte Bank';
      const bankKey = bankName.toLowerCase();
      const productType = normalizeProductType(entry.contract.product_type);
      if (!acc[bankKey]) {
        acc[bankKey] = {
          bankKey,
          bankName,
          bankLogo: entry.contract.bank_logo || null,
          totalAmount: 0,
          totalAvailable: 0,
          totalAccrued: 0,
          totalDaily: 0,
          productMap: {},
        };
      }
      const row = acc[bankKey];
      row.totalAmount += Number(entry.snapshot.amount || 0);
      row.totalAvailable += Number(entry.snapshot.availableAmount || 0);
      row.totalAccrued += Number(entry.snapshot.accruedInterest || 0);
      row.totalDaily += Number(entry.snapshot.dailyEarningsToday || 0);

      if (!row.productMap[productType]) {
        row.productMap[productType] = { type: productType, count: 0, amount: 0 };
      }
      row.productMap[productType].count += 1;
      row.productMap[productType].amount += Number(entry.snapshot.amount || 0);

      if (!row.bankLogo && entry.contract.bank_logo) {
        row.bankLogo = entry.contract.bank_logo;
      }
      return acc;
    }, {});

    return Object.values(grouped)
      .map((row) => {
        const products = Object.values(row.productMap)
          .sort((a, b) => b.amount - a.amount);
        const routableProducts = products.filter((product) => PRODUCT_ROUTE_MAP[product.type]);
        return {
          ...row,
          products,
          routableProducts,
          totalAmount: Number(row.totalAmount.toFixed(2)),
          totalAvailable: Number(row.totalAvailable.toFixed(2)),
          totalAccrued: Number(row.totalAccrued.toFixed(2)),
          totalDaily: Number(row.totalDaily.toFixed(2)),
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [snapshots]);

  if (!user) return null;

  const depotTotal = snapshots.reduce((sum, item) => sum + item.snapshot.amount, 0);
  const depotAccrued = snapshots.reduce((sum, item) => sum + item.snapshot.accruedInterest, 0);
  const depotAvailable = snapshots.reduce((sum, item) => sum + item.snapshot.availableAmount, 0);
  const dailyYieldTotal = snapshots.reduce((sum, item) => sum + item.snapshot.dailyEarningsToday, 0);
  const avgRate = activeContracts.length
    ? activeContracts.reduce((sum, contract) => sum + Number(contract.interest_rate || 0), 0) / activeContracts.length
    : 0;

  const byProduct = ['Festgeld', 'Tagesgeld', 'Flexgeld'].map((product) => {
    const rows = snapshots.filter((item) => item.contract.product_type === product);
    const amount = rows.reduce((sum, item) => sum + item.snapshot.amount, 0);
    const available = rows.reduce((sum, item) => sum + item.snapshot.availableAmount, 0);
    const accrued = rows.reduce((sum, item) => sum + item.snapshot.accruedInterest, 0);
    return { product, rows, amount, available, accrued };
  });

  const productPieData = byProduct
    .map((item) => ({ name: item.product, value: Number(item.amount.toFixed(2)) }))
    .filter((item) => item.value > 0);

  const cashflowByDate = cashflows.reduce((acc, flow) => {
    const key = flow.flow_date;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + Number(flow.amount_eur || 0);
    return acc;
  }, {});
  const performanceSeries = Array.from({ length: 90 }, (_, index) => {
    const daysAgo = 89 - index;
    const date = new Date(now);
    date.setDate(now.getDate() - daysAgo);
    const isoKey = date.toISOString().slice(0, 10);
    const value = activeContracts.reduce((sum, contract) => {
      const snapshot = computeContractSnapshot(contract, date);
      if (snapshot.startDate > date) return sum;
      return sum + snapshot.amount + snapshot.accruedInterest;
    }, 0);
    const available = activeContracts.reduce((sum, contract) => {
      const snapshot = computeContractSnapshot(contract, date);
      if (snapshot.startDate > date) return sum;
      return sum + snapshot.availableAmount;
    }, 0);
    return {
      label: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      dateKey: isoKey,
      value: Number(value.toFixed(2)),
      available: Number(available.toFixed(2)),
      netFlow: Number((cashflowByDate[isoKey] || 0).toFixed(2)),
    };
  });
  const dateWindowKeys = new Set(performanceSeries.map((row) => row.dateKey));
  const snapshotRowsInWindow = (dailySnapshots || [])
    .filter((row) => row?.snapshot_date && dateWindowKeys.has(row.snapshot_date));
  const firstSnapshotDateKey = snapshotRowsInWindow.length
    ? snapshotRowsInWindow[0].snapshot_date
    : null;
  const snapshotMap = snapshotRowsInWindow.reduce((acc, row) => {
    acc[row.snapshot_date] = row;
    return acc;
  }, {});
  const snapshotBackedSeries = performanceSeries.map((baseRow) => {
    const snapshotRow = snapshotMap[baseRow.dateKey];
    if (snapshotRow) {
      return {
        ...baseRow,
        value: Number(snapshotRow.total_value_eur || 0),
        available: Number(snapshotRow.available_eur || 0),
        netFlow: Number(snapshotRow.net_flow_eur || 0),
      };
    }
    if (firstSnapshotDateKey && baseRow.dateKey < firstSnapshotDateKey) {
      return {
        ...baseRow,
        value: 0,
        available: 0,
        netFlow: 0,
      };
    }
    return {
      ...baseRow,
      netFlow: 0,
    };
  });
  const sourceSeries = snapshotRowsInWindow.length ? snapshotBackedSeries : performanceSeries;
  const benchmarkSeries = (benchmarkPoints || []).map((row) => ({
    label: new Date(`${row.point_date}T00:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    value: Number(row.value || 0),
  }));
  const benchmarkComparison = computeBenchmarkComparison(sourceSeries, benchmarkSeries);
  const performanceWithBenchmark = benchmarkComparison.alignedSeries;

  const pieTotal = productPieData.reduce((sum, row) => sum + row.value, 0);

  const liquidityBuckets = snapshots.reduce((acc, item) => {
    const { snapshot } = item;
    const payout = snapshot.amount + snapshot.maturityInterest;

    if (snapshot.productType === 'Tagesgeld' || snapshot.availabilityLabel === 'Aktuell verfügbar') {
      acc.immediate += snapshot.availableAmount;
      return acc;
    }

    const targetDays = snapshot.daysLeft ?? Math.max(0, Math.ceil(snapshot.lockMonths * 30.44 - snapshot.elapsedDays));
    if (targetDays <= 30) acc.d30 += payout;
    else if (targetDays <= 90) acc.d90 += payout;
    else acc.over90 += payout;
    return acc;
  }, { immediate: 0, d30: 0, d90: 0, over90: 0 });

  const liquiditySeries = [
    { bucket: 'Sofort', amount: Number(liquidityBuckets.immediate.toFixed(2)) },
    { bucket: '<30 Tage', amount: Number(liquidityBuckets.d30.toFixed(2)) },
    { bucket: '30-90 Tage', amount: Number(liquidityBuckets.d90.toFixed(2)) },
    { bucket: '>90 Tage', amount: Number(liquidityBuckets.over90.toFixed(2)) },
  ];

  const bankExposure = Object.values(snapshots.reduce((acc, item) => {
    const bank = item.contract.bank_name || 'Unbekannte Bank';
    if (!acc[bank]) {
      acc[bank] = { bank, amount: 0, contracts: 0 };
    }
    acc[bank].amount += item.snapshot.amount;
    acc[bank].contracts += 1;
    return acc;
  }, {})).map((entry) => ({
    ...entry,
    excess: Math.max(0, entry.amount - DEPOSIT_PROTECTION_LIMIT),
  })).sort((a, b) => b.amount - a.amount);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthFlows = (cashflows || []).filter((flow) => {
    if (!flow?.flow_date) return false;
    const date = new Date(`${flow.flow_date}T00:00:00`);
    return date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear();
  });
  const monthInflow = monthFlows.reduce((sum, flow) => (
    flow.flow_type === 'outflow' ? sum : sum + Number(flow.amount_eur || 0)
  ), 0);
  const monthOutflow = monthFlows.reduce((sum, flow) => (
    flow.flow_type === 'outflow' ? sum + Number(flow.amount_eur || 0) : sum
  ), 0);
  const monthNetFromFlows = monthInflow - monthOutflow;
  const monthNetFromSnapshots = (dailySnapshots || []).reduce((sum, row) => {
    if (!row?.snapshot_date) return sum;
    const date = new Date(`${row.snapshot_date}T00:00:00`);
    if (date.getMonth() !== monthStart.getMonth() || date.getFullYear() !== monthStart.getFullYear()) return sum;
    return sum + Number(row.net_flow_eur || 0);
  }, 0);
  const monthNet = monthFlows.length ? monthNetFromFlows : monthNetFromSnapshots;

  const currentTaxTotals = computeTaxTotalsFromSnapshot(taxSnapshots[0] || {});
  const netYieldMetrics = computeNetYieldMetrics({
    snapshots,
    taxWithheldEur: currentTaxTotals.totalTaxEur,
    feesEur: currentTaxTotals.feesEur,
  });
  const maturityLadder = computeMaturityLadder(activeContracts, now).slice(0, 8);
  const cashflowCalendar = computeCashflowCalendar(activeContracts, cashflows, now)
    .filter((row) => Math.abs(row.net) > 0.001)
    .slice(0, 14);
  const contributionBreakdown = computeContributionBreakdown(snapshots);
  const riskLimitAlerts = computeRiskLimitAlerts(snapshots, {
    topBankShareLimitPct: 100,
    depositLimit: DEPOSIT_PROTECTION_LIMIT,
  });

  const shellNavItems = [
    { key: 'depot', label: 'Dashboard', icon: WalletCards, section: 'depot' },
    { key: 'tagesgeld', label: 'Tagesgeld', icon: Landmark, to: '/dashboard/tagesgeld' },
    { key: 'festgeld', label: 'Festgeld', icon: Landmark, to: '/dashboard/festgeld' },
    { key: 'flexgeld', label: 'Flexgeld', icon: Landmark, to: '/dashboard/flexgeld' },
    { key: 'steuern', label: 'Steuern', icon: FileText, to: '/dashboard/taxes' },
    { key: 'tools', label: 'Rechner & Tools', icon: Calendar, section: 'tools' },
    { key: 'favorites', label: 'Favoriten', icon: Heart, section: 'favorites' },
    { key: 'support', label: 'Support', icon: MessageSquareMore, section: 'support' },
    { key: 'profile', label: 'Profil', icon: UserRound, section: 'profile' },
    { key: 'logout', label: 'Abmelden', icon: LogOut, action: 'logout' },
  ];

  const handleShellNavSelect = (item) => {
    if (item?.action === 'logout') {
      handleLogout();
      return;
    }
    if (item?.section) {
      setActiveSection(item.section);
      return;
    }
    if (item?.to) navigate(item.to);
  };

  const handleSelectTool = (toolKey) => {
    setActiveTool(toolKey);
    window.setTimeout(() => {
      const target = document.getElementById(`tools-${toolKey}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };
  const closeBankSelector = () => setBankSelectorState(null);
  const navigateToProductFromBank = (productType) => {
    const route = PRODUCT_ROUTE_MAP[normalizeProductType(productType)];
    if (!route) {
      toast.error('Für dieses Produkt ist keine Zielseite verfügbar.');
      return;
    }
    closeBankSelector();
    navigate(route);
  };
  const handleBankLogoClick = (bankRow) => {
    if (!bankRow?.routableProducts?.length) {
      toast.error('Für diese Bank ist aktuell keine Produktseite verfügbar.');
      return;
    }
    if (bankRow.routableProducts.length === 1) {
      navigateToProductFromBank(bankRow.routableProducts[0].type);
      return;
    }
    setBankSelectorState(bankRow);
  };

  return (
    <UserAreaShell
      navItems={shellNavItems}
      activeKey={activeSection}
      onNavSelect={handleShellNavSelect}
    >
            {activeSection === 'depot' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  <SnapshotMetricCard
                    context="Portfolio Snapshot"
                    value={formatCompactCurrency(depotTotal)}
                    valueTitle={formatCurrency(depotTotal)}
                    period={`${activeContracts.length} aktive Verträge`}
                    deltaLabel={`${benchmarkComparison.portfolioReturnPct >= 0 ? '+' : ''}${benchmarkComparison.portfolioReturnPct.toFixed(2)}%`}
                    deltaPositive={benchmarkComparison.portfolioReturnPct >= 0}
                  />
                  <SnapshotMetricCard
                    context="Tagesaktuelle Zinsen"
                    value={`+${formatCompactCurrency(dailyYieldTotal)}`}
                    valueTitle={`+${formatCurrency(dailyYieldTotal)}`}
                    period="Gewinn pro Tag"
                    deltaLabel={netYieldMetrics.dailyNetAvailable ? 'Netto verfügbar' : 'Netto folgt nach Steuer-Setup'}
                    deltaPositive={Boolean(netYieldMetrics.dailyNetAvailable)}
                  />
                  <SnapshotMetricCard
                    context="Aufgelaufene Zinsen"
                    value={`+${formatCompactCurrency(depotAccrued)}`}
                    valueTitle={`+${formatCurrency(depotAccrued)}`}
                    period="Seit Vertragsstart"
                    deltaLabel={`${netYieldMetrics.netYieldPct.toFixed(2)}% netto`}
                    deltaPositive={netYieldMetrics.netYieldPct >= 0}
                  />
                  <SnapshotMetricCard
                    context="Aktuell verfügbar"
                    value={formatCompactCurrency(depotAvailable)}
                    valueTitle={formatCurrency(depotAvailable)}
                    period="Nach Produktregeln"
                    deltaLabel={`${monthNet >= 0 ? '+' : ''}${formatCompactCurrency(monthNet)} netto`}
                    deltaPositive={monthNet >= 0}
                  />
                  <SnapshotMetricCard
                    context="Ø Zinssatz"
                    value={`${avgRate.toFixed(2)} %`}
                    period="Alle aktiven Verträge"
                    deltaLabel={benchmarkComparison.hasBenchmark
                      ? `${benchmarkComparison.benchmarkReturnPct.toFixed(2)}% Benchmark`
                      : 'Benchmark-Daten fehlen'}
                    deltaPositive={benchmarkComparison.benchmarkReturnPct >= 0}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 size={16} className="text-slate-500" />
                    <h3 className="font-semibold text-[#0B1E33]">Multi-Bank Überblick</h3>
                  </div>
                  {bankOverviewRows.length === 0 ? (
                    <p className="text-sm text-slate-500">Noch keine Bankdaten im Depot verfügbar.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {bankOverviewRows.map((bank) => (
                        <div key={bank.bankKey} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                className="rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                onClick={() => handleBankLogoClick(bank)}
                                title="Produktseite öffnen"
                              >
                                <BankLogo logo={bank.bankLogo} bankName={bank.bankName} size="md" />
                              </button>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{bank.bankName}</p>
                                <p className="text-xs text-slate-500">{bank.products.reduce((sum, p) => sum + p.count, 0)} Verträge</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleBankLogoClick(bank)}
                              className="text-xs text-teal-700 font-medium hover:underline shrink-0"
                            >
                              Öffnen
                            </button>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <p className="text-sm text-slate-600">Angelegt: <span className="font-medium text-slate-900">{formatCurrency(bank.totalAmount)}</span></p>
                            <p className="text-sm text-slate-600">Verfügbar: <span className="font-medium text-slate-900">{formatCurrency(bank.totalAvailable)}</span></p>
                            <p className="text-sm text-slate-600">Tagesertrag: <span className="font-medium text-emerald-600">+{formatCurrency(bank.totalDaily)}</span></p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {bank.products.map((product) => (
                              <span key={`${bank.bankKey}-${product.type}`} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                {product.type} · {product.count}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <NewsVideoSection />

                <div id="dashboard-contracts" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                    <Landmark size={17} className="text-slate-500" />
                    <h2 className="text-lg font-semibold text-[#0B1E33]">Vertragsübersicht</h2>
                  </div>
                  {!activeContracts.length ? (
                    <div className="py-12 text-center text-slate-500">Noch keine Verträge im Depot.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Produkt</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Bank</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Vertragsnr.</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Anlagebetrag</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Tagesertrag</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Aufgelaufene Zinsen</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Verfügbar</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Startdatum</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Enddatum</th>
                            <th className="text-left px-4 py-3 text-sm text-slate-600">Laufzeit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshots.map(({ contract, snapshot }) => (
                            <tr key={contract.id} className="border-b border-slate-100">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{contract.product_type}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                  <BankLogo logo={contract.bank_logo} bankName={contract.bank_name} size="sm" />
                                  <span>{contract.bank_name || '—'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">{contract.contract_number || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(snapshot.amount)}</td>
                              <td className="px-4 py-3 text-sm text-emerald-600">+{formatCurrency(snapshot.dailyEarningsToday)}</td>
                              <td className="px-4 py-3 text-sm text-emerald-600">+{formatCurrency(snapshot.accruedInterest)}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(snapshot.availableAmount)}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{snapshot.startDate?.toLocaleDateString('de-DE') || '—'}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{snapshot.endDate?.toLocaleDateString('de-DE') || 'Unbefristet'}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{snapshot.termMonths > 0 ? `${snapshot.termMonths} M` : 'Unbefristet'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-[#0B1E33]">Performance vs Benchmark</h3>
                      </div>
                      {benchmarkComparison.hasBenchmark ? (
                        <span className={`text-xs font-medium ${benchmarkComparison.relativeReturnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          Alpha {benchmarkComparison.relativeReturnPct >= 0 ? '+' : ''}{benchmarkComparison.relativeReturnPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">Benchmark nicht verfügbar</span>
                      )}
                    </div>
                    {!benchmarkComparison.hasBenchmark && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                        Für den gewählten Zeitraum liegen keine verifizierten Benchmark-Daten vor.
                      </p>
                    )}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceWithBenchmark}>
                          <defs>
                            <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value, name) => [
                              formatCurrency(value),
                              name === 'value' ? 'Portfolio' : name === 'benchmark' ? 'Benchmark' : name === 'netFlow' ? 'Nettofluss' : 'Verfügbar',
                            ]}
                            contentStyle={{ borderRadius: 10, borderColor: '#CBD5E1' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="value"
                            stroke="#0EA5E9"
                            fill="url(#portfolioValueFill)"
                            strokeWidth={2.4}
                            dot={false}
                          />
                          <Line type="monotone" dataKey="benchmark" stroke="#334155" strokeWidth={1.8} dot={false} />
                          <Line type="monotone" dataKey="available" stroke="#1D4ED8" strokeWidth={1.4} dot={false} strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="netFlow" stroke="#7C3AED" strokeWidth={1.6} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Produktverteilung</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={productPieData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={95}
                            innerRadius={55}
                            paddingAngle={2}
                            stroke="#F8FAFC"
                            strokeWidth={2}
                            label={false}
                            labelLine={false}
                          >
                            {productPieData.map((entry, index) => (
                              <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {productPieData.map((row, index) => {
                        const share = pieTotal > 0 ? (row.value / pieTotal) * 100 : 0;
                        return (
                          <div key={row.name} className="rounded-lg border border-slate-200 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                              <p className="text-xs text-slate-500">{row.name}</p>
                            </div>
                            <p className="text-sm font-semibold text-[#0B1E33]" title={formatCurrency(row.value)}>
                              {formatCompactCurrency(row.value)}
                            </p>
                            <p className="text-xs text-slate-500">{share.toFixed(1)} % Anteil</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Beitrag nach Produkt</h3>
                    </div>
                    <div className="space-y-2">
                      {contributionBreakdown.productRows.length === 0 && (
                        <p className="text-sm text-slate-500">Noch keine Beitragsdaten vorhanden.</p>
                      )}
                      {contributionBreakdown.productRows
                        .sort((a, b) => b.value - a.value)
                        .map((row) => (
                          <div key={row.name} className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                            <span className="text-sm text-slate-700">{row.name}</span>
                            <span className="text-sm font-semibold text-[#0B1E33]">{formatCurrency(row.value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <SectionCard title="Risikohinweise" icon={AlertTriangle}>
                    <div className="space-y-2">
                      {riskLimitAlerts.length === 0 && (
                        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                          Keine aktiven Limitverletzungen.
                        </p>
                      )}
                      {riskLimitAlerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="rounded-lg border border-slate-200 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-700">{alert.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Cashflow-Kalender (120 Tage)</h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cashflowCalendar.length === 0 && (
                        <p className="text-sm text-slate-500">Noch keine Cashflow-Einträge.</p>
                      )}
                      {cashflowCalendar.map((row) => (
                        <div key={row.date} className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{new Date(`${row.date}T00:00:00`).toLocaleDateString('de-DE')}</p>
                            <p className="text-xs text-slate-500">Einzahlung {formatCurrency(row.inflow + row.interest)} · Auszahlung {formatCurrency(row.outflow)}</p>
                          </div>
                          <p className={`text-sm font-semibold ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock3 size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Fälligkeitsleiter</h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {maturityLadder.length === 0 && (
                        <p className="text-sm text-slate-500">Keine fälligen Verträge vorhanden.</p>
                      )}
                      {maturityLadder.map((row) => (
                        <div key={row.contractId} className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{row.bankName} · {row.productType}</p>
                            <p className="text-xs text-slate-500">{row.contractNumber} · {new Date(`${row.date}T00:00:00`).toLocaleDateString('de-DE')}</p>
                          </div>
                          <p className="text-sm font-semibold text-[#0B1E33]">{formatCurrency(row.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div id="dashboard-documents" className="grid grid-cols-1 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Dokumente & Reports</h3>
                    </div>
                    <div className="space-y-2">
                      {documents.length === 0 && <p className="text-sm text-slate-500">Noch keine Dokumente verfügbar.</p>}
                      {documents.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                            <p className="text-xs text-slate-500">{doc.document_type || 'Dokument'} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString('de-DE') : '—'}</p>
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
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers3 size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Liquiditätsübersicht</h3>
                    </div>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={liquiditySeries}>
                          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => formatCompactCurrency(v)} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Bar dataKey="amount" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-[#0B1E33]">Bankenrisiko / Einlagensicherung</h3>
                    </div>
                    <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
                      {bankExposure.length === 0 && (
                        <p className="text-sm text-slate-500 p-3">Noch keine Bankenexposure vorhanden.</p>
                      )}
                      {bankExposure.length > 0 && (
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium text-slate-600">Bank</th>
                              <th className="text-right px-3 py-2 font-medium text-slate-600">Exposure</th>
                              <th className="text-right px-3 py-2 font-medium text-slate-600">Verträge</th>
                              <th className="text-right px-3 py-2 font-medium text-slate-600">Über Limit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bankExposure.map((row) => (
                              <tr key={row.bank} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-3 py-2 text-slate-800">{row.bank}</td>
                                <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(row.amount)}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{row.contracts}</td>
                                <td className={`px-3 py-2 text-right font-medium ${row.excess > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {row.excess > 0 ? formatCurrency(row.excess) : '0,00 €'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeSection === 'tools' && (
              <div className="space-y-4">
                <ToolsHubSection selectedTool={activeTool} onSelectTool={handleSelectTool} />
                <InlineToolsWidgets activeTool={activeTool} />
              </div>
            )}

            {activeSection === 'favorites' && (
              <>
                {favorites.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                    <Heart size={40} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Noch keine Favoriten</p>
                    <Button onClick={() => navigate('/comparison')} className="bg-[#0B1E33] text-white">
                      Angebote durchsuchen
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {favorites.map((offer) => (
                      <div key={offer.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <BankLogo logo={offer.bank_logo} bankName={offer.bank_name} size="md" />
                          <div>
                            <p className="font-semibold text-sm">{offer.bank_name}</p>
                            <p className="text-xs text-slate-500">{offer.country}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-teal-600 mb-3">
                          {offer.interest_rate}% <span className="text-sm text-slate-500 font-normal">p.a.</span>
                        </p>
                        <DepositProtectionBadge offer={offer} />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1 bg-[#0B1E33] text-white" onClick={() => navigate('/apply', { state: { offer } })}>
                            Bewerben
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeFavorite(offer.id)} title="Aus Favoriten entfernen">
                            <Heart size={14} className="fill-red-500 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === 'support' && <UserSupportSection />}

            {activeSection === 'profile' && (
              <div className="space-y-4 max-w-4xl">
                {deleteFlowOpen ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <button
                      type="button"
                      onClick={resetDeleteFlow}
                      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft size={14} />
                      Zurück
                    </button>
                    <h2 className="text-2xl font-semibold text-[#0B1E33]">Konto löschen</h2>
                    <div className="grid grid-cols-3 gap-2 max-w-[560px]">
                      {[
                        { step: 1, label: 'Prüfung' },
                        { step: 2, label: 'Bestätigung' },
                        { step: 3, label: 'Abgeschlossen' },
                      ].map((item) => (
                        <div key={item.step} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-7 w-7 rounded-full border inline-flex items-center justify-center text-xs font-semibold ${
                              deleteFlowStep >= item.step
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 text-slate-500'
                            }`}
                            >
                              {item.step}
                            </span>
                            {item.step < 3 ? <span className="h-px flex-1 bg-slate-200" /> : null}
                          </div>
                          <p className="text-xs text-slate-500">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {deleteFlowStep === 1 && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 p-4">
                          <h3 className="font-semibold text-[#0B1E33] mb-2">Bitte prüfen Sie Folgendes, bevor Sie Ihr Konto löschen</h3>
                          <p className="text-sm text-slate-500 mb-3">Um Ihr Konto zu löschen, müssen folgende Bedingungen erfüllt sein:</p>
                          {deleteChecksLoading ? (
                            <p className="text-sm text-slate-500">Prüfung wird geladen...</p>
                          ) : deleteChecks.length === 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              <p className="text-sm font-medium text-amber-800">Prüfung konnte nicht geladen werden.</p>
                              <p className="text-xs text-amber-700 mt-1">Bitte erneut versuchen, damit die Gründe angezeigt werden.</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={loadDeleteChecks}
                              >
                                Prüfung erneut laden
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {deleteChecks.map((check) => (
                                <div key={check.key} className="rounded-lg border border-slate-200 px-3 py-2 flex items-start gap-3">
                                  {check.passed ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{check.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{check.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          Nach der Löschung Ihres Kontos werden alle Ihre Daten dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                        </div>
                        {deleteFlowError ? (
                          <p className="text-sm text-red-600">{deleteFlowError}</p>
                        ) : null}
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" onClick={resetDeleteFlow}>Abbrechen</Button>
                          <Button
                            onClick={() => setDeleteFlowStep(2)}
                            className="bg-[#0B1E33] text-white"
                            disabled={deleteChecksLoading || !canContinueDeleteStep1}
                          >
                            Weiter
                          </Button>
                        </div>
                      </div>
                    )}

                    {deleteFlowStep === 2 && (
                      <div className="space-y-4 max-w-xl">
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <p className="text-sm font-semibold text-red-700">Warnung: Diese Aktion ist endgültig.</p>
                          <p className="text-sm text-red-700 mt-1">
                            Bestätigen Sie mit Ihrem Passwort, um Ihr Konto endgültig zu schließen.
                          </p>
                        </div>
                        <label className="block">
                          <span className="text-sm text-slate-600">Passwort</span>
                          <div className="mt-1 relative">
                            <input
                              type={deletePasswordVisible ? 'text' : 'password'}
                              value={deletePassword}
                              onChange={(event) => setDeletePassword(event.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm"
                              placeholder="Passwort eingeben"
                            />
                            <button
                              type="button"
                              onClick={() => setDeletePasswordVisible((prev) => !prev)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                              aria-label="Passwort anzeigen"
                            >
                              {deletePasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </label>
                        {deleteFlowError ? (
                          <p className="text-sm text-red-600">{deleteFlowError}</p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2">
                          <Button variant="outline" onClick={() => setDeleteFlowStep(1)}>Zurück</Button>
                          <Button
                            onClick={confirmSoftDelete}
                            disabled={deleteFlowSaving}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {deleteFlowSaving ? 'Wird ausgeführt...' : 'Konto löschen'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {deleteFlowStep === 3 && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                          <p className="text-lg font-semibold text-emerald-800">Konto erfolgreich geschlossen</p>
                          <p className="text-sm text-emerald-700 mt-1">
                            Ihr Konto wurde am {new Date(deleteCompletedAt || Date.now()).toLocaleString('de-DE')} deaktiviert.
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleLogout} className="bg-[#0B1E33] text-white">
                            Abmelden
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 text-[#0B1E33]">Kontoinformationen</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <ProfileAvatar
                        avatarUrl={user.avatar_url}
                        fullName={[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                        size="xl"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">Profilfoto</p>
                        <label className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-100 cursor-pointer">
                          <UploadCloud size={14} />
                          {avatarSaving ? 'Wird hochgeladen...' : 'Foto hochladen'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={avatarSaving}
                          />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">Erlaubt: JPG, PNG, WEBP (max. 5 MB)</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-sm">
                      {(user.first_name || user.last_name) && (
                        <div className="flex justify-between py-3 border-b border-slate-100">
                          <span className="text-slate-500">Name</span>
                          <span className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(' ')}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">E-Mail</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      {user.country && (
                        <div className="flex justify-between py-3 border-b border-slate-100">
                          <span className="text-slate-500">Land</span>
                          <span className="font-medium">{user.country}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex justify-between py-3 border-b border-slate-100 gap-3">
                          <span className="text-slate-500 shrink-0">Adresse</span>
                          <span className="font-medium text-right break-words">{user.address}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Kontotyp</span>
                        <span className="font-medium">{user.role === 'admin' ? 'Administrator' : 'Benutzer'}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Mitglied seit</span>
                        <span className="font-medium">{new Date(user.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                      <Shield size={20} className="text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">Ihr Konto ist mit bankentauglicher Verschlüsselung geschützt.</p>
                    </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-[#0B1E33]">Sicherheit · Mail OTP 2FA</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Standardmäßig ist 2FA deaktiviert. Nach Aktivierung wird auf neuen Geräten beim ersten Login ein OTP per E-Mail abgefragt.
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Zwei-Faktor-Authentifizierung</p>
                          <p className="text-xs text-slate-500">Kanal: E-Mail OTP</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={Boolean(user.two_factor_enabled)}
                            disabled={twoFactorSaving}
                            onChange={(event) => handleTwoFactorToggle(event.target.checked)}
                          />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#0B1E33] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-900">Vertrauenswürdige Geräte</h4>
                        {loadingTrustedDevices ? (
                          <p className="text-sm text-slate-500 mt-2">Geräte werden geladen...</p>
                        ) : trustedDevices.length === 0 ? (
                          <p className="text-sm text-slate-500 mt-2">Noch keine Geräte gespeichert.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {trustedDevices.map((device) => (
                              <div key={device.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{device.device_label || 'Browser Gerät'}</p>
                                  <p className="text-xs text-slate-500">
                                    Letzte Nutzung: {device.last_used_at ? new Date(device.last_used_at).toLocaleString('de-DE') : '—'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Gültig bis: {device.expires_at ? new Date(device.expires_at).toLocaleDateString('de-DE') : '—'}
                                  </p>
                                </div>
                                {device.revoked_at ? (
                                  <span className="text-xs text-slate-500">Abgemeldet</span>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleRevokeDevice(device.id)}>
                                    Gerät entfernen
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Konto verwalten</h3>
                      <button
                        type="button"
                        onClick={openDeleteModal}
                        className="w-full rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-left flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-red-700">Konto löschen</p>
                          <p className="text-xs text-red-600 mt-0.5">Löschen Sie Ihr Raisin Konto und alle damit verbundenen Daten.</p>
                        </div>
                        <ChevronRight size={16} className="text-red-600" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {deleteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-red-600">
                      <AlertCircle size={20} />
                      <h4 className="text-2xl font-semibold">Konto löschen</h4>
                    </div>
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                      aria-label="Schließen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Sind Sie sicher, dass Sie Ihr Raisin Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li>• Alle Ihre Anlagen und Kontoeinstellungen werden gelöscht.</li>
                      <li>• Ihre persönlichen Daten werden dauerhaft entfernt.</li>
                      <li>• Sie verlieren den Zugriff auf Ihr Konto und alle Dokumente.</li>
                    </ul>
                    <div>
                      <label className="block text-sm text-slate-600">Um fortzufahren, geben Sie bitte Ihr Passwort ein.</label>
                      <div className="mt-1 relative">
                        <input
                          type={deletePasswordVisible ? 'text' : 'password'}
                          value={deletePassword}
                          onChange={(event) => setDeletePassword(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm"
                          placeholder="Passwort eingeben"
                        />
                        <button
                          type="button"
                          onClick={() => setDeletePasswordVisible((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                          aria-label="Passwort anzeigen"
                        >
                          {deletePasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {deleteFlowError ? (
                      <p className="text-sm text-red-600">{deleteFlowError}</p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button variant="outline" onClick={closeDeleteModal}>Abbrechen</Button>
                      <Button onClick={startDeleteFlow} className="bg-red-600 hover:bg-red-700 text-white">
                        Konto löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bankSelectorState && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Bank auswählen</p>
                      <h4 className="text-lg font-semibold text-[#0B1E33]">{bankSelectorState.bankName}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={closeBankSelector}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                      aria-label="Schließen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-5 space-y-2">
                    {bankSelectorState.routableProducts.map((product) => (
                      <button
                        key={`${bankSelectorState.bankKey}-${product.type}`}
                        type="button"
                        onClick={() => navigateToProductFromBank(product.type)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">{product.type}</p>
                        <p className="text-xs text-slate-500 mt-1">{product.count} Vertrag/Verträge · {formatCurrency(product.amount)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
    </UserAreaShell>
  );
};

export default UserDashboard;