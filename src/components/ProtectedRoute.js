import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1E33]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!requireAdmin && user.role !== 'admin') {
    if (user.must_reset_password && location.pathname !== '/auth/first-password-reset') {
      return <Navigate to="/auth/first-password-reset" replace />;
    }

    if (
      !user.must_reset_password &&
      user.onboarding_required &&
      !user.onboarding_completed &&
      location.pathname !== '/onboarding'
    ) {
      return <Navigate to="/onboarding" replace />;
    }

    if (location.pathname === '/auth/first-password-reset' && !user.must_reset_password) {
      return <Navigate to={user.onboarding_required && !user.onboarding_completed ? '/onboarding' : '/dashboard'} replace />;
    }

    if (location.pathname === '/onboarding' && user.onboarding_completed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
