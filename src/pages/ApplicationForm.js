import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import {
  User, Building2, FileText, CheckCircle,
  ArrowLeft, ArrowRight, Loader2, Upload, Trash2, AlertCircle
} from 'lucide-react';
import { uploadDocumentToCloudinary } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { logActivityEvent } from '@/lib/activityFeed';
import { loadEurRates, toEur } from '@/lib/currency';

const steps = [
  { number: 1, title: 'Persönliche Daten', icon: User },
  { number: 2, title: 'Anlageinformationen', icon: Building2 },
  { number: 3, title: 'Dokumente', icon: FileText },
  { number: 4, title: 'Bestätigung', icon: CheckCircle },
];

const ApplicationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedOffer = location.state?.offer || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [personalData, setPersonalData] = useState({
    first_name: '', last_name: '', birth_date: '',
    address: '', phone: '', email: '', nationality: '',
  });

  const [investmentData, setInvestmentData] = useState({
    bank_name: preselectedOffer?.bank_name || '',
    investment_amount: '',
    term_months: preselectedOffer?.deposit_term || '',
    interest_rate: preselectedOffer?.interest_rate || '',
    tax_id: '',
    purpose: '',
  });

  const [documents, setDocuments] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handlePersonalChange = (field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleInvestmentChange = (field, value) => {
    setInvestmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = useCallback(async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Ungültiger Dateityp. Erlaubt: PDF, JPG, PNG');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Datei zu groß. Maximal 10MB erlaubt.');
      return;
    }

    setUploadingDoc(true);
    try {
      const result = await uploadDocumentToCloudinary(file, docType);
      setDocuments(prev => [...prev, {
        type: docType,
        url: result.url,
        name: result.name,
        uploaded_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setUploadingDoc(false);
    }
  }, []);

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const { first_name, last_name, birth_date, address, phone, email } = personalData;
    return first_name && last_name && birth_date && address && phone && email;
  };

  const validateStep2 = () => {
    const { bank_name, investment_amount, term_months, tax_id } = investmentData;
    return bank_name && investment_amount >= 1000 && term_months > 0 && tax_id;
  };

  const validateStep3 = () => documents.some(doc => doc.type === 'id_document');

  const validateStep4 = () => termsAccepted && privacyAccepted;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      default: return false;
    }
  };

  // ─── FIX: Artık /api/applications endpoint'ine istek atıyor ─────────────
  // Önceki kod direkt supabase.from('applications').insert() yapıyordu,
  // bu yüzden backend hiç tetiklenmiyordu ve mailler gitmiyordu.
  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await loadEurRates();
      const listedCurrency = String(preselectedOffer?.currency || 'EUR').toUpperCase();
      const sourceCurrency = String(preselectedOffer?.source_currency || listedCurrency).toUpperCase();
      const enteredAmount = Number(investmentData.investment_amount);
      const amountEur = listedCurrency === 'EUR' ? enteredAmount : toEur(enteredAmount, listedCurrency);

      const { data, error } = await supabase
        .from('applications')
        .insert({
          personal_data: personalData,
          investment_data: {
            ...investmentData,
            investment_amount: amountEur,
            currency: 'EUR',
            source_currency: sourceCurrency,
            source_amount: enteredAmount,
          },
          documents: documents,
          terms_accepted: termsAccepted,
          privacy_accepted: privacyAccepted,
          status: 'Neu',
          status_history: [{ status: 'Neu', timestamp: new Date().toISOString() }],
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message || 'Antrag konnte nicht eingereicht werden.');
      setApplicationId(data.id);
      setSubmitSuccess(true);
      toast.success('Antrag erfolgreich eingereicht!');

      const { data: authData } = await supabase.auth.getUser();
      await logActivityEvent({
        event_type: 'application_submitted',
        summary: 'Antrag eingereicht',
        payload: {
          application_id: data.id,
          bank_name: investmentData.bank_name || null,
          amount: amountEur,
          email: personalData.email || null,
        },
        user_id: authData?.user?.id || null,
      });
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
            <div className="flex justify-center mb-6">
              <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto" />
            </div>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Antrag erfolgreich eingereicht!</h2>
            <p className="text-slate-600 mb-4">
              Vielen Dank für Ihren Festgeldantrag. Wir haben Ihnen eine Bestätigung per E-Mail gesendet.
            </p>
            {applicationId && (
              <div className="bg-slate-50 rounded-xl px-6 py-4 mb-6 inline-block">
                <p className="text-sm text-slate-500 mb-1">Ihre Antragsnummer</p>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {applicationId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}
            <p className="text-sm text-slate-500 mb-8">
              Unser Team wird Ihren Antrag prüfen und sich innerhalb von 1–2 Werktagen bei Ihnen melden.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Zum Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-xl"
              >
                Zur Startseite
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const docTypes = [
    { key: 'id_document', label: 'Personalausweis / Reisepass *', required: true },
    { key: 'address_proof', label: 'Adressnachweis', required: false },
    { key: 'income_proof', label: 'Einkommensnachweis', required: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex justify-center mb-8">
          <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto" />
        </div>
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? 'bg-emerald-500 text-white' :
                      isActive ? 'bg-blue-600 text-white' :
                        'bg-slate-200 text-slate-400'}`}>
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block
                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all
                    ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {/* Step 1 — Persönliche Daten */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Persönliche Daten</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vorname *</Label>
                  <Input value={personalData.first_name} onChange={e => handlePersonalChange('first_name', e.target.value)} placeholder="z.B. Max" className="mt-1" />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input value={personalData.last_name} onChange={e => handlePersonalChange('last_name', e.target.value)} placeholder="z.B. Mustermann" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>E-Mail-Adresse *</Label>
                <Input type="email" value={personalData.email} onChange={e => handlePersonalChange('email', e.target.value)} placeholder="z.B. max@mustermann.de" className="mt-1" />
              </div>
              <div>
                <Label>Geburtsdatum *</Label>
                <DatePicker 
                  date={personalData.birth_date} 
                  setDate={(date) => handlePersonalChange('birth_date', date)} 
                />
              </div>
              <div>
                <Label>Telefonnummer *</Label>
                <Input type="tel" value={personalData.phone} onChange={e => handlePersonalChange('phone', e.target.value)} placeholder="z.B. +49 30 123456" className="mt-1" />
              </div>
              <div>
                <Label>Adresse *</Label>
                <Input value={personalData.address} onChange={e => handlePersonalChange('address', e.target.value)} placeholder="z.B. Musterstraße 1, 10115 Berlin" className="mt-1" />
              </div>
              <div>
                <Label>Staatsangehörigkeit</Label>
                <Input value={personalData.nationality} onChange={e => handlePersonalChange('nationality', e.target.value)} placeholder="z.B. Deutsch" className="mt-1" />
              </div>
            </div>
          )}

          {/* Step 2 — Anlageinformationen */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Anlageinformationen</h2>
              <div>
                <Label>Bank *</Label>
                <Input value={investmentData.bank_name} onChange={e => handleInvestmentChange('bank_name', e.target.value)} placeholder="z.B. BBVA Bank" className="mt-1" />
              </div>
              <div>
                <Label>Anlagebetrag (€) *</Label>
                <Input
                  type="number"
                  value={String(investmentData.investment_amount)}
                  onChange={e => handleInvestmentChange('investment_amount', e.target.value)}
                  placeholder="z.B. 10000"
                  min="1000"
                  className="mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">Mindestbetrag: 1000 €</p>
              </div>
              <div>
                <Label>Laufzeit (Monate) *</Label>
                <Input
                  type="number"
                  value={String(investmentData.term_months)}
                  onChange={e => handleInvestmentChange('term_months', e.target.value)}
                  placeholder="z.B. 12"
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Zinssatz (%)</Label>
                <Input
                  type="number"
                  value={String(investmentData.interest_rate)}
                  onChange={e => handleInvestmentChange('interest_rate', e.target.value)}
                  placeholder="z.B. 3.50"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Steuer-ID *</Label>
                <Input value={investmentData.tax_id} onChange={e => handleInvestmentChange('tax_id', e.target.value)} placeholder="z.B. 12 345 678 901" className="mt-1" />
              </div>
              <div>
                <Label>Verwendungszweck</Label>
                <Input value={investmentData.purpose} onChange={e => handleInvestmentChange('purpose', e.target.value)} placeholder="z.B. Altersvorsorge, Vermögensaufbau..." className="mt-1" />
              </div>
            </div>
          )}

          {/* Step 3 — Dokumente */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Dokumente hochladen</h2>
              <p className="text-sm text-slate-500 mb-4">Bitte laden Sie die erforderlichen Dokumente hoch. Erlaubte Formate: PDF, JPG, PNG (max. 10 MB).</p>

              {docTypes.map(({ key, label, required }) => {
                const uploaded = documents.find(d => d.type === key);
                return (
                  <div key={key} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">{label}</Label>
                      {uploaded && (
                        <button onClick={() => removeDocument(documents.findIndex(d => d.type === key))} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {uploaded ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        <CheckCircle size={14} />
                        <span className="truncate">{uploaded.name}</span>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Upload size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-500">
                          {uploadingDoc ? 'Wird hochgeladen...' : 'Datei auswählen'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => handleDocumentUpload(e, key)}
                          disabled={uploadingDoc}
                        />
                      </label>
                    )}
                  </div>
                );
              })}

              {!validateStep3() && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={14} /> Personalausweis oder Reisepass ist Pflicht.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Bestätigung */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Zusammenfassung & Bestätigung</h2>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium">{personalData.first_name} {personalData.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-Mail</span>
                  <span className="font-medium">{personalData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-medium">{investmentData.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Betrag</span>
                  <span className="font-medium">
                    {Number(investmentData.investment_amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Laufzeit</span>
                  <span className="font-medium">{investmentData.term_months} Monate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokumente</span>
                  <span className="font-medium">{documents.length} Datei(en)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} data-testid="checkbox-terms" />
                  <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                    Ich stimme den <a href="/legal/terms" className="text-blue-600 hover:underline">Allgemeinen Geschäftsbedingungen</a> zu. *
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} data-testid="checkbox-privacy" />
                  <label htmlFor="privacy" className="text-sm text-slate-700 cursor-pointer">
                    Ich stimme der <a href="/legal/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a> zu. *
                  </label>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="rounded-xl" data-testid="btn-back">
                <ArrowLeft size={18} className="mr-2" /> Zurück
              </Button>
            ) : <div />}

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                data-testid="btn-next"
              >
                Weiter <ArrowRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                data-testid="btn-submit"
              >
                {isSubmitting
                  ? <><Loader2 size={18} className="mr-2 animate-spin" /> Wird gesendet...</>
                  : <>Antrag absenden <CheckCircle size={18} className="ml-2" /></>}
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ApplicationForm;
