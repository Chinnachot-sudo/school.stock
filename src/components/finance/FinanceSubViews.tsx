'use client';

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  FileMinus,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Calendar,
  DollarSign,
  User,
  X,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { Invoice } from '@/types/inventory';

// ============================================================================
// 1. BILLING NOTES VIEW (Consolidated Invoices & Billing Notes)
// ============================================================================
export interface BillingNote {
  id: string;
  noteNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  invoices: string[];
  totalAmount: number;
  status: 'PENDING' | 'SENT' | 'PAID';
}

export function BillingNotesView({ invoices }: { invoices: Invoice[] }) {
  const [billingNotes, setBillingNotes] = useState<BillingNote[]>([
    {
      id: 'bn-1',
      noteNumber: 'BN-202609-001',
      customerName: 'Bangkok International Bookfair Co., Ltd.',
      issueDate: '20 Sep 2026',
      dueDate: '05 Oct 2026',
      invoices: ['INV-202609-0012', 'INV-202609-0015'],
      totalAmount: 48500,
      status: 'SENT'
    },
    {
      id: 'bn-2',
      noteNumber: 'BN-202609-002',
      customerName: 'RAIS PTA (Parent Teacher Association)',
      issueDate: '22 Sep 2026',
      dueDate: '07 Oct 2026',
      invoices: ['INV-202609-0021'],
      totalAmount: 18200,
      status: 'PENDING'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState('');
  const [dueDays, setDueDays] = useState(15);

  const handleCreateBillingNote = (e: React.FormEvent) => {
    e.preventDefault();
    const newBN: BillingNote = {
      id: `bn-${Date.now()}`,
      noteNumber: `BN-202609-00${billingNotes.length + 1}`,
      customerName: targetCustomer || 'Corporate Partner',
      issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(Date.now() + dueDays * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoices: ['INV-202609-PENDING'],
      totalAmount: 25000,
      status: 'PENDING'
    };

    setBillingNotes(prev => [newBN, ...prev]);
    setIsCreateOpen(false);
    setTargetCustomer('');
    alert(`Billing Note ${newBN.noteNumber} generated successfully!`);
  };

  const filtered = billingNotes.filter(b =>
    b.noteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0B6B4F]" />
            <span>Consolidated Billing Notes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Group outstanding invoices for institutional customers, parents, or partner organizations
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Billing Note</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search billing notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0B6B4F]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Billing Note #</th>
                <th className="py-3 px-4">Client / Organization</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Attached Invoices</th>
                <th className="py-3 px-4 text-right">Total (฿)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(bn => (
                <tr key={bn.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{bn.noteNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{bn.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">{bn.issueDate}</td>
                  <td className="py-3 px-4 font-bold text-slate-700">{bn.dueDate}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {bn.invoices.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ฿{bn.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bn.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : bn.status === 'SENT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {bn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => alert(`Printing Billing Note ${bn.noteNumber}`)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <span>New Billing Note</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBillingNote} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Organization Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PTA Committee, School Partner..."
                  value={targetCustomer}
                  onChange={e => setTargetCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Term (Days):</label>
                <select
                  value={dueDays}
                  onChange={e => setDueDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value={7}>7 Days (Within 1 week)</option>
                  <option value={15}>15 Days (Half month)</option>
                  <option value={30}>30 Days (End of month)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  Generate Note
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
// 2. AR AGING VIEW (Accounts Receivable Aging Schedule)
// ============================================================================
export function AgingReportView({ invoices }: { invoices: Invoice[] }) {
  const agingData = [
    {
      debtor: 'Grade 9 Parent Association',
      total: 35000,
      current: 25000,
      days30: 10000,
      days60: 0,
      days90: 0,
      lastPayment: '10 Sep 2026'
    },
    {
      debtor: 'Siam Sports Equipment Partner',
      total: 48000,
      current: 0,
      days30: 28000,
      days60: 20000,
      days90: 0,
      lastPayment: '15 Aug 2026'
    },
    {
      debtor: 'Catering & Canteen Concession',
      total: 62000,
      current: 0,
      days30: 0,
      days60: 32000,
      days90: 30000,
      lastPayment: '02 Jul 2026'
    }
  ];

  const totalOutstanding = agingData.reduce((sum, d) => sum + d.total, 0);
  const totalCurrent = agingData.reduce((sum, d) => sum + d.current, 0);
  const total30 = agingData.reduce((sum, d) => sum + d.days30, 0);
  const total60 = agingData.reduce((sum, d) => sum + d.days60, 0);
  const total90 = agingData.reduce((sum, d) => sum + d.days90, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards for Aging Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Receivables</span>
          <div className="text-2xl font-black text-slate-900">฿{totalOutstanding.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500">All overdue categories</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700">Current (0 - 30 Days)</span>
          <div className="text-2xl font-black text-emerald-700">฿{totalCurrent.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Not overdue yet</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-700">31 - 60 Days Overdue</span>
          <div className="text-2xl font-black text-blue-700">฿{total30.toLocaleString()}</div>
          <span className="text-[11px] text-blue-600 font-semibold">First reminder due</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-amber-700">61 - 90 Days Overdue</span>
          <div className="text-2xl font-black text-amber-700">฿{total60.toLocaleString()}</div>
          <span className="text-[11px] text-amber-600 font-semibold">Urgent collection</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-700">&gt; 90 Days Overdue</span>
          <div className="text-2xl font-black text-rose-700">฿{total90.toLocaleString()}</div>
          <span className="text-[11px] text-rose-600 font-semibold">Escalate to Director</span>
        </div>
      </div>

      {/* Aging Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Accounts Receivable Aging Schedule</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Debtor / Customer</th>
                <th className="py-3 px-4 text-right">Total Outstanding</th>
                <th className="py-3 px-4 text-right text-emerald-700">Current (0-30d)</th>
                <th className="py-3 px-4 text-right text-blue-700">31-60d</th>
                <th className="py-3 px-4 text-right text-amber-700">61-90d</th>
                <th className="py-3 px-4 text-right text-rose-700">&gt;90d</th>
                <th className="py-3 px-4">Last Payment</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {agingData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.debtor}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ฿{row.total.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    {row.current > 0 ? `฿${row.current.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    {row.days30 > 0 ? `฿${row.days30.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700">
                    {row.days60 > 0 ? `฿${row.days60.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {row.days90 > 0 ? `฿${row.days90.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{row.lastPayment}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => alert(`Sent payment statement reminder to ${row.debtor}`)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4F] text-[11px] font-bold border border-emerald-200 transition flex items-center gap-1 mx-auto"
                    >
                      <Send className="w-3 h-3" /> Remind
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
// 3. CREDIT NOTE VIEW (Credit Notes & Receivable Adjustments)
// ============================================================================
export interface CreditNoteRecord {
  id: string;
  cnNumber: string;
  date: string;
  invoiceRef: string;
  customerName: string;
  reason: string;
  amount: number;
  status: 'ISSUED' | 'APPLIED';
}

export function CreditNoteView() {
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([
    {
      id: 'cn-1',
      cnNumber: 'CN-202609-001',
      date: '23 Sep 2026',
      invoiceRef: 'INV-202609-0012',
      customerName: 'Bangkok International Bookfair Co., Ltd.',
      reason: 'Damaged Books returned to warehouse',
      amount: 4200,
      status: 'ISSUED'
    },
    {
      id: 'cn-2',
      cnNumber: 'CN-202609-002',
      date: '21 Sep 2026',
      invoiceRef: 'INV-202609-0008',
      customerName: 'Kru Prasert (Primary School)',
      reason: 'Volume discount retroactive correction',
      amount: 1500,
      status: 'APPLIED'
    }
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [invRef, setInvRef] = useState('');
  const [custName, setCustName] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [reason, setReason] = useState('Damaged goods return');

  const handleIssueCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    const newCN: CreditNoteRecord = {
      id: `cn-${Date.now()}`,
      cnNumber: `CN-202609-00${creditNotes.length + 1}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoiceRef: invRef || 'INV-202609-0020',
      customerName: custName || 'School Customer',
      reason,
      amount,
      status: 'ISSUED'
    };

    setCreditNotes(prev => [newCN, ...prev]);
    setIsAddOpen(false);
    setInvRef('');
    setCustName('');
    alert(`Credit Note ${newCN.cnNumber} generated!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileMinus className="w-5 h-5 text-rose-600" />
            <span>Credit Notes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit notes issued for returned goods, damaged inventory, or billing price corrections
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Credit Note</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Credit Note #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Original Invoice Ref</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Amount (฿)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {creditNotes.map(cn => (
                <tr key={cn.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{cn.cnNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{cn.date}</td>
                  <td className="py-3 px-4 font-mono text-[#0B6B4F] font-bold">{cn.invoiceRef}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{cn.customerName}</td>
                  <td className="py-3 px-4 text-slate-600">{cn.reason}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-600">
                    -฿{cn.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {cn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => alert(`Printing Credit Note ${cn.cnNumber}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileMinus className="w-5 h-5 text-rose-300" />
                <span>Issue New Credit Note</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleIssueCreditNote} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Reference #:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-202609-0015"
                  value={invRef}
                  onChange={e => setInvRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Organization Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent Name or Company"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Note Amount:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Credit Note:</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Damaged goods returned to warehouse">Damaged goods returned to warehouse</option>
                  <option value="Billing price dispute / overcharge">Billing price dispute / overcharge</option>
                  <option value="Volume discount correction">Volume discount correction</option>
                  <option value="Cancelled course/activity registration">Cancelled course/activity registration</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
