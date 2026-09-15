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
  ShieldCheck,
  Building2
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

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    try {
      setIsSubmitting(true);
      await signIn(u, p);
      window.location.href = '/';
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F2]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6B4F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F2] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* 2-Column Main Login Card */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/90 shadow-2xl shadow-emerald-950/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ================= LEFT COLUMN: Visual Banner with DSC00918.jpg ================= */}
        <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-8 xl:p-10 bg-slate-900 overflow-hidden select-none">
          {/* Background School Architecture Photo */}
          <img
            src="/images/DSC00918.jpg"
            alt="Roong Aroon International School Architecture"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Aesthetic Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-slate-900/50" />

          {/* Top Brand Emblem */}
          <div className="relative z-10 flex items-center gap-3 bg-black/25 backdrop-blur-md p-2.5 pr-4 rounded-2xl border border-white/20 w-fit">
            <div className="w-11 h-11 rounded-xl bg-white/95 p-1 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/images/school_logo.png"
                alt="Roong Aroon Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-white font-black text-xs tracking-wider uppercase block">
                Roong Aroon
              </span>
              <span className="text-emerald-300 text-[10.5px] font-medium block">
                International School
              </span>
            </div>
          </div>

          {/* Bottom Architectural Info Card */}
          <div className="relative z-10 bg-black/45 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-[10px] tracking-wider uppercase">
                <Building2 className="w-3 h-3" />
                School ERP Portal
              </span>
              <span className="text-[11px] text-slate-300 font-mono">v2.0</span>
            </div>
            <h2 className="text-xl font-black text-white leading-tight">
              โรงเรียนนานาชาติรุ่งอรุณ
            </h2>
            <p className="text-xs text-slate-200 font-normal leading-relaxed">
              ระบบสารสนเทศบริหารจัดการพัสดุ สินค้าคงคลัง และห้องสหกรณ์โรงเรียน
              เพื่อสนับสนุนการเรียนรู้อย่างเต็มศักยภาพ
            </p>
          </div>
        </div>

        {/* Mobile Header Banner (when on small screens) */}
        <div className="lg:hidden relative h-48 w-full overflow-hidden select-none">
          <img
            src="/images/DSC00918.jpg"
            alt="Roong Aroon Architecture"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-slate-900/50" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
            <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/20 w-fit">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center">
                <img src="/images/school_logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-xs leading-none block">Roong Aroon International School</span>
                <span className="text-[10px] text-emerald-300">โรงเรียนนานาชาติรุ่งอรุณ</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-white/95">Inventory & POS Management Portal</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Modern Clean Login Form ================= */}
        <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          {/* Top bar with language / academic year tag */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B6B4F]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Staff Authentication
              </span>
            </div>

            {/* Region / Status Tag (matching IND 🇮🇳 badge in mockup) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700">
              <span>TH</span>
              <span>🇹🇭</span>
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
                    placeholder="superadmin or admin"
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
                  กรุณาติดต่อผู้ดูแลระบบ (Super Admin) เพื่อรีเซ็ตรหัสผ่านของคุณ
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

            {/* "or" Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                or
              </span>
            </div>

            {/* Quick 1-Click Role Login Pills (matching third-party buttons in mockup) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin', 'rais2026')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-[#0B6B4F] hover:bg-emerald-50/40 text-slate-700 hover:text-[#0B6B4F] transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[#0B6B4F] group-hover:scale-110 transition" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin2026')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-[#0B6B4F] hover:bg-emerald-50/40 text-slate-700 hover:text-[#0B6B4F] transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <User className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                <span>Admin Login</span>
              </button>
            </div>

            {/* Helper text under buttons */}
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
