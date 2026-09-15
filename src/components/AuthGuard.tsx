'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showDirectButton, setShowDirectButton] = useState(false);

  // Pages that bypass auth guard
  const isPublicPage = pathname === '/login' || pathname === '/auth/callback';

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace('/login');
      const timer = setTimeout(() => {
        setShowDirectButton(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Loading auth state or redirecting unauthenticated user to /login
  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-3xl p-8 flex flex-col items-center text-center shadow-lg shadow-black/5">
          {/* School Crest */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3.5 shadow-xs border border-[#E5E7EB] bg-[#F7F4EF] p-1.5 flex items-center justify-center">
            <img
              src="/images/school_logo.png"
              alt="Roong Aroon International School Crest"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-base font-black text-[#111827] tracking-tight block">
            Roong Aroon International School
          </span>
          <p className="text-[11px] font-semibold text-[#6B7280] tracking-wide mt-0.5">
            โรงเรียนนานาชาติรุ่งอรุณ • ERP Portal
          </p>

          <div className="w-full border-t border-[#F3F4F6] my-5" />

          <Loader2 className="w-8 h-8 animate-spin text-[#0B6B4F] mb-3" />
          <h2 className="text-sm font-bold text-[#111827]">
            {loading ? 'Verifying Authorization...' : 'Redirecting to Staff Sign In...'}
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Please sign in with your Username and Password.
          </p>

          {showDirectButton && (
            <Link
              href="/login"
              className="mt-5 w-full min-h-[42px] bg-[#0B6B4F] hover:bg-[#084D39] text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-sm"
            >
              <span>Go to Sign In Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Authorized user
  return <>{children}</>;
}
