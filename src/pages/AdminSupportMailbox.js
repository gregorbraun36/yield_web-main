import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, MessageSquareMore } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/admin/StatusBadge';
import SectionCard from '@/components/dashboard/pro/SectionCard';
import SnapshotMetricCard from '@/components/dashboard/pro/SnapshotMetricCard';
import { toast } from 'sonner';

const TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'offen', label: 'Offen' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'geschlossen', label: 'Geschlossen' },
];

const AdminSupportMailbox = () => {
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('support_tickets').select('*').order('last_message_at', { ascending: false });
    if (activeTab !== 'all') query = query.eq('status', activeTab);
    const { data, error } = await query;
    if (error) {
      toast.error(`Tickets konnten nicht geladen werden: ${error.message}`);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  }, [activeTab]);

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

  useEffect(() => {
    if (!selectedTicket?.id) return undefined;
    fetchMessages(selectedTicket.id);
    const channel = supabase
      .channel(`admin-ticket-${selectedTicket.id}`)
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
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) => (
      `${ticket.subject || ''} ${ticket.customer_name || ''} ${ticket.customer_email || ''}`.toLowerCase().includes(q)
    ));
  }, [tickets, search]);

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'offen').length;
    const today = tickets.filter((ticket) => {
      if (!ticket.created_at) return false;
      const date = new Date(ticket.created_at);
      const now = new Date();
      return date.toDateString() === now.toDateString();
    }).length;
    const unread = tickets.reduce((sum, ticket) => sum + Number(ticket.unread_admin_count || 0), 0);
    const slaBreaches = tickets.filter((ticket) => {
      if (ticket.status === 'geschlossen' || !ticket.last_message_at) return false;
      const last = new Date(ticket.last_message_at).getTime();
      return Date.now() - last > 24 * 60 * 60 * 1000;
    }).length;
    return { open, today, unread, slaBreaches };
  }, [tickets]);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setReply('');
    if (ticket?.id) {
      const { error } = await supabase
        .from('support_tickets')
        .update({ unread_admin_count: 0 })
        .eq('id', ticket.id);
      if (!error) {
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, unread_admin_count: 0 } : t)));
        setSelectedTicket((prev) => (prev?.id === ticket.id ? { ...prev, unread_admin_count: 0 } : prev));
      }
    }
  };

  const updateStatus = async (status) => {
    if (!selectedTicket?.id) return;
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, last_message_at: new Date().toISOString() })
      .eq('id', selectedTicket.id);
    if (error) {
      toast.error(`Status konnte nicht gesetzt werden: ${error.message}`);
      return;
    }
    setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
    fetchTickets();
  };

  const sendReply = async () => {
    if (!selectedTicket?.id || !reply.trim()) return;
    const { error } = await supabase.from('support_ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_role: 'admin',
      message: reply.trim(),
    });
    if (error) {
      toast.error(`Antwort konnte nicht gesendet werden: ${error.message}`);
      return;
    }
    setReply('');
    toast.success('Antwort gesendet.');
    await fetchMessages(selectedTicket.id);
    fetchTickets();
  };

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-slate-400 mb-1">Support</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0B1E33]">Support-Postfach</h1>
            <p className="text-sm text-slate-500 mt-1">
              Eingehende Kunden-Nachrichten in Echtzeit. Status verwalten, Antworten senden, Tickets schließen.
            </p>
          </div>
          <Button variant="outline" onClick={fetchTickets} className="gap-2 shrink-0" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-1">
          <SnapshotMetricCard context="Ticket Backlog" value={`${stats.open}`} period="Offene Tickets" deltaLabel={stats.open > 0 ? 'Action needed' : 'Clean'} deltaPositive={stats.open === 0} />
          <SnapshotMetricCard context="Heute eröffnet" value={`${stats.today}`} period="Neue Tickets heute" deltaLabel={stats.today > 0 ? 'Zugang aktiv' : 'Kein Zugang'} deltaPositive />
          <SnapshotMetricCard context="Ungelesen (Admin)" value={`${stats.unread}`} period="Inbox Pending" deltaLabel={stats.unread > 0 ? 'Antwort offen' : 'Inbox clean'} deltaPositive={stats.unread === 0} />
          <SnapshotMetricCard context="SLA Breaches" value={`${stats.slaBreaches}`} period=">24h ohne Antwort" deltaLabel={stats.slaBreaches > 0 ? 'SLA Risiko' : 'Im Ziel'} deltaPositive={stats.slaBreaches === 0} />
          <SnapshotMetricCard context="Ticket Universe" value={`${tickets.length}`} period="Gesamt im Scope" deltaLabel={`${filteredTickets.length} gefiltert`} deltaPositive />
        </div>

        <SectionCard title="Support Operations" icon={MessageSquareMore}>
          <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche Kunde / Betreff"
              className="mb-3"
            />
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0B1E33]' : 'text-slate-500'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${selectedTicket?.id === ticket.id ? 'border-[#0B1E33] bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                  <p className="text-xs text-slate-500 mt-1">{ticket.customer_name || ticket.customer_email || 'Unbekannt'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge value={ticket.status} label={ticket.status || 'offen'} />
                    <p className="text-[11px] text-slate-400">
                      {ticket.last_message_at ? new Date(ticket.last_message_at).toLocaleString('de-DE') : '—'}
                    </p>
                  </div>
                </button>
              ))}
              {!filteredTickets.length && (
                <p className="text-sm text-slate-400 text-center py-8">Keine Tickets gefunden.</p>
              )}
            </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[560px] flex flex-col">
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Wähle links ein Ticket aus, um die Konversation zu öffnen.
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[#0B1E33]">{selectedTicket.subject}</p>
                    <p className="text-sm text-slate-500">{selectedTicket.customer_name || selectedTicket.customer_email || 'Kunde'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.status === 'geschlossen' ? (
                      <Button size="sm" variant="outline" onClick={() => updateStatus('offen')}>
                        Wieder öffnen
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus('offen')}>Offen</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus('in_bearbeitung')}>In Bearbeitung</Button>
                        <Button size="sm" className="bg-[#0B1E33] hover:bg-[#1E293B] text-white" onClick={() => updateStatus('geschlossen')}>
                          Schließen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl px-4 py-3 ${message.sender_role === 'admin'
                        ? 'ml-auto bg-[#0B1E33] text-white'
                        : 'bg-slate-100 text-slate-800'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <p className={`text-[11px] mt-1 ${message.sender_role === 'admin' ? 'text-slate-300' : 'text-slate-400'}`}>
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
                    onChange={(event) => setReply(event.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Antwort verfassen..."
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={sendReply} disabled={!reply.trim()} className="bg-[#0B1E33] hover:bg-[#1E293B] text-white">
                      Antwort senden
                    </Button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </SectionCard>
    </div>
  );
};

export default AdminSupportMailbox;
