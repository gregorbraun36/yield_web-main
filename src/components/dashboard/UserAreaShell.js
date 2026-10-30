import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Headset } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProfileAvatar from '@/components/ProfileAvatar';

const UserAreaShell = ({
  navItems = [],
  activeKey,
  onNavSelect,
  topRight,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavClick = (item) => {
    if (onNavSelect) {
      onNavSelect(item);
      return;
    }
    if (item?.to) navigate(item.to);
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.email || 'Benutzer';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr]">
          <aside className="border-r border-slate-200 bg-white px-4 py-5 flex flex-col">
            <div className="pb-4 border-b border-slate-200">
              <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-8 w-auto max-w-full" />
              <p className="text-xs text-teal-600 mt-2">h68-invest.de</p>
            </div>

            <nav className="mt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey
                  ? activeKey === item.key
                  : (item.to ? location.pathname === item.to : false);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {Icon ? <Icon size={15} /> : null}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="rounded-lg border border-slate-700/35 bg-gradient-to-b from-[#0E2A4D] to-[#081B36] px-2.5 py-2 text-white shadow-[0_3px_10px_rgba(2,6,23,0.16)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <p className="text-[18px] font-semibold leading-tight">Fragen?</p>
                    <span className="inline-flex items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 p-1 text-cyan-200">
                      <Headset size={15} />
                    </span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-200 mt-0.5">Wir sind gerne für Sie da.</p>
                <a
                  href="tel:+493023320761"
                  className="mt-1.5 inline-block whitespace-nowrap text-[15px] font-semibold tracking-tight text-cyan-300 hover:text-cyan-200"
                >
                  +49 30 23320761
                </a>
                <p className="text-[11px] text-slate-200 mt-1">Mo. - Fr. 8 - 20 Uhr</p>
                <p className="text-[11px] text-slate-200">Sa. 10 - 16 Uhr</p>
              </div>
            </div>
          </aside>

          <main className="px-4 py-4 md:px-6 md:py-5">
            <div className="flex justify-end items-center mb-4">
              {topRight || (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard?section=profile')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ProfileAvatar avatarUrl={user?.avatar_url} fullName={fullName} size="sm" />
                  <span className="truncate max-w-[180px]">{fullName}</span>
                </button>
              )}
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserAreaShell;
