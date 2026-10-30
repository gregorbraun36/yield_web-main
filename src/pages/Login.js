import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Clock, XCircle, Mail, RotateCcw } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockedStatus, setBlockedStatus] = useState(null); // 'pending' | 'rejected' | 'deleted' | null
  const [searchParams] = useSearchParams();
  const {
    login,
    user,
    twoFactorPending,
    verifyTwoFactorOtp,
    resendTwoFactorOtp,
    cancelTwoFactor,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery.trim().toLowerCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBlockedStatus(null);

    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result?.requiresTwoFactor) {
        toast.success('OTP wurde per E-Mail gesendet');
        return;
      }
      toast.success('Erfolgreich angemeldet');
      if (result?.redirectTo) {
        navigate(result.redirectTo);
      }
    } catch (error) {
      // Status-spezifische Fehlerbehandlung
      if (error.status === 'pending') {
        setBlockedStatus('pending');
        return;
      }
      if (error.status === 'rejected') {
        setBlockedStatus('rejected');
        return;
      }
      if (error.status === 'deleted') {
        setBlockedStatus('deleted');
        return;
      }

      const message = error.message?.includes('Invalid login credentials')
        ? 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.'
        : error.message || 'Anmeldung fehlgeschlagen';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyTwoFactorOtp(otpCode);
      toast.success('OTP bestätigt');
      setOtpCode('');
      if (result?.redirectTo) navigate(result.redirectTo);
    } catch (error) {
      toast.error(error.message || 'OTP konnte nicht verifiziert werden');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    setLoading(true);
    try {
      await resendTwoFactorOtp();
      toast.success('Neuer OTP-Code wurde gesendet');
    } catch (error) {
      toast.error(error.message || 'OTP konnte nicht erneut gesendet werden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft size={20} className="mr-2" />
          Zurück zur Startseite
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-center mb-8">
            <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-[#0B1E33] mb-2 text-center">
            {twoFactorPending ? 'OTP-Bestätigung' : 'Willkommen zurück'}
          </h1>
          <p className="text-slate-500 text-center mb-8 text-sm">
            {twoFactorPending
              ? `Wir haben einen Sicherheitscode an ${twoFactorPending.email} gesendet.`
              : 'Melden Sie sich bei Ihrem H68 Spar Direkt-Konto an'}
          </p>

          {/* Onay bekliyor uyarısı */}
          {blockedStatus === 'pending' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm mb-1">Konto wird geprüft</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Ihr Konto wartet noch auf Freischaltung durch einen Administrator.
                  Sie erhalten eine E-Mail, sobald Ihr Konto aktiviert wurde.
                </p>
              </div>
            </div>
          )}

          {/* Red edildi uyarısı */}
          {blockedStatus === 'rejected' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm mb-1">Registrierung nicht genehmigt</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  Ihre Registrierung wurde leider nicht genehmigt. Bei Fragen wenden Sie sich an{' '}
                  <a
                    href="mailto:info@h68-invest.de"
                    className="underline hover:text-red-900"
                  >
                    info@h68-invest.de
                  </a>
                </p>
              </div>
            </div>
          )}

          {blockedStatus === 'deleted' && (
            <div className="flex items-start gap-3 bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6">
              <XCircle size={20} className="text-slate-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">Konto geschlossen</p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Dieses Konto wurde geschlossen. Wenn Sie Hilfe benötigen, kontaktieren Sie{' '}
                  <a
                    href="mailto:info@h68-invest.de"
                    className="underline hover:text-slate-900"
                  >
                    info@h68-invest.de
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {twoFactorPending ? (
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <Mail size={18} className="text-blue-700 mt-0.5" />
                <p className="text-sm text-blue-800">Bitte geben Sie den 6-stelligen OTP-Code ein.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">OTP-Code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white py-6"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? 'Prüfung läuft...' : 'OTP bestätigen'}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 gap-2" disabled={loading} onClick={handleOtpResend}>
                  <RotateCcw size={15} />
                  Code erneut senden
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={cancelTwoFactor}>
                  Abbrechen
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">E-Mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  required
                  data-testid="login-email-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Passwort</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white py-6"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? 'Anmeldung läuft...' : 'Anmelden'}
              </Button>
            </form>
          )}

          <p className="text-sm text-slate-600 text-center mt-6">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
              Konto erstellen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
