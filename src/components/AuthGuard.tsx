'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { Loader2, School, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pages that bypass auth guard
  if (pathname === '/login' || pathname === '/auth/callback') {
    return <>{children}</>;
  }

  // Loading auth state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F4D3A]" />
        <p className="text-xs text-[#6B6560]">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
      </div>
    );
  }

  // If Supabase is configured and user is NOT logged in -> Require Login!
  if (isConfigured && !user) {
    const handleLogin = async () => {
      try {
        setIsSigningIn(true);
        setError(null);
        await signInWithGoogle();
      } catch (err: any) {
        setIsSigningIn(false);
        setError(err.message || 'ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาลองใหม่อีกครั้ง');
      }
    };

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 flex flex-col items-center text-center">
          
          {/* Romaneeya Leaf Icon */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden mb-3 shadow-xs border border-[#E5E7EB] bg-[#E6F5EF] p-1">
            <img
              src="/images/romaneeya_leaf_logo.svg"
              alt="Romaneeya Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-base font-extrabold text-[#111827] tracking-tight block">
            Romaneeya
          </span>
          <p className="text-[11px] font-mono text-[#6B7280] tracking-wide uppercase">
            Roong Aroon International School
          </p>

          <h1 className="text-lg font-bold text-[#111827] mt-3">
            เข้าสู่ระบบ
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            ระบบ ERP & คลังพัสดุ (ใช้บัญชีโรงเรียนเท่านั้น)
          </p>

          {error && (
            <div className="w-full mt-4 p-3 bg-[#FEE4E2] border border-[#B42318]/20 text-[#B42318] text-xs rounded-lg flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="w-full mt-6 space-y-3">
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full min-h-[48px] bg-[#1F4D3A] hover:bg-[#183D2E] active:scale-98 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 text-xs transition disabled:opacity-60"
            >
              {isSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>

            <p className="text-[11px] text-[#6B6560] text-center font-mono">
              @roong-aroon.ac.th
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authorized / offline mode
  return <>{children}</>;
}
