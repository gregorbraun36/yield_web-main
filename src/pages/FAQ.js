import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  HelpCircle, 
  UserPlus, 
  Percent, 
  Shield, 
  Receipt, 
  Gift, 
  Headphones,
  Mail,
  MessageCircle,
  ChevronRight
} from 'lucide-react';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const faqCategories = [
    {
      id: 'general',
      name: 'Allgemeine Fragen',
      icon: HelpCircle,
      color: 'blue',
      questions: [
        {
          question: 'Was ist H68 Spar Direkt?',
          answer: 'H68 Spar Direkt ist eine unabhängige Vergleichsplattform für europäische Sparangebote. Wir helfen Ihnen, die besten Zinssätze von vertrauenswürdigen Banken in Europa zu finden und zu vergleichen. Dabei sind wir kein Finanzinstitut – wir vermitteln nur und halten kein Geld.'
        },
        {
          question: 'Ist die Nutzung von H68 Spar Direkt kostenlos?',
          answer: 'Ja, H68 Spar Direkt ist für alle Nutzer komplett kostenlos. Es gibt keine versteckten Gebühren oder Kosten. Wir finanzieren uns durch Partnerschaften mit Banken, was jedoch keinen Einfluss auf unsere Vergleiche oder Empfehlungen hat.'
        },
        {
          question: 'Wie funktioniert die Plattform?',
          answer: 'Die Nutzung ist einfach: 1) Erstellen Sie ein kostenloses Konto, 2) Vergleichen Sie Sparangebote von über 50 europäischen Banken, 3) Filtern Sie nach Zinssatz, Laufzeit und Mindestanlage, 4) Wenn Sie ein passendes Angebot gefunden haben, senden Sie Ihre Anfrage direkt an die Bank. Die Kontoeröffnung erfolgt dann bei der jeweiligen Partnerbank.'
        },
        {
          question: 'Verwaltet H68 Spar Direkt mein Geld?',
          answer: 'Nein, absolut nicht. H68 Spar Direkt ist ausschließlich eine Vergleichsplattform. Wir halten, verwalten oder haben keinen Zugang zu Ihren Geldern. Alle Sparkonten werden direkt bei unseren Partnerbanken eröffnet und verwaltet. Ihr Geld bleibt immer bei dem von Ihnen gewählten, regulierten Finanzinstitut.'
        },
        {
          question: 'In welchen Ländern ist H68 Spar Direkt verfügbar?',
          answer: 'H68 Spar Direkt richtet sich primär an Nutzer in Deutschland. Die auf unserer Plattform gelisteten Banken stammen aus verschiedenen EU-Ländern wie Deutschland, Frankreich, Italien, Spanien, Portugal, den Niederlanden und weiteren. Die Wohnsitzanforderungen variieren je nach Bank.'
        }
      ]
    },
    {
      id: 'account',
      name: 'Kontoeröffnung',
      icon: UserPlus,
      color: 'emerald',
      questions: [
        {
          question: 'Wie eröffne ich ein Sparkonto über H68 Spar Direkt?',
          answer: 'Nachdem Sie ein passendes Angebot gefunden haben, klicken Sie auf "Interesse senden" oder "Details ansehen". Sie können dann Ihre Kontaktdaten hinterlassen, und die Bank wird sich mit Ihnen in Verbindung setzen. Die eigentliche Kontoeröffnung erfolgt direkt bei der Partnerbank mit deren eigenen Verifizierungsverfahren.'
        },
        {
          question: 'Welche Dokumente brauche ich zur Kontoeröffnung?',
          answer: 'Typische Anforderungen umfassen: einen gültigen Personalausweis oder Reisepass, einen Adressnachweis (z.B. Meldebescheinigung oder Kontoauszug), Ihre Steuer-Identifikationsnummer und manchmal Einkommensnachweise. Jede Bank hat eigene spezifische Anforderungen, die während des Antragsprozesses erklärt werden.'
        },
        {
          question: 'Wie lange dauert die Kontoeröffnung?',
          answer: 'Die Dauer variiert je nach Bank. In der Regel dauert die Online-Verifizierung zwischen wenigen Minuten und einigen Tagen. Nach erfolgreicher Verifizierung ist Ihr Konto sofort aktiv. Bei manchen Banken kann der Prozess durch Video-Ident beschleunigt werden.'
        },
        {
          question: 'Kann ich Konten bei mehreren Banken haben?',
          answer: 'Ja, absolut. Sie können Sparkonten bei mehreren Banken parallel führen. Das kann sogar vorteilhaft sein: Die EU-Einlagensicherung gilt pro Bank und Kunde bis 100.000 €. Wenn Sie höhere Beträge anlegen möchten, erhöht die Verteilung auf mehrere Banken Ihren Schutz.'
        },
        {
          question: 'Muss ich in Deutschland wohnen?',
          answer: 'Für die Nutzung von H68 Spar Direkt müssen Sie nicht zwingend in Deutschland wohnen. Allerdings haben viele Partnerbanken spezifische Wohnsitzanforderungen. Manche akzeptieren Kunden aus dem gesamten EU-Raum, andere sind auf bestimmte Länder beschränkt. Prüfen Sie die jeweiligen Anforderungen im Angebotsdetail.'
        }
      ]
    },
    {
      id: 'rates',
      name: 'Zinsen & Angebote',
      icon: Percent,
      color: 'violet',
      questions: [
        {
          question: 'Wie funktionieren die Zinssätze?',
          answer: 'Die angezeigten Zinssätze sind nominale Jahreszinsen (p.a. = per annum). Bei Festgeld erhalten Sie den festen Zinssatz für die gesamte Laufzeit. Bei Tagesgeld kann sich der Zinssatz ändern. Die Zinsen werden je nach Produkt monatlich, quartalsweise, jährlich oder am Ende der Laufzeit ausgezahlt.'
        },
        {
          question: 'Was ist der Unterschied zwischen Festgeld und Tagesgeld?',
          answer: 'Festgeld: Ihr Geld wird für eine feste Laufzeit (z.B. 12 Monate) angelegt. Dafür erhalten Sie in der Regel höhere Zinsen, können aber nicht vorzeitig auf das Geld zugreifen. Tagesgeld: Sie können jederzeit über Ihr Geld verfügen, erhalten aber meist niedrigere und variable Zinsen.'
        },
        {
          question: 'Warum variieren die Zinssätze zwischen Banken?',
          answer: 'Die Zinssätze hängen von verschiedenen Faktoren ab: der Geldpolitik der Europäischen Zentralbank, der Geschäftsstrategie der Bank, dem Wettbewerb im jeweiligen Markt und der wirtschaftlichen Lage des Landes. Manche Banken bieten höhere Zinsen, um neue Kunden zu gewinnen.'
        },
        {
          question: 'Wie oft werden die Zinssätze aktualisiert?',
          answer: 'Wir aktualisieren unsere Plattform regelmäßig, um aktuelle Informationen bereitzustellen. Da sich Zinssätze ändern können, empfehlen wir, den aktuellen Zinssatz immer auf der offiziellen Website der Bank zu überprüfen, bevor Sie ein Konto eröffnen.'
        },
        {
          question: 'Kann ich mein Festgeld vorzeitig kündigen?',
          answer: 'Das hängt von der jeweiligen Bank und dem Produkt ab. Bei den meisten Festgeldanlagen ist eine vorzeitige Kündigung nicht vorgesehen oder mit Zinsverlusten verbunden. Manche Banken erlauben Kündigungen gegen eine Gebühr. Prüfen Sie die Bedingungen vor der Anlage sorgfältig.'
        }
      ]
    },
    {
      id: 'security',
      name: 'Sicherheit',
      icon: Shield,
      color: 'indigo',
      questions: [
        {
          question: 'Sind meine Einlagen bei den Partnerbanken sicher?',
          answer: 'Ja. Alle Partnerbanken auf unserer Plattform sind durch die gesetzliche EU-Einlagensicherung geschützt. Das bedeutet: Ihre Einlagen sind bis zu 100.000 € pro Kunde und pro Bank gesichert – selbst im unwahrscheinlichen Fall einer Bankeninsolvenz. Diese Garantie ist EU-weit gesetzlich vorgeschrieben.'
        },
        {
          question: 'Was ist die EU-Einlagensicherung?',
          answer: 'Die EU-Einlagensicherung ist ein gesetzlicher Schutz für Sparer in allen EU-Ländern. Sie garantiert, dass Ihre Einlagen bis zu 100.000 € pro Person und Bank geschützt sind. Im Falle einer Bankinsolvenz erhalten Sie Ihr Geld innerhalb von 7 Arbeitstagen vom nationalen Einlagensicherungsfonds zurück.'
        },
        {
          question: 'Kann ich den Banken auf der Plattform vertrauen?',
          answer: 'Alle unsere Partnerbanken sind etablierte, lizenzierte und regulierte Finanzinstitute in der EU. Sie werden von ihren nationalen Aufsichtsbehörden (z.B. BaFin in Deutschland) überwacht und müssen strenge EU-Bankenvorschriften erfüllen. Wir prüfen alle Partnerbanken vor der Aufnahme auf unsere Plattform.'
        },
        {
          question: 'Wie schützt H68 Spar Direkt meine persönlichen Daten?',
          answer: 'Wir nehmen Datenschutz sehr ernst und erfüllen die DSGVO sowie alle europäischen Datenschutzvorschriften. Wir verwenden 256-Bit-SSL-Verschlüsselung für alle Datenübertragungen. Ihre Daten werden niemals ohne Ihre ausdrückliche Zustimmung an Dritte weitergegeben oder verkauft.'
        }
      ]
    },
    {
      id: 'taxes',
      name: 'Steuern',
      icon: Receipt,
      color: 'orange',
      questions: [
        {
          question: 'Muss ich Zinserträge versteuern?',
          answer: 'Ja, Zinserträge unterliegen in Deutschland der Abgeltungssteuer. Der Steuersatz beträgt 25 % plus Solidaritätszuschlag (5,5 % auf die Steuer) und ggf. Kirchensteuer. Insgesamt werden etwa 26,375 % – 27,99 % Ihrer Zinserträge an das Finanzamt abgeführt.'
        },
        {
          question: 'Was ist der Sparerpauschbetrag?',
          answer: 'Der Sparerpauschbetrag ist ein steuerlicher Freibetrag für Kapitalerträge. Er beträgt 1.000 € pro Person und Jahr (2.000 € bei gemeinsam veranlagten Ehepaaren). Zinserträge bis zu diesem Betrag sind steuerfrei. Um den Freibetrag zu nutzen, müssen Sie Ihrer Bank einen Freistellungsauftrag erteilen.'
        },
        {
          question: 'Wie funktioniert die Besteuerung bei ausländischen Banken?',
          answer: 'Bei Zinserträgen von ausländischen Banken innerhalb der EU erfolgt die Besteuerung in der Regel über Ihre deutsche Steuererklärung. Die Bank führt keine deutsche Abgeltungssteuer ab, aber Sie müssen die Erträge in Anlage KAP angeben. Doppelbesteuerungsabkommen verhindern, dass Sie in beiden Ländern Steuern zahlen.'
        },
        {
          question: 'Muss ich die Zinsen in meiner Steuererklärung angeben?',
          answer: 'Bei deutschen Banken mit Freistellungsauftrag bis zum Freibetrag: nein. Bei Zinsen über dem Freibetrag oder bei ausländischen Banken: ja, in der Anlage KAP. Die Zinserträge ausländischer Banken müssen immer in der Steuererklärung angegeben werden, auch wenn die Steuer bereits im Ausland einbehalten wurde.'
        }
      ]
    },
    {
      id: 'bonus',
      name: 'Bonus',
      icon: Gift,
      color: 'amber',
      questions: [
        {
          question: 'Was ist der Neukundenbonus?',
          answer: 'Viele unserer Partnerbanken bieten Neukunden einen einmaligen Bonus zwischen 100 € und 300 €. Dieser wird zusätzlich zu den regulären Zinsen gutgeschrieben und ist eine Willkommensprämie für die erste Kontoeröffnung über unsere Plattform.'
        },
        {
          question: 'Wie erhalte ich den Bonus?',
          answer: 'Um den Bonus zu erhalten, müssen Sie in der Regel: 1) Ein neues Konto über H68 Spar Direkt bei einer teilnehmenden Bank eröffnen, 2) Einen Mindestbetrag einzahlen (variiert je nach Bank), 3) Das Geld für eine bestimmte Mindestzeit anlegen. Der Bonus wird dann automatisch auf Ihr Konto gutgeschrieben.'
        },
        {
          question: 'Wovon hängt die Bonushöhe ab?',
          answer: 'Die Bonushöhe variiert je nach Bank und hängt oft von Ihrem Anlagebetrag ab. Beispiel: 100 € Bonus ab 10.000 € Einlage, 200 € Bonus ab 25.000 € Einlage, 300 € Bonus ab 50.000 € Einlage. Die genauen Bedingungen finden Sie im jeweiligen Angebot.'
        },
        {
          question: 'Ist der Bonus steuerpflichtig?',
          answer: 'Ja, der Neukundenbonus gilt steuerlich als Kapitalertrag und unterliegt der Abgeltungssteuer. Er wird wie reguläre Zinserträge behandelt und kann durch den Sparerpauschbetrag abgedeckt werden, sofern dieser noch nicht ausgeschöpft ist.'
        }
      ]
    },
    {
      id: 'support',
      name: 'Unterstützung',
      icon: Headphones,
      color: 'teal',
      questions: [
        {
          question: 'Wie erreiche ich den H68 Spar Direkt Support?',
          answer: 'Sie können uns auf verschiedenen Wegen erreichen: Per E-Mail an info@h68-invest.de (Antwort innerhalb von 24 Stunden), über unser Kontaktformular auf der Website, oder telefonisch während unserer Geschäftszeiten (Mo-Fr 9-18 Uhr). Wir helfen Ihnen gerne bei allen Fragen zur Plattform.'
        },
        {
          question: 'Was mache ich bei Problemen mit meinem Bankkonto?',
          answer: 'Bei Fragen oder Problemen mit Ihrem Sparkonto wenden Sie sich bitte direkt an die jeweilige Bank. Da H68 Spar Direkt nur eine Vergleichsplattform ist, haben wir keinen Zugriff auf Ihre Bankkonten. Jede Partnerbank hat einen eigenen Kundenservice, der Ihnen weiterhelfen kann.'
        },
        {
          question: 'Bietet H68 Spar Direkt eine persönliche Beratung an?',
          answer: 'H68 Spar Direkt bietet keine persönliche Finanz- oder Anlageberatung an. Wir stellen Informationen und Vergleichstools zur Verfügung, um Ihnen bei der eigenen Entscheidungsfindung zu helfen. Für eine individuelle Beratung empfehlen wir, einen unabhängigen Finanzberater zu konsultieren.'
        }
      ]
    }
  ];

  // Flatten all questions for search
  const allQuestions = useMemo(() => {
    return faqCategories.flatMap(category => 
      category.questions.map(q => ({
        ...q,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color
      }))
    );
  }, []);

  // Filter questions based on search and category
  const filteredQuestions = useMemo(() => {
    let questions = activeCategory === 'all' 
      ? allQuestions 
      : allQuestions.filter(q => q.categoryId === activeCategory);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.answer.toLowerCase().includes(query)
      );
    }
    
    return questions;
  }, [activeCategory, searchQuery, allQuestions]);

  // Group filtered questions by category for display
  const groupedQuestions = useMemo(() => {
    if (activeCategory !== 'all') {
      return [{ 
        category: faqCategories.find(c => c.id === activeCategory), 
        questions: filteredQuestions 
      }];
    }
    
    const groups = [];
    faqCategories.forEach(category => {
      const categoryQuestions = filteredQuestions.filter(q => q.categoryId === category.id);
      if (categoryQuestions.length > 0) {
        groups.push({ category, questions: categoryQuestions });
      }
    });
    return groups;
  }, [filteredQuestions, activeCategory]);

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    emerald: 'bg-emerald-100',
    violet: 'bg-violet-100',
    indigo: 'bg-indigo-100',
    orange: 'bg-orange-100',
    amber: 'bg-amber-100',
    teal: 'bg-teal-100'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    indigo: 'text-indigo-600',
    orange: 'text-orange-600',
    amber: 'text-amber-600',
    teal: 'text-teal-600'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Häufig gestellte Fragen
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Finden Sie Antworten auf Ihre Fragen rund um H68 Spar Direkt, Sparangebote und die Kontoeröffnung.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Frage suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              data-testid="faq-search-input"
            />
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              data-testid="faq-category-all"
            >
              Alle Fragen
            </button>
            {faqCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid={`faq-category-${category.id}`}
              >
                <category.icon size={16} />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          {searchQuery && (
            <p className="text-slate-600 mb-6">
              {filteredQuestions.length} Ergebnis{filteredQuestions.length !== 1 ? 'se' : ''} gefunden
              {searchQuery && ` für "${searchQuery}"`}
            </p>
          )}

          {/* No Results */}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Keine Ergebnisse gefunden</h3>
              <p className="text-slate-600 mb-4">
                Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}

          {/* FAQ Groups */}
          <div className="space-y-10">
            {groupedQuestions.map(({ category, questions }) => (
              <div key={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClasses[category.color]}`}>
                    <category.icon size={20} className={iconColorClasses[category.color]} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                  <span className="text-sm text-slate-500">({questions.length})</span>
                </div>

                {/* Questions Accordion */}
                <Accordion type="single" collapsible className="space-y-3">
                  {questions.map((faq, index) => (
                    <AccordionItem
                      key={`${category.id}-${index}`}
                      value={`${category.id}-${index}`}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                      data-testid={`faq-item-${category.id}-${index}`}
                    >
                      <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-teal-600 px-5 py-4 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed px-5 pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 md:p-12 border border-slate-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-teal-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Ihre Frage nicht gefunden?
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto">
                Unser Support-Team ist für Sie da. Kontaktieren Sie uns und wir helfen Ihnen gerne weiter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Contact */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Per E-Mail</h3>
                <p className="text-slate-600 text-sm mb-3">Antwort innerhalb von 24 Stunden</p>
                <a 
                  href="mailto:info@h68-invest.de" 
                  className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
                >
                  info@h68-invest.de
                </a>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Headphones size={24} className="text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Kontaktformular</h3>
                <p className="text-slate-600 text-sm mb-4">Schreiben Sie uns direkt</p>
                <Link to="/contact">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    Kontakt aufnehmen
                    <ChevronRight size={18} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Service Hours */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Servicezeiten: Montag – Freitag, 9:00 – 18:00 Uhr
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default FAQ;
