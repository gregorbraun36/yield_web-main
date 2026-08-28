import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

const TrustBadge = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 ${className}`} data-testid="trust-badge">
      <Shield size={14} className="text-blue-600 mr-1.5" />
      <div className="flex flex-col">
        <div className="flex items-center">
          <CheckCircle2 size={12} className="text-green-600 mr-1" />
          <span className="text-xs font-semibold text-blue-900">EU-Einlagensicherung</span>
        </div>
        <span className="text-[10px] text-blue-700">bis €100.000</span>
      </div>
    </div>
  );
};

export default TrustBadge;
