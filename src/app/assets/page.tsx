'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  TrendingDown,
  Trash2,
  Repeat,
  CheckCircle2,
  Download,
  Loader2
} from 'lucide-react';
import {
  AssetRegisterView,
  AssetDepreciationView,
  AssetDisposeView,
  AssetBorrowView,
  AssetVerificationView
} from '@/components/assets/AssetsSubViews';

type AssetTab = 'register' | 'depreciation' | 'dispose' | 'borrow' | 'verification';

function AssetsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AssetTab) || 'register';
  const [activeTab, setActiveTab] = useState<AssetTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as AssetTab;
    if (tabParam && ['register', 'depreciation', 'dispose', 'borrow', 'verification'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Overall Asset Statistics
  const stats = [
    { label: 'Total Assets', value: '142', icon: Briefcase, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Active in Use', value: '128', icon: CheckCircle2, color: 'text-blue-700 bg-blue-50' },
    { label: 'On Loan / Borrowed', value: '9', icon: Repeat, color: 'text-amber-700 bg-amber-50' },
    { label: 'Pending Dispose', value: '5', icon: Trash2, color: 'text-rose-700 bg-rose-50' },
  ];

  const tabs: { key: AssetTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'register', label: 'Asset Register', icon: Briefcase },
    { key: 'dispose', label: 'Register / Dispose', icon: Trash2 },
    { key: 'borrow', label: 'Asset Borrow', icon: Repeat }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0B6B4F]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#111827] tracking-tight">
                Asset & Fixed Capital Management
              </h1>
              <p className="text-xs text-[#6B7280]">
                Capital asset ledger, depreciation tracking, loan/return custody, and annual audit verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Exporting full asset & depreciation ledger to CSV/Excel...')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] text-xs font-semibold rounded-xl shadow-2xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280] font-medium">{s.label}</span>
                <div className={`p-2 rounded-xl ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#111827] tracking-tight font-mono">
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs font-bold'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dedicated Tab Views */}
      {activeTab === 'register' && (
        <AssetRegisterView
          onRunVerification={() => setActiveTab('verification')}
          onRunDepreciation={() => setActiveTab('depreciation')}
        />
      )}
      {activeTab === 'depreciation' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="text-xs text-[#0B6B4F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            ← Back to Asset Register
          </button>
          <AssetDepreciationView />
        </div>
      )}
      {activeTab === 'dispose' && <AssetDisposeView />}
      {activeTab === 'borrow' && <AssetBorrowView />}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="text-xs text-[#0B6B4F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            ← Back to Asset Register
          </button>
          <AssetVerificationView />
        </div>
      )}
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B6B4F]" />
        </div>
      }
    >
      <AssetsContent />
    </Suspense>
  );
}
