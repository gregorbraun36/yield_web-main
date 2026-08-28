import React from 'react';

const SnapshotMetricCard = ({
  context,
  value,
  period,
  deltaLabel,
  deltaPositive = true,
  valueTitle,
}) => (
  <div className="min-w-0 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{context}</p>
    <p className="text-2xl xl:text-3xl font-semibold tracking-tight text-[#0B1E33]" title={valueTitle}>
      {value}
    </p>
    <div className="mt-1 flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500">{period}</p>
      {deltaLabel ? (
        <span className={`text-xs font-medium ${deltaPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {deltaLabel}
        </span>
      ) : null}
    </div>
  </div>
);

export default SnapshotMetricCard;
