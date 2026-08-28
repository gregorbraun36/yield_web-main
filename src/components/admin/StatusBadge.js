import React from 'react';

const COLOR_MAP = {
  aktiv: 'bg-green-50 text-green-700 border-green-200',
  offen: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_bearbeitung: 'bg-violet-50 text-violet-700 border-violet-200',
  geschlossen: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const StatusBadge = ({ value, label }) => {
  const normalized = `${value || ''}`.toLowerCase().replace(/\s+/g, '_');
  const className = COLOR_MAP[normalized] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${className}`}>
      {label || value || '—'}
    </span>
  );
};

export default StatusBadge;
