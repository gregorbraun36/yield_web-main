import React from 'react';
import { 
  UserPlus, 
  Search, 
  CheckCircle, 
  Landmark,
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Konto erstellen',
      subtitle: 'Schnell und kostenlos registrieren',
      description: 'Registrieren Sie sich kostenlos in nur wenigen Minuten für ein H68 Spar Direkt-Konto. Sie benötigen nur eine E-Mail-Adresse und ein sicheres Passwort.',
      features: [
        'Keine Kreditkarte erforderlich',
        'Kostenloser Zugang zu allen Vergleichstools',
        'Speichern Sie Ihre Lieblingsangebote'
      ],
      image: 'https://images.unsplash.com/photo-1612831455740-a2f6212eeeb2?w=600&h=400&fit=crop&crop=faces',
      imageAlt: 'Freundliche Person am Laptop bei der Registrierung'
    },
    {
      number: 2,
      icon: Search,
      title: 'Angebote vergleichen',
      subtitle: 'Finden Sie die besten Zinsen',
      description: 'Durchsuchen Sie Sparangebote von vertrauenswürdigen europäischen Banken. Nutzen Sie unsere Filter, um Optionen nach Land, Zinssatz, Laufzeit und Mindestanlage einzugrenzen.',
      features: [
        'Über 50 europäische Banken',
        'Echtzeit-Zinssätze',
        'Detaillierte Angebotsvergleiche'
      ],
      image: 'https://images.unsplash.com/photo-1599453052061-5c377643e4fa?w=600&h=400&fit=crop&crop=faces',
      imageAlt: 'Paar bespricht gemeinsam Finanzoptionen am Laptop'
    },
    {
      number: 3,
      icon: CheckCircle,
      title: 'Beste Option wählen',
      subtitle: 'Treffen Sie eine informierte Entscheidung',
      description: 'Nutzen Sie unseren interaktiven Sparrechner, um zu berechnen, wie Ihr Geld im Laufe der Zeit wächst. Vergleichen Sie verschiedene Szenarien.',
      features: [
        'Interaktiver Zinsrechner',
        'Vergleich verschiedener Laufzeiten',
        'Speichern in Ihrem Dashboard'
      ],
      image: 'https://images.unsplash.com/photo-1758522490426-ae82d2351376?w=600&h=400&fit=crop&crop=faces',
      imageAlt: 'Glückliches Paar prüft Sparoptionen auf dem Tablet'
    },
    {
      number: 4,
      icon: Landmark,
      title: 'Konto eröffnen',
      subtitle: 'Direkt bei der Bank abschließen',
      description: 'Wenn Sie das perfekte Sparangebot gefunden haben, senden Sie Ihre Anfrage direkt an die Bank. Die Kontoeröffnung erfolgt bei der Partnerbank.',
      features: [
        'Einfacher Antragsprozess',
        'Direkte Kommunikation mit der Bank',
        'EU-Einlagensicherung bis 100.000 €'
      ],
      image: 'https://images.unsplash.com/photo-1686771416282-3888ddaf249b?w=600&h=400&fit=crop&crop=faces',
      imageAlt: 'Professionelle Beratung mit Handschlag'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B1E33] to-[#1a3a5c] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            So funktioniert es
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            In vier einfachen Schritten zum besten Sparangebot. 
            Vergleichen Sie europäische Banken und finden Sie die höchsten Zinsen.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="relative">
                    {/* Step Number Badge */}
                    <div className="absolute -top-4 -left-4 z-10 bg-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                      {step.number}
                    </div>
                    {/* Image Container */}
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                      <img
                        src={step.image}
                        alt={step.imageAlt}
                        className="w-full h-64 md:h-80 object-cover"
                        loading="lazy"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <step.icon size={20} className="text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">
                      Schritt {step.number}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h2>
                  <p className="text-lg text-teal-700 font-medium mb-4">
                    {step.subtitle}
                  </p>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {step.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Bereit, die besten Zinsen zu finden?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Starten Sie jetzt Ihren Vergleich und entdecken Sie attraktive Sparangebote von europäischen Banken.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/comparison">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 px-8">
                Angebote vergleichen
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-slate-300 px-8">
                Kostenlos registrieren
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Info Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Wichtige Informationen</h3>
                <p className="text-slate-600">Was Sie über H68 Spar Direkt wissen sollten</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl">
                <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  H68 Spar Direkt ist ein Vergleichsdienst. Wir halten oder verwalten keine Gelder.
                </span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl">
                <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Alle Sparkonten werden direkt bei unseren Partnerbanken eröffnet.
                </span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl">
                <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Jede Bank kann eigene Antragsanforderungen und Verifizierungsprozesse haben.
                </span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl">
                <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Einlagensicherung wird durch das nationale System jeder Bank gewährleistet.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HowItWorks;
