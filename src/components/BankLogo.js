import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

const BANK_LOGO_FALLBACKS = {
  knab: '/assets/bank-logos/knab.png',
};

const BankLogo = ({ logo, bankName, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const normalizedBankName = String(bankName || '').trim().toLowerCase();

  const sizeConfig = {
    sm: { container: 'w-10 h-10', icon: 18 },
    md: { container: 'w-12 h-12', icon: 22 },
    lg: { container: 'w-14 h-14', icon: 26 },
    xl: { container: 'w-16 h-16', icon: 30 },
  };
  const config = sizeConfig[size] || sizeConfig.md;
  const fallbackLogo = Object.entries(BANK_LOGO_FALLBACKS).find(([key]) => normalizedBankName.includes(key))?.[1] || null;
  const finalLogo = logo || fallbackLogo;

  const handleImageError = () => {
    setImageError(true);
  };

  // Show neutral bank icon placeholder if no logo or image error
  // Uses a professional, neutral design - NOT colored letter boxes
  if (!finalLogo || imageError) {
    return (
      <div 
        className={`${config.container} rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm ${className}`}
        data-testid={`bank-logo-${bankName?.toLowerCase().replace(/\s+/g, '-')}`}
        title={bankName}
      >
        <Building2 size={config.icon} className="text-slate-400" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div 
      className={`${config.container} rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ${className}`}
      title={bankName}
    >
      <img
        src={finalLogo}
        alt={`${bankName} logo`}
        className="w-full h-full object-contain p-1.5"
        onError={handleImageError}
        loading="lazy"
        data-testid={`bank-logo-${bankName?.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  );
};

export default BankLogo;
