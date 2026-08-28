import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Activity, Heart, FilePlus2, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/admin/StatusBadge';
import { toast } from 'sonner';

const EVENT_OPTIONS = [
  { value: 'all', label: 'Alle Ereignistypen' },
  { value: 'application_submitted', label: 'Antrag eingereicht' },
  { value: 'favorite_added', label: 'Favorit hinzugefügt' },
  { value: 'favorite_removed', label: 'Favorit entfernt' },
  { value: 'admin_user_created', label: 'Admin Benutzer erstellt' },
  { value: 'otp_sent', label: '2FA OTP gesendet' },
  { value: 'otp_verified', label: '2FA OTP bestätigt' },
  { value: 'support_ticket_created', label: 'Support Ticket erstellt' },
  { value: 'failed_login', label: 'Fehlgeschlagene Anmeldung' },
  { value: 'user_login', label: 'Benutzer Login' },
  { value: 'user_logout', label: 'Benutzer Logout' },
];

const getIcon = (eventType) => {
  switch (eventType) {
    case 'favorite_added':
    case 'favorite_removed':
      return Heart;
    case 'application_submitted':
      return FilePlus2;
    case 'failed_login':
      return ShieldAlert;
    case 'user_login':
      return LogIn;
    case 'user_logout':
      return LogOut;
    default:
      return Activity;
  }
};

const AdminActivityFeed = () => {
  const [events, setEvents] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [liveMode, setLiveMode] = useState(true);
  const [liveStatus, setLiveStatus] = useState('connecting');

  const hydrateProfiles = async (rows) => {
    const ids = [...new Set((rows || []).map((event) => event.user_id).filter(Boolean))];
    if (!ids.length) return;

    const missingIds = ids.filter((id) => !profileMap[id]);
    if (!missingIds.length) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', missingIds);

    if (error) return;

    setProfileMap((previous) => {
      const next = { ...previous };
      (data || []).forEach((profile) => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        next[profile.id] = {
          name: fullName || null,
          email: profile.email || null,
        };
      });
      return next;
    });
  };

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('admin_activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventFilter !== 'all') query = query.eq('event_type', eventFilter);

    const { data, error } = await query;
    if (error) {
      toast.error(`Aktivitäten konnten nicht geladen werden: ${error.message}`);
    } else {
      const rows = data || [];
      setEvents(rows);
      hydrateProfiles(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [eventFilter]);

  useEffect(() => {
    if (!liveMode) return undefined;
    setLiveStatus('connecting');
    const channel = supabase
      .channel('admin-activity-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_feed' }, (payload) => {
        setEvents((previous) => [payload.new, ...previous].slice(0, 200));
        hydrateProfiles([payload.new]);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setLiveStatus('subscribed');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setLiveStatus('disconnected');
      });

    const statusTimer = setTimeout(() => {
      setLiveStatus((previous) => (previous === 'connecting' ? 'disconnected' : previous));
    }, 700);

    return () => {
      clearTimeout(statusTimer);
      setLiveStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [liveMode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => (
      `${event.summary || ''} ${event.user_name || ''} ${event.user_email || ''} ${JSON.stringify(event.payload || {})}`.toLowerCase().includes(q)
    ));
  }, [events, search]);

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Monitoring</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Benutzeraktivitäten</h1>
            <p className="text-sm text-slate-500 mt-1">Live-Feed aller Ereignisse · letzte 200 Einträge.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className={liveMode ? 'border-green-200 text-green-700 bg-green-50' : 'border-slate-200 text-slate-600'}
              onClick={() => setLiveMode((previous) => !previous)}
            >
              {liveMode ? 'Live' : 'Live aus'}
            </Button>
            <span className={`text-xs px-2 py-1 rounded-full border ${
              liveMode && liveStatus === 'subscribed'
                ? 'bg-green-50 text-green-700 border-green-200'
                : liveMode
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {liveMode && liveStatus === 'subscribed'
                ? 'Live verbunden'
                : liveMode
                  ? 'Live verbindet...'
                  : 'Live getrennt'}
            </span>
            <Button variant="outline" onClick={fetchEvents} className="gap-2" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Neu laden
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col lg:flex-row gap-3 mb-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suche: Name, E-Mail, Payload..."
          />
          <select
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            className="h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-w-[240px]"
          >
            {EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
          {filtered.map((event) => {
            const Icon = getIcon(event.event_type);
            const profile = event.user_id ? profileMap[event.user_id] : null;
            const actorName =
              profile?.name ||
              event.payload?.actor_name ||
              event.payload?.name ||
              (event.user_id ? `User ${event.user_id.slice(0, 8)}` : 'Anonym');
            const actorEmail =
              profile?.email ||
              event.payload?.actor_email ||
              event.payload?.email ||
              null;
            return (
              <div key={event.id} className="px-4 py-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{event.summary || event.event_type}</p>
                    <p className="text-xs text-slate-500 mt-1 break-all">
                      {actorName} {actorEmail ? `· ${actorEmail}` : ''}
                    </p>
                    <code className="text-[11px] text-slate-500 bg-slate-50 rounded px-1.5 py-0.5 inline-block mt-1">
                      {JSON.stringify(event.payload || {})}
                    </code>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString('de-DE') : '—'}</p>
                  <div className="mt-1">
                    <StatusBadge value={event.event_type} label={event.event_type} />
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-sm text-slate-400">Keine Aktivitäten gefunden.</div>
          )}
        </div>
    </div>
  );
};

export default AdminActivityFeed;
