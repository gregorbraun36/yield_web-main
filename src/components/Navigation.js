import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  // Navigation groups
  const productLinks = [
    { name: 'Home', path: '/' },
    { name: 'Vergleich', path: '/comparison' },
    { name: 'Rechner', path: '/calculator' },
  ];

  const infoLinks = [
    { name: 'So funktioniert es', path: '/how-it-works' },
    { name: 'Sicherheit', path: '/security' },
    { name: 'Steuern', path: '/savings-education' },
    { name: 'FAQ', path: '/faq' },
  ];

  const companyLinks = [
    { name: 'Über uns', path: '/about' },
    { name: 'Kontakt', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all ${isActive(to)
          ? 'text-teal-700 bg-teal-50'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      data-testid={`nav-${children.toLowerCase().replace(/\s/g, '-')}`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">

          {/* Logo - Slightly larger with more spacing */}
          <Link to="/" className="flex items-center group flex-shrink-0 mr-8" data-testid="nav-logo">
            <img src="/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" className="h-10 w-auto max-w-[240px] sm:max-w-[280px]" />
          </Link>

          {/* Desktop Navigation - Grouped */}
          <div className="hidden lg:flex items-center flex-1">

            {/* Left Group: Products */}
            <div className="flex items-center">
              {productLinks.map((link) => (
                <NavLink key={link.path} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 mx-3"></div>

            {/* Middle Group: Information */}
            <div className="flex items-center">
              {infoLinks.map((link) => (
                <NavLink key={link.path} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 mx-3"></div>

            {/* Right Group: Company */}
            <div className="flex items-center">
              {companyLinks.map((link) => (
                <NavLink key={link.path} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Action Buttons - Far Right */}
          <div className="hidden lg:flex items-center gap-3 ml-6 flex-shrink-0">
            {user ? (
              <>
                <Button asChild variant="ghost" className="text-slate-700 hover:bg-slate-100 font-medium">
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} data-testid="nav-dashboard-btn">
                    Dashboard
                  </Link>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                  data-testid="nav-logout-btn"
                >
                  Abmelden
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-slate-700 hover:bg-slate-100 font-medium">
                  <Link to="/login" data-testid="nav-login-btn">
                    Anmelden
                  </Link>
                </Button>
                <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 shadow-sm">
                  <Link to="/register" data-testid="nav-register-btn">
                    Konto eröffnen
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} className="text-slate-700" /> : <Menu size={24} className="text-slate-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100" data-testid="mobile-menu">

            {/* Products Section */}
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Produkte</p>
              {productLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 ${isActive(link.path)
                      ? 'text-teal-700 bg-teal-50'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Information Section */}
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Information</p>
              {infoLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 ${isActive(link.path)
                      ? 'text-teal-700 bg-teal-50'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Company Section */}
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Unternehmen</p>
              {companyLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 ${isActive(link.path)
                      ? 'text-teal-700 bg-teal-50'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-4"></div>

            {/* Action Buttons */}
            <div className="px-4 space-y-2">
              {user ? (
                <>
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    className="block w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="outline" className="w-full justify-center">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-center text-slate-600"
                  >
                    Abmelden
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full justify-center bg-teal-600 hover:bg-teal-700">
                    <Link to="/register" className="w-full" onClick={() => setIsOpen(false)}>
                      Konto eröffnen
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}>
                      Anmelden
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
