import React from 'react';

const SectionCard = ({ title, icon: Icon, rightSlot = null, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${className}`}>
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={16} className="text-slate-500" /> : null}
        <h3 className="font-semibold text-[#0B1E33]">{title}</h3>
      </div>
      {rightSlot}
    </div>
    {children}
  </div>
);

export default SectionCard;
