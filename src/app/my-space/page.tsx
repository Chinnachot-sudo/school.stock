'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UserCheck,
  PlusCircle,
  ClipboardList,
  Receipt,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Boxes,
  FileText,
  AlertTriangle,
  School,
  ArrowRight,
  Briefcase,
  ChevronDown,
  X,
  MapPin,
  Tag
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Item, Department } from '@/types/inventory';

export interface AssetItem {
  id: string;
  code: string;
  name: string;
  serial?: string;
  category?: string;
  location?: string;
  custodian?: string;
  status: string;
}

interface MyRequestItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  department: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REJECTED';
  createdAt: string;
  purpose: string;
}

interface MyReceiptItem {
  id: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

type MySpaceTab = 'new-request' | 'my-requests' | 'my-receipts' | 'report-issue' | 'search-stock';

export default function MySpacePage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as MySpaceTab) || 'new-request';
  const [activeTab, setActiveTab] = useState<MySpaceTab>(initialTab);
  const { user, roleLabel } = useAuth();

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form: New Request (Asset Management)
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [requestQty, setRequestQty] = useState<number>(1);
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [requestPurpose, setRequestPurpose] = useState<string>('');

  // Form: Report Issue
  const [issueItemName, setIssueItemName] = useState('');
  const [issueType, setIssueType] = useState('DAMAGED');
  const [issueDetails, setIssueDetails] = useState('');

  // User Requests & Receipts State
  const [myRequests, setMyRequests] = useState<MyRequestItem[]>([]);
  const [myReceipts, setMyReceipts] = useState<MyReceiptItem[]>([]);
  const [requestsLoadError, setRequestsLoadError] = useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [issueFeedback, setIssueFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as MySpaceTab;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load assets, items, and departments
  useEffect(() => {
    Promise.all([
      fetch('/api/assets', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ assets: [] })),
      fetch('/api/items', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/departments', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ departments: [] })),
      fetch('/api/requisitions', { cache: 'no-store' }).then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load requests.');
        return payload;
      }).catch(error => ({ loadError: error instanceof Error ? error.message : 'Unable to load requests.' }))
    ]).then(([assetsData, itemsData, deptData, requestsData]) => {
      if (assetsData?.assets) setAssets(assetsData.assets);
      if (itemsData?.items) setItems(itemsData.items);
      if (deptData?.departments) setDepartments(deptData.departments);
      if (requestsData?.requests) setMyRequests(requestsData.requests);
      if (requestsData?.loadError) setRequestsLoadError(requestsData.loadError);
      setLoading(false);
    });
  }, []);

  const submitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) {
      setRequestFeedback({ type: 'error', message: 'กรุณาเลือกรายการครุภัณฑ์ (Asset) ที่ต้องการทำรายการ' });
      return;
    }
    setRequestFeedback(null);
    setSubmittingRequest(true);
    try {
      const response = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          itemId: selectedAsset.id,
          quantity: requestQty,
          departmentId: targetDepartment,
          purpose: requestPurpose
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit request.');
      const refreshed = await fetch('/api/requisitions', { cache: 'no-store' }).then(r => r.json());
      setMyRequests(Array.isArray(refreshed.requests) ? refreshed.requests : []);
      setSelectedAsset(null);
      setAssetSearchTerm('');
      setRequestQty(1);
      setTargetDepartment('');
      setRequestPurpose('');
      setRequestFeedback({ type: 'success', message: 'บันทึกคำขอยืมครุภัณฑ์สำเร็จ และอยู่ระหว่างรอการอนุมัติ' });
    } catch (error) {
      setRequestFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Unable to submit request.' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const submitIssueReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIssueFeedback(null);
    setSubmittingIssue(true);
    try {
      const response = await fetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: issueItemName, issueType, details: issueDetails })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit issue report.');
      setIssueItemName('');
      setIssueType('DAMAGED');
      setIssueDetails('');
      setIssueFeedback({ type: 'success', message: 'Issue report saved to Supabase.' });
    } catch (error) {
      setIssueFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Unable to submit issue report.' });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const filteredItems = items.filter(
    i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter(asset => {
    const q = assetSearchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (asset.name && asset.name.toLowerCase().includes(q)) ||
      (asset.code && asset.code.toLowerCase().includes(q)) ||
      (asset.category && asset.category.toLowerCase().includes(q)) ||
      (asset.location && asset.location.toLowerCase().includes(q)) ||
      (asset.serial && asset.serial.toLowerCase().includes(q))
    );
  }).slice(0, 40);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E6F5EF] text-[#0B6B4F] flex items-center justify-center font-bold text-lg border border-emerald-100 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111827]">
              My Space
            </h1>
            <p className="text-xs text-[#6B7280]">
              Welcome, {user?.user_metadata?.full_name || user?.email || 'Teacher/Staff'} &bull; Role: <span className="font-semibold text-[#0B6B4F]">{roleLabel}</span>
            </p>
          </div>
        </div>

        {/* Tab Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#F9FAFB] p-1.5 rounded-xl border border-[#E5E7EB]">
          {[
            { key: 'new-request', label: 'New Request', icon: PlusCircle },
            { key: 'my-requests', label: 'My Requests', icon: ClipboardList, badge: myRequests.filter(r => r.status === 'PENDING').length },
            { key: 'my-receipts', label: 'My Receipts', icon: Receipt },
            { key: 'report-issue', label: 'Report Issue', icon: AlertCircle },
            { key: 'search-stock', label: 'Search Stock', icon: Search }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as MySpaceTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0B6B4F] shadow-2xs border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. New Request Tab */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'new-request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#0B6B4F]" />
                <span>Create New Requisition (ขอยืมครุภัณฑ์)</span>
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                เลือกครุภัณฑ์จาก Asset Management เพื่อขอเบิกใช้งาน หรือยืมสำหรับกิจกรรมการเรียนการสอน
              </p>
            </div>

            <form onSubmit={submitRequest} className="space-y-4">
              {requestFeedback && (
                <div
                  role="status"
                  className={`rounded-xl border p-3 text-xs ${
                    requestFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {requestFeedback.message}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Select Asset / Material (ครุภัณฑ์ที่ต้องการยืม) <span className="text-rose-500">*</span>
                  </span>
                  {assets.length > 0 && (
                    <span className="text-[11px] font-normal text-slate-500">
                      มีครุภัณฑ์ในระบบ {assets.length} รายการ
                    </span>
                  )}
                </label>

                {selectedAsset ? (
                  /* Selected Asset Card */
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#0B6B4F] border border-emerald-200">
                            {selectedAsset.code}
                          </span>
                          {selectedAsset.category && (
                            <span className="text-[11px] text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-emerald-100">
                              {selectedAsset.category}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              selectedAsset.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : selectedAsset.status === 'IN_USE'
                                ? 'bg-blue-100 text-blue-800'
                                : selectedAsset.status === 'ON_LOAN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {selectedAsset.status || 'Active'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                          {selectedAsset.name}
                        </h4>
                        {selectedAsset.location && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>สถานที่: {selectedAsset.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAsset(null);
                        setIsAssetDropdownOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition shrink-0"
                      title="Change Asset"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Searchable Combobox Input & Dropdown */
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={assetSearchTerm}
                        onChange={e => {
                          setAssetSearchTerm(e.target.value);
                          setIsAssetDropdownOpen(true);
                        }}
                        onFocus={() => setIsAssetDropdownOpen(true)}
                        placeholder="ค้นหาชื่อครุภัณฑ์, รหัส Asset Code, หมวดหมู่, หรือสถานที่..."
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none transition"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                        className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isAssetDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Fast Dropdown Menu */}
                    {isAssetDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsAssetDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {filteredAssets.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              {loading ? 'กำลังโหลดรายการครุภัณฑ์...' : 'ไม่พบครุภัณฑ์ที่ตรงกับคำค้นหา'}
                            </div>
                          ) : (
                            filteredAssets.map(asset => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setIsAssetDropdownOpen(false);
                                  setAssetSearchTerm('');
                                }}
                                className="w-full p-3 text-left hover:bg-slate-50 transition flex items-center justify-between gap-3 group"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#0B6B4F] group-hover:bg-[#0B6B4F] group-hover:text-white transition">
                                      {asset.code}
                                    </span>
                                    {asset.category && (
                                      <span className="text-[10px] text-slate-500 bg-slate-100/70 px-1.5 py-0.5 rounded">
                                        {asset.category}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                        asset.status === 'AVAILABLE'
                                          ? 'text-emerald-700 bg-emerald-50'
                                          : asset.status === 'IN_USE'
                                          ? 'text-blue-700 bg-blue-50'
                                          : asset.status === 'ON_LOAN'
                                          ? 'text-amber-700 bg-amber-50'
                                          : 'text-slate-600 bg-slate-100'
                                      }`}
                                    >
                                      {asset.status || 'Active'}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-800 group-hover:text-[#0B6B4F] transition truncate">
                                    {asset.name}
                                  </div>
                                  {asset.location && (
                                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{asset.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="text-[11px] text-[#0B6B4F] opacity-0 group-hover:opacity-100 font-bold transition shrink-0">
                                  เลือก &rarr;
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Requested Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={requestQty}
                    onChange={e => setRequestQty(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department / Grade Level
                  </label>
                  <select
                    value={targetDepartment}
                    onChange={e => setTargetDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none"
                  >
                    <option value="">-- Select Department / Grade --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Purpose / Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={requestPurpose}
                  onChange={e => setRequestPurpose(e.target.value)}
                  placeholder="e.g. ขอยืมสำหรับการจัดกิจกรรมการเรียนการสอน หรือโครงการพิเศษ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingRequest || loading || !selectedAsset}
                  className="px-6 py-2.5 bg-[#0B6B4F] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 disabled:bg-slate-300 disabled:text-slate-600 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingRequest ? 'Submitting…' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Guide / Policies Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <School className="w-4 h-4 text-[#0B6B4F]" />
              <span>School Requisition Guidelines</span>
            </h3>
            <ul className="text-xs text-[#6B7280] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] mt-1.5 shrink-0" />
                <span>Submitted requests are recorded with a pending-review status.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] mt-1.5 shrink-0" />
                <span>Approval routing and pickup arrangements are not configured in the database yet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] mt-1.5 shrink-0" />
                <span>Submitting a request does not reserve stock or deduct inventory.</span>
              </li>
            </ul>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-[#0B6B4F] flex items-center justify-between">
              <div>
                <span className="font-bold block">Need to search the catalog?</span>
                <span className="text-[11px] text-emerald-700">Check real-time stock levels instantly</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('search-stock')}
                className="p-1.5 bg-white rounded-lg text-[#0B6B4F] shadow-2xs hover:bg-emerald-100"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. My Requests Tab */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'my-requests' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0B6B4F]" />
                <span>My Requests Ledger</span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Track the approval progress and pickup status of all your requisitions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('new-request')}
              className="px-4 py-2 bg-[#0B6B4F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Request</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requestsLoadError ? (
                  <tr><td colSpan={7} className="py-12 text-center text-rose-700 text-xs">{requestsLoadError}</td></tr>
                ) : myRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span>No requests have been submitted from this account.</span>
                    </td>
                  </tr>
                ) : (
                  myRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#0B6B4F]">{req.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{req.itemName}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {req.qty} {req.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{req.department}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">{req.purpose}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{req.createdAt}</td>
                      <td className="py-3 px-3 text-center">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved (Ready for Pickup)</span>
                          </span>
                        )}
                        {req.status === 'RECEIVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Dispensed</span>
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. My Receipts Tab */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'my-receipts' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#0B6B4F]" />
              <span>My Receipts &amp; Welfare Purchases</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Payment history and school welfare deductions from school store purchases
            </p>
          </div>

          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Receipt history is not connected to the signed-in user. The list below is not a verified personal ledger.
          </div>

          {myReceipts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No linked receipt records are available.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReceipts.map(rcp => (
                <div key={rcp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{rcp.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {rcp.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Date: {rcp.date}</span>
                    <span>{rcp.itemsCount} items</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{rcp.paymentMethod}</span>
                    <span className="font-mono font-black text-sm text-[#0B6B4F]">฿{rcp.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Report Issue Tab */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'report-issue' && (
        <div className="max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Report Issue / Discrepancy</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Report damaged equipment, missing items, or physical stock count discrepancies
            </p>
          </div>

          <form onSubmit={submitIssueReport} className="space-y-4">
            {issueFeedback && <div role="status" className={`rounded-xl border p-3 text-xs ${issueFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{issueFeedback.message}</div>}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Item / Equipment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={issueItemName}
                onChange={e => setIssueItemName(e.target.value)}
                placeholder="e.g. Projector in Science Lab 102 or Printer Toner depleted"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Issue Type</label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
              >
                <option value="DAMAGED">Damaged / Broken during use</option>
                <option value="DEFECTIVE">Defective upon arrival</option>
                <option value="MISSING">Missing / Not found at location</option>
                <option value="OUT_OF_STOCK">Stock Out on shelf but exists in system</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Issue Description & Location
              </label>
              <textarea
                rows={4}
                value={issueDetails}
                onChange={e => setIssueDetails(e.target.value)}
                placeholder="Specify symptoms, building, room number, or details to expedite support"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingIssue}
                className="px-6 py-2.5 bg-[#0B6B4F] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 disabled:bg-slate-300 disabled:text-slate-600"
              >
                <Send className="w-4 h-4" />
                <span>{submittingIssue ? 'Submitting…' : 'Submit Incident Report'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Search Stock Tab */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'search-stock' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Search className="w-5 h-5 text-[#0B6B4F]" />
                <span>Search Stock & Catalog</span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Check real-time stock availability and request items immediately
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by item name or code..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0B6B4F] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.slice(0, 30).map(item => (
              <div
                key={item.id}
                className="p-3.5 border border-slate-200 rounded-xl bg-white hover:border-[#0B6B4F]/40 transition space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{item.code}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{item.categoryId}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">{item.name}</h4>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400 text-[11px]">Stock: </span>
                    <span className={`font-mono font-bold ${item.currentStock <= item.minStock ? 'text-amber-600' : 'text-[#0B6B4F]'}`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const matchedAsset = assets.find(
                        a => a.code.toLowerCase() === item.code.toLowerCase() || a.name.toLowerCase() === item.name.toLowerCase()
                      );
                      if (matchedAsset) {
                        setSelectedAsset(matchedAsset);
                      } else {
                        setAssetSearchTerm(item.name);
                      }
                      setActiveTab('new-request');
                    }}
                    className="px-2.5 py-1 bg-[#E6F5EF] text-[#0B6B4F] font-bold text-[11px] rounded-lg hover:bg-[#d6f0e4] transition"
                  >
                    + Request Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
