import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Shield,
  Check,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  Info,
  Building2,
  Lightbulb
} from 'lucide-react';

const BBVAContractForm = () => {
  const formRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal Data
    salutation: '',
    fullName: '',
    birthDate: '',
    birthPlace: '',
    nationality: 'Deutschland',
    street: '',
    postalCode: '',
    phone: '',
    mobile: '',
    email: '',
    taxId: '',
    
    // Company data (optional)
    registryCourt: '',
    registryNumber: '',
    
    // Identification
    idType: 'personalausweis',
    idNumber: '',
    idIssuedDate: '',
    idValidUntil: '',
    idAuthority: '',
    
    // Investment
    investmentAmount: '10000',
    term: '1',
    interestPayment: 'maturity',
    
    // Reference account
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: '',
    
    // Confirmations
    agbAccepted: false,
    privacyAccepted: false,
    productInfoAccepted: false,
    depositProtectionAccepted: false,
    withdrawalRightAccepted: false,
    correctnessConfirmed: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const interestRates = {
    '1': '2,50%',
    '2': '3,00%',
    '3': '3,25%',
    '5': '3,75%'
  };

  const allConfirmationsAccepted = 
    formData.agbAccepted && 
    formData.privacyAccepted && 
    formData.productInfoAccepted && 
    formData.depositProtectionAccepted && 
    formData.withdrawalRightAccepted && 
    formData.correctnessConfirmed;

  return (
    <div className="min-h-screen bg-white">
      {/* Print-only header */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { font-size: 11pt; }
            .print-page-break { page-break-before: always; }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `}
      </style>
      
      <main className="py-8 px-4 md:px-8 max-w-[900px] mx-auto" ref={formRef}>
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b-4 border-[#003366] mb-8">
          <div>
            <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto mb-3" />
            <h1 className="text-4xl font-bold text-[#003366] tracking-wider">BBVA</h1>
            <p className="text-sm text-gray-500">Banco Bilbao Vizcaya Argentaria</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#003366]">Festgeldvertrag</h2>
            <p className="text-sm text-gray-500 italic">Ihr sicherer Weg zu planbaren Erträgen</p>
          </div>
        </header>

        {/* Contract Info Bar */}
        <div className="bg-[#e6f0fa] p-4 md:p-5 rounded-lg mb-8 flex flex-col md:flex-row gap-4 md:gap-10">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Vertrags-Nummer</span>
            <p className="text-lg font-semibold text-[#003366]">FG-2026-____________</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Vertragsdatum</span>
            <p className="text-lg font-semibold text-[#003366]">{new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

        {/* Introduction Box */}
        <div className="bg-gradient-to-br from-[#003366] to-[#004d99] text-white p-6 md:p-8 rounded-xl mb-10">
          <h3 className="text-xl font-semibold mb-4">Festgeldanlage mit garantierter Verzinsung</h3>
          <p className="text-sm opacity-95 mb-5 leading-relaxed">
            Dieser Vertrag regelt die Bedingungen für die Anlage von Festgeld bei Banco Bilbao Vizcaya Argentaria, S.A. 
            Durch die Unterzeichnung dieses Vertrages erklären sich beide Parteien mit den nachfolgenden Bedingungen einverstanden.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'Attraktive Festzinsen über die gesamte Laufzeit',
              'Planbare Erträge durch feste Verzinsung',
              'Einlagensicherung bis 100.000 EUR',
              'Flexible Laufzeiten von 1 bis 5 Jahren',
              'Transparente Vertragsbedingungen'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: Customer Information */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
            <h3 className="text-lg font-semibold text-[#003366]">Kundeninformationen</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-5">
            Bitte füllen Sie alle Felder aus. Pflichtfelder sind mit * gekennzeichnet.
          </p>

          {/* Salutation */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Label className="font-semibold text-[#003366] mb-3 block">Anrede *</Label>
            <RadioGroup 
              value={formData.salutation} 
              onValueChange={(val) => handleInputChange('salutation', val)}
              className="flex flex-wrap gap-6"
            >
              {['Frau', 'Herr', 'Firma'].map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem value={option.toLowerCase()} id={option} />
                  <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Personal Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-[#003366]">Name, Vorname / Firma *</Label>
                <Input 
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="mt-1"
                  data-testid="input-full-name"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">Geburtsdatum / Gründungsdatum *</Label>
                <DatePicker
                  date={formData.birthDate}
                  setDate={(date) => handleInputChange('birthDate', date)}
                  id="birth-date"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">Geburtsort / Sitz *</Label>
                <Input 
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  className="mt-1"
                  data-testid="input-birth-place"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">Staatsangehörigkeit *</Label>
                <Input 
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="mt-1"
                  data-testid="input-nationality"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-[#003366]">Straße / Nr. *</Label>
                <Input 
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="mt-1"
                  data-testid="input-street"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">PLZ / Ort *</Label>
                <Input 
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="mt-1"
                  data-testid="input-postal-code"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">Telefon *</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label className="font-semibold text-[#003366]">Mobil</Label>
                <Input 
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="mt-1"
                  data-testid="input-mobile"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="font-semibold text-[#003366]">E-Mail-Adresse *</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">Steueridentifikationsnummer *</Label>
              <Input 
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="11-stellige Steuer-ID"
                className="mt-1"
                data-testid="input-tax-id"
              />
            </div>
          </div>

          {/* Company Info Box */}
          <div className="bg-gray-100 p-4 rounded-lg mt-6 flex gap-4">
            <Building2 className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-[#003366] mb-3">Zusatzangaben für Unternehmen</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Registergericht</Label>
                  <Input 
                    value={formData.registryCourt}
                    onChange={(e) => handleInputChange('registryCourt', e.target.value)}
                    className="mt-1"
                    data-testid="input-registry-court"
                  />
                </div>
                <div>
                  <Label className="text-sm">Register-Nr.</Label>
                  <Input 
                    value={formData.registryNumber}
                    onChange={(e) => handleInputChange('registryNumber', e.target.value)}
                    className="mt-1"
                    data-testid="input-registry-number"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Identification */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
            <h3 className="text-lg font-semibold text-[#003366]">Legitimation</h3>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Label className="font-semibold text-[#003366] mb-3 block">Legitimiert durch *</Label>
            <RadioGroup 
              value={formData.idType} 
              onValueChange={(val) => handleInputChange('idType', val)}
              className="flex flex-wrap gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="personalausweis" id="personalausweis" />
                <Label htmlFor="personalausweis" className="cursor-pointer">Personalausweis</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="reisepass" id="reisepass" />
                <Label htmlFor="reisepass" className="cursor-pointer">Reisepass</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-[#003366]">Ausweis-Nr. *</Label>
              <Input 
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                className="mt-1"
                data-testid="input-id-number"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">Ausgestellt am *</Label>
              <DatePicker
                date={formData.idIssuedDate}
                setDate={(date) => handleInputChange('idIssuedDate', date)}
                id="id-issued"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">Gültig bis *</Label>
              <DatePicker
                date={formData.idValidUntil}
                setDate={(date) => handleInputChange('idValidUntil', date)}
                id="id-valid"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">Behörde / Ort *</Label>
              <Input 
                value={formData.idAuthority}
                onChange={(e) => handleInputChange('idAuthority', e.target.value)}
                className="mt-1"
                data-testid="input-id-authority"
              />
            </div>
          </div>

          <div className="bg-[#e6f0fa] p-4 rounded-lg mt-5 flex gap-3 border-l-4 border-[#0066cc]">
            <Info className="w-5 h-5 text-[#0066cc] flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="text-[#003366]">Hinweis zur Legitimationsprüfung:</strong> Gemäß Geldwäschegesetz ist die BBVA 
              verpflichtet, die Identität des Kunden zu überprüfen. Die Legitimationsprüfung kann per PostIdent- oder VideoIdent-Verfahren durchgeführt werden.
            </p>
          </div>
        </section>

        {/* Section 3: Investment Details */}
        <section className="mb-10 print-page-break">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
            <h3 className="text-lg font-semibold text-[#003366]">Details zur Festgeldanlage</h3>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <Label className="font-semibold text-[#003366] mb-2 block">Anlagebetrag (in EUR) *</Label>
            <div className="flex items-center gap-3">
              <Input 
                type="number"
                value={formData.investmentAmount}
                onChange={(e) => handleInputChange('investmentAmount', e.target.value)}
                className="text-2xl font-semibold text-[#003366] w-48"
                min="1000"
                data-testid="input-investment-amount"
              />
              <span className="text-xl font-semibold text-[#003366]">EUR</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Mindestbetrag: 1000 EUR</p>
          </div>

          <h4 className="text-base font-semibold text-[#003366] mb-4">Laufzeit und Zinssatz * (bitte auswählen)</h4>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#003366] text-white">
                  <th className="p-4 text-left font-semibold">Laufzeit</th>
                  <th className="p-4 text-center font-semibold">Zinssatz p.a.</th>
                  <th className="p-4 text-center font-semibold w-24">Auswahl</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { term: '1', years: '1 Jahr', rate: '2,50%' },
                  { term: '2', years: '2 Jahre', rate: '3,00%' },
                  { term: '3', years: '3 Jahre', rate: '3,25%' },
                  { term: '5', years: '5 Jahre', rate: '3,75%' }
                ].map((row, idx) => (
                  <tr 
                    key={row.term} 
                    className={`border border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#e6f0fa] cursor-pointer transition-colors`}
                    onClick={() => handleInputChange('term', row.term)}
                  >
                    <td className="p-4 font-medium">{row.years}</td>
                    <td className="p-4 text-center">
                      <span className="text-xl font-bold text-green-600">{row.rate}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div 
                        className={`w-6 h-6 border-2 rounded mx-auto flex items-center justify-center transition-all ${
                          formData.term === row.term 
                            ? 'border-[#003366] bg-[#003366]' 
                            : 'border-[#003366]'
                        }`}
                        data-testid={`select-term-${row.term}`}
                      >
                        {formData.term === row.term && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-base font-semibold text-[#003366] mt-6 mb-4">Zinsgutschrift *</h4>

          <RadioGroup 
            value={formData.interestPayment} 
            onValueChange={(val) => handleInputChange('interestPayment', val)}
            className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yearly" id="yearly" />
              <Label htmlFor="yearly" className="cursor-pointer">Jährliche Auszahlung</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="maturity" id="maturity" />
              <Label htmlFor="maturity" className="cursor-pointer">
                Auszahlung bei Fälligkeit <span className="text-gray-500 italic">(empfohlen für maximale Erträge)</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="bg-amber-50 p-4 rounded-lg mt-5 flex gap-3 border-l-4 border-amber-500">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="text-amber-700">Wichtiger Hinweis:</strong> Die Festgeldanlage ist für die vereinbarte Laufzeit fest angelegt. 
              Eine vorzeitige Verfügung ist grundsätzlich nicht möglich. Bei Fälligkeit wird der Anlagebetrag zuzüglich der Zinsen auf Ihr Referenzkonto überwiesen.
            </p>
          </div>
        </section>

        {/* Section 4: Reference Account */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
            <h3 className="text-lg font-semibold text-[#003366]">Referenzkonto für Auszahlung</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="font-semibold text-[#003366]">Kontoinhaber *</Label>
              <Input 
                value={formData.accountHolder}
                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                className="mt-1"
                data-testid="input-account-holder"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="font-semibold text-[#003366]">IBAN *</Label>
              <Input 
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                placeholder="DE__ ____ ____ ____ ____ __"
                className="mt-1 font-mono tracking-wider"
                data-testid="input-iban"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">BIC *</Label>
              <Input 
                value={formData.bic}
                onChange={(e) => handleInputChange('bic', e.target.value)}
                className="mt-1 font-mono"
                data-testid="input-bic"
              />
            </div>
            <div>
              <Label className="font-semibold text-[#003366]">Kreditinstitut</Label>
              <Input 
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="mt-1"
                data-testid="input-bank-name"
              />
            </div>
          </div>
        </section>

        {/* Section 5: Deposit Protection */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">5</span>
            <h3 className="text-lg font-semibold text-[#003366]">Einlagensicherung</h3>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border border-green-300 flex gap-4 items-center">
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-green-800 mb-1">Ihre Einlagen sind geschützt bis 100.000 EUR</h4>
              <p className="text-sm text-green-700">
                Die Einlagen der BBVA sind durch das gesetzliche Einlagensicherungssystem der Bundesanstalt für 
                Finanzdienstleistungsaufsicht (BaFin) geschützt. Darüber hinaus ist die BBVA Mitglied im 
                Einlagensicherungsfonds des Bundesverbandes deutscher Banken.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Tax Information */}
        <section className="mb-10 print-page-break">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">6</span>
            <h3 className="text-lg font-semibold text-[#003366]">Steuerliche Informationen</h3>
          </div>

          <div className="mb-5">
            <h4 className="text-base font-semibold text-[#003366] mb-2 pb-2 border-b border-gray-200">§8 Steuerliche Behandlung</h4>
            <p className="text-sm text-gray-600 leading-relaxed text-justify">
              Kapitalerträge unterliegen der Kapitalertragsteuer (25%) zuzüglich Solidaritätszuschlag (5,5%) und ggf. Kirchensteuer. 
              Die BBVA führt diese Steuern direkt an das Finanzamt ab, sofern kein ausreichender Freistellungsauftrag vorliegt. 
              Der jährliche Sparer-Pauschbetrag beträgt 1.000 EUR (2.000 EUR bei Zusammenveranlagung). 
              Kunden sind selbst für die Einhaltung ihrer steuerlichen Pflichten verantwortlich.
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg flex gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="text-[#003366]">Tipp:</strong> Erteilen Sie einen Freistellungsauftrag, um den Sparer-Pauschbetrag von 1.000 EUR 
              (bzw. 2.000 EUR bei Zusammenveranlagung) optimal zu nutzen.
            </p>
          </div>
        </section>

        {/* Section 7: Legal Terms (collapsed for online, full for print) */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">7</span>
            <h3 className="text-lg font-semibold text-[#003366]">Rechtliche Belehrung und Vertragsbedingungen</h3>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            {[
              { title: '§1 Vertragsgegenstand', content: 'Mit diesem Festgeldvertrag verpflichtet sich der Kunde, den vereinbarten Geldbetrag für die Dauer der vereinbarten Laufzeit bei der BBVA Deutschland anzulegen. Die BBVA verpflichtet sich zur Verzinsung des Anlagebetrags zum vereinbarten festen Zinssatz.' },
              { title: '§2 Zinsen und Verzinsung', content: 'Die Verzinsung erfolgt zum vereinbarten festen Zinssatz für die gesamte Laufzeit. Die Zinsen werden wahlweise jährlich oder am Ende der Laufzeit zusammen mit dem Anlagebetrag ausgezahlt. Der Zinssatz ist für die gesamte Laufzeit garantiert.' },
              { title: '§3 Auszahlung und Fälligkeit', content: 'Bei Fälligkeit des Festgeldkontos wird der Anlagebetrag zuzüglich der angefallenen Zinsen auf das vom Kunden angegebene Referenzkonto überwiesen. Eine automatische Verlängerung erfolgt nicht.' },
              { title: '§4 Vorzeitige Verfügung', content: 'Eine vorzeitige Verfügung über den Anlagebetrag ist grundsätzlich nicht möglich. In begründeten Ausnahmefällen kann die BBVA nach billigem Ermessen eine vorzeitige Auflösung zulassen.' },
              { title: '§5 Widerrufsrecht', content: 'Der Kunde hat das Recht, diese Vertragserklärung innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen. Der Widerruf ist zu richten an: BBVA Deutschland, Junghofstraße 26, 60311 Frankfurt am Main.' },
              { title: '§9 Datenschutz', content: 'Die BBVA verarbeitet personenbezogene Daten des Kunden zur Vertragserfüllung und zur Einhaltung gesetzlicher Verpflichtungen. Kunden haben gemäß DSGVO ein Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit.' }
            ].map((item, idx) => (
              <div key={idx} className="pb-3 border-b border-gray-100">
                <h4 className="text-base font-semibold text-[#003366] mb-1">{item.title}</h4>
                <p className="leading-relaxed text-justify">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Confirmations */}
        <section className="mb-10 print-page-break">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">8</span>
            <h3 className="text-lg font-semibold text-[#003366]">Vertragsbestätigung</h3>
          </div>

          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Mit meiner Unterschrift bestätige ich, dass ich die Vertragsunterlagen, insbesondere die rechtliche 
            Belehrung, die Allgemeinen Geschäftsbedingungen und die Datenschutzinformation erhalten und zur 
            Kenntnis genommen habe. Ich erkläre mich mit den Vertragsbedingungen einverstanden.
          </p>

          <h4 className="text-base font-semibold text-[#003366] mb-4">Bestätigungen (bitte ankreuzen):</h4>

          <div className="space-y-3">
            {[
              { key: 'agbAccepted', text: 'Ich habe die Allgemeinen Geschäftsbedingungen der BBVA erhalten und zur Kenntnis genommen.' },
              { key: 'privacyAccepted', text: 'Ich habe die Datenschutzinformation erhalten und zur Kenntnis genommen.' },
              { key: 'productInfoAccepted', text: 'Ich habe das Produktinformationsblatt zum Festgeld erhalten.' },
              { key: 'depositProtectionAccepted', text: 'Ich wurde über die Einlagensicherung informiert.' },
              { key: 'withdrawalRightAccepted', text: 'Ich wurde über das 14-tägige Widerrufsrecht belehrt.' },
              { key: 'correctnessConfirmed', text: 'Ich bestätige die Richtigkeit aller gemachten Angaben.' }
            ].map((item) => (
              <div 
                key={item.key}
                className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleCheckboxChange(item.key)}
              >
                <Checkbox 
                  checked={formData[item.key]}
                  onCheckedChange={() => handleCheckboxChange(item.key)}
                  className="mt-0.5"
                  data-testid={`checkbox-${item.key}`}
                />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 9: Signatures */}
        <section className="mb-10 pt-8 border-t-2 border-[#003366]">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#003366]">
            <span className="w-8 h-8 bg-[#003366] text-white rounded-full flex items-center justify-center font-bold text-sm">9</span>
            <h3 className="text-lg font-semibold text-[#003366]">Unterschriften</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="text-center">
              <div className="h-16 border-b border-gray-800 mb-2"></div>
              <p className="text-sm text-gray-500">Ort, Datum</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-800 mb-2"></div>
              <p className="text-sm text-gray-500">Unterschrift Kunde</p>
            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-gray-300">
            <h4 className="text-base font-semibold text-[#003366] mb-5">Für die BBVA Deutschland:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="text-center">
                <div className="h-16 border-b border-gray-800 mb-2"></div>
                <p className="text-sm text-gray-500">Ort, Datum</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-gray-800 mb-2"></div>
                <p className="text-sm text-gray-500">Unterschrift Bankvertreter</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 mt-12 border-t-4 border-[#003366] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <strong className="text-[#003366]">BBVA Deutschland</strong><br />
            Junghofstraße 26 | 60311 Frankfurt am Main<br />
            Tel: +49 (0) 69/27 40-0 | E-Mail: info@bbva.de | www.bbva.de
          </div>
          <div className="text-sm text-gray-500">
            Festgeldvertrag | Stand: Dezember 2025
          </div>
        </footer>

        {/* Action Buttons (no-print) */}
        <div className="no-print mt-10 pt-6 border-t flex flex-col md:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex items-center gap-2"
            data-testid="btn-print"
          >
            <Printer className="w-4 h-4" />
            Formular drucken
          </Button>
          <Button 
            disabled={!allConfirmationsAccepted}
            className="bg-[#003366] hover:bg-[#004d99] flex items-center gap-2"
            data-testid="btn-submit"
          >
            <FileText className="w-4 h-4" />
            {allConfirmationsAccepted ? 'Antrag einreichen' : 'Bitte alle Bestätigungen ankreuzen'}
          </Button>
        </div>
      </main>

      <div className="no-print">
      </div>
    </div>
  );
};

export default BBVAContractForm;
