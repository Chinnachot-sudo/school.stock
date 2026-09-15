'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AlertCircle, Loader2, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
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
      setError(err.message || 'Login failed. Please check your username and password.');
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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-7 sm:p-9 flex flex-col items-center text-center shadow-lg shadow-black/5">
        
        {/* School Crest / Romaneeya Logo */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3.5 shadow-sm border border-[#E5E7EB] bg-[#F7F4EF] p-1.5 flex items-center justify-center">
          <img
            src="/images/school_logo.png"
            alt="Roong Aroon International School Crest"
            className="w-full h-full object-contain"
          />
        </div>

        <span className="text-lg font-black text-[#111827] tracking-tight block">
          Roong Aroon International School
        </span>
        <p className="text-xs font-semibold text-[#6B7280] tracking-wide mt-0.5">
          โรงเรียนนานาชาติรุ่งอรุณ • Inventory Portal
        </p>

        <div className="w-full border-t border-[#F3F4F6] my-5" />

        <div className="w-full text-left mb-5">
          <h1 className="text-base font-bold text-[#111827]">
            Staff Sign In
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Restricted access. Please sign in with your assigned credentials.
          </p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. superadmin or admin"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Password
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] mt-2 bg-[#0B6B4F] hover:bg-[#084D39] active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to System</span>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Panel */}
        <div className="w-full mt-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Default System Accounts:</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900">Super Admin:</span>
                <span className="font-mono text-slate-600 ml-1.5">superadmin</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="font-mono text-slate-600">rais2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('superadmin', 'rais2026')}
                  className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin', 'rais2026')}
                  disabled={isSubmitting}
                  className="text-[10.5px] font-bold text-white bg-[#0B6B4F] hover:bg-[#084D39] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  1-Click Login
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900">Admin:</span>
                <span className="font-mono text-slate-600 ml-1.5">admin</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="font-mono text-slate-600">admin2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin2026')}
                  className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin2026')}
                  disabled={isSubmitting}
                  className="text-[10.5px] font-bold text-white bg-[#0B6B4F] hover:bg-[#084D39] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  1-Click Login
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
