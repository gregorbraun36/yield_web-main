import React from 'react';
import BankLogo from '@/components/BankLogo';

const ProductContractCard = ({
  productLabel,
  bankName,
  bankLogo,
  termLabel,
  contractNumber,
  amount,
  interestRate,
  accrued,
  available,
  availabilityLabel,
  dailyEarningsLabel,
  startDate,
  endDate,
  lockEndDate,
  lockInfoLabel,
  daysLeft,
  daysLeftLabel,
  progress,
  note,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BankLogo logo={bankLogo} bankName={bankName} size="sm" />
            <p className="font-semibold text-slate-900 break-words">{bankName}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1 break-words">{productLabel} · {termLabel} · Vertragsnr. {contractNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xl md:text-2xl font-semibold tracking-tight text-[#0B1E33]">{interestRate}</p>
          <p className="text-xs text-emerald-700">Aktiv</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-5 py-4 text-sm">
        <div>
          <p className="text-slate-500">Anlagebetrag</p>
          <p className="font-semibold text-slate-900 break-words">{amount}</p>
        </div>
        <div>
          <p className="text-slate-500">Aufgelaufene Zinsen</p>
          <p className="font-semibold text-emerald-600 break-words">{accrued}</p>
        </div>
        <div>
          <p className="text-slate-500">{availabilityLabel || 'Aktuell verfügbar'}</p>
          <p className="font-semibold text-slate-900 break-words">{available}</p>
        </div>
        <div>
          <p className="text-slate-500">Tagesertrag</p>
          <p className="font-semibold text-emerald-600 break-words">{dailyEarningsLabel || '—'}</p>
        </div>
      </div>
      <div className={`grid grid-cols-1 ${lockEndDate ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4 px-5 pb-4 text-sm`}>
        <div>
          <p className="text-slate-500">Startdatum</p>
          <p className="font-medium text-slate-900">{startDate}</p>
        </div>
        {lockEndDate ? (
          <div>
            <p className="text-slate-500">Sperrfrist bis</p>
            <p className="font-medium text-slate-900">{lockEndDate}</p>
            {lockInfoLabel ? (
              <p className="text-xs text-amber-700 mt-1">{lockInfoLabel}</p>
            ) : null}
          </div>
        ) : null}
        <div>
          <p className="text-slate-500">Enddatum</p>
          <p className="font-medium text-slate-900">{endDate || 'Unbefristet'}</p>
        </div>
        <div>
          <p className="text-slate-500">{daysLeftLabel || 'Restlaufzeit'}</p>
          <p className="font-medium text-slate-900">{daysLeft}</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <p className="text-xs text-slate-500 mb-1">Laufzeit-Fortschritt</p>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-blue-700 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        {note ? <p className="text-xs text-slate-500 mt-2">{note}</p> : null}
      </div>
    </div>
  );
};

export default ProductContractCard;
