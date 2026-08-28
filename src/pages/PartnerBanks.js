import React from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Lock, 
  Building2,
  BadgeCheck,
  Eye,
  FileCheck,
  Users,
  Globe,
  Landmark
} from 'lucide-react';

// Featured partner banks with descriptions
const featuredBanks = [
  {
    name: 'BBVA',
    country: 'Spanien',
    flag: '🇪🇸',
    logo: '/assets/bank-logos/bbva.svg',
    description: 'Eine der größten Banken Spaniens mit über 150 Jahren Geschichte und starker Präsenz in Europa.',
    depositProtection: 'Spanische Einlagensicherung (FGD)',
    founded: '1857'
  },
  {
    name: 'Santander',
    country: 'Spanien',
    flag: '🇪🇸',
    logo: '/assets/bank-logos/santander.svg',
    description: 'Globale Bank mit Hauptsitz in Spanien, bekannt für Stabilität und kundenorientierte Finanzlösungen.',
    depositProtection: 'Spanische Einlagensicherung (FGD)',
    founded: '1857'
  },
  {
    name: 'ING',
    country: 'Niederlande',
    flag: '🇳🇱',
    logo: '/assets/bank-logos/ing.svg',
    description: 'Niederländische Großbank mit innovativen Direktbank-Angeboten und europaweiter Präsenz.',
    depositProtection: 'Niederländische Einlagensicherung (DGS)',
    founded: '1991'
  },
  {
    name: 'BNP Paribas',
    country: 'Frankreich',
    flag: '🇫🇷',
    logo: '/assets/bank-logos/bnp-paribas.svg',
    description: 'Führende französische Bank und eine der größten Banken der Eurozone.',
    depositProtection: 'Französische Einlagensicherung (FGDR)',
    founded: '2000'
  },
  {
    name: 'Deutsche Bank',
    country: 'Deutschland',
    flag: '🇩🇪',
    logo: '/assets/bank-logos/deutsche-bank.svg',
    description: 'Deutschlands größte Bank mit globalem Netzwerk und umfassenden Finanzdienstleistungen.',
    depositProtection: 'Deutsche Einlagensicherung',
    founded: '1870'
  },
  {
    name: 'UniCredit',
    country: 'Italien',
    flag: '🇮🇹',
    logo: '/assets/bank-logos/unicredit.svg',
    description: 'Paneuropäische Bankengruppe mit starker Präsenz in Italien, Deutschland und Österreich.',
    depositProtection: 'Italienische Einlagensicherung (FITD)',
    founded: '1998'
  },
  {
    name: 'Rabobank',
    country: 'Niederlande',
    flag: '🇳🇱',
    logo: '/assets/bank-logos/rabobank.svg',
    description: 'Niederländische Genossenschaftsbank mit besonderem Fokus auf nachhaltige Finanzdienstleistungen.',
    depositProtection: 'Niederländische Einlagensicherung (DGS)',
    founded: '1898'
  },
  {
    name: 'Commerzbank',
    country: 'Deutschland',
    flag: '🇩🇪',
    logo: '/assets/bank-logos/commerzbank.svg',
    description: 'Traditionsreiche deutsche Geschäftsbank mit umfangreichem Filialnetz und digitalen Services.',
    depositProtection: 'Deutsche Einlagensicherung',
    founded: '1870'
  }
];

// Trust features
const trustFeatures = [
  {
    icon: Shield,
    title: 'EU-Einlagensicherung',
    description: 'Alle Einlagen sind bis zu 100.000 € pro Bank und Kunde durch die gesetzliche EU-Einlagensicherung geschützt.'
  },
  {
    icon: BadgeCheck,
    title: 'Geprüfte Banken',
    description: 'Wir arbeiten ausschließlich mit regulierten und lizenzierten europäischen Banken zusammen.'
  },
  {
    icon: Eye,
    title: 'Transparente Zinsen',
    description: 'Alle Zinssätze und Konditionen werden klar und verständlich dargestellt – ohne versteckte Gebühren.'
  },
  {
    icon: Lock,
    title: 'Sichere Daten',
    description: 'Ihre persönlichen Daten werden nach höchsten Sicherheitsstandards verschlüsselt und geschützt.'
  }
];

