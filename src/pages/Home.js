import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BankLogo from '@/components/BankLogo';
import PlatformFlowDiagram from '@/components/PlatformFlowDiagram';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { loadEurRates, offerInEur, formatEur } from '@/lib/currency';
import { ArrowRight, Shield, TrendingUp, Users, CheckCircle, Star, Lock, Building2, Eye, Globe, Landmark, ThumbsUp, ShieldCheck, KeyRound, Gift, Euro, Search } from 'lucide-react';

const Home = () => {
  const [offers, setOffers] = useState([]);
  const [allOffers, setAllOffers] = useState([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_offers')
        .select('*, banks(id, name, country, logo_url, website_url, deposit_protection, deposit_protection_amount)')
        .eq('is_active', true)
        .order('interest_rate', { ascending: false });

      if (error) throw error;
      await loadEurRates();
      const mapped = (data || []).map(o => offerInEur({ ...o, bank_name: o.banks?.name || '', country: o.banks?.country || '', bank_logo: o.banks?.logo_url || null, website_url: o.banks?.website_url || null, deposit_protection: o.banks?.deposit_protection || '', deposit_protection_amount: o.banks?.deposit_protection_amount || '' }));
      setAllOffers(mapped);
      setOffers(mapped.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 to-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-slate-900">
                Europäische Sparangebote an einem Ort vergleichen
              </h1>
              <p className="text-xl leading-relaxed text-slate-600 mb-8">
                Greifen Sie auf wettbewerbsfähige Sparkonten von vertrauenswürdigen europäischen Banken zu. Finden Sie die besten Zinssätze, vergleichen Sie Laufzeiten und lassen Sie Ihre Ersparnisse mit Zuversicht wachsen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    data-testid="hero-open-account-btn"
                  >
                    Konto eröffnen
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link to="/comparison">
                  <Button
                    variant="outline"
                    className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl px-8 py-6 text-lg font-semibold transition-all"
                    data-testid="hero-compare-btn"
                  >
                    Angebote vergleichen
                  </Button>
                </Link>
              </div>

              {/* Hero Bonus Banner */}
              <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5" data-testid="hero-bonus-banner">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-amber-400 to-yellow-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Gift size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Bis zu 300 € Neukundenbonus sichern
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Erhalten Sie zwischen 100 € und 300 € Bonus, wenn Sie über unsere Plattform ein Sparkonto eröffnen. Die Bonus-Höhe hängt von der Bank und Ihrem Anlagebetrag ab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-6">
              <img
                src="https://images.unsplash.com/photo-1758691031455-9ce2e45f11f4?w=800&h=600&fit=crop&crop=faces"
                alt="Paar überprüft gemeinsam Sparangebote am Laptop"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Reviews Section */}
      <section className="py-4 bg-slate-50 border-y border-slate-200" data-testid="trust-reviews-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
              <ShieldCheck size={32} className="text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Verifizierte Finanzplattform</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
              <KeyRound size={32} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Sichere Datenverschlüsselung</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
              <Shield size={32} className="text-green-600" />
              <span className="text-sm font-medium text-slate-700">EU-Einlagensicherung</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why H68 Spar Direkt Section */}
      <section className="py-20 bg-white" data-testid="why-h68-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Warum H68 Spar Direkt?
            </h2>
          </div>

          {/* Horizontal Trust Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
            <div className="flex flex-col items-center text-center" data-testid="trust-item-banks">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Landmark size={26} className="text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-slate-900">50+ Banken</span>
              <span className="text-sm text-slate-500">im Vergleich</span>
            </div>

            <div className="flex flex-col items-center text-center" data-testid="trust-item-rates">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={26} className="text-emerald-600" />
              </div>
              <span className="text-lg font-semibold text-slate-900">Bis zu 3,20 %</span>
              <span className="text-sm text-slate-500">Zinsen p.a.</span>
            </div>

            <div className="flex flex-col items-center text-center" data-testid="trust-item-protection">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Shield size={26} className="text-indigo-600" />
              </div>
              <span className="text-lg font-semibold text-slate-900">EU-Einlagensicherung</span>
              <span className="text-sm text-slate-500">bis 100.000 €</span>
            </div>

            <div className="flex flex-col items-center text-center" data-testid="trust-item-bonus">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Gift size={26} className="text-amber-600" />
              </div>
              <span className="text-lg font-semibold text-slate-900">100 € – 300 €</span>
              <span className="text-sm text-slate-500">Neukundenbonus möglich</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-200 mb-14"></div>

          {/* Two-Column Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Search size={20} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Einfach vergleichen</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Alle Sparangebote an einem Ort vergleichen und filtern.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={20} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Kostenlos</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Die Nutzung der Plattform ist für Nutzer kostenlos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Ausgewählte Sparangebote
            </h2>
            <p className="text-xl leading-relaxed text-slate-600">
              Entdecken Sie attraktive Sparmöglichkeiten unserer Partnerbanken
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                data-testid={`offer-card-${offer.id}`}
              >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <BankLogo logo={offer.bank_logo} bankName={offer.bank_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{offer.bank_name}</h3>
                      <p className="text-sm text-slate-500">{offer.country}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{offer.interest_rate}%</div>
                      <div className="text-xs text-slate-500">p.a.</div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Anlageform</span>
                      <span className="text-sm font-medium text-blue-600">
                        {offer.investment_type || 'Festgeld'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Laufzeit</span>
                      <span className="text-sm font-medium text-slate-900">
                        {offer.deposit_term === 0 ? 'Flexibel' : `${offer.deposit_term} Monate`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Mindesteinlage</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatEur(offer.min_deposit)}
                      </span>
                    </div>
                  </div>
                  <Link to="/comparison">
                    <Button variant="outline" className="w-full" size="sm">
                      Details ansehen
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/comparison">
              <Button className="bg-[#0B1E33] hover:bg-[#1E293B] text-white rounded-xl px-8 py-4 text-base font-semibold">
                Alle Angebote ansehen
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>

          {/* Bonus CTA inside offers section */}
          <div className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Euro size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Neukundenbonus bis zu 300 €</h3>
                  <p className="text-sm text-slate-600">
                    Die Bonus-Höhe hängt von der Bank und Ihrem Anlagebetrag ab.
                  </p>
                </div>
              </div>
              <Link to="/comparison" className="flex-shrink-0">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 font-semibold shadow-md">
                  Bonus-Angebote ansehen
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Flow Diagram */}
      <PlatformFlowDiagram />

      {/* Trust Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Shield size={16} />
              <span>Einlagensicherung</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Warum h68-invest.de vertrauen?
            </h2>
            <p className="text-xl leading-relaxed text-slate-600 max-w-3xl mx-auto">
              h68-invest.de ist die Marke der H68 Vermögensverwaltung. Ihre Sicherheit und Ihr Seelenfrieden haben für uns höchste Priorität.
              Als reiner Vermittler bringen wir Sie ausschließlich mit etablierten Banken zusammen. Wir selbst bieten keine eigenen Finanzprodukte an und erbringen
              reine Vermittlungsdienstleistungen. Ihre Einlagen und Kapitalerträge sind deshalb bei unseren Partnerbanken durch die gesetzliche Einlagensicherung
              und die strenge Aufsicht einer Finanzaufsichtsbehörde geschützt.
            </p>
          </div>
          {/* Section has problem */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-16">
            <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow" data-testid="trust-deposit-protection">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield size={28} className="text-white sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">EU-Einlagensicherung</h3>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                      Geschützt bis €100.000
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Alle Partnerbanken sind durch nationale Einlagensicherungssysteme abgesichert. Ihre Ersparnisse sind gemäß EU-Vorschriften bis zu €100.000 pro Bank geschützt.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>EU-reguliert</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Staatlich gesichert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow" data-testid="trust-partner-banks">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Landmark size={28} className="text-white sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Vertrauenswürdige europäische Banken</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      34+ Partnerbanken
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Wir arbeiten nur mit lizenzierten, regulierten Banken in ganz Europa zusammen. Jeder Partner durchläuft eine gründliche Prüfung und Compliance-Verifizierung.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Lizenzierte Banken</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Verifizierte Partner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow" data-testid="trust-secure-platform">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Lock size={28} className="text-white sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Sichere Plattform</h3>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                      256-Bit SSL-Verschlüsselung
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Banktaugliche Verschlüsselung schützt Ihre Daten. Wir speichern niemals sensible Bankdaten und verwenden sichere, verschlüsselte Verbindungen.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Bankentaugliche Sicherheit</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Keine Datenspeicherung</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow" data-testid="trust-transparency">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Eye size={28} className="text-white sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Transparenter Vergleich</h3>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                      100% Unabhängig
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Keine versteckten Gebühren, keine gesponserten Rankings. Unser Vergleich zeigt echte Zinssätze von echten Banken, objektiv sortiert.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Keine Sponsoren</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>Objektive Sortierung</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-100">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#0B1E33] mb-1">12.000+</div>
              <div className="text-xs lg:text-sm text-slate-500">Aktive Nutzer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#0B1E33] mb-1">34</div>
              <div className="text-xs lg:text-sm text-slate-500">Partnerbanken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#0B1E33] mb-1">8</div>
              <div className="text-xs lg:text-sm text-slate-500">EU-Länder</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#0B1E33] mb-1">€100K</div>
              <div className="text-xs lg:text-sm text-slate-500">Einlagensicherung</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Bereit, Ihre Ersparnisse zu vermehren?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Schließen Sie sich Tausenden europäischer Sparer an, die H68 Spar Direkt vertrauen, um die besten Zinssätze zu finden.
          </p>
          <Link to="/register">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
              data-testid="cta-open-account-btn"
            >
              Jetzt loslegen
              <ArrowRight className="ml-3" size={24} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Bonus CTA Section */}
      <section className="py-16 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500" data-testid="bonus-cta-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift size={40} className="text-white" />
              </div>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Jetzt Bonus sichern
                </h2>
                <p className="text-lg text-white/90">
                  Vergleichen Sie Sparangebote und sichern Sie sich bis zu 300 € Neukundenbonus.
                </p>
              </div>
            </div>
            <Link to="/comparison" className="flex-shrink-0">
              <Button
                className="bg-white text-amber-600 hover:bg-amber-50 rounded-xl px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                data-testid="bonus-cta-compare-btn"
              >
                Angebote vergleichen
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
