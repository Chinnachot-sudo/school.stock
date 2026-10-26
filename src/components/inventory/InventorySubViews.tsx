'use client';

import React, { useState } from 'react';
import {
  Boxes,
  ArrowLeftRight,
  Truck,
  ClipboardCheck,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Building,
  Calendar,
  Send,
  Download,
  Check,
  X,
  FileText,
  PackagePlus,
  Layers,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Item, Department } from '@/types/inventory';

// ============================================================================
// 1. BORROW & RETURN VIEW (School Equipment Loan & Return Ledger)
// ============================================================================
export interface BorrowRecord {
  id: string;
  itemCode: string;
  itemName: string;
  borrowerName: string;
  department: string;
  borrowDate: string;
  dueDate: string;
  qty: number;
  status: 'ACTIVE' | 'OVERDUE' | 'RETURNED';
  note?: string;
}

export function BorrowReturnView({
  items,
  departments,
  onRecordBorrow
}: {
  items: Item[];
  departments: Department[];
  onRecordBorrow?: (record: any) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [borrowLedger, setBorrowLedger] = useState<BorrowRecord[]>([]);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [borrowerName, setBorrowerName] = useState('');
  const [departmentName, setDepartmentName] = useState(departments[0]?.name || '');
  const [borrowQty, setBorrowQty] = useState(1);
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [loanNote, setLoanNote] = useState('');

  const handleReturnItem = (id: string) => {
    setBorrowLedger(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'RETURNED' } : r))
    );
  };

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddModalOpen(false);
  };

  const filtered = borrowLedger.filter(r => {
    const matchSearch =
      r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Equipment loan records are not connected to a database. No loan history is available, and borrow/return actions are disabled.
      </div>

      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Currently On Loan</span>
          <div className="text-2xl font-black text-slate-900">
            —
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Not available</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Overdue Returns</span>
          <div className="text-2xl font-black text-rose-600">
            —
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Not available</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Returned</span>
          <div className="text-2xl font-black text-emerald-700">
            —
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Not available</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by equipment, teacher name, or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B6B4F]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {(['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === st ? 'bg-white text-[#0B6B4F] shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled
            title="Equipment loan tracking is not connected to a database."
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold shadow-sm cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Borrow</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Loan ID</th>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Borrower & Department</th>
                <th className="py-3 px-4">Borrow Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No database-backed equipment loan records are available.
                  </td>
                </tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{row.itemName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{row.itemCode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{row.borrowerName}</div>
                    <div className="text-[11px] text-slate-500">{row.department}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.borrowDate}</td>
                  <td className="py-3 px-4">
                    <span className={row.status === 'OVERDUE' ? 'font-bold text-rose-600' : 'text-slate-600'}>
                      {row.dueDate}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{row.qty}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-800'
                        : row.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.status !== 'RETURNED' ? (
                      <button
                        type="button"
                        disabled
                        title="Equipment return tracking is not connected to a database."
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold border border-slate-200 cursor-not-allowed"
                      >
                        Mark Returned
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Loan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-300" />
                <span>Record Equipment Loan</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBorrow} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipment / Item:</label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name} (Stock: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Borrower Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kru Sarah, Mr. David"
                    value={borrowerName}
                    onChange={e => setBorrowerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department:</label>
                  <select
                    value={departmentName}
                    onChange={e => setDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={borrowQty}
                    onChange={e => setBorrowQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Return Due Date:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose / Note:</label>
                <textarea
                  rows={2}
                  value={loanNote}
                  onChange={e => setLoanNote(e.target.value)}
                  placeholder="e.g. Grade 9 Science experiment, school assembly event..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  Confirm Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. TRANSFER VIEW (Inter-Department & Warehouse Stock Transfer)
// ============================================================================
export interface TransferRecord {
  id: string;
  itemCode: string;
  itemName: string;
  sourceLoc: string;
  targetLoc: string;
  qty: number;
  transferredBy: string;
  date: string;
  status: 'COMPLETED' | 'IN_TRANSIT';
}

export function TransferView({ items }: { items: Item[] }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [transferQty, setTransferQty] = useState(10);
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const locations: string[] = [];

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Transfer Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#0B6B4F]" />
            Stock Transfer Order
          </h3>

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Stock transfer executed and bin balances updated!</span>
            </div>
          )}

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Stock transfers and storage locations are not connected to a database. Transfer submission is unavailable.
          </p>
          <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Item to Transfer:</label>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                {items.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.code} - {it.name} (Available: {it.currentStock} {it.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Source Location:</label>
              <select
                value={fromLoc}
                onChange={e => setFromLoc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination Location:</label>
              <select
                value={toLoc}
                onChange={e => setToLoc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Transfer Quantity:</label>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={e => setTransferQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Transfer Note / Reason:</label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Specify reason for transfer, e.g. Store replenishment..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled
              className="w-full py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition"
            >
              Execute Stock Transfer
            </button>
          </form>
        </div>

        {/* Transfer History */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#0B6B4F]" />
            Recent Transfer Log
          </h3>

          <div className="divide-y divide-slate-100">
            {transfers.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No database-backed transfer records are available.</p>
            ) : transfers.map(tr => (
              <div key={tr.id} className="py-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{tr.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {tr.status}
                  </span>
                </div>
                <div className="font-bold text-slate-800">{tr.itemName} ({tr.itemCode})</div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{tr.sourceLoc}</span>
                  <ArrowRight className="w-3 h-3 text-[#0B6B4F]" />
                  <span className="font-bold text-slate-700">{tr.targetLoc}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Authorized by: {tr.transferredBy}</span>
                  <span className="font-black text-slate-900">{tr.qty} units &bull; {tr.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. STOCK COUNT VIEW (Cycle Count Audit & Reconciliation)
// ============================================================================
export function StockCountView({ items }: { items: Item[] }) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(i => {
      initial[i.id] = i.currentStock;
    });
    return initial;
  });
  const [reconciled, setReconciled] = useState(false);
  const [filterDiscrepancy, setFilterDiscrepancy] = useState(false);

  const handleCountChange = (itemId: string, val: number) => {
    setCounts(prev => ({ ...prev, [itemId]: val }));
  };

  const discrepancies = items.filter(i => (counts[i.id] ?? i.currentStock) !== i.currentStock);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#0B6B4F]" />
            <span>Physical Stock Audit Sheet</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit cycle: Term 1 Mid-Year Stock Verification &bull; Auditor: Inventory Controller
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={filterDiscrepancy}
              onChange={e => setFilterDiscrepancy(e.target.checked)}
              className="w-3.5 h-3.5 text-[#0B6B4F]"
            />
            <span>Show Discrepancies Only ({discrepancies.length})</span>
          </label>

          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
          >
            Posting unavailable
          </button>
        </div>
      </div>

      {/* Discrepancy Alert */}
      {discrepancies.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{discrepancies.length} items</strong> have variance between Physical Count and System Balance.
            </span>
          </div>
          <span className="font-mono font-bold">Audit In Progress</span>
        </div>
      )}

      {/* Audit Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">System Stock</th>
                <th className="py-3 px-4 text-center">Physical Count</th>
                <th className="py-3 px-4 text-center">Variance</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items
                .filter(it => !filterDiscrepancy || (counts[it.id] ?? it.currentStock) !== it.currentStock)
                .map(item => {
                  const physical = counts[item.id] ?? item.currentStock;
                  const variance = physical - item.currentStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 px-4 text-slate-500">{item.location || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={physical}
                          onChange={e => handleCountChange(item.id, Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-black text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B6B4F]"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-black font-mono">
                        {variance === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : variance > 0 ? (
                          <span className="text-blue-600">+{variance}</span>
                        ) : (
                          <span className="text-rose-600">{variance}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          variance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {variance === 0 ? 'Balanced' : 'Discrepancy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. LOCATIONS VIEW (Warehouses, Zones, and Bin Locations)
// ============================================================================
export function LocationsView() {
  const warehouses: Array<{ id: string; name: string; zone: string; capacity: string; shelves: number; totalItems: number; color: string }> = [];
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0B6B4F]" />
            <span>Warehouse Zones & Storage Hierarchy</span>
          </h2>
          <p className="text-xs text-slate-500">
            Storage bin capacity, aisle racks, and inventory allocation by building
          </p>
        </div>

        <button type="button" disabled title="Storage locations are not connected to a database." className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location / Bin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.length === 0 ? (
          <p className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No storage location records are available in the connected database.
          </p>
        ) : warehouses.map(wh => (
          <div key={wh.id} className={`p-5 rounded-2xl border ${wh.color} shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs">{wh.id}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80">
                Capacity: {wh.capacity}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{wh.zone}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-700">
              <span>{wh.shelves} Aisle Shelves</span>
              <span className="font-black text-slate-900">{wh.totalItems} Items Registered</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. PURCHASE REQUESTS VIEW (Purchase Requisitions / PR)
// ============================================================================
export function PurchaseRequestsView({ items }: { items: Item[] }) {
  const lowItems = items.filter(i => i.currentStock <= i.minStock);

  const purchaseRequests: Array<{ id: string; date: string; requestedBy: string; itemsCount: number; estimatedCost: number; status: string; supplier: string }> = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0B6B4F]" />
            <span>Purchase Requisitions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-aggregated requisitions generated for depleted inventory below safety thresholds
          </p>
        </div>

        <button type="button" disabled title="Purchase request records are not connected to a database." className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-4 h-4" />
          <span>Generate PR for Low Stock ({lowItems.length})</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">PR Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Suggested Supplier</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Est. Cost (THB)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purchaseRequests.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-slate-500">No purchase request records are available in Supabase.</td></tr> : purchaseRequests.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{pr.id}</td>
                  <td className="py-3 px-4 text-slate-500">{pr.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{pr.requestedBy}</td>
                  <td className="py-3 px-4">{pr.supplier}</td>
                  <td className="py-3 px-4 text-center font-bold">{pr.itemsCount}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ฿{pr.estimatedCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pr.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => alert(`View details for ${pr.id}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. REORDER POINTS VIEW (Reorder Points & Depleted Items)
// ============================================================================
export function ReorderPointsView({
  items,
  onQuickRestock
}: {
  items: Item[];
  onQuickRestock: (item: Item) => void;
}) {
  const lowItems = items.filter(i => i.currentStock <= i.minStock);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm block">
              Safety Reorder Threshold Alert ({lowItems.length} items critical)
            </span>
            <span className="text-rose-700">
              The following items have reached or fallen below their configured minimum safety stock levels. Restock now to prevent operational disruption.
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Min Safety Stock</th>
                <th className="py-3 px-4 text-center">Deficit</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lowItems.map(item => {
                const deficit = item.minStock - item.currentStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">{item.location || '—'}</td>
                    <td className="py-3 px-4 text-center font-black text-rose-600">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                      -{deficit > 0 ? deficit : 0} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onQuickRestock(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold text-[11px] shadow-sm transition"
                      >
                        + Quick Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lowItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    {items.length === 0 ? 'No inventory records are available in Supabase.' : 'No items are currently at or below the configured minimum stock level.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
