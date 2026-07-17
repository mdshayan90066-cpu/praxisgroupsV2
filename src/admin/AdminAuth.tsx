import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// 🔒 Hardcoded admin credentials
const ADMIN_EMAIL = 'mdshayan90066@gmail.com';
const ADMIN_PASSWORD = 'Rahmanian@22-24';

const SESSION_KEY = 'praxis-admin-session';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  adminEmail: string;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === ADMIN_EMAIL) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, ADMIN_EMAIL);
      setIsAuthenticated(true);
      return { error: null };
    }
    return { error: 'Invalid email or password.' };
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, loading, adminEmail: ADMIN_EMAIL, login, signOut }),
    [isAuthenticated, loading, login, signOut]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
