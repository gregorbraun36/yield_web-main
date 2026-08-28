import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, Search, Mail, Phone, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminOfferInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offer_interests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterests(data || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Interessenten: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteInterest = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase.from('offer_interests').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Eintrag erfolgreich gelöscht');
      setInterests((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error('Fehler beim Löschen: ' + error.message);
    }
  };

  const filteredInterests = interests.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.offer_bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Leads</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Interessenten (Anfragen)</h1>
          <p className="text-slate-600 text-sm mt-1">Verwalten Sie hier alle Informationen und Anfragen zu bestimmten Angeboten.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-wrap gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Suchen nach Name, E-Mail oder Bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>
            <div className="text-sm text-slate-500">
              {filteredInterests.length} {filteredInterests.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bank / Angebot</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nachricht</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      Lädt Daten...
                    </td>
                  </tr>
                ) : filteredInterests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      Keine Interessenten gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredInterests.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <a href={`tel:${item.phone}`} className="text-slate-600 hover:text-slate-900">{item.phone}</a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.offer_bank_name || 'Unbekannt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.message}>
                        {item.message || <span className="text-slate-400 italic">Keine Nachricht</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteInterest(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                          title="Eintrag löschen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default AdminOfferInterests;
