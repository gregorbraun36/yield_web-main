import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import BankLogo from '@/components/BankLogo';
import OfferDetailModal from '@/components/OfferDetailModal';
import OfferInterestModal from '@/components/OfferInterestModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { logActivityEvent } from '@/lib/activityFeed';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { loadEurRates, offerInEur, formatEur } from '@/lib/currency';
import {
  Heart, Shield, Calendar, Wallet,
  Clock, Star, X,
  RefreshCw, TrendingUp, SlidersHorizontal, Search, Send, Globe,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS = {
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Netherlands': '🇳🇱', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Sweden': '🇸🇪',
  'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Finland': '🇫🇮', 'Denmark': '🇩🇰',
  'Ireland': '🇮🇪', 'Luxembourg': '🇱🇺', 'Greece': '🇬🇷',
};

const INVESTMENT_TYPES = ['Festgeld', 'Tagesgeld'];

const DEFAULT_FILTERS = {
  searchText: '',
  interestRateRange: [0, 10],
  countries: [],
  investmentAmount: '',
  investmentTypes: [],
  termRange: [0, 120],
  interestFrequencies: [],
};

// ─── Pure helpers (module-level — no closure, always stable reference) ────────

const getInvestmentType = (offer) =>
  offer.investment_type || (offer.deposit_term === 0 ? 'Tagesgeld' : 'Festgeld');

const getTermLabel = (offer) =>
  offer.deposit_term === 0 || getInvestmentType(offer) === 'Tagesgeld'
    ? 'Flexibel'
    : `${offer.deposit_term} Monate`;

const isFeaturedBank = (offer) =>
  offer.bank_name.toLowerCase() === 'bbva bank deutschland';

/**
 * Computes top-10% offer IDs once when the offer list changes.
 * Returns a Set for O(1) lookup per card instead of re-sorting inside every
 * card render (previously: O(n log n) × n cards on every render cycle).
 */
const buildTopOfferIds = (offers) => {
  if (offers.length === 0) return new Set();
  const sorted = [...offers].map((o) => o.interest_rate).sort((a, b) => b - a);
  const threshold = sorted[Math.floor(offers.length * 0.1)] ?? sorted[0];
  return new Set(offers.filter((o) => o.interest_rate >= threshold).map((o) => o.id));
};

const countActiveFilters = (filters) => {
  let count = 0;
  if (filters.searchText.trim()) count++;
  if (filters.interestRateRange[0] > 0 || filters.interestRateRange[1] < 10) count++;
  if (filters.countries.length > 0) count++;
  if (filters.investmentAmount) count++;
  if (filters.investmentTypes.length > 0) count++;
  if (filters.termRange[0] > 0 || filters.termRange[1] < 120) count++;
  if (filters.interestFrequencies.length > 0) count++;
  return count;
};

// ─── Custom hook: debounced value ─────────────────────────────────────────────

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity. The Input stays controlled and responsive (instant feedback)
 * while the expensive filteredOffers useMemo is deferred.
 */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Sub-components (module-level → stable references → memo works) ──────────

const FilterBadge = memo(({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium">
    {label}
    <button onClick={onRemove} className="ml-0.5 hover:text-teal-900">
      <X size={11} />
    </button>
  </span>
));

const CheckboxGroup = memo(({ label, options, selected, onChange, renderLabel }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-slate-900 select-none"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onChange(opt)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          {renderLabel ? renderLabel(opt) : opt}
        </label>
      ))}
    </div>
  </div>
));

/**
 * FilterPanel is a standalone memoized component defined at module level.
 *
 * Previously it was defined as a nested function inside SavingsComparison.
 * That pattern defeats React.memo entirely: on every parent render React
 * creates a brand-new function object, so memo's shallow-equality check
 * always fails and FilterPanel re-renders unconditionally.
 *
 * Receiving all data/callbacks as explicit props makes the dependency
 * contract clear and lets memo bail out when nothing relevant changed.
 */
