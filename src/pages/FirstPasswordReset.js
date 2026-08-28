import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const FirstPasswordReset = () => {
  const navigate = useNavigate();
  const { user, completeFirstPasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try {
      await completeFirstPasswordReset(password);
      toast.success('Passwort erfolgreich aktualisiert.');
      if (user?.onboarding_required && !user?.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(`Passwort konnte nicht aktualisiert werden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto" />
        </div>
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[#0B1E33] mb-2">Passwort beim ersten Login ändern</h1>
        <p className="text-sm text-slate-500 mb-6">
          Aus Sicherheitsgründen müssen Sie Ihr temporäres Passwort ersetzen, bevor Sie fortfahren.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Neues Passwort</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Neues Passwort bestätigen</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white gap-2">
            <KeyRound size={16} />
            {loading ? 'Wird gespeichert...' : 'Passwort aktualisieren'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FirstPasswordReset;
