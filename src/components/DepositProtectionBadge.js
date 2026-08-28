import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

const DepositProtectionBadge = ({ 
  protection, 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const extractAmount = (protectionString) => {
    if (!protectionString) return '€100.000';
    const match = protectionString.match(/€[\d,\.]+|SEK[\s\d,\.]+/);
    return match ? match[0] : '€100.000';
  };

  const amount = extractAmount(protection);
  const isEU = protection && !protection.includes('SEK');

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      shield: 14,
      text: 'text-[10px]',
      amount: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5',
      shield: 16,
      text: 'text-xs',
      amount: 'text-sm',
    },
    lg: {
      container: 'px-4 py-2',
      shield: 20,
      text: 'text-sm',
      amount: 'text-base',
    },
  };

  const variantClasses = {
    default: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      shield: 'text-blue-600',
      text: 'text-blue-800',
      check: 'text-green-500',
    },
    compact: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      shield: 'text-blue-600',
      text: 'text-blue-700',
      check: 'text-green-500',
    },
    highlight: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-300',
      shield: 'text-green-600',
      text: 'text-green-800',
      check: 'text-green-600',
    },
  };

  const s = sizeClasses[size];
  const v = variantClasses[variant];

  return (
    <div 
      className={`inline-flex items-center gap-2 ${v.bg} border ${v.border} rounded-lg ${s.container} ${className}`}
      data-testid="deposit-protection-badge"
    >
      <div className={`flex-shrink-0 ${v.shield}`}>
        <Shield size={s.shield} className="fill-current opacity-20" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className={v.check} />
          <span className={`font-semibold ${s.text} ${v.text}`}>
            {isEU ? 'EU-Einlagensicherung' : 'Einlagensicherung'}
          </span>
        </div>
        <span className={`font-bold ${s.amount} ${v.text}`}>
          bis {amount}
        </span>
      </div>
    </div>
  );
};

export default DepositProtectionBadge;
