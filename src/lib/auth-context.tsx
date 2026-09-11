'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserRole, getUserRole, ROLE_LABELS } from '@/types/inventory';

const ALLOWED_SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'roong-aroon.ac.th';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  role: UserRole;
  roleLabel: string;
  isSuperAdmin: boolean;
  isInventoryManager: boolean;
  canManageItems: boolean;
  canRestock: boolean;
  canDeleteItems: boolean;
  canPrintQr: boolean;
  canExportExcel: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  role: 'TEACHER',
  roleLabel: 'ครู / บุคลากร',
  isSuperAdmin: false,
  isInventoryManager: false,
  canManageItems: false,
  canRestock: false,
  canDeleteItems: false,
  canPrintQr: false,
  canExportExcel: false,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data }: any) => {
      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      alert('ระบบยังไม่ได้เชื่อมต่อ Supabase หรือยังไม่ได้ตั้งค่า Environment Variables');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
          ...(ALLOWED_SCHOOL_DOMAIN ? { hd: ALLOWED_SCHOOL_DOMAIN } : {})
        }
      }
    });

    if (error) {
      console.error('Sign in with Google error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Compute permissions based on user email
  const role: UserRole = getUserRole(user?.email);
  const roleLabel = ROLE_LABELS[role];
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isInventoryManager = role === 'INVENTORY_MANAGER' || isSuperAdmin;
  const canManageItems = isInventoryManager;
  const canRestock = isInventoryManager;
  const canDeleteItems = isSuperAdmin;
  const canPrintQr = isInventoryManager;
  const canExportExcel = isInventoryManager;

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
        isInventoryManager,
        canManageItems,
        canRestock,
        canDeleteItems,
        canPrintQr,
        canExportExcel,
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
