'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserRole, getUserRole, ROLE_LABELS, AppUser } from '@/types/inventory';
import {
  can as checkCan,
  canAny as checkCanAny,
  canAll as checkCanAll,
  getUserPermissions,
  PermissionKey
} from '@/lib/auth/permissions';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  role: UserRole;
  roleLabel: string;
  permissions: PermissionKey[];
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
  getUserRole: (roleOrEmail?: string) => UserRole;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  session: null,
  loading: true,
  isConfigured: false,
  role: 'teacher',
  roleLabel: 'Teacher / Staff',
  permissions: [],
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  getUserRole: () => 'teacher',
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {}
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
    role: data.role || 'teacher',
    aud: 'authenticated',
    created_at: data.createdAt || new Date().toISOString()
  } as unknown as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserFromStorage = useCallback(() => {
    try {
      let userData: any = null;
      const stored = localStorage.getItem('school_auth_user');
      if (stored) {
        try {
          userData = JSON.parse(stored);
        } catch {
          userData = null;
        }
      }
      
      if (!userData && typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )school_user=([^;]+)/);
        if (match) {
          const raw = decodeURIComponent(match[1]);
          try {
            if (raw.includes('.')) {
              const b64 = raw.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
              const jsonStr = decodeURIComponent(escape(atob(b64)));
              userData = JSON.parse(jsonStr);
            } else {
              userData = JSON.parse(raw);
            }
          } catch {
            userData = null;
          }
        }
      }

      if (userData && (userData.username || userData.id)) {
        const cleanRole = getUserRole(userData.role || userData.email);
        const resolvedPermissions = userData.permissions || getUserPermissions({ ...userData, role: cleanRole });
        const appUserObj: AppUser = {
          id: userData.id || `usr-${userData.username}`,
          username: userData.username || '',
          name: userData.name || userData.username || 'User',
          email: userData.email,
          role: cleanRole,
          permissions: resolvedPermissions
        };
        setAppUser(appUserObj);
        setUser(formatUserObject(appUserObj));
      }
    } catch (err) {
      console.warn('Failed to parse cached auth user:', err);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
    setLoading(false);
  }, [loadUserFromStorage]);

  const refreshUser = async () => {
    loadUserFromStorage();
  };

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

      const cleanRole = getUserRole(data.user.role || data.user.email);
      const perms = data.user.permissions || getUserPermissions({ ...data.user, role: cleanRole });
      const fullAppUser: AppUser = {
        ...data.user,
        role: cleanRole,
        permissions: perms
      };

      setAppUser(fullAppUser);
      setUser(formatUserObject(fullAppUser));
      localStorage.setItem('school_auth_user', JSON.stringify(fullAppUser));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    throw new Error('Google Sign-In has been disabled by School Administration. Please use your Username and Password.');
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setAppUser(null);
    setSession(null);
    try {
      localStorage.removeItem('school_auth_user');
      if (typeof document !== 'undefined') {
        document.cookie = 'school_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'school_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Determine current active permissions
  const role: UserRole = appUser?.role || getUserRole((user as any)?.role || user?.email);
  const roleLabel = ROLE_LABELS[role] || 'Teacher / Staff';
  const effectiveAppUser = useMemo<AppUser>(() => {
    return (
      appUser || {
        id: user?.id || 'usr-temp',
        username: (user?.user_metadata as any)?.username || '',
        name: (user?.user_metadata as any)?.full_name || '',
        email: user?.email || '',
        role: role,
        permissions: getUserPermissions({ id: user?.id || '', username: '', name: '', role })
      }
    );
  }, [appUser, user, role]);

  const permissions = useMemo(() => {
    return getUserPermissions(effectiveAppUser);
  }, [effectiveAppUser]);

  const can = useCallback((permission: PermissionKey): boolean => {
    return checkCan(effectiveAppUser, permission);
  }, [effectiveAppUser]);

  const canAny = useCallback((perms: PermissionKey[]): boolean => {
    return checkCanAny(effectiveAppUser, perms);
  }, [effectiveAppUser]);

  const canAll = useCallback((perms: PermissionKey[]): boolean => {
    return checkCanAll(effectiveAppUser, perms);
  }, [effectiveAppUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser: effectiveAppUser,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        role,
        roleLabel,
        permissions,
        can,
        canAny,
        canAll,
        getUserRole,
        signIn,
        signInWithGoogle,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
