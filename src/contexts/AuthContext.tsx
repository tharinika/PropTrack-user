import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
type UserRole = 'landlord' | 'tenant' | null;

interface User {
  id?: string;
  email: string;
  role: UserRole;
  name: string;
  isDemo?: boolean;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  monthlyRent?: number;
  upiQrCodeUrl?: string;
  upiId?: string;
}

interface TenantCredential {
  id: string;
  email: string;
  password: string;
  name: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: number;
  isTemporaryPassword: boolean; // Track if password is temporary
}

interface AuthContextType {
  user: User | null;
  setUser:(user:User|null)=>void;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => boolean;
  signUp: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  needsPasswordReset: boolean;
  completePasswordReset: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('proptrack_user');
    const savedNeedsReset = localStorage.getItem('proptrack_needs_reset');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('[AUTH] Failed to parse saved user:', error);
        localStorage.removeItem('proptrack_user');
      }
    }
    if (savedNeedsReset === 'true') {
      setNeedsPasswordReset(true);
    }
    setIsInitialized(true);
  }, []);

  // Listen for storage events to update user data
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('proptrack_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('[AUTH] Failed to parse saved user on storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async(email: string, password: string, role: UserRole = 'landlord'): boolean => {
    // Demo Landlord Account
    if (email === 'landlord@proptrack.com' && role === 'landlord') {
      const landlordUser: User = {
        id: 'landlord-1',
        email: 'landlord@proptrack.com',
        role: 'landlord',
        name: 'John Anderson',
        isDemo: true
      };
      setUser(landlordUser);
      setNeedsPasswordReset(false);
      localStorage.setItem('proptrack_user', JSON.stringify(landlordUser));
      localStorage.removeItem('proptrack_needs_reset');
      return true;
    }
    
    // Demo Tenant Account
    if (email === 'tenant@proptrack.com' && role === 'tenant') {
      const tenantUser: User = {
        id: 'tenant-1',
        email: 'tenant@proptrack.com',
        role: 'tenant',
        name: 'Sarah Miller',
        isDemo: true,
        propertyId: 'greenwood-1',
        propertyName: 'Greenwood Apartments',
        unitId: 'unit-1',
        unitNumber: 'A-101',
        monthlyRent: 15000
      };
      
      console.log('[TENANT LOGIN] User connected to backend:', {
        propertyId: tenantUser.propertyId,
        unitId: tenantUser.unitId,
        monthlyRent: tenantUser.monthlyRent,
        isDemo: tenantUser.isDemo
      });
      
      setUser(tenantUser);
      
      // Demo tenant doesn't need password reset
      setNeedsPasswordReset(false);
      localStorage.setItem('proptrack_user', JSON.stringify(tenantUser));
      localStorage.removeItem('proptrack_needs_reset');
      return true;
    }
    
    // Check tenant credentials (for custom tenants added by landlords)
    if (role === 'tenant') {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    console.error("Auth error:", authError);
    return false;
  }

  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !dbUser) {
    console.error("DB error:", dbError);
    return false;
  }

  console.log("DB USER:", dbUser);

  const tenantUser: User = {
    id: dbUser.id,
    email: dbUser.email,
    role: 'tenant',
    name: dbUser.name,
    isDemo: false,
    propertyId: dbUser.property_id,
    unitId: dbUser.unit_id,
    monthlyRent: dbUser.monthly_rent || 0
  };

  console.log("FINAL USER:", tenantUser);

  setUser(tenantUser);
  localStorage.setItem('proptrack_user', JSON.stringify(tenantUser));

  return true;
}
    
    // Check custom accounts (only for landlords from sign-up)
    if (role === 'landlord') {
      const savedAccounts = localStorage.getItem('proptrack_accounts');
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        const account = accounts.find((acc: any) => acc.email === email && acc.password === password);
        if (account) {
          const signedInUser: User = {
            id: `user-${Date.now()}`,
            email: account.email,
            role: 'landlord',
            name: account.name,
            isDemo: false
          };
          setUser(signedInUser);
          setNeedsPasswordReset(false);
          localStorage.setItem('proptrack_user', JSON.stringify(signedInUser));
          localStorage.removeItem('proptrack_needs_reset');
          return true;
        }
      }
    }
    
    return false;
  };

  const signUp = (email: string, password: string, name: string): boolean => {
    const savedAccounts = localStorage.getItem('proptrack_accounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    
    if (accounts.find((acc: any) => acc.email === email)) {
      return false;
    }
    
    const newAccount = { email, password, name };
    accounts.push(newAccount);
    localStorage.setItem('proptrack_accounts', JSON.stringify(accounts));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      role: 'landlord',
      name,
      isDemo: false
    };
    setUser(newUser);
    setNeedsPasswordReset(false);
    localStorage.setItem('proptrack_user', JSON.stringify(newUser));
    localStorage.removeItem('proptrack_needs_reset');
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setNeedsPasswordReset(false);
    localStorage.removeItem('proptrack_user');
    localStorage.removeItem('proptrack_needs_reset');
    window.history.pushState(null, '', window.location.href);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const completePasswordReset = (newPassword: string) => {
    setNeedsPasswordReset(false);
    localStorage.removeItem('proptrack_needs_reset');
    
    if (user && user.role === 'tenant' && !user.isDemo) {
      // Update tenant credential with new password and remove temporary flag
      const savedCredentials = localStorage.getItem('proptrack_tenant_credentials');
      if (savedCredentials) {
        const credentials: TenantCredential[] = JSON.parse(savedCredentials);
        const updatedCredentials = credentials.map((cred) => {
          if (cred.id === user.id) {
            return {
              ...cred,
              password: newPassword,
              isTemporaryPassword: false
            };
          }
          return cred;
        });
        localStorage.setItem('proptrack_tenant_credentials', JSON.stringify(updatedCredentials));
      }
    }
    
    // Update current user object (for session management)
    if (user) {
      const updatedUser: User = {
        ...user
      };
      setUser(updatedUser);
      localStorage.setItem('proptrack_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        login,
        signUp,
        logout,
        needsPasswordReset,
        completePasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}