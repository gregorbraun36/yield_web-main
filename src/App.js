import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import CookieConsent from '@/components/CookieConsent';
import ScrollToTop from '@/components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import SavingsComparison from '@/pages/SavingsComparison';
import Calculator from '@/pages/Calculator';
import HowItWorks from '@/pages/HowItWorks';
import Security from '@/pages/Security';
import PartnerBanks from '@/pages/PartnerBanks';
import SavingsEducation from '@/pages/SavingsEducation';
import FAQ from '@/pages/FAQ';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import UserDashboard from '@/pages/UserDashboard';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminBanks from '@/pages/AdminBanks';
import AdminOffers from '@/pages/AdminOffers';
import AdminUsers from '@/pages/AdminUsers';
import AdminApplications from '@/pages/AdminApplications';
import AdminOfferInterests from '@/pages/AdminOfferInterests';
import AdminContracts from '@/pages/AdminContracts';
import AdminSupportMailbox from '@/pages/AdminSupportMailbox';
import AdminActivityFeed from '@/pages/AdminActivityFeed';
import ApplicationForm from '@/pages/ApplicationForm';
import BBVAContractForm from '@/pages/BBVAContractForm';
import Legal from '@/pages/Legal';
import FirstPasswordReset from '@/pages/FirstPasswordReset';
import Onboarding from '@/pages/Onboarding';
import UserFestgeld from '@/pages/UserFestgeld';
import UserTagesgeld from '@/pages/UserTagesgeld';
import UserFlexgeld from '@/pages/UserFlexgeld';
import UserTaxes from '@/pages/UserTaxes';
import AdminTaxes from '@/pages/AdminTaxes';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { loadEurRates } from '@/lib/currency';
import '@/App.css';

function App() {
  React.useEffect(() => {
    loadEurRates();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="App">
          <Routes>
            {/* Layout wrapper — Navigation & Footer rendered once */}
            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/comparison" element={<SavingsComparison />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/security" element={<Security />} />
              <Route path="/partner-banks" element={<PartnerBanks />} />
              <Route path="/savings-education" element={<SavingsEducation />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/apply" element={<ApplicationForm />} />
              <Route path="/contract/bbva" element={<BBVAContractForm />} />
              <Route path="/legal/:page" element={<Legal />} />

              {/* User protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/festgeld"
                element={
                  <ProtectedRoute>
                    <UserFestgeld />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/tagesgeld"
                element={
                  <ProtectedRoute>
                    <UserTagesgeld />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/flexgeld"
                element={
                  <ProtectedRoute>
                    <UserFlexgeld />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/taxes"
                element={
                  <ProtectedRoute>
                    <UserTaxes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auth/first-password-reset"
                element={
                  <ProtectedRoute>
                    <FirstPasswordReset />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Admin protected — shared shell + nested routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="banks" element={<AdminBanks />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="offer-interests" element={<AdminOfferInterests />} />
                <Route path="contracts" element={<AdminContracts />} />
                <Route path="taxes" element={<AdminTaxes />} />
                <Route path="support-mailbox" element={<AdminSupportMailbox />} />
                <Route path="activity-feed" element={<AdminActivityFeed />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
          <CookieConsent />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
