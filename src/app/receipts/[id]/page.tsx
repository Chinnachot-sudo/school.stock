'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Receipt } from '@/types/inventory';
import ReceiptModal from '@/components/ReceiptModal';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';

export default function SingleReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/receipts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setReceipt(data.receipt);
      })
      .catch(err => setError('ไม่สามารถโหลดข้อมูลใบเสร็จได้'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลใบเสร็จ...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md mx-auto my-12 text-center border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">ไม่พบใบเสร็จรับเงิน</h2>
        <p className="text-xs text-slate-500">{error || 'ไม่พบข้อมูลใบเสร็จในระบบ'}</p>
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายงานการเงิน</span>
        </Link>
      </div>
    );
  }

  return (
    <ReceiptModal
      receipt={receipt}
      isOpen={true}
      onClose={() => router.push('/finance')}
    />
  );
}