const FilterPanel = memo(({
  filters,
  availableCountries,
  availableFrequencies,
  activeFilterCount,
  onSearchChange,
  onSliderChange,
  onAmountChange,
  onToggleArray,
  onReset,
}) => (
  <div className="space-y-6">
    {/* Search */}
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Banksuche</p>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={filters.searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Bank oder Land..."
          className="pl-8 text-sm h-9"
        />
        {filters.searchText && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>

    {/* Interest Rate Range */}
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Zinssatz:{' '}
        <span className="text-slate-900">
          {filters.interestRateRange[0]}% – {filters.interestRateRange[1]}%
        </span>
      </p>
      <Slider
        min={0} max={10} step={0.1}
        value={filters.interestRateRange}
        onValueChange={(v) => onSliderChange('interestRateRange', v)}
        className="mb-1"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0%</span><span>10%</span>
      </div>
    </div>

    {/* Term Range */}
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Laufzeit:{' '}
        <span className="text-slate-900">
          {filters.termRange[0]} – {filters.termRange[1]} Monate
        </span>
      </p>
      <Slider
        min={0} max={120} step={1}
        value={filters.termRange}
        onValueChange={(v) => onSliderChange('termRange', v)}
        className="mb-1"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Flexibel</span><span>120 M.</span>
      </div>
    </div>

    {/* Investment Amount */}
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Anlagebetrag (€)
      </p>
      <Input
        type="number"
        value={filters.investmentAmount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="z.B. 10000"
        className="text-sm h-9"
        min="0"
      />
      <p className="text-xs text-slate-400 mt-1">
        Zeigt Angebote, für die Ihr Betrag ausreicht.
      </p>
    </div>

    {/* Countries */}
    {availableCountries.length > 0 && (
      <CheckboxGroup
        label="Land"
        options={availableCountries}
        selected={filters.countries}
        onChange={(v) => onToggleArray('countries', v)}
        renderLabel={(c) => (
          <span>{COUNTRY_FLAGS[c] || <Globe size={12} />} {c}</span>
        )}
      />
    )}

    {/* Investment Type */}
    <CheckboxGroup
      label="Anlagetyp"
      options={INVESTMENT_TYPES}
      selected={filters.investmentTypes}
      onChange={(v) => onToggleArray('investmentTypes', v)}
    />

    {/* Interest Frequency */}
    {availableFrequencies.length > 0 && (
      <CheckboxGroup
        label="Zinsauszahlung"
        options={availableFrequencies}
        selected={filters.interestFrequencies}
        onChange={(v) => onToggleArray('interestFrequencies', v)}
      />
    )}

    {activeFilterCount > 0 && (
      <Button variant="outline" size="sm" className="w-full text-slate-600" onClick={onReset}>
        <X size={13} className="mr-1.5" /> Alle Filter zurücksetzen
      </Button>
    )}
  </div>
));

// ─── OfferCard (module-level + memoized) ─────────────────────────────────────
/**
 * Extracting the card into its own memo'd component means that when the
 * parent re-renders (e.g. user is typing in the search box), only cards
 * whose props have actually changed get re-rendered by React's reconciler.
 * Cards for offers that don't match the new search text are simply unmounted;
 * cards that were already visible and unchanged are skipped entirely.
 */
const OfferCard = memo(({ offer, isFav, badge, onOpen, onApply, onInterest, onToggleFavorite }) => {
  const isFeatured = isFeaturedBank(offer);

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isFeatured ? 'border-amber-300' : 'border-slate-200'
        }`}
      onClick={() => onOpen(offer)}
    >
      {badge && (
        <div
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold ${badge.color === 'amber'
              ? 'bg-amber-50 border-b border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-b border-emerald-200 text-emerald-700'
            }`}
        >
          {badge.color === 'amber'
            ? <Star size={12} className="fill-amber-600 text-amber-600" />
            : <TrendingUp size={12} />}
          {badge.text}
        </div>
      )}

      <div className="p-5 flex items-center gap-6 flex-wrap sm:flex-nowrap">
        {/* Bank info */}
        <div
          className={`flex-shrink-0 flex items-center gap-3 w-56 p-3 rounded-xl ${isFeatured ? 'bg-amber-50' : 'bg-slate-50'
            }`}
        >
          <BankLogo logo={offer.bank_logo} bankName={offer.bank_name} size="lg" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-tight truncate">{offer.bank_name}</h3>
            <p className="text-xs text-slate-500">
              {COUNTRY_FLAGS[offer.country]} {offer.country}
            </p>
          </div>
        </div>

        {/* Offer details */}
        <div className="flex-1 flex items-center gap-6 flex-wrap">
          <div
            className={`px-4 py-2 rounded-lg flex-shrink-0 ${isFeatured
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-teal-50 border border-teal-200'
              }`}
          >
            <span className={`text-2xl font-bold ${isFeatured ? 'text-amber-700' : 'text-teal-700'}`}>
              {offer.interest_rate}%
            </span>
            <p className="text-xs text-slate-500">p.a.</p>
          </div>

          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400 flex-shrink-0" />
              {getTermLabel(offer)}
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet size={14} className="text-slate-400 flex-shrink-0" />
              {formatEur(offer.min_deposit)} min.
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-slate-400 flex-shrink-0" />
              {offer.deposit_protection_amount}
            </div>
            {offer.interest_frequency && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400 flex-shrink-0" />
                {offer.interest_frequency}
              </div>
            )}
          </div>

          <div className="ml-auto text-xs text-slate-500 bg-slate-100 rounded-lg px-2 py-1 self-start">
            {getInvestmentType(offer)}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            className="bg-[#0B1E33] hover:bg-[#1E293B] text-white"
            onClick={() => onApply('/apply', { state: { offer } })}
          >
            Bewerben
          </Button>
          <Button size="sm" variant="outline" onClick={() => onInterest(offer)}>
            <Send size={14} className="mr-1" /> Anfrage
          </Button>
          <button
            onClick={(e) => onToggleFavorite(e, offer.id)}
            className={`p-1.5 rounded-lg border transition-colors ${isFav
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-slate-200 text-slate-400 hover:text-red-500'
              }`}
            title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart size={16} className={isFav ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const SavingsComparison = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [interestOffer, setInterestOffer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('interest_rate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce only the text search — checkbox/slider changes are cheap
  const debouncedSearchText = useDebouncedValue(filters.searchText, 300);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => { fetchOffers(); }, []);

  useEffect(() => {
    if (user) fetchFavorites();
    else setFavorites([]);
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('savings_offers')
        .select('*, banks(id, name, country, logo_url, website_url, deposit_protection, deposit_protection_amount)')
        .eq('is_active', true);
      if (error) throw error;
      await loadEurRates();
      const mapped = (data || []).map((o) => offerInEur({
        ...o,
        bank_name: o.banks?.name || '',
        country: o.banks?.country || '',
        bank_logo: o.banks?.logo_url || null,
        website_url: o.banks?.website_url || null,
        deposit_protection: o.banks?.deposit_protection || '',
        deposit_protection_amount: o.banks?.deposit_protection_amount || '',
      }));
      setOffers(mapped);
    } catch {
      toast.error('Fehler beim Laden der Angebote');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setFavorites(data?.favorites || []);
    } catch {
      console.error('Fehler beim Laden der Favoriten');
    }
  };

  // ─── Derived data ───────────────────────────────────────────────────────────

  const topOfferIds = useMemo(() => buildTopOfferIds(offers), [offers]);

  const availableCountries = useMemo(
    () => [...new Set(offers.map((o) => o.country))].filter(Boolean).sort(),
    [offers]
  );

  const availableFrequencies = useMemo(
    () => [...new Set(offers.map((o) => o.interest_frequency).filter(Boolean))],
    [offers]
  );

  // ─── Stable callbacks ───────────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (value) => setFilters((prev) => ({ ...prev, searchText: value })),
    []
  );

  const handleSliderChange = useCallback(
    (key, value) => setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleAmountChange = useCallback(
    (value) => setFilters((prev) => ({ ...prev, investmentAmount: value })),
    []
  );

  const toggleArrayFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const toggleSortOrder = useCallback(
    () => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc')),
    []
  );

  /**
   * Optimistic favorite toggle:
   * 1. Update local state immediately (instant UI feedback).
   * 2. Fire DB update in the background.
   * 3. Roll back on DB error.
   *
   * Using the functional form of setFavorites ensures we always read the
   * latest snapshot — no stale-closure risk even though toggleFavorite is
   * memoized with useCallback.
   */
  const toggleFavorite = useCallback(
    async (e, offerId) => {
      e.stopPropagation();
      if (!user) {
        toast.error('Bitte melden Sie sich an, um Favoriten zu speichern');
        return;
      }
      setFavorites((prev) => {
        const wasFavorite = prev.includes(offerId);
        const next = wasFavorite
          ? prev.filter((id) => id !== offerId)
          : [...prev, offerId];

        supabase
          .from('profiles')
          .update({ favorites: next })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              toast.error('Fehler beim Aktualisieren der Favoriten');
              setFavorites(prev); // rollback
              return;
            }

            const offer = offers.find((item) => item.id === offerId);
            logActivityEvent({
              event_type: wasFavorite ? 'favorite_removed' : 'favorite_added',
              summary: wasFavorite ? 'Favorit entfernt' : 'Favorit hinzugefügt',
              payload: {
                actor_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
                actor_email: user.email || null,
                offer_id: offerId,
                bank_name: offer?.bank_name || null,
                interest_rate: offer?.interest_rate || null,
              },
              user_id: user.id,
            });
          });

        toast.success(wasFavorite ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
        return next;
      });
    },
    [user, offers]
  );

  const handleOpenDetail = useCallback((offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  }, []);

  const handleOpenInterest = useCallback((offer) => {
    setInterestOffer(offer);
    setShowInterestModal(true);
  }, []);

  const handleCloseDetail = useCallback(() => setShowDetailModal(false), []);
  const handleCloseInterest = useCallback(() => setShowInterestModal(false), []);
  const handleOpenMobileFilters = useCallback(() => setShowMobileFilters(true), []);
  const handleCloseMobileFilters = useCallback(() => setShowMobileFilters(false), []);

  // ─── Filtered & sorted offers ───────────────────────────────────────────────
  // debouncedSearchText is used here instead of filters.searchText so the
  // array scan is deferred until the user pauses typing.

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (debouncedSearchText.trim()) {
      const q = debouncedSearchText.toLowerCase();
      result = result.filter(
        (o) => o.bank_name.toLowerCase().includes(q) || o.country.toLowerCase().includes(q)
      );
    }

    result = result.filter(
      (o) =>
        o.interest_rate >= filters.interestRateRange[0] &&
        o.interest_rate <= filters.interestRateRange[1]
    );

    if (filters.countries.length > 0)
      result = result.filter((o) => filters.countries.includes(o.country));

    if (filters.investmentTypes.length > 0)
      result = result.filter((o) => filters.investmentTypes.includes(getInvestmentType(o)));

    if (filters.investmentAmount) {
      const amount = parseFloat(
        filters.investmentAmount.replace(/\./g, '').replace(',', '.')
      );
      if (!isNaN(amount))
        result = result.filter((o) => o.min_deposit <= amount);
    }

    result = result.filter(
      (o) => o.deposit_term >= filters.termRange[0] && o.deposit_term <= filters.termRange[1]
    );

    if (filters.interestFrequencies.length > 0)
      result = result.filter((o) => filters.interestFrequencies.includes(o.interest_frequency));

    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Featured offers pinned to top
    const featured = result.filter(isFeaturedBank);
    const rest = result.filter((o) => !isFeaturedBank(o));
    return [...featured, ...rest];
  }, [offers, debouncedSearchText, filters, sortBy, sortOrder]);

  // ─── Active filter count & chips ────────────────────────────────────────────

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const activeChips = useMemo(() => {
    const chips = [];

    if (filters.searchText.trim())
      chips.push({ key: 'searchText', label: `Suche: "${filters.searchText}"`, onRemove: () => handleSearchChange('') });

    if (filters.interestRateRange[0] > 0 || filters.interestRateRange[1] < 10)
      chips.push({ key: 'rate', label: `${filters.interestRateRange[0]}% – ${filters.interestRateRange[1]}%`, onRemove: () => handleSliderChange('interestRateRange', [0, 10]) });

    if (filters.termRange[0] > 0 || filters.termRange[1] < 120)
      chips.push({ key: 'term', label: `${filters.termRange[0]} – ${filters.termRange[1]} Monate`, onRemove: () => handleSliderChange('termRange', [0, 120]) });

    filters.countries.forEach((c) =>
      chips.push({ key: `country-${c}`, label: `${COUNTRY_FLAGS[c] || ''} ${c}`, onRemove: () => toggleArrayFilter('countries', c) })
    );
    filters.investmentTypes.forEach((t) =>
      chips.push({ key: `type-${t}`, label: t, onRemove: () => toggleArrayFilter('investmentTypes', t) })
    );
    filters.interestFrequencies.forEach((f) =>
      chips.push({ key: `freq-${f}`, label: f, onRemove: () => toggleArrayFilter('interestFrequencies', f) })
    );

    if (filters.investmentAmount)
      chips.push({ key: 'amount', label: `Betrag: €${filters.investmentAmount}`, onRemove: () => handleAmountChange('') });

    return chips;
  }, [filters, handleSearchChange, handleSliderChange, handleAmountChange, toggleArrayFilter]);

  // ─── Memoized props object for FilterPanel ──────────────────────────────────
  // A single stable object passed to both sidebar and mobile drawer so that
  // React.memo on FilterPanel gets consistent shallow-equality results.

  const filterPanelProps = useMemo(() => ({
    filters,
    availableCountries,
    availableFrequencies,
    activeFilterCount,
    onSearchChange: handleSearchChange,
    onSliderChange: handleSliderChange,
    onAmountChange: handleAmountChange,
    onToggleArray: toggleArrayFilter,
    onReset: resetFilters,
  }), [
    filters,
    availableCountries,
    availableFrequencies,
    activeFilterCount,
    handleSearchChange,
    handleSliderChange,
    handleAmountChange,
    toggleArrayFilter,
    resetFilters,
  ]);

  // ─── Badge helper (uses precomputed Set for O(1) lookup) ────────────────────

  const getOfferBadge = useCallback(
    (offer) => {
      if (isFeaturedBank(offer)) return { text: 'Empfohlenes Angebot', color: 'amber' };
      if (topOfferIds.has(offer.id)) return { text: 'Top-Zins', color: 'emerald' };
      return null;
    },
    [topOfferIds]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Sparangebote vergleichen: Das Wichtigste zu Festgeld, Tagesgeld und Flexgeld</h1>
          <p className="text-slate-300">
            Festgeld, Tagesgeld und Flexgeld sind drei sichere und beliebte Anlageformen. Sie unterscheiden sich vor allem in Flexibilität, Verfügbarkeit und Verzinsung – je nach Ihren Zielen passt eine Variante besonders gut zu Ihnen.

            Festgeld: Festes Geld für eine feste Laufzeit (z. B. 6 Monate oder 1 Jahr) zu einem garantierten Zinssatz. Höchste Zinsen, aber während der Laufzeit gebunden.
            Tagesgeld: Täglich verfügbar. Sie können jederzeit ein- und auszahlen. Der Zinssatz ist variabel und passt sich dem Markt an – ideal als flexible Reserve.
            Flexgeld: Die clevere Mischung aus Festgeld und Tagesgeld. Fester Zinssatz bei gleichzeitiger Flexibilität (vorzeitige Verfügbarkeit möglich).

            Über h68-invest.de erhalten Sie attraktive Angebote bei etablierten deutschen und europäischen Banken. Bei allen drei Varianten sind Ihre Einlagen bis 100.000 € pro Bank gesetzlich abgesichert.
            Möchten Sie herausfinden, welche Form am besten zu Ihnen passt? Nutzen Sie unseren Sparrechner oder vereinbaren Sie einen unverbindlichen Termin – wir zeigen Ihnen die aktuellen Top-Konditionen.







    
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <SlidersHorizontal size={15} /> Filter
                </h3>
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel {...filterPanelProps} />
            </div>
          </div>

          {/* ── Offers Column ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <button
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:border-slate-400 transition-colors"
                onClick={handleOpenMobileFilters}
              >
                <SlidersHorizontal size={14} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="text-sm text-slate-500 mr-auto">
                {loading
                  ? 'Lädt…'
                  : `${filteredOffers.length} Angebot${filteredOffers.length !== 1 ? 'e' : ''} gefunden`}
              </p>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="interest_rate">Zinssatz</option>
                <option value="deposit_term">Laufzeit</option>
                <option value="min_deposit">Mindesteinlage</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 bg-white transition-colors"
                title={sortOrder === 'desc' ? 'Absteigend' : 'Aufsteigend'}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {activeChips.map((chip) => (
                  <FilterBadge key={chip.key} label={chip.label} onRemove={chip.onRemove} />
                ))}
                {activeChips.length > 1 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-slate-400 hover:text-slate-700 underline ml-1"
                  >
                    Alle löschen
                  </button>
                )}
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Angebote werden geladen…</p>
              </div>
            )}

            {!loading && filteredOffers.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <SlidersHorizontal size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium mb-1">Keine Angebote gefunden</p>
                <p className="text-slate-400 text-sm mb-4">Passen Sie Ihre Filterkriterien an.</p>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}

            {!loading && filteredOffers.length > 0 && (
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isFav={favorites.includes(offer.id)}
                    badge={getOfferBadge(offer)}
                    onOpen={handleOpenDetail}
                    onApply={navigate}
                    onInterest={handleOpenInterest}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseMobileFilters} />
          <div className="relative ml-auto w-80 max-w-full h-full bg-white overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filter
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </h3>
              <button onClick={handleCloseMobileFilters} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <FilterPanel {...filterPanelProps} />
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button className="w-full bg-[#0B1E33] text-white" onClick={handleCloseMobileFilters}>
                {filteredOffers.length} Angebot{filteredOffers.length !== 1 ? 'e' : ''} anzeigen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
          onInterestClick={(offer) => { handleCloseDetail(); handleOpenInterest(offer); }}
          onApply={(offer) => navigate('/apply', { state: { offer } })}
        />
      )}

      {interestOffer && (
        <OfferInterestModal
          offer={interestOffer}
          isOpen={showInterestModal}
          onClose={handleCloseInterest}
        />
      )}

    </div>
  );
};

export default SavingsComparison;
