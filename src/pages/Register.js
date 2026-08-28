import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Clock, Mail } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register } = useAuth();

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return; 
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
      });
      setRegisteredEmail(form.email);
      setRegistered(true);
    } catch (error) {
      const duplicateEmail =
        error.message?.includes('bereits registriert') || error.message?.includes('already registered');
      if (duplicateEmail) {
        toast.error('Bu e-posta zaten kayıtlı. Admin tarafından oluşturulan hesaplar için lütfen giriş sayfasını kullanın.');
        navigate(`/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
        return;
      }
      const message = error.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Kayıt başarılı → onay bekleniyor ekranı
  if (registered) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock size={32} className="text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold text-[#0B1E33] mb-2">
              Registrierung eingegangen
            </h1>
            <p className="text-slate-500 mb-6">
              Vielen Dank für Ihre Registrierung bei H68 Spar Direkt.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm mb-1">
                    Ihr Konto wird geprüft
                  </p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Unser Team überprüft Ihre Registrierung. Dies dauert in der Regel
                    <strong> 1–2 Werktage</strong>. Sie erhalten eine E-Mail an{' '}
                    <strong>{registeredEmail}</strong>, sobald Ihr Konto freigeschaltet wurde.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <Mail size={18} className="text-slate-500 shrink-0" />
              <p className="text-sm text-slate-600">
                Bei Fragen:{' '}
                <a
                  href="mailto:info@h68spardirekt.com"
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  info@h68spardirekt.com
                </a>
              </p>
            </div>

            <Link to="/">
              <Button className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white">
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal kayıt formu
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft size={20} className="mr-2" />
          Zurück zur Startseite
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-center mb-8">
            <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B1E33] mb-2 text-center">Konto erstellen</h1>
          <p className="text-slate-500 text-center mb-8 text-sm">Konto anlegen und Profildaten später im Onboarding ergänzen</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700">E-Mail</label>
              <Input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="ihre@email.de"
                required
                data-testid="register-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700">Passwort</label>
              <Input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Mindestens 6 Zeichen"
                required
                data-testid="register-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700">Passwort bestätigen</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="••••••••"
                required
                data-testid="register-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white py-6 mt-2"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
