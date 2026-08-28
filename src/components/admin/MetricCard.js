import React from 'react';

const MetricCard = ({ label, value, hint }) => {
  return (
    <div className="min-w-0 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className="text-2xl xl:text-3xl font-semibold tracking-tight text-[#0B1E33] leading-tight break-words">{value}</p>
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
};

export default MetricCard;
