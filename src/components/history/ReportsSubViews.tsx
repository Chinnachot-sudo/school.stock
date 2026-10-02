'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
  PiggyBank,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  School,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  User,
  ShoppingBag
} from 'lucide-react';
import { Transaction, Department } from '@/types/inventory';

// ============================================================================
// 1. SALES REPORT VIEW (Summary Sales Performance)
// ============================================================================
export function SalesReportView({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'term'>('month');

  const topItems = [
    { rank: 1, code: 'UN-POLO-M', name: 'School Uniform Polo (Size M)', qty: 142, revenue: 63900, category: 'Uniform' },
    { rank: 2, code: 'ST-A4-001', name: 'Double A A4 80gsm Copy Paper', qty: 98, revenue: 14700, category: 'Stationery' },
    { rank: 3, code: 'BK-MATH-G9', name: 'IB MYP Mathematics Grade 9 Textbook', qty: 65, revenue: 55250, category: 'Books' },
    { rank: 4, code: 'PE-JERSEY-L', name: 'School House Sports Jersey (Size L)', qty: 54, revenue: 29700, category: 'Sports' },
    { rank: 5, code: 'ST-PEN-BL', name: 'Pilot G2 0.5mm Gel Pen (Blue)', qty: 210, revenue: 9450, category: 'Stationery' },
  ];

  const cashierStats = [
    { name: 'Ms. Supaporn S.', role: 'Head Cashier', bills: 320, total: 124500 },
    { name: 'Mr. Anan P.', role: 'Store Clerk', bills: 215, total: 88400 },
    { name: 'Ms. Kanya T.', role: 'Afternoon Shift', bills: 145, total: 54200 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Gross Sales Revenue</span>
          <div className="text-2xl font-black text-slate-900">฿267,100</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% vs previous period
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Transactions Count</span>
          <div className="text-2xl font-black text-slate-900">680</div>
          <span className="text-[11px] text-slate-500">Avg. 22.6 bills per school day</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Average Basket</span>
          <div className="text-2xl font-black text-[#0B6B4F]">฿392.80</div>
          <span className="text-[11px] text-slate-500">Average 3.2 items / transaction</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Discounts & Subsidies</span>
          <div className="text-2xl font-black text-amber-600">฿18,450</div>
          <span className="text-[11px] text-slate-500">Staff & scholarship concessions</span>
        </div>
      </div>

      {/* Top Selling Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 5 Best-Selling Products</h3>
            <p className="text-xs text-slate-500">Ranked by revenue generation and units moved</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3 text-center">Rank</th>
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Total Revenue (THB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topItems.map(item => (
                <tr key={item.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 text-center font-black text-slate-900">#{item.rank}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-black">{item.qty.toLocaleString()} pcs</td>
                  <td className="py-3 px-3 text-right font-black text-[#0B6B4F]">
                    ฿{item.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Shift Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Cashier Turnover Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cashierStats.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{c.name}</span>
                <span className="text-[11px] text-slate-500">{c.role}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs text-slate-500">{c.bills} transactions</span>
                <span className="text-base font-black text-slate-900">฿{c.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ISSUE & RECEIPT COMPARISON VIEW (Requisitions vs Inward Receipts)
// ============================================================================
export function IssueReceiptReportView({ transactions }: { transactions: Transaction[] }) {
  const departmentUsage = [
    { dept: 'Primary Years (PYP)', issuedQty: 420, issuedValue: 58400, requestsCount: 45 },
    { dept: 'Middle Years (MYP)', issuedQty: 380, issuedValue: 64200, requestsCount: 38 },
    { dept: 'Diploma Programme (DP)', issuedQty: 290, issuedValue: 71500, requestsCount: 29 },
    { dept: 'Sciences & Laboratory', issuedQty: 180, issuedValue: 84000, requestsCount: 16 },
    { dept: 'Arts & Music Studio', issuedQty: 140, issuedValue: 32500, requestsCount: 22 },
    { dept: 'School Administration & IT', issuedQty: 210, issuedValue: 46800, requestsCount: 34 },
  ];

  const totalIssued = departmentUsage.reduce((sum, d) => sum + d.issuedValue, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Comparison Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Goods Received</span>
          <div className="text-2xl font-black text-emerald-700">฿412,500</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Supplier restocking & purchase orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Requisitions Issued</span>
          <div className="text-2xl font-black text-rose-700">฿{totalIssued.toLocaleString()}</div>
          <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Internal department supplies usage
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Net Inventory Addition</span>
          <div className="text-2xl font-black text-blue-700">
            +฿{(412500 - totalIssued).toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Warehouse inventory growth</span>
        </div>
      </div>

      {/* Department Requisition Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Supplies Requisition by Department
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Department / Programme</th>
                <th className="py-3 px-4 text-center">Requests Count</th>
                <th className="py-3 px-4 text-center">Units Issued</th>
                <th className="py-3 px-4 text-right">Total Cost Value (THB)</th>
                <th className="py-3 px-4 text-right">% of Total Issuance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentUsage.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.dept}</td>
                  <td className="py-3 px-4 text-center font-semibold">{row.requestsCount} slips</td>
                  <td className="py-3 px-4 text-center font-mono">{row.issuedQty} pcs</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ฿{row.issuedValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0B6B4F]">
                    {Math.round((row.issuedValue / totalIssued) * 100)}%
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
// 3. RECEIVABLES REPORT VIEW (Accounts Receivable & Settlements)
// ============================================================================
export function ReceivablesReportView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Invoiced</span>
          <div className="text-2xl font-black text-slate-900">฿380,000</div>
          <span className="text-[11px] text-slate-500">Corporate & parental billing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700">Collected Revenue</span>
          <div className="text-2xl font-black text-emerald-700">฿315,000</div>
          <span className="text-[11px] text-emerald-600 font-semibold">82.9% collection rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-700">Outstanding AR</span>
          <div className="text-2xl font-black text-rose-700">฿65,000</div>
          <span className="text-[11px] text-rose-600 font-semibold">17.1% pending settlement</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Collection Efficiency Summary</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Overdue collections are managed by the school accounting department with automatic statement notifications sent at 30, 60, and 90 days.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 4. FINANCE & BUDGET REPORT VIEW (Departmental Budgets & Expenditures)
// ============================================================================
export function FinanceBudgetReportView() {
  const budgets = [
    { department: 'Primary Years (PYP)', allocated: 250000, spent: 184500, remaining: 65500, status: 'HEALTHY' },
    { department: 'Middle Years (MYP)', allocated: 300000, spent: 242000, remaining: 58000, status: 'HEALTHY' },
    { department: 'Diploma Programme (DP)', allocated: 350000, spent: 312000, remaining: 38000, status: 'WARNING' },
    { department: 'Science & Laboratory', allocated: 200000, spent: 194000, remaining: 6000, status: 'CRITICAL' },
    { department: 'Sports & PE Dept', allocated: 150000, spent: 98000, remaining: 52000, status: 'HEALTHY' },
    { department: 'School Store Operations', allocated: 500000, spent: 412000, remaining: 88000, status: 'HEALTHY' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#0B6B4F]" />
            <span>Academic Year Departmental Budget Execution</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual budget allocation vs actual procurement and requisition expenditures
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Department / Faculty</th>
                <th className="py-3 px-4 text-right">Allocated Budget (THB)</th>
                <th className="py-3 px-4 text-right">Spent to Date (THB)</th>
                <th className="py-3 px-4 text-right">Remaining Balance (THB)</th>
                <th className="py-3 px-4 text-center">% Utilized</th>
                <th className="py-3 px-4 text-center">Budget Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {budgets.map((b, idx) => {
                const percent = Math.round((b.spent / b.allocated) * 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.department}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      ฿{b.allocated.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      ฿{b.spent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      ฿{b.remaining.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${percent > 90 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
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
