import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { COUNTRIES } from '@/constants/profileOptions';
import { toast } from 'sonner';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    country: user?.country || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.country) {
      toast.error('Bitte füllen Sie Vorname, Nachname und Land aus.');
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(form);
      toast.success('Profil wurde erfolgreich vervollständigt.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(`Onboarding fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto mb-6" />
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Willkommen</p>
          <h1 className="text-3xl font-semibold text-[#0B1E33] mb-2">Onboarding abschließen</h1>
          <p className="text-sm text-slate-500">
            Bitte vervollständigen Sie Ihre Profildaten, damit Ihr Konto vollständig aktiviert wird.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vorname *</label>
              <Input value={form.first_name} onChange={handleChange('first_name')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nachname *</label>
              <Input value={form.last_name} onChange={handleChange('last_name')} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Land *</label>
              <select
                value={form.country}
                onChange={handleChange('country')}
                required
                className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Land auswählen...</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
              <Input value={form.phone} onChange={handleChange('phone')} placeholder="+49..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
            <Input value={form.address} onChange={handleChange('address')} placeholder="Straße, Hausnummer, PLZ, Stadt" />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#0B1E33] hover:bg-[#1E293B] text-white gap-2">
              <CheckCircle2 size={16} />
              {loading ? 'Wird gespeichert...' : 'Onboarding abschließen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
