import React from 'react';
import { Target, Users, Heart, TrendingUp } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-[#0B1E33] mb-6 break-words">
          Über H68 Vermögensverwaltung GmbH
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 mb-12">
          H68 Vermögensverwaltung GmbH ist eine unabhängige Gesellschaft mit Sitz in Schönefeld bei Berlin.
        </p>

        <div className="space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
              <div className="bg-green-50 w-12 h-12 md:w-14 md:h-14 rounded-md flex items-center justify-center mb-6">
                <Target className="text-green-600 w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="text-xl font-semibold text-[#0B1E33] mb-3">Unsere Mission</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Wir verwalten Vermögen sorgfältig, langfristig und mit höchster Sorgfalt – immer im Interesse der uns anvertrauten Werte. Unser Fokus liegt auf Stabilität, Werterhalt und nachhaltiger Entwicklung.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
              <div className="bg-green-50 w-12 h-12 md:w-14 md:h-14 rounded-md flex items-center justify-center mb-6">
                <Heart className="text-green-600 w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="text-xl font-semibold text-[#0B1E33] mb-3">Unsere Werte</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                <strong>Vertrauen · Verantwortung · Diskretion</strong><br />
                Diese Grundsätze leiten unser tägliches Handeln. Wir arbeiten ohne externe Einflüsse, ohne Druck und mit höchster Integrität – immer im Einklang mit den gesetzlichen Vorgaben.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-[#0B1E33] mb-4">Unsere Geschichte</h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                Die H68 Vermögensverwaltung GmbH wurde aus einer klaren Überzeugung heraus gegründet: Wer sein eigenes Vermögen aufbaut und mehrt, verdient eine Betreuung, die genauso professionell, diskret und sorgfältig ist wie das Vermögen selbst.
Deshalb konzentrieren wir uns ausschließlich auf zwei Dinge: die Verwaltung eigenen Vermögens und die gezielte Vermittlung an ausgewählte, renommierte Banken und große Unternehmen. Diese bewusste Spezialisierung macht uns unabhängig, transparent und extrem fokussiert.
              </p>
              <p>
                Für Sie als Kunde bedeutet das: Sie profitieren von einer Beratung, die nicht von Provisionsinteressen getrieben wird, sondern einzig und allein von dem Ziel, Ihr Vermögen langfristig, sicher und nachhaltig zu stärken. Absolute Unabhängigkeit, höchste Transparenz und ein klarer Blick auf langfristige Wertstabilität – das ist es, was uns antreibt.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1E33] mb-6">Was uns auszeichnet</h2>
            <div className="space-y-6 text-slate-700">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="bg-green-50 p-2 sm:p-3 rounded-md flex-shrink-0 mt-1">
                  <TrendingUp className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg text-[#0B1E33] mb-2">Konsequente Fokussierung</h4>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Wir beschränken uns ausschließlich auf die Verwaltung eigenen Vermögens. Es werden Dienstleistungen für Dritte erbracht.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="bg-green-50 p-2 sm:p-3 rounded-md flex-shrink-0 mt-1">
                  <Target className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg text-[#0B1E33] mb-2">Spezialisisierung auf Sachwerte</h4>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Unser Kernbereich liegt in der langfristigen Betreuung – stabil, greifbar und werthaltig.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="bg-green-50 p-2 sm:p-3 rounded-md flex-shrink-0 mt-1">
                  <Users className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg text-[#0B1E33] mb-2">Diskretion und Professionalität</h4>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Wir agieren bewusst unauffällig und ohne öffentliche Akquise – unser Anspruch ist höchste Qualität statt breite Werbung.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-lg p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1E33] mb-4">So arbeiten wir</h2>
            <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-4">
              <p>
                Die H68 Vermögensverwaltung GmbH verwaltet ausschließlich eigenes Vermögen.
              </p>
              <p>
                Alle Tätigkeiten erfolgen im Rahmen des gesetzlich zulässigen Gegenstands und ohne Erlaubnispflicht nach dem Kreditwesengesetz (KWG).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-[#0B1E33] mb-4">Regulierung & Sicherheit</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Ihre Sicherheit und der Schutz Ihres Geldes haben für uns oberste Priorität.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Als reiner und unabhängiger Vermittler bringen wir Sie ausschließlich mit renommierten, streng regulierten Partnerbanken zusammen.
              Sie erhalten dadurch Zugang zu den attraktivsten Festgeld-, Tagesgeld- und Flexgeld-Angeboten – ohne dass wir selbst Einlagen verwalten oder eigene Finanzprodukte anbieten.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Jedes Angebot, das wir Ihnen vermitteln, unterliegt den vollen aufsichtsrechtlichen Vorgaben und den gesetzlichen Sicherungssystemen in Deutschland und Europa.
              Ihre Einlagen sind damit auf höchstem Niveau geschützt.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Die H68 Vermögensverwaltung GmbH ist ordnungsgemäß im Handelsregister eingetragen und handelt vollständig im Einklang mit deutschem Recht.
              Weitere Angaben finden Sie in unserem Impressum.
            </p>
          </section>
        </div>
      </div>

    </div>
  );
};

export default About;
