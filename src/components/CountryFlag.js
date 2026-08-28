import React from 'react';

const CountryFlag = ({ country, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-4',
    md: 'w-6 h-5',
    lg: 'w-8 h-6'
  };

  const flagEmojis = {
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Austria': '🇦🇹'
  };

  return (
    <span 
      className={`inline-flex items-center justify-center text-xl ${sizeClasses[size]}`}
      title={country}
      data-testid={`flag-${country.toLowerCase()}`}
    >
      {flagEmojis[country] || '🇪🇺'}
    </span>
  );
};

export default CountryFlag;
