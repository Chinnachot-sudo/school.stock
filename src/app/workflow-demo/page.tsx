'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function WorkflowDemoPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Checking access…</div>;
  }

  return (
    <main className="mx-auto mt-12 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-lg font-bold text-slate-900">Workflow is not connected</h1>
      <p className="mt-2 text-sm text-slate-600">
        Approval workflow records and settings are not stored in the connected Supabase database. No sample requests or approval history are shown.
      </p>
      <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
        Back to Dashboard
      </Link>
    </main>
  );
}
