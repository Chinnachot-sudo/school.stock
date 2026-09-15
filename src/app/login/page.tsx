'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  AlertCircle,
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signIn(username.trim(), password);
      window.location.href = '/';
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Login failed. Please check your username and password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1A14]">
        <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans overflow-hidden bg-[#0A1A14]">
      {/* Ambient Nature Background (02content.jpg) with soft, non-distracting opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src="/images/02content.jpg"
          alt="Roong Aroon Ambience"
          className="w-full h-full object-cover object-center opacity-25 filter blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#06150F]/85 via-[#0A1A14]/75 to-[#0D241C]/80" />
      </div>

      {/* 2-Column Main Login Card */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] border border-white/25 shadow-2xl shadow-black/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* ================= LEFT COLUMN: Pure Clean Architectural Photo DSC00918.jpg ================= */}
        <div className="relative hidden lg:block lg:col-span-6 overflow-hidden select-none bg-slate-900">
          <img
            src="/images/DSC00918.jpg"
            alt="Roong Aroon International School Architecture"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mobile Header Banner (small screens only) */}
        <div className="lg:hidden relative h-52 w-full overflow-hidden select-none bg-slate-900">
          <img
            src="/images/DSC00918.jpg"
            alt="Roong Aroon Architecture"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ================= RIGHT COLUMN: Clean Login Form ================= */}
        <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B6B4F]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Staff Authentication
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-sm mx-auto my-auto space-y-6">
            {/* Heading */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Login
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
                Welcome back! Please login to your account.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your username / email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/20 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/20 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep me logged in checkbox & Forgot password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B6B4F] focus:ring-[#0B6B4F] border-slate-300 accent-[#0B6B4F]"
                  />
                  <span>Keep me logged in</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-xs font-semibold text-slate-500 hover:text-[#0B6B4F] transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {showForgotNotice && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] animate-in fade-in">
                  กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านของคุณ
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] bg-[#0B6B4F] hover:bg-[#08543E] active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-md shadow-emerald-900/15 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Helper text */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{' '}
                <span className="text-[#0B6B4F] font-bold">Contact Admin</span>
              </p>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="text-center pt-6 text-[11px] text-slate-400">
            @ {new Date().getFullYear()} Roong Aroon International School. All rights reserved.
          </div>
        </div>

      </div>
    </div>
  );
}
