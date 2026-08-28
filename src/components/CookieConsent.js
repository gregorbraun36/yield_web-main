import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, Megaphone, Settings, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const COOKIE_CONSENT_KEY = 'h68_spar_direkt_cookie_consent';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('consent');
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: false,
    statistics: false,
    marketing: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs) => {
    const consentData = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleReject = () => {
    const onlyNecessary = {
      necessary: true,
      preferences: false,
      statistics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  const handleAllowSelection = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const content = {
    title: 'Diese Website verwendet Cookies',
    description: 'Wir verwenden Cookies, um unsere Website sicher und benutzerfreundlich zu betreiben. Einige Cookies sind notwendig, um die Grundfunktionen der Website zu gewährleisten, während andere uns helfen, die Website zu verbessern und Ihnen relevante Inhalte anzuzeigen.',
    tabs: {
      consent: 'Zustimmung',
      details: 'Details',
      about: 'Über Cookies',
    },
    categories: {
      necessary: {
        title: 'Notwendig',
        description: 'Diese Cookies sind für das Funktionieren der Website unerlässlich und können nicht deaktiviert werden. Sie werden nur als Reaktion auf von Ihnen vorgenommene Aktionen gesetzt.',
        always: 'Immer aktiv',
      },
      preferences: {
        title: 'Präferenzen',
        description: 'Diese Cookies ermöglichen es der Website, sich an Ihre Einstellungen zu erinnern (z.B. Sprache, Region) und erweiterte, personalisierte Funktionen bereitzustellen.',
      },
      statistics: {
        title: 'Statistik',
        description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem sie Informationen anonym sammeln und melden.',
      },
      marketing: {
        title: 'Marketing',
        description: 'Diese Cookies werden verwendet, um Besuchern relevante Werbung und Marketing-Kampagnen anzuzeigen. Sie verfolgen Besucher über Websites hinweg.',
      },
    },
    about: {
      title: 'Was sind Cookies?',
      text1: 'Cookies sind kleine Textdateien, die von Websites auf Ihrem Gerät gespeichert werden. Sie werden häufig verwendet, um Websites funktionsfähig zu machen oder effizienter zu arbeiten, sowie um Informationen an die Eigentümer der Website zu übermitteln.',
      title2: 'Wie verwenden wir Cookies?',
      text2: 'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Dies umfasst die Speicherung Ihrer Präferenzen, die Analyse des Nutzerverhaltens und die Bereitstellung personalisierter Inhalte.',
      title3: 'Ihre Rechte',
      text3: 'Sie haben das Recht, Ihre Cookie-Einstellungen jederzeit zu ändern. Sie können auch alle nicht-notwendigen Cookies ablehnen, ohne dass dies die Grundfunktionen der Website beeinträchtigt.',
    },
    buttons: {
      reject: 'Ablehnen',
      allowSelection: 'Auswahl erlauben',
      acceptAll: 'Alle akzeptieren',
    },
  };

  if (!isVisible) return null;

  const categoryIcons = {
    necessary: <Shield size={20} className="text-green-600" />,
    preferences: <Settings size={20} className="text-blue-600" />,
    statistics: <BarChart3 size={20} className="text-purple-600" />,
    marketing: <Megaphone size={20} className="text-orange-600" />,
  };

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 z-[60] w-full md:left-1/2 md:right-auto md:bottom-6 md:w-[min(100%-2rem,42rem)] md:-translate-x-1/2"
        data-testid="cookie-consent-banner"
      >
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Cookie size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{content.title}</h2>
            </div>
          </div>

          <div className="flex border-b border-slate-200">
            {['consent', 'details', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                data-testid={`cookie-tab-${tab}`}
              >
                {content.tabs[tab]}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {activeTab === 'consent' && (
              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">{content.description}</p>
                
                <div className="space-y-3 mt-4">
                  {Object.entries(preferences).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        value ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {categoryIcons[key]}
                        <span className="font-medium text-slate-900">
                          {content.categories[key].title}
                        </span>
                      </div>
                      {key === 'necessary' ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          {content.categories.necessary.always}
                        </span>
                      ) : (
                        <Switch
                          checked={value}
                          onCheckedChange={() => togglePreference(key)}
                          data-testid={`cookie-toggle-${key}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                {Object.entries(content.categories).map(([key, category]) => (
                  <div
                    key={key}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className={`flex items-center justify-between p-4 ${
                      preferences[key] ? 'bg-green-50' : 'bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {categoryIcons[key]}
                        <span className="font-semibold text-slate-900">{category.title}</span>
                      </div>
                      {key === 'necessary' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="text-xs font-semibold text-green-600">
                            {content.categories.necessary.always}
                          </span>
                        </div>
                      ) : (
                        <Switch
                          checked={preferences[key]}
                          onCheckedChange={() => togglePreference(key)}
                        />
                      )}
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm text-slate-600">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">{content.about.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{content.about.text1}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">{content.about.title2}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{content.about.text2}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-900">{content.about.title3}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{content.about.text3}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={handleReject}
                data-testid="cookie-reject-btn"
              >
                {content.buttons.reject}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={handleAllowSelection}
                data-testid="cookie-allow-selection-btn"
              >
                {content.buttons.allowSelection}
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAcceptAll}
                data-testid="cookie-accept-all-btn"
              >
                {content.buttons.acceptAll}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
