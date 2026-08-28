import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, RefreshCw, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { logActivityEvent } from '@/lib/activityFeed';
import StatusBadge from '@/components/admin/StatusBadge';

const TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'offen', label: 'Offen' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'geschlossen', label: 'Geschlossen' },
];

const UserSupportSection = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });
    if (error) {
      toast.error(`Tickets konnten nicht geladen werden: ${error.message}`);
      setTickets([]);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchMessages = useCallback(async (ticketId) => {
    if (!ticketId) return;
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(`Nachrichten konnten nicht geladen werden: ${error.message}`);
      setMessages([]);
    } else {
      setMessages(data || []);
    }
  }, []);

  const markUserRead = async (ticketId) => {
    if (!ticketId || !user?.id) return;
    await supabase.from('support_tickets').update({ unread_user_count: 0 }).eq('id', ticketId).eq('user_id', user.id);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, unread_user_count: 0 } : t)));
  };

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setReply('');
    await fetchMessages(ticket.id);
    await markUserRead(ticket.id);
  };

  useEffect(() => {
    if (!selectedTicket?.id) return undefined;
    const channel = supabase
      .channel(`user-ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        () => {
          fetchMessages(selectedTicket.id);
          fetchTickets();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id, fetchMessages, fetchTickets]);

  const filteredTickets = useMemo(() => {
    let rows = tickets;
    if (activeTab !== 'all') rows = rows.filter((t) => t.status === activeTab);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => `${t.subject || ''}`.toLowerCase().includes(q));
  }, [tickets, activeTab, search]);

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    if (!user?.id || !newSubject.trim() || !newBody.trim()) {
      toast.error('Bitte Betreff und Nachricht ausfüllen.');
      return;
    }
    setCreating(true);
    try {
      const customerName = [user.first_name, user.last_name].filter(Boolean).join(' ') || null;
      let ticketRow = null;

      // Backward compatibility: if new columns are not yet in schema cache,
      // retry with the minimal payload so users can still create tickets.
      const primaryInsert = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: newSubject.trim(),
          status: 'offen',
          customer_name: customerName,
          customer_email: user.email || null,
        })
        .select('id')
        .single();

      if (primaryInsert.error) {
        const message = String(primaryInsert.error.message || '').toLowerCase();
        const missingCustomerColumn =
          message.includes('customer_email') || message.includes('customer_name');

        if (!missingCustomerColumn) throw primaryInsert.error;

        const fallbackInsert = await supabase
          .from('support_tickets')
          .insert({
            user_id: user.id,
            subject: newSubject.trim(),
            status: 'offen',
          })
          .select('id')
          .single();

        if (fallbackInsert.error) throw fallbackInsert.error;
        ticketRow = fallbackInsert.data;
      } else {
        ticketRow = primaryInsert.data;
      }

      const { error: msgError } = await supabase.from('support_ticket_messages').insert({
        ticket_id: ticketRow.id,
        sender_user_id: user.id,
        sender_role: 'user',
        message: newBody.trim(),
      });
      if (msgError) throw msgError;

      await logActivityEvent({
        event_type: 'support_ticket_created',
        summary: `Support-Ticket: ${newSubject.trim()}`,
        payload: { ticket_id: ticketRow.id, subject: newSubject.trim() },
        user_id: user.id,
      });

      toast.success('Ticket erstellt. Wir melden uns im Chat.');
      setNewSubject('');
      setNewBody('');
      setShowNew(false);
      await fetchTickets();
      const { data: fullTicket, error: loadErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketRow.id)
        .single();
      if (!loadErr && fullTicket) await selectTicket(fullTicket);
    } catch (err) {
      toast.error(err.message || 'Ticket konnte nicht erstellt werden.');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket?.id || !user?.id || !reply.trim()) return;
    if (selectedTicket.status === 'geschlossen') {
      toast.error('Dieses Ticket ist geschlossen. Bitte legen Sie ein neues Ticket an.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_user_id: user.id,
        sender_role: 'user',
        message: reply.trim(),
      });
      if (error) throw error;
      setReply('');
      await fetchMessages(selectedTicket.id);
      await fetchTickets();
      toast.success('Nachricht gesendet.');
    } catch (err) {
      toast.error(err.message || 'Senden fehlgeschlagen.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Hilfe</p>
          <h2 className="text-xl font-semibold text-[#0B1E33]">Support & Tickets</h2>
          <p className="text-sm text-slate-500 mt-1">
            Stellen Sie eine Frage — unser Team antwortet hier. Status sehen Sie neben jedem Ticket.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchTickets} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </Button>
          <Button size="sm" className="bg-[#0B1E33] text-white gap-2" onClick={() => setShowNew((v) => !v)}>
            <MessageSquarePlus size={14} />
            Neues Ticket
          </Button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreateTicket} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Betreff</label>
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Kurz beschreiben, worum es geht"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nachricht</label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder="Ihre Frage oder Anliegen im Detail…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Abbrechen</Button>
            <Button type="submit" disabled={creating} className="bg-[#0B1E33] text-white">
              {creating ? 'Wird erstellt…' : 'Ticket absenden'}
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tickets durchsuchen…"
            className="mb-3"
          />
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0B1E33] shadow-sm' : 'text-slate-500'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => selectTicket(ticket)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${selectedTicket?.id === ticket.id ? 'border-[#0B1E33] bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{ticket.subject}</p>
                  {Number(ticket.unread_user_count || 0) > 0 && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-sky-500" title="Neue Antwort" />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge value={ticket.status} label={ticket.status || 'offen'} />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {ticket.last_message_at ? new Date(ticket.last_message_at).toLocaleDateString('de-DE') : '—'}
                  </span>
                </div>
              </button>
            ))}
            {!filteredTickets.length && (
              <p className="text-sm text-slate-400 text-center py-8">Noch keine Tickets.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[480px] flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8 text-center">
              Wählen Sie links ein Ticket oder erstellen Sie ein neues.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-200">
                <p className="text-lg font-semibold text-[#0B1E33]">{selectedTicket.subject}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge value={selectedTicket.status} label={selectedTicket.status || 'offen'} />
                  {selectedTicket.status === 'geschlossen' && (
                    <span className="text-xs text-slate-500">Antworten nicht möglich — neues Ticket bei Bedarf.</span>
                  )}
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[90%] rounded-xl px-4 py-3 ${message.sender_role === 'admin'
                      ? 'bg-[#0B1E33] text-white ml-0'
                      : 'bg-slate-100 text-slate-800 ml-auto'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-[11px] mt-1 ${message.sender_role === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {message.sender_role === 'admin' ? 'Support' : 'Sie'} ·{' '}
                      {message.created_at ? new Date(message.created_at).toLocaleString('de-DE') : ''}
                    </p>
                  </div>
                ))}
                {!messages.length && <p className="text-sm text-slate-400">Noch keine Nachrichten.</p>}
              </div>
              <div className="p-4 border-t border-slate-200">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={selectedTicket.status === 'geschlossen'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder={selectedTicket.status === 'geschlossen' ? 'Ticket geschlossen' : 'Ihre Nachricht…'}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleSendReply}
                    disabled={!reply.trim() || sending || selectedTicket.status === 'geschlossen'}
                    className="bg-[#0B1E33] text-white gap-2"
                  >
                    <Send size={14} />
                    Senden
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSupportSection;
