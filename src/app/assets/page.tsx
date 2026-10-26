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
import type { AssetItem } from '@/components/assets/AssetsSubViews';
import { useAuth } from '@/lib/auth-context';

type AssetTab = 'register' | 'depreciation' | 'dispose' | 'borrow' | 'verification';

function AssetsContent() {
  const { can } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AssetTab) || 'register';
  const [activeTab, setActiveTab] = useState<AssetTab>(initialTab);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetLoadError, setAssetLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/assets', { cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load assets from Supabase.');
        if (!cancelled) setAssets(result.assets || []);
      })
      .catch(error => {
        if (!cancelled) setAssetLoadError(error instanceof Error ? error.message : 'Unable to load assets from Supabase.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAssets(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as AssetTab;
    if (tabParam && ['register', 'depreciation', 'dispose', 'borrow', 'verification'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const stats = [
    { label: 'Total Assets', value: isLoadingAssets || assetLoadError ? '—' : assets.length, icon: Briefcase, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Active in Use', value: isLoadingAssets || assetLoadError ? '—' : assets.filter(asset => asset.status === 'IN_USE').length, icon: CheckCircle2, color: 'text-blue-700 bg-blue-50' },
    { label: 'On Loan / Borrowed', value: isLoadingAssets || assetLoadError ? '—' : assets.filter(asset => asset.status === 'ON_LOAN').length, icon: Repeat, color: 'text-amber-700 bg-amber-50' },
    { label: 'Maintenance / Disposed', value: isLoadingAssets || assetLoadError ? '—' : assets.filter(asset => asset.status === 'MAINTENANCE' || asset.status === 'DISPOSED').length, icon: Trash2, color: 'text-rose-700 bg-rose-50' },
  ];

  const tabs: { key: AssetTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'register', label: 'Asset Register', icon: Briefcase },
    { key: 'borrow', label: 'Borrow & Return', icon: Repeat },
    { key: 'dispose', label: 'Maintenance & Disposal', icon: Trash2 }
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
            disabled
            title="Asset records are not connected to a database."
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-[#E5E7EB] text-slate-500 text-xs font-semibold rounded-xl cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {assetLoadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
          Could not load the Asset Register from Supabase: {assetLoadError}
        </div>
      ) : (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          {isLoadingAssets ? 'Connecting to the Asset Register in Supabase...' : 'Asset Register data is loaded from Supabase.'} Borrowing, maintenance, disposal workflows, depreciation, verification, and export are not yet connected and must not be used as operational records.
        </div>
      )}

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

      {activeTab === 'register' && (
        <AssetRegisterView
          assets={assets}
          onAssetsChange={setAssets}
          isLoading={isLoadingAssets}
          loadError={assetLoadError}
          canCreateAsset={can('inventory:item:create')}
          onRunVerification={() => setActiveTab('verification')}
          onRunDepreciation={() => setActiveTab('depreciation')}
        />
      )}
      {activeTab !== 'register' && (
      <fieldset disabled aria-label="This asset workflow is not connected to Supabase" className="min-w-0 border-0 p-0 m-0 space-y-4">
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
      </fieldset>
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
