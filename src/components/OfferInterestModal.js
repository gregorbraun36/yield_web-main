import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import BankLogo from './BankLogo';

const OfferInterestModal = ({ offer, isOpen, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('offer_interests')
        .insert([{
          offer_id: offer.id,
          offer_bank_name: offer.bank_name,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          message: form.message || null,
        }]);

      if (error) throw error;

      // /api/send-email serverless function üzerinden mail at (CORS sorunundan kaçınmak için)
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: `Neue Anfrage für Festgeldangebot: ${offer.bank_name}`,
            html: `<h2>Neue Angebotsanfrage eingegangen</h2>
                   <p><strong>Bank:</strong> ${offer.bank_name}</p>
                   <p><strong>Zinssatz:</strong> ${offer.interest_rate}% p.a.</p>
                   <p><strong>Laufzeit:</strong> ${offer.deposit_term || 0} Monate</p>
                   <br/>
                   <p><strong>Interessent:</strong> ${form.name}</p>
                   <p><strong>E-Mail:</strong> ${form.email}</p>
                   <p><strong>Telefon:</strong> ${form.phone || 'Nicht angegeben'}</p>
                   <p><strong>Nachricht:</strong><br/>${form.message ? form.message.replace(/\n/g, '<br/>') : 'Keine Nachricht'}</p>`,
          }),
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }

      setSubmitted(true);
      toast.success('Anfrage erfolgreich übermittelt');
    } catch (error) {
      toast.error('Fehler beim Senden der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', phone: '', message: '' });
    setSubmitted(false);
    onClose();
  };

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white p-0">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Vielen Dank für Ihr Interesse!
            </h2>
            <p className="text-slate-600 mb-6">
              Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden, um Sie über das Angebot der <strong>{offer.bank_name}</strong> zu informieren.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              onClick={handleClose}
              data-testid="interest-success-close-btn"
            >
              Schließen
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 border-b border-slate-200 p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900 mb-1">
                  Interesse an diesem Angebot
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                Füllen Sie das Formular aus und wir kontaktieren Sie mit weiteren Informationen.
              </p>
              <div className="flex items-center gap-3 mt-4 p-3 bg-white rounded-lg border border-slate-200">
                <BankLogo logo={offer.bank_logo} bankName={offer.bank_name} size="sm" />
                <div>
                  <p className="font-semibold text-slate-900">{offer.bank_name}</p>
                  <div className="text-sm text-slate-500">
                    {offer.interest_rate}% p.a. | {offer.deposit_term || 0} Monate
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <User size={14} /> Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ihr vollständiger Name"
                  required
                  data-testid="interest-name-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Mail size={14} /> E-Mail *
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ihre@email.de"
                  required
                  data-testid="interest-email-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Phone size={14} /> Telefon (optional)
                </label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+49 123 456 7890"
                  data-testid="interest-phone-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <MessageSquare size={14} /> Nachricht (optional)
                </label>
                <textarea
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Haben Sie spezielle Fragen zu diesem Angebot?"
                  data-testid="interest-message-input"
                />
              </div>

              <p className="text-xs text-slate-500">
                Mit dem Absenden stimmen Sie zu, dass wir Sie zu diesem Angebot kontaktieren dürfen. Ihre Daten werden gemäß unserer{' '}
                <a href="/legal/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a> verarbeitet.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  data-testid="interest-cancel-btn"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                  data-testid="interest-submit-btn"
                >
                  {loading ? 'Wird gesendet...' : <><Send size={16} className="mr-2" />Anfrage senden</>}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OfferInterestModal;