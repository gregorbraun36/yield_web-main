import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0B1E33] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src="/assets/logo/h68-logo-white.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto mb-4" />
            <p className="text-slate-300 text-sm">
              Ihre vertrauenswürdige europäische Sparvergleichsplattform.
            </p>
            <div className="flex items-center mt-4 space-x-2">
              <Shield size={16} className="text-green-400" />
              <span className="text-xs text-slate-300">Bankentaugliche Sicherheit</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produkte</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/comparison" className="hover:text-white transition-colors">Sparvergleich</Link></li>
              <li><Link to="/calculator" className="hover:text-white transition-colors">Zinsrechner</Link></li>
              <li><Link to="/partner-banks" className="hover:text-white transition-colors">Partnerbanken</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Unternehmen</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/about" className="hover:text-white transition-colors">Über uns</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">So funktioniert's</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Sicherheit</Link></li>
              <li><Link to="/savings-education" className="hover:text-white transition-colors">Sparen erklärt</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/legal/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Datenschutzerklärung</Link></li>
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">AGB</Link></li>
              <li><Link to="/legal/disclaimer" className="hover:text-white transition-colors">Haftungsausschluss</Link></li>
              <li><Link to="/legal/revocation" className="hover:text-white transition-colors">Widerrufsbelehrung</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-400 mb-4 md:mb-0">
            © {new Date().getFullYear()} H68 Spar Direkt. Alle Rechte vorbehalten.
          </p>
          <div className="flex space-x-2">
            <a href="https://wa.me/493023320761" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center h-10 w-10" data-testid="footer-whatsapp">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-7 w-7 fill-current">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
