import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Mail, MapPin, Phone } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([form]);

      if (error) throw error;

      // /api/send-email serverless function üzerinden mail at (CORS sorunundan kaçınmak için)
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: `Neue Kontaktanfrage: ${form.subject}`,
            html: `<h2>Neue Kontaktanfrage eingegangen</h2>
                   <p><strong>Name:</strong> ${form.name}</p>
                   <p><strong>E-Mail:</strong> ${form.email}</p>
                   <p><strong>Betreff:</strong> ${form.subject}</p>
                   <p><strong>Nachricht:</strong><br/>${form.message.replace(/\n/g, '<br/>')}</p>`,
          }),
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }

      toast.success('Nachricht erfolgreich gesendet! Wir melden uns in Kürze.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none text-[#0B1E33] mb-6">
          Kontakt aufnehmen
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 mb-12">
          Haben Sie Fragen? Wir helfen Ihnen gerne. Senden Sie uns eine Nachricht und wir antworten so schnell wie möglich.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-[#0B1E33] mb-6">Nachricht senden</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ihr Name"
                    required
                    data-testid="contact-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">E-Mail</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ihre@email.de"
                    required
                    data-testid="contact-email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Betreff</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Worum geht es?"
                    required
                    data-testid="contact-subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Nachricht</label>
                  <textarea
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 placeholder:font-light placeholder:italic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Wie können wir Ihnen helfen..."
                    required
                    data-testid="contact-message"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0B1E33] hover:bg-[#1E293B] text-white py-6"
                  disabled={loading}
                  data-testid="contact-submit-btn"
                >
                  {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail size={20} className="text-[#0B1E33]" />
                <h3 className="font-semibold text-[#0B1E33]">E-Mail</h3>
              </div>
              <a href="mailto:info@h68-invest.de" className="text-slate-600 text-sm hover:underline">info@h68-invest.de</a>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Phone size={20} className="text-[#0B1E33]" />
                <h3 className="font-semibold text-[#0B1E33]">Telefon</h3>
              </div>
              <p className="text-slate-600 text-sm">+49 30 23320761</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <MapPin size={20} className="text-[#0B1E33]" />
                <h3 className="font-semibold text-[#0B1E33]">Adresse</h3>
              </div>
              <p className="text-slate-600 text-sm">
                H68 Vermögensverwaltung GmbH
                <br />
                Kienberger Allee 4
                <br />
                12529 Schönefeld, Deutschland
              </p>
              <p className="text-slate-600 text-sm mt-4">
                <span className="font-semibold text-slate-800">Online-Abteilung (Standort München)</span>
                <br />
                H68 Vermögensverwaltung GmbH - Online-Abteilung
                <br />
                Maximilianstraße 14
                <br />
                80539 München
                <br />
                Deutschland
                <br />
                +49 30 23320761
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contact;
