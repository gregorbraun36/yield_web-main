import React from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Lock, 
  PiggyBank,
  Euro,
  FileText,
  Calculator,
  AlertCircle,
  Landmark,
  Wallet,
  Receipt,
  Globe,
  Users,
  HelpCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

const SavingsEducation = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-2xl mb-6">
            <Lightbulb size={32} className="text-teal-400" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Sparen bei europäischen Banken
          </h1>
          <p className="text-xl text-teal-300 font-medium mb-2">– einfach erklärt –</p>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Hier erfahren Sie, wie Geldanlagen bei EU-Banken funktionieren, 
            wie Ihre Einlagen geschützt sind und was Sie bei der Steuer beachten sollten.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Section 1: Sicherheit in der EU */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={28} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Sicherheit in der EU
                </h2>
                <p className="text-slate-600">
                  Wie Ihre Ersparnisse geschützt sind
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Gute Nachricht:</strong> Banken in der Europäischen Union unterliegen strengen Regeln. 
                Das bedeutet mehr Sicherheit für Ihr Geld.
              </p>
              <p>
                Alle EU-Länder haben ein <strong>Einlagensicherungssystem</strong>. 
                Dieses System schützt Ihr Geld, falls eine Bank in Schwierigkeiten gerät.
              </p>
            </div>

            {/* Important Info Box */}
            <div className="mt-6 bg-teal-50 border border-teal-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={24} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-teal-800 mb-1">Wichtige Information:</p>
                  <p className="text-teal-700">
                    Einlagen bis zu <strong>100.000 €</strong> pro Kunde und Bank sind durch die 
                    europäische Einlagensicherung geschützt. Das ist gesetzlich vorgeschrieben.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Gehört mein Geld noch mir? */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet size={28} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Gehört mein Geld noch mir?
                </h2>
                <p className="text-slate-600">
                  Die wichtigste Frage – einfach beantwortet
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Ja, absolut!</strong> Das Geld, das Sie bei einer Bank einzahlen, gehört immer Ihnen. 
                Die Bank verwahrt es nur für Sie.
              </p>
              <p>
                Selbst wenn eine Bank in finanzielle Schwierigkeiten gerät, ist Ihr Geld geschützt. 
                Die Einlagensicherung sorgt dafür, dass Sie Ihr Geld zurückbekommen.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <span className="text-sm text-slate-700">Ihr Geld bleibt Ihr Eigentum</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <span className="text-sm text-slate-700">Schutz auch bei Bankproblemen</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <span className="text-sm text-slate-700">Gesetzliche Garantie bis 100.000 €</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
                <span className="text-sm text-slate-700">EU-weit einheitlicher Schutz</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Wie werden Zinsen versteuert? */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt size={28} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Wie werden Zinsen versteuert?
                </h2>
                <p className="text-slate-600">
                  Steuern auf Zinserträge – kurz erklärt
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed mb-6">
              <p>
                Als deutscher Anleger versteuern Sie Ihre Zinserträge in der Regel <strong>in Deutschland</strong> – 
                egal ob die Bank in Spanien, Frankreich oder einem anderen EU-Land sitzt.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Kapitalertragsteuer</p>
                  <p className="text-slate-600 text-sm">
                    In Deutschland beträgt die Kapitalertragsteuer <strong>25%</strong> plus Solidaritätszuschlag 
                    (ca. 26,375% insgesamt).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sparerpauschbetrag</p>
                  <p className="text-slate-600 text-sm">
                    Es gibt einen <strong>Freibetrag von 1.000 €</strong> pro Jahr (bei Einzelpersonen). 
                    Zinsen bis zu diesem Betrag sind steuerfrei.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Steuererklärung</p>
                  <p className="text-slate-600 text-sm">
                    Zinserträge aus ausländischen Banken müssen Sie in Ihrer deutschen Steuererklärung angeben.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Keine doppelte Besteuerung */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe size={28} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Keine doppelte Besteuerung
                </h2>
                <p className="text-slate-600">
                  Abkommen zwischen den EU-Ländern
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Keine Sorge:</strong> Sie müssen Ihre Zinsen nicht zweimal versteuern – 
                einmal im Ausland und einmal in Deutschland.
              </p>
              <p>
                Die europäischen Länder haben <strong>Doppelbesteuerungsabkommen</strong> abgeschlossen. 
                Diese Abkommen regeln, dass Zinserträge nur in einem Land versteuert werden – 
                normalerweise in Ihrem Wohnsitzland.
              </p>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 mb-1">Das bedeutet für Sie:</p>
                  <p className="text-green-700">
                    Als deutscher Anleger zahlen Sie Steuern auf Ihre Zinsen nur in Deutschland – 
                    egal in welchem EU-Land Ihre Bank sitzt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Einfaches Beispiel */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calculator size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Einfaches Beispiel
                </h2>
                <p className="text-teal-100">
                  So funktioniert es in der Praxis
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-teal-200 text-sm mb-1">Anlage</p>
                  <p className="text-3xl font-bold">10.000 €</p>
                </div>
                <div>
                  <p className="text-teal-200 text-sm mb-1">Zinssatz</p>
                  <p className="text-3xl font-bold">3,0 %</p>
                </div>
                <div>
                  <p className="text-teal-200 text-sm mb-1">Zinsen pro Jahr</p>
                  <p className="text-3xl font-bold">300 €</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-teal-50">
              <div className="flex items-start gap-3">
                <ArrowRight size={18} className="text-teal-300 flex-shrink-0 mt-1" />
                <p>
                  Sie legen 10.000 € bei einer spanischen Bank mit 3% Zinsen an.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight size={18} className="text-teal-300 flex-shrink-0 mt-1" />
                <p>
                  Nach einem Jahr erhalten Sie 300 € Zinsen.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight size={18} className="text-teal-300 flex-shrink-0 mt-1" />
                <p>
                  Diese 300 € geben Sie in Ihrer deutschen Steuererklärung an.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight size={18} className="text-teal-300 flex-shrink-0 mt-1" />
                <p>
                  Liegen Ihre gesamten Kapitalerträge unter 1.000 €, zahlen Sie keine Steuern.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Das sollten Anleger beachten */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={28} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Das sollten Anleger beachten
                </h2>
                <p className="text-slate-600">
                  Drei einfache Punkte zum Merken
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Einlagensicherung prüfen</p>
                  <p className="text-slate-600">
                    Achten Sie darauf, dass die Bank der EU-Einlagensicherung unterliegt 
                    und Ihr Geld bis 100.000 € geschützt ist.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Zinsen in der Steuererklärung angeben</p>
                  <p className="text-slate-600">
                    Vergessen Sie nicht, Ihre Zinserträge aus ausländischen Banken in Ihrer 
                    deutschen Steuererklärung anzugeben.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Sparerpauschbetrag nutzen</p>
                  <p className="text-slate-600">
                    Nutzen Sie Ihren Freibetrag von 1.000 € pro Jahr. 
                    Kapitalerträge bis zu diesem Betrag sind steuerfrei.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Wichtiger Hinweis</h3>
                <p className="text-amber-800 leading-relaxed">
                  Diese Informationen dienen nur zur allgemeinen Orientierung und stellen 
                  <strong> keine Steuerberatung</strong> dar. Steuerliche Regelungen können sich ändern 
                  und hängen von Ihrer individuellen Situation ab. Bei konkreten Steuerfragen 
                  wenden Sie sich bitte an einen <strong>Steuerberater</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <section>
          <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
            <h3 className="font-bold text-xl text-slate-900 mb-4 text-center">
              Zusammenfassung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield size={20} className="text-teal-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Einlagen bis 100.000 € geschützt</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Wallet size={20} className="text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Ihr Geld bleibt Ihr Eigentum</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Euro size={20} className="text-amber-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">1.000 € Freibetrag pro Jahr</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe size={20} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Keine doppelte Besteuerung</p>
              </div>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
};

export default SavingsEducation;
