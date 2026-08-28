import React from 'react';
import { Shield, Lock, Eye, FileCheck } from 'lucide-react';

const securitySections = [
  {
    title: 'Bankentaugliche Sicherheit',
    icon: Shield,
    intro: 'H68 Spar Direkt verwendet dieselben Sicherheitsstandards wie große Finanzinstitute. Unsere Plattform ist mit mehreren Schutzschichten aufgebaut, um sicherzustellen, dass Ihre Daten sicher bleiben.',
    points: [
      '256-Bit SSL-Verschlüsselung für alle Datenübertragungen',
      'Sichere Passwort-Hashing mit branchenüblichen Algorithmen',
      'Regelmäßige Sicherheitsaudits und Schwachstellenbewertungen',
      'Einhaltung europäischer Datenschutzstandards',
    ],
  },
  {
    title: 'Datenschutz',
    icon: Lock,
    intro: 'Wir sind vollständig konform mit der Datenschutz-Grundverordnung (DSGVO) und anderen europäischen Datenschutzgesetzen. Ihre persönlichen Informationen werden niemals ohne Ihre ausdrückliche Zustimmung weitergegeben.',
    points: [
      'Wir erheben nur die minimal notwendigen Daten zur Bereitstellung unserer Dienste',
      'Ihre Daten werden in sicheren, verschlüsselten Datenbanken gespeichert',
      'Sie haben volle Kontrolle über Ihre Daten mit Rechten auf Zugang, Änderung oder Löschung',
      'Wir verkaufen niemals Ihre persönlichen Informationen an Dritte',
    ],
  },
  {
    title: 'Transparenz',
    icon: Eye,
    intro: 'H68 Spar Direkt ist nur eine Vergleichsplattform. Wir halten, verwalten oder haben keinen Zugang zu Ihren Sparkonten oder Geldern. Alle Finanztransaktionen erfolgen direkt zwischen Ihnen und unseren Partnerbanken.',
    points: [
      'Wir zeigen genaue, aktuelle Informationen von Partnerbanken',
      'Alle Partnerbanken sind lizenzierte und regulierte Finanzinstitute',
      'Wir legen klar offen, wie wir arbeiten und Einnahmen erzielen',
    ],
  },
  {
    title: 'Sicherheit der Partnerbanken',
    icon: FileCheck,
    intro: 'Alle Partnerbanken auf unserer Plattform sind etablierte, regulierte Finanzinstitute, die strenge europäische Bankenstandards erfüllen.',
    points: [
      'Alle Einlagen sind durch nationale Einlagensicherungssysteme geschützt (bis zu €100.000 pro Kunde)',
      'Banken werden von ihren jeweiligen nationalen Finanzbehörden reguliert',
      'Wir überprüfen regelmäßig unsere Partnerbanken, um sicherzustellen, dass sie hohe Standards einhalten',
    ],
  },
];

const Security = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-[#0B1E33] to-[#123a5d] rounded-2xl border border-[#1f4664] px-6 py-8 md:px-10 md:py-10 text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Sicherheit & Vertrauen</h1>
          <p className="text-slate-200 mt-3 max-w-3xl text-base md:text-lg leading-relaxed">
            Ihre Sicherheit und Privatsphäre haben für uns höchste Priorität. Erfahren Sie, wie wir Ihre Informationen schützen.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {securitySections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#0B1E33]">{section.title}</h2>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed mb-4">
                  {section.intro}
                </p>

                <ul className="space-y-2.5 text-slate-700">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-semibold text-[#0B1E33] mb-3">Fragen zur Sicherheit?</h3>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Wenn Sie Bedenken oder Fragen zu unseren Sicherheitsmaßnahmen haben, zögern Sie nicht, uns zu kontaktieren.
          </p>
          <a href="/contact" className="text-emerald-700 hover:text-emerald-800 font-medium">
            Unser Sicherheitsteam kontaktieren →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Security;
