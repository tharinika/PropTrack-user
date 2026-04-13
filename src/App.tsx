import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertiesProvider } from './contexts/PropertiesContext';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { CommunityProvider } from './contexts/CommunityContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { TenantDashboard } from './components/tenant/TenantDashboard';
import { Toaster } from './components/ui/sonner';

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password';

// Wrapper component to access AppDataContext and pass tenants to CommunityProvider

function MainApp() {
  const { user } = useAuth();

  let tenants = [];

  try {
    tenants = useAppData().tenants;
  } catch (err) {
    return null; // ⛑️ prevents crash
  }

  const tenantInfo = tenants.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    property: tenant.property,
    unit: tenant.unit
  }));

  return (
    <CommunityProvider tenants={tenantInfo}>
      <AppContent />
    </CommunityProvider>
  );
}
function AppContent() {
  const { user, needsPasswordReset } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  // Reset to login page when user logs out
  useEffect(() => {
    if (!user) {
      setAuthView('login');
    }
  }, [user]);

  // Show reset password for first-time tenant login
  if (user && needsPasswordReset) {
    return <ResetPasswordPage />;
  }

  // Show role-based dashboard
  if (user) {
    return (
      user.role === 'landlord'
    ? <LandlordDashboard />
    : <TenantDashboard />
    );
  }

  // Show authentication screens
  switch (authView) {
    case 'signup':
      return <SignUpPage onBack={() => setAuthView('login')} />;
    case 'forgot-password':
      return <ForgotPasswordPage onBack={() => setAuthView('login')} />;
    default:
      return (
        <LoginPage 
          onForgotPassword={() => setAuthView('forgot-password')}
          onSignUp={() => setAuthView('signup')}
        />
      );
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PropertiesProvider>
          <AppDataProvider>
            <MainApp />
            <Toaster />
          </AppDataProvider>
        </PropertiesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}