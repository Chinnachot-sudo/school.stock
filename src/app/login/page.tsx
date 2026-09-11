'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { School, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to home
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setIsSigningIn(false);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#1F4D3A]" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-xs">
        
        {/* School Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center mb-4 shadow-xs">
          <School className="w-6 h-6" />
        </div>

        <p className="text-[11px] font-mono text-[#6B7280] tracking-wide uppercase">
          Roong Aroon International School
        </p>

        <h1 className="text-xl font-bold text-[#111827] mt-1">
          เข้าสู่ระบบ
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          ใช้บัญชีโรงเรียนเท่านั้น
        </p>

        {error && (
          <div className="w-full mt-4 p-3 bg-[#FEE4E2] border border-[#B42318]/20 text-[#B42318] text-xs rounded-xl flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Google Login Button */}
        <div className="w-full mt-6 space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full min-h-[48px] bg-[#0B6B4F] hover:bg-[#0F3D2E] active:scale-98 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-xs transition disabled:opacity-60 shadow-xs"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>

          <p className="text-[11px] text-[#6B6560] text-center font-mono">
            @roong-aroon.ac.th
          </p>
        </div>

        {/* Fallback for local development */}
        {!isConfigured && (
          <div className="w-full mt-6 pt-4 border-t border-[#E5E0D8]">
            <Link
              href="/"
              className="text-xs text-[#6B6560] hover:text-[#1A1A1A] flex items-center justify-center gap-1 transition"
            >
              <span>เข้าใช้งานโหมดทดสอบ (Local Dev)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