// Security benefits
const securityBenefits = [
  {
    icon: Landmark,
    title: 'Gesetzliche Einlagensicherung',
    description: 'Gemäß EU-Richtlinie 2014/49/EU sind Ihre Einlagen bei allen unseren Partnerbanken bis zu 100.000 € gesetzlich geschützt. Diese Garantie gilt unabhängig von der wirtschaftlichen Situation der Bank.'
  },
  {
    icon: FileCheck,
    title: 'Regulierte Finanzinstitute',
    description: 'Alle Partnerbanken unterliegen der Aufsicht nationaler und europäischer Behörden wie der EZB, BaFin, oder vergleichbaren Institutionen. Dies gewährleistet die Einhaltung strenger Finanzvorschriften.'
  },
  {
    icon: CheckCircle2,
    title: 'Transparente Konditionen',
    description: 'Wir präsentieren alle Zinssätze, Laufzeiten und Mindestanlagebeträge übersichtlich. Sie können die Angebote verschiedener Banken direkt vergleichen und die beste Option für Ihre Bedürfnisse wählen.'
  },
  {
    icon: Users,
    title: 'Unabhängige Vergleichsplattform',
    description: 'H68 Spar Direkt ist eine unabhängige Plattform, die Ihnen hilft, die besten Sparangebote zu finden. Wir verwalten keine Kundengelder – alle Konten werden direkt bei den jeweiligen Banken eröffnet.'
  }
];

const PartnerBanks = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-teal-400" />
              </div>
              <span className="text-teal-400 font-medium">Partnerbanken & Sicherheit</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Unsere Partnerbanken in Europa
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Wir vergleichen attraktive Sparangebote von etablierten europäischen Banken. 
              Alle unsere Partner sind regulierte Finanzinstitute mit gesetzlicher Einlagensicherung.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon size={20} className="text-teal-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bank Overview Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1E33] mb-4">
              Ausgewählte Partnerbanken
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Eine Auswahl unserer vertrauenswürdigen Partnerbanken aus ganz Europa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBanks.map((bank, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-teal-200"
                data-testid={`partner-bank-${bank.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {/* Bank Logo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 mb-4 bg-white flex items-center justify-center">
                  <img 
                    src={bank.logo} 
                    alt={`${bank.name} Logo`}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="w-full h-full bg-slate-100 flex items-center justify-center"><svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>`;
                    }}
                  />
                </div>

                {/* Bank Info */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-900">{bank.name}</h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{bank.flag}</span>
                  <span className="text-sm text-slate-600">{bank.country}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {bank.description}
                </p>

                {/* Deposit Protection Badge */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Shield size={14} className="text-teal-600" />
                  <span className="text-xs text-teal-700 font-medium">
                    {bank.depositProtection}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              Und viele weitere europäische Banken aus Deutschland, Frankreich, Italien, Spanien, Niederlande, Österreich, Belgien und Skandinavien.
            </p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-2xl mb-4">
              <Shield size={32} className="text-teal-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1E33] mb-4">
              Ihre Einlagen sind geschützt
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Sicherheit steht bei uns an erster Stelle. Erfahren Sie, wie Ihre Ersparnisse geschützt sind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-5 p-6 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <benefit.icon size={24} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EU Deposit Protection Info Box */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield size={48} className="text-white" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  EU-Einlagensicherung bis zu 100.000 €
                </h3>
                <p className="text-teal-100 leading-relaxed max-w-2xl">
                  Gemäß der EU-Richtlinie 2014/49/EU sind Ihre Einlagen bei allen unseren Partnerbanken bis zu 100.000 € 
                  pro Bank und Kunde gesetzlich geschützt. Diese Garantie gilt in allen EU-Mitgliedstaaten und wird 
                  durch die nationalen Einlagensicherungssysteme gewährleistet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1E33] mb-4">
              Warum H68 Spar Direkt vertrauen?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Wir setzen auf Transparenz, Sicherheit und Unabhängigkeit
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={28} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Wichtiger Hinweis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              H68 Spar Direkt ist eine unabhängige Vergleichsplattform und kein Finanzinstitut. Wir vermitteln keine 
              Finanzprodukte und verwalten keine Kundengelder. Alle Sparkonten werden direkt bei den jeweiligen 
              Partnerbanken eröffnet. Die angezeigten Informationen dienen ausschließlich zu Vergleichszwecken 
              und stellen keine Anlageberatung dar. Bitte prüfen Sie vor jeder Entscheidung die aktuellen 
              Konditionen bei der jeweiligen Bank.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PartnerBanks;
