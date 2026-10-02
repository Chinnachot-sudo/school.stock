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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Item, Department } from '@/types/inventory';

type MySpaceTab = 'new-request' | 'my-requests' | 'my-receipts' | 'report-issue' | 'search-stock';

export default function MySpacePage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as MySpaceTab) || 'new-request';
  const [activeTab, setActiveTab] = useState<MySpaceTab>(initialTab);
  const { user, roleLabel } = useAuth();

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form: New Request
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [requestQty, setRequestQty] = useState<number>(1);
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [requestPurpose, setRequestPurpose] = useState<string>('');
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  // Form: Report Issue
  const [issueItemName, setIssueItemName] = useState('');
  const [issueType, setIssueType] = useState('DAMAGED');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as MySpaceTab;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load items and departments
  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/departments').then(r => r.json()).catch(() => ({ departments: [] }))
    ]).then(([itemsData, deptData]) => {
      if (itemsData?.items) setItems(itemsData.items);
      if (deptData?.departments) setDepartments(deptData.departments);
      setLoading(false);
    });
  }, []);

  // Mock My Requests
  const myRequests = [
    {
      id: 'REQ-2026-089',
      itemName: 'A4 Printing Paper (80gsm) Double A',
      qty: 3,
      unit: 'Ream',
      department: 'Primary Years (PYP)',
      status: 'PENDING',
      createdAt: '24 Sep 2026, 08:30',
      purpose: 'Grade 3 Art & Worksheet Activities'
    },
    {
      id: 'REQ-2026-074',
      itemName: 'Whiteboard Marker (Blue) Pentel',
      qty: 5,
      unit: 'Pack',
      department: 'Middle Years (MYP)',
      status: 'APPROVED',
      createdAt: '22 Sep 2026, 14:15',
      purpose: 'Science Lab Room 302'
    },
    {
      id: 'REQ-2026-061',
      itemName: 'Permanent Marker Bullet Tip (Black)',
      qty: 2,
      unit: 'Box',
      department: 'Diploma Programme (DP)',
      status: 'RECEIVED',
      createdAt: '19 Sep 2026, 10:00',
      purpose: 'Exam Grading Preparation'
    }
  ];

  // Mock My Receipts
  const myReceipts = [
    {
      id: 'RCP-2026-0412',
      date: '23 Sep 2026',
      itemsCount: 4,
      totalAmount: 320,
      paymentMethod: 'School Welfare Wallet',
      status: 'PAID'
    },
    {
      id: 'RCP-2026-0355',
      date: '15 Sep 2026',
      itemsCount: 2,
      totalAmount: 145,
      paymentMethod: 'PromptPay QR',
      status: 'PAID'
    }
  ];

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || requestQty <= 0) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setSelectedItem('');
      setRequestQty(1);
      setRequestPurpose('');
      setRequestSubmitted(false);
      setActiveTab('my-requests');
    }, 1500);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueItemName.trim()) return;
    setIssueSubmitted(true);
    setTimeout(() => {
      setIssueItemName('');
      setIssueDetails('');
      setIssueSubmitted(false);
      alert('Issue reported successfully. The Warehouse Team has been notified.');
    }, 1200);
  };

  const filteredItems = items.filter(
    i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <span>Create New Requisition</span>
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Select items from inventory for classroom instruction or school activities
              </p>
            </div>

            {requestSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-800">Requisition Submitted Successfully!</h3>
                <p className="text-xs text-emerald-700">
                  Your request has been routed to the Warehouse & Department Head for approval (Status: PENDING)
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Material / Item <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedItem}
                    onChange={e => setSelectedItem(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none"
                  >
                    <option value="">-- Search and select an item --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} [{item.code}] (Stock: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
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
                    placeholder="e.g. For Grade 8 Science experiment this Friday"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0B6B4F] outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0B6B4F] hover:bg-[#084D39] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
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
                <span>Standard requisitions are reviewed and approved within 24 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] mt-1.5 shrink-0" />
                <span>Once approved, items can be picked up at the Central Storage (Floor 1).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] mt-1.5 shrink-0" />
                <span>For borrowed equipment, please return promptly on the specified date.</span>
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
              className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#084D39] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
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
                {myRequests.map(req => (
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
                          <span>Pending Approval</span>
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
                    </td>
                  </tr>
                ))}
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
              <span>My Receipts & Welfare Purchases</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Payment history and school welfare deductions from school store purchases
            </p>
          </div>

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

          <form onSubmit={handleIssueSubmit} className="space-y-4">
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
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Submit Incident Report</span>
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
                      setSelectedItem(item.id);
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
