import React from 'react';
import { User, Building2, Landmark, ArrowRight, ArrowLeft, Wallet, PiggyBank, Euro, CheckCircle, ArrowRightLeft } from 'lucide-react';

const PlatformFlowDiagram = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50" data-testid="platform-flow-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <ArrowRightLeft size={16} />
            <span>Einfach erklärt</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0B1E33] mb-4">
            So funktioniert unsere Sparplattform
          </h2>
          <p className="text-xl leading-relaxed text-slate-600 max-w-3xl mx-auto">
            Über unsere Plattform können Sie verschiedene Sparangebote europäischer Partnerbanken vergleichen und auswählen. Sie eröffnen einmalig ein Konto und können anschließend bequem Angebote verschiedener Banken nutzen.
          </p>
        </div>

        {/* Main Flow Diagram */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            
            {/* Left: Customer */}
            <div className="lg:col-span-1 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                  <User size={56} className="text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <Euro size={20} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#0B1E33] mb-2">Sie</h3>
              <p className="text-sm text-slate-600">Einmaliges Konto bei H68 Spar Direkt</p>
            </div>

            {/* Arrow 1: Customer to Platform */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
              <div className="hidden lg:flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3 text-blue-600">
                  <span className="text-xs font-semibold bg-blue-100 px-3 py-1 rounded-full">1. Einzahlung</span>
                </div>
                <div className="w-full flex items-center justify-center">
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 flex-1 rounded-full"></div>
                  <ArrowRight size={28} className="text-blue-600 -ml-1" />
                </div>
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <ArrowLeft size={28} className="text-green-600 -mr-1" />
                  <div className="h-1 bg-gradient-to-l from-green-400 to-green-600 flex-1 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <span className="text-xs font-semibold bg-green-100 px-3 py-1 rounded-full">4. Zinsen + Kapital</span>
                </div>
              </div>
              {/* Mobile arrows */}
              <div className="lg:hidden flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <ArrowRight size={24} className="text-blue-600 rotate-90" />
                  <span className="text-xs text-blue-600 font-semibold mt-1">Einzahlung</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowLeft size={24} className="text-green-600 rotate-90" />
                  <span className="text-xs text-green-600 font-semibold mt-1">Zinsen</span>
                </div>
              </div>
            </div>

            {/* Center: Platform */}
            <div className="lg:col-span-1 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transform rotate-3 hover:rotate-0 transition-transform">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl transform -rotate-6 -z-10 opacity-30"></div>
                  <Building2 size={56} className="text-white" />
                </div>
                <div className="absolute -top-3 -left-3 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-md transform -rotate-12">
                  <PiggyBank size={24} className="text-white" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md transform rotate-12">
                  <Wallet size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#0B1E33] mb-2">H68 Spar Direkt</h3>
              <p className="text-sm text-slate-600">Ihre zentrale Sparplattform</p>
            </div>

            {/* Arrow 2: Platform to Banks */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
              <div className="hidden lg:flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3 text-blue-600">
                  <span className="text-xs font-semibold bg-blue-100 px-3 py-1 rounded-full">2. Anlage wählen</span>
                </div>
                <div className="w-full flex items-center justify-center">
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 flex-1 rounded-full"></div>
                  <ArrowRight size={28} className="text-blue-600 -ml-1" />
                </div>
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <ArrowLeft size={28} className="text-green-600 -mr-1" />
                  <div className="h-1 bg-gradient-to-l from-green-400 to-green-600 flex-1 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <span className="text-xs font-semibold bg-green-100 px-3 py-1 rounded-full">3. Zinszahlungen</span>
                </div>
              </div>
              {/* Mobile arrows */}
              <div className="lg:hidden flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <ArrowRight size={24} className="text-blue-600 rotate-90" />
                  <span className="text-xs text-blue-600 font-semibold mt-1">Anlage</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowLeft size={24} className="text-green-600 rotate-90" />
                  <span className="text-xs text-green-600 font-semibold mt-1">Zinsen</span>
                </div>
              </div>
            </div>

            {/* Right: Partner Banks */}
            <div className="lg:col-span-1 flex flex-col items-center text-center">
              <div className="relative mb-6">
                {/* Bank 1 */}
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6 z-10">
                  <Landmark size={28} className="text-white" />
                </div>
                {/* Bank 2 - Main */}
                <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg z-20 relative">
                  <Landmark size={40} className="text-white" />
                </div>
                {/* Bank 3 */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-6 z-10">
                  <Landmark size={28} className="text-white" />
                </div>
                {/* Bank 4 */}
                <div className="absolute -top-2 right-6 w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center shadow-md transform rotate-12">
                  <Landmark size={20} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#0B1E33] mb-2 mt-4">Partnerbanken</h3>
              <p className="text-sm text-slate-600">Europäische Banken mit attraktiven Zinsen</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <h4 className="font-bold text-[#0B1E33]">Konto eröffnen</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sie eröffnen einmalig ein kostenloses Konto bei H68 Spar Direkt. Ab jetzt haben Sie Zugang zu allen Sparangeboten.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <h4 className="font-bold text-[#0B1E33]">Angebot wählen</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Vergleichen Sie Zinssätze und Laufzeiten verschiedener europäischer Banken und wählen Sie Ihr ideales Angebot.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <h4 className="font-bold text-[#0B1E33]">Geld anlegen</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ihr Kapital wird sicher an die gewählte Partnerbank übertragen. Sie profitieren von der EU-Einlagensicherung.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <h4 className="font-bold text-[#0B1E33]">Zinsen erhalten</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Am Ende der Laufzeit erhalten Sie Ihr Kapital plus die verdienten Zinsen direkt auf Ihr H68 Spar Direkt-Konto zurück.
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Ihre Vorteile auf einen Blick</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Ein Konto, viele Banken</p>
                <p className="text-blue-100 text-sm mt-1">Zugang zu Angeboten verschiedener europäischer Banken mit nur einer Anmeldung.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">EU-Einlagensicherung</p>
                <p className="text-blue-100 text-sm mt-1">Ihre Einlagen sind bis zu €100.000 pro Bank durch die EU geschützt.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Transparenter Vergleich</p>
                <p className="text-blue-100 text-sm mt-1">Alle Zinssätze und Konditionen auf einen Blick – ohne versteckte Gebühren.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformFlowDiagram;
