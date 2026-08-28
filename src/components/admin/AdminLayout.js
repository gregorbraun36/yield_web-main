import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Percent,
  FileText,
  Send,
  WalletCards,
  MessageSquareMore,
  Activity,
  Scale,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AdminLayout = () => {
  const [applicationBadge, setApplicationBadge] = useState(0);
  const [supportBadge, setSupportBadge] = useState(0);
  const [taxBadge, setTaxBadge] = useState(0);

  const fetchBadges = useCallback(async () => {
    const [
      { count: pendingApplications },
      { data: supportRows },
      { count: openSupportTickets },
      { count: pendingTaxRequests },
    ] = await Promise.all([
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'Abgeschlossen'),
      supabase
        .from('support_tickets')
        .select('unread_admin_count'),
      supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'geschlossen'),
      supabase
        .from('portfolio_tax_exemption_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    setApplicationBadge(pendingApplications || 0);
    const unreadSupportCount = (supportRows || []).reduce(
      (sum, row) => sum + Number(row.unread_admin_count || 0),
      0,
    );
    setSupportBadge(Math.max(openSupportTickets || 0, unreadSupportCount));
    setTaxBadge(pendingTaxRequests || 0);
  }, []);

  useEffect(() => {
    fetchBadges();
    const intervalId = setInterval(fetchBadges, 30000);
    return () => clearInterval(intervalId);
  }, [fetchBadges]);

  const nav = useMemo(() => ([
    { to: '/admin', label: 'Übersicht', icon: LayoutDashboard, end: true, badge: 0 },
    { to: '/admin/users', label: 'Benutzer', icon: Users, badge: 0 },
    { to: '/admin/banks', label: 'Banken', icon: Building2, badge: 0 },
    { to: '/admin/offers', label: 'Angebote', icon: Percent, badge: 0 },
    { to: '/admin/applications', label: 'Anträge', icon: FileText, badge: applicationBadge },
    { to: '/admin/offer-interests', label: 'Interessenten', icon: Send, badge: 0 },
    { to: '/admin/contracts', label: 'Depot', icon: WalletCards, badge: 0 },
    { to: '/admin/taxes', label: 'Steuern', icon: Scale, badge: taxBadge },
    { to: '/admin/support-mailbox', label: 'Support', icon: MessageSquareMore, badge: supportBadge },
    { to: '/admin/activity-feed', label: 'Aktivität', icon: Activity, badge: 0 },
  ]), [applicationBadge, supportBadge, taxBadge]);

  return (
    <div className="min-h-screen bg-slate-100">
    <header className="border-b border-white/10 bg-gradient-to-r from-[#0B1E33] via-[#0f2847] to-[#143455] text-white shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/assets/logo/h68-logo-white.png" alt="H68 Vermögensverwaltung" className="h-8 w-auto max-w-[220px]" />
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sky-200/85">Administration</p>
            <h1 className="text-lg font-semibold tracking-tight truncate">H68 Spar Direkt</h1>
          </div>
        </div>
        <Link
          to="/"
          className="text-sm text-slate-200 hover:text-white border border-white/25 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors shrink-0"
        >
          Zur Website
        </Link>
      </div>
    </header>

    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 lg:items-start">
      <nav
        aria-label="Admin-Navigation"
        className="flex lg:flex-col gap-1 overflow-x-auto lg:w-56 shrink-0 pb-1 lg:pb-0 lg:pr-4 lg:border-r border-slate-200/90 -mx-1 px-1 lg:mx-0 lg:px-0"
      >
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[#0B1E33] text-white shadow-sm'
                  : 'text-slate-600 bg-white/60 hover:bg-white hover:text-slate-900 border border-slate-200/80 hover:border-slate-300',
              ].join(' ')
            }
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0 opacity-90" />
            <span className="flex items-center gap-2">
              {label}
              {badge > 0 && (
                <span className="inline-flex min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  </div>
  );
};

export default AdminLayout;
