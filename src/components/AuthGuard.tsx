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
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
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
      <div className="min-h-[75vh] flex items-center justify-center p-3">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Decorative background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-100 rounded-full blur-2xl pointer-events-none"></div>

          {/* Logo / Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <School className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            ระบบคลังพัสดุโรงเรียนรุ่งอรุณ
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            กรุณาเข้าสู่ระบบก่อนใช้งาน
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            สำหรับครูและบุคลากร ใช้บัญชี Google โรงเรียนเพื่อสแกนเช็คและตัดสต็อกพัสดุ
          </p>

          {error && (
            <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="w-full mt-6 space-y-3">
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-2xl border border-slate-300 shadow-sm hover:shadow-md flex items-center justify-center gap-3 text-sm transition active:scale-98 disabled:opacity-50"
            >
              {isSigningIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>เข้าสู่ระบบด้วย Google (อีเมลโรงเรียน)</span>
            </button>

            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>รองรับบัญชี @roong-aroon.ac.th</span>
            </p>
          </div>

          <div className="w-full mt-6 pt-5 border-t border-slate-100 text-left space-y-2 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">💡 ทำไมต้องเข้าสู่ระบบ?</p>
            <ul className="space-y-1 list-disc list-inside text-slate-500">
              <li>ระบบจะบันทึกชื่อผู้เบิกตามบัญชี Google ให้อัตโนมัติ</li>
              <li>ป้องกันบุคคลภายนอกที่ไม่เกี่ยวข้องเข้ามาตัดสต็อกพัสดุ</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Authorized / offline mode
  return <>{children}</>;
}
