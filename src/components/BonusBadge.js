import React from 'react';
import { Gift } from 'lucide-react';

const BonusBadge = ({ 
  amount, 
  size = 'md',
  variant = 'sticker',
  className = '' 
}) => {
  if (!amount || amount <= 0) return null;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      icon: 12,
      text: 'text-[10px]',
      amount: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5',
      icon: 14,
      text: 'text-xs',
      amount: 'text-sm',
    },
    lg: {
      container: 'px-4 py-2',
      icon: 16,
      text: 'text-sm',
      amount: 'text-base',
    },
  };

  const s = sizeClasses[size];

  if (variant === 'sticker') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white ${s.container} rounded-full shadow-lg transform rotate-[-3deg] hover:rotate-0 transition-transform ${className}`}
        data-testid="bonus-badge"
      >
        <Gift size={s.icon} className="flex-shrink-0" />
        <span className={`font-bold ${s.amount} whitespace-nowrap`}>
          Bis zu €{amount}
        </span>
      </div>
    );
  }

  if (variant === 'ribbon') {
    return (
      <div 
        className={`absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg z-10 ${className}`}
        data-testid="bonus-badge-ribbon"
      >
        <div className="flex items-center gap-1">
          <Gift size={s.icon} />
          <span className={`font-bold ${s.text} whitespace-nowrap`}>
            +€{amount}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span 
        className={`inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full ${s.text} font-bold ${className}`}
        data-testid="bonus-badge-inline"
      >
        <Gift size={10} />
        +€{amount}
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div 
        className={`bg-gradient-to-r from-red-500 via-rose-500 to-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 ${className}`}
        data-testid="bonus-badge-banner"
      >
        <Gift size={s.icon} className="animate-pulse" />
        <span className={`font-bold ${s.amount} uppercase tracking-wide`}>
          Bonus bis zu €{amount}
        </span>
      </div>
    );
  }

  return null;
};

export default BonusBadge;
