'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserRole, getUserRole, ROLE_LABELS, AppUser } from '@/types/inventory';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  role: UserRole;
  roleLabel: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isInventoryManager: boolean;
  canManageItems: boolean;
  canRestock: boolean;
  canDeleteItems: boolean;
  canPrintQr: boolean;
  canExportExcel: boolean;
  canManageUsers: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  role: 'TEACHER',
  roleLabel: 'Teacher / Staff',
  isSuperAdmin: false,
  isAdmin: false,
  isInventoryManager: false,
  canManageItems: false,
  canRestock: false,
  canDeleteItems: false,
  canPrintQr: false,
  canExportExcel: false,
  canManageUsers: false,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

function formatUserObject(data: any): User {
  return {
    id: data.id || 'usr-default',
    email: data.email || `${data.username || 'staff'}@roong-aroon.ac.th`,
    app_metadata: { provider: 'credentials' },
    user_metadata: {
      full_name: data.name || data.username || 'Staff User',
      username: data.username || ''
    },
    role: data.role || 'TEACHER',
    aud: 'authenticated',
    created_at: data.createdAt || new Date().toISOString()
  } as unknown as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage for persisted user session
    try {
      const stored = localStorage.getItem('school_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.username) {
          setUser(formatUserObject(parsed));
        }
      }
    } catch (err) {
      console.warn('Failed to parse cached auth user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      const formatted = formatUserObject(data.user);
      setUser(formatted);
      localStorage.setItem('school_auth_user', JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Deprecated in favor of credentials, but provided for compatibility
    throw new Error('Google Sign-In has been disabled by School Administration. Please use your Username and Password.');
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem('school_auth_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Determine permissions
  const rawRole = (user as any)?.role || user?.email;
  const role: UserRole = getUserRole(rawRole);
  const roleLabel = ROLE_LABELS[role] || 'Teacher / Staff';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;
  const isInventoryManager = isAdmin; // alias
  const canManageItems = isAdmin;
  const canRestock = isAdmin;
  const canDeleteItems = isSuperAdmin;
  const canPrintQr = isAdmin;
  const canExportExcel = isAdmin;
  const canManageUsers = isSuperAdmin || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        role,
        roleLabel,
        isSuperAdmin,
        isAdmin,
        isInventoryManager,
        canManageItems,
        canRestock,
        canDeleteItems,
        canPrintQr,
        canExportExcel,
        canManageUsers,
        signIn,
        signInWithGoogle,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
