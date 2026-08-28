import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Globe, 
  Percent, 
  Calendar, 
  Wallet, 
  Shield, 
  Clock, 
  Euro,
  Info,
  AlertTriangle,
  FileText,
  Landmark,
  X
} from 'lucide-react';
import BankLogo from './BankLogo';
import { formatEur } from '@/lib/currency';

const OfferDetailModal = ({ offer, isOpen, onClose, onInterestClick, onInterest }) => {
  if (!offer) return null;
  const handleInterestClick =
    typeof onInterestClick === 'function'
      ? onInterestClick
      : typeof onInterest === 'function'
        ? onInterest
        : null;

  // Helper function to get deposit protection details
  const getProtectionDetails = () => {
    const country = offer.country;
    const protectionAuthorities = {
      'Germany': 'Entschädigungseinrichtung deutscher Banken GmbH (EdB)',
      'France': 'Fonds de Garantie des Dépôts et de Résolution (FGDR)',
      'Italy': 'Fondo Interbancario di Tutela dei Depositi (FITD)',
      'Spain': 'Fondo de Garantía de Depósitos de Entidades de Crédito (FGD)',
      'Netherlands': 'De Nederlandsche Bank (DNB)',
      'Austria': 'Einlagensicherung Austria Ges.m.b.H.',
      'Belgium': 'Fonds de Garantie des Dépôts et de Résolution',
      'Sweden': 'Riksgälden (Swedish National Debt Office)',
    };
    return offer.deposit_protection_authority || protectionAuthorities[country] || 'Nationale Einlagensicherung';
  };

  const getTermLabel = () => {
    if (offer.deposit_term === 0 || offer.investment_type === 'Tagesgeld') {
      return 'Täglich verfügbar';
    }
    return `${offer.deposit_term} Monate`;
  };

  const getInvestmentType = () => {
    return offer.investment_type || (offer.deposit_term === 0 ? 'Tagesgeld' : 'Festgeld');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-0">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <BankLogo logo={offer.bank_logo} bankName={offer.bank_name} size="lg" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{offer.bank_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Globe size={14} className="text-slate-500" />
                  <span className="text-sm text-slate-600">{offer.country}</span>
                  <span className="text-slate-300 mx-1">|</span>
                  <span className="text-sm font-medium text-blue-600">{getInvestmentType()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{offer.interest_rate}%</div>
              <div className="text-sm text-slate-500">p.a.</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Calendar size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Laufzeit</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">{getTermLabel()}</div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Wallet size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Mindestanlage</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">{formatEur(offer.min_deposit)}</div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Wallet size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Höchstanlage</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {offer.max_deposit ? formatEur(offer.max_deposit) : 'Keine Obergrenze'}
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Euro size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Währung</span>
              </div>
              <div className="text-lg font-semibold text-slate-900">EUR</div>
            </div>
          </div>

          {/* Interest Payment */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900">Zinszahlung</h3>
            </div>
            <p className="text-slate-700">
              {offer.interest_frequency || 'Am Ende der Laufzeit'}
            </p>
          </div>

          {/* Product Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-slate-600" />
              <h3 className="font-semibold text-slate-900">Produktbeschreibung</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {offer.description || `${getInvestmentType()} der ${offer.bank_name} mit einem Zinssatz von ${offer.interest_rate}% p.a. für eine Laufzeit von ${getTermLabel()}.`}
            </p>
          </div>

          {/* Investment Conditions */}
          {offer.investment_conditions && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">Anlagebedingungen</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{offer.investment_conditions}</p>
            </div>
          )}

          {/* Early Withdrawal */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="font-semibold text-slate-900">Vorzeitige Verfügung</h3>
            </div>
            <p className="text-slate-700 text-sm">
              {offer.early_withdrawal || (getInvestmentType() === 'Tagesgeld' 
                ? 'Bei Tagesgeld ist das Guthaben jederzeit verfügbar.'
                : 'Bei Festgeld ist eine vorzeitige Kündigung in der Regel nicht möglich oder mit Zinsverlusten verbunden. Bitte informieren Sie sich vor Abschluss über die genauen Bedingungen.'
              )}
            </p>
          </div>

          {/* Deposit Protection */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-green-600" />
              <h3 className="font-semibold text-slate-900">Einlagensicherung</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sicherungsbetrag:</span>
                <span className="font-medium text-slate-900">{offer.deposit_protection_amount || '€100.000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Land:</span>
                <span className="font-medium text-slate-900">{offer.deposit_protection_country || offer.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sicherungseinrichtung:</span>
                <span className="font-medium text-slate-900 text-right">{getProtectionDetails()}</span>
              </div>
            </div>
          </div>

          {/* Risk Information */}
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={18} className="text-slate-600" />
              <h3 className="font-semibold text-slate-900">Wichtige Hinweise</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Einlagen sind bis zu €100.000 pro Kunde und Bank durch die EU-Einlagensicherung geschützt.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Dieses Angebot wird von einer Partnerbank bereitgestellt. H68 Spar Direkt ist ein Vermittler und kein Kreditinstitut.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Zinssätze und Konditionen können sich ändern. Die angezeigten Informationen erheben keinen Anspruch auf Vollständigkeit.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1 border-slate-300"
              onClick={onClose}
              data-testid="offer-detail-close-btn"
            >
              Schließen
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onInterestClick(offer)}
              data-testid="offer-detail-interest-btn"
            >
              Interesse an diesem Angebot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDetailModal;
