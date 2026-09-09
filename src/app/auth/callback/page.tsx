'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      router.replace('/');
      return;
    }

    const client = supabase;

    const handleCallback = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;

        if (data.session) {
          const email = data.session.user.email || '';
          const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'roong-aroon.ac.th';
          
          if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
            await client.auth.signOut();
            setError(`ขออภัย: อนุญาตเฉพาะบัญชีอีเมลโรงเรียน (@${allowedDomain}) เท่านั้น (อีเมลที่คุณใช้คือ: ${email})`);
            return;
          }

          router.replace('/');
        } else {
          const { data: listener } = client.auth.onAuthStateChange((_event: any, session: any) => {
            if (session) {
              listener.subscription.unsubscribe();
              router.replace('/');
            }
          });
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800">ไม่สามารถเข้าสู่ระบบได้</h2>
            <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            <button
              onClick={() => router.replace('/login')}
              className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              กลับสู่หน้าเข้าสู่ระบบ
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-800">กำลังเข้าสู่ระบบ...</h2>
            <p className="text-xs text-slate-400">กรุณารอสักครู่ ระบบกำลังยืนยันบัญชีอีเมลโรงเรียนของคุณ</p>
          </>
        )}
      </div>
    </div>
  );
}
