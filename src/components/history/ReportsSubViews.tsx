'use client';

import React, { useState, useMemo } from 'react';
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
  ShoppingBag,
  Inbox
} from 'lucide-react';
import { Transaction, Department, Receipt, Invoice } from '@/types/inventory';

// ============================================================================
// 1. SALES REPORT VIEW (Summary Sales Performance from Real Database)
// ============================================================================
export function SalesReportView({
  transactions = [],
  receipts = []
}: {
  transactions: Transaction[];
  receipts?: Receipt[];
}) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'term'>('month');

  // Real computed sales transactions
  const salesTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'SALE');
  }, [transactions]);

  const grossSales = useMemo(() => {
    if (receipts && receipts.length > 0) {
      return receipts.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    }
    return salesTxs.reduce((sum, t) => sum + (t.totalCost || (t.quantity * (t.unitCost || 0))), 0);
  }, [receipts, salesTxs]);

  const txCount = useMemo(() => {
    if (receipts && receipts.length > 0) {
      return receipts.filter(r => r.status === 'COMPLETED').length;
    }
    return salesTxs.length;
  }, [receipts, salesTxs]);

  const avgBasket = useMemo(() => {
    return txCount > 0 ? grossSales / txCount : 0;
  }, [grossSales, txCount]);

  const discounts = useMemo(() => {
    if (receipts && receipts.length > 0) {
      return receipts.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.discount || 0), 0);
    }
    return 0;
  }, [receipts]);

  // Aggregate top selling products
  const topItems = useMemo(() => {
    const map = new Map<string, { code: string; name: string; qty: number; revenue: number; category: string }>();

    if (receipts && receipts.length > 0) {
      receipts.filter(r => r.status === 'COMPLETED').forEach(r => {
        (r.items || []).forEach(it => {
          const key = it.itemId || it.itemCode || it.itemName;
          const cur = map.get(key) || {
            code: it.itemCode || '-',
            name: it.itemName,
            qty: 0,
            revenue: 0,
            category: 'Store Item'
          };
          cur.qty += it.quantity || 0;
          cur.revenue += it.totalPrice || ((it.quantity || 0) * (it.unitPrice || 0));
          map.set(key, cur);
        });
      });
    } else {
      salesTxs.forEach(t => {
        const key = t.itemId || t.itemCode || t.itemName;
        const cur = map.get(key) || {
          code: t.itemCode || '-',
          name: t.itemName,
          qty: 0,
          revenue: 0,
          category: t.department || 'Store Item'
        };
        cur.qty += t.quantity || 0;
        cur.revenue += t.totalCost || (t.quantity * (t.unitCost || 0));
        map.set(key, cur);
      });
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((it, idx) => ({ rank: idx + 1, ...it }));
  }, [receipts, salesTxs]);

  // Cashier stats
  const cashierStats = useMemo(() => {
    const map = new Map<string, { name: string; role: string; bills: number; total: number }>();
    if (receipts && receipts.length > 0) {
      receipts.filter(r => r.status === 'COMPLETED').forEach(r => {
        const name = r.cashierName || 'Store Cashier';
        const cur = map.get(name) || { name, role: 'Cashier', bills: 0, total: 0 };
        cur.bills += 1;
        cur.total += r.totalAmount || 0;
        map.set(name, cur);
      });
    }
    return Array.from(map.values());
  }, [receipts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Gross Sales Revenue</span>
          <div className="text-2xl font-black text-slate-900">฿{grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500 font-medium">
            Total sales generated
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Transactions Count</span>
          <div className="text-2xl font-black text-slate-900">{txCount}</div>
          <span className="text-[11px] text-slate-500">Completed customer sales</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Average Basket</span>
          <div className="text-2xl font-black text-[#0B6B4F]">฿{avgBasket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500">Average value per sale</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Discounts & Subsidies</span>
          <div className="text-2xl font-black text-amber-600">฿{discounts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-slate-500">Promotions & concessions</span>
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

        {topItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No sales transactions recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Top-selling items will appear here once POS sales are completed.</p>
          </div>
        ) : (
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
                    <td className="py-3 px-3 text-center font-black">{item.qty.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-black text-[#0B6B4F]">
                      ฿{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cashier Shift Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Cashier Turnover Performance</h3>
        {cashierStats.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-slate-600">No cashier shift records logged</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. ISSUE & RECEIPT COMPARISON VIEW (Requisitions vs Inward Receipts)
// ============================================================================
export function IssueReceiptReportView({ transactions = [] }: { transactions: Transaction[] }) {
  const inTxs = useMemo(() => transactions.filter(t => t.type === 'IN'), [transactions]);
  const outTxs = useMemo(() => transactions.filter(t => t.type === 'OUT'), [transactions]);

  const totalReceived = useMemo(() => {
    return inTxs.reduce((sum, t) => sum + (t.totalCost || (t.quantity * (t.unitCost || 0))), 0);
  }, [inTxs]);

  const totalIssued = useMemo(() => {
    return outTxs.reduce((sum, t) => sum + (t.totalCost || (t.quantity * (t.unitCost || 0))), 0);
  }, [outTxs]);

  const netAddition = totalReceived - totalIssued;

  // Department Usage Breakdown
  const departmentUsage = useMemo(() => {
    const map = new Map<string, { dept: string; issuedQty: number; issuedValue: number; requestsCount: number }>();
    outTxs.forEach(t => {
      const deptName = t.department || 'Central';
      const cur = map.get(deptName) || { dept: deptName, issuedQty: 0, issuedValue: 0, requestsCount: 0 };
      cur.issuedQty += t.quantity || 0;
      cur.issuedValue += t.totalCost || (t.quantity * (t.unitCost || 0));
      cur.requestsCount += 1;
      map.set(deptName, cur);
    });
    return Array.from(map.values());
  }, [outTxs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Comparison Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Goods Received</span>
          <div className="text-2xl font-black text-emerald-700">฿{totalReceived.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Supplier restocking & orders
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
          <div className={`text-2xl font-black ${netAddition >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
            {netAddition >= 0 ? '+' : ''}฿{netAddition.toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Warehouse inventory change</span>
        </div>
      </div>

      {/* Department Requisition Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Supplies Requisition by Department
        </h3>

        {departmentUsage.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No stock issue transactions recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Department supply usage will be tracked here when items are issued.</p>
          </div>
        ) : (
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
                    <td className="py-3 px-4 text-center font-mono">{row.issuedQty}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ฿{row.issuedValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0B6B4F]">
                      {totalIssued > 0 ? Math.round((row.issuedValue / totalIssued) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. RECEIVABLES REPORT VIEW (Accounts Receivable from Real Invoices)
// ============================================================================
export function ReceivablesReportView({ invoices = [] }: { invoices?: Invoice[] }) {
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [invoices]);

  const collectedRevenue = useMemo(() => {
    return invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [invoices]);

  const outstandingAR = useMemo(() => {
    return invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [invoices]);

  const collectionRate = totalInvoiced > 0 ? ((collectedRevenue / totalInvoiced) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Invoiced</span>
          <div className="text-2xl font-black text-slate-900">฿{totalInvoiced.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500">Total billing generated</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700">Collected Revenue</span>
          <div className="text-2xl font-black text-emerald-700">฿{collectedRevenue.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">{collectionRate}% collection rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-700">Outstanding AR</span>
          <div className="text-2xl font-black text-rose-700">฿{outstandingAR.toLocaleString()}</div>
          <span className="text-[11px] text-rose-600 font-semibold">Pending customer settlements</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Collection Efficiency Summary</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Invoices and customer billing notes are managed by the school accounting department with settlement tracking.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 4. FINANCE & BUDGET REPORT VIEW (Departmental Budgets from Real Database)
// ============================================================================
export function FinanceBudgetReportView({ departments = [] }: { departments?: Department[] }) {
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

        {departments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <School className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No departments configured</p>
          </div>
        ) : (
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
                {departments.map((b) => {
                  const allocated = b.allocatedBudget || 0;
                  const spent = b.spentBudget || 0;
                  const remaining = Math.max(0, allocated - spent);
                  const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
                  const status = percent > 90 ? 'CRITICAL' : percent > 75 ? 'WARNING' : 'HEALTHY';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        ฿{allocated.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                        ฿{spent.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        ฿{remaining.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${percent > 90 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono">{percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'HEALTHY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
