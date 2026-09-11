'use client';

import { useState, useEffect } from 'react';
import { Transaction, Department, TransactionType } from '@/types/inventory';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  User,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/auth-context';

export default function HistoryPage() {
  const { canExportExcel } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [txRes, deptRes] = await Promise.all([
        fetch('/api/transactions?limit=200'),
        fetch('/api/categories')
      ]);
      const txData = await txRes.json();
      const deptData = await deptRes.json();

      setTransactions(txData.transactions || []);
      setDepartments(deptData.departments || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filtered transactions
  const filtered = transactions.filter(tx => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesDept = filterDept === 'ALL' || tx.department === filterDept;
    const matchesSearch =
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.requesterName && tx.requesterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesDept && matchesSearch;
  });

  // Calculate statistics
  const totalOut = transactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalIn = transactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filtered.map((tx, idx) => ({
      ลำดับ: idx + 1,
      วันเวลา: new Date(tx.createdAt).toLocaleString('th-TH'),
      ประเภท: tx.type === 'OUT' ? 'เบิกตัดสต็อก' : tx.type === 'IN' ? 'รับของเข้า' : 'ปรับยอด',
      รหัสสินค้า: tx.itemCode,
      ชื่อรายการพัสดุ: tx.itemName,
      จำนวน: tx.quantity,
      ยอดคงเหลือหลังรายการ: tx.balanceAfter,
      กลุ่มสาระ_แผนก: tx.department,
      ผู้เบิก_ผู้ทำรายการ: tx.requesterName || '-',
      หมายเหตุ_วัตถุประสงค์: tx.note || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานการเบิกพัสดุ');

    const fileName = `รายงานการเบิกจ่ายพัสดุโรงเรียน_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <History className="w-5 h-5 text-[#1F4D3A]" />
            ประวัติการเบิกและรับพัสดุ
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            บันทึกการทำรายการย้อนหลัง สามารถคัดกรองและส่งออกไฟล์ Excel ได้
          </p>
        </div>

        {canExportExcel && (
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] disabled:opacity-40 text-[#1A1A1A] text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1F4D3A]" />
            <span>ส่งออกรายงาน Excel (.xlsx)</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <span className="text-xs font-medium text-[#6B6560] block">รายการทั้งหมด</span>
          <span className="text-2xl font-bold font-mono text-[#1A1A1A] mt-1 block">{transactions.length}</span>
          <span className="text-[10px] text-[#6B6560]">บันทึกในระบบ</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <span className="text-xs font-medium text-[#C45C26] flex items-center gap-1">
            <ArrowDownRight className="w-4 h-4" />
            ยอดเบิกตัดออก (ชิ้น)
          </span>
          <span className="text-2xl font-bold font-mono text-[#C45C26] mt-1 block">-{totalOut}</span>
          <span className="text-[10px] text-[#6B6560]">จากทุกกลุ่มสาระฯ</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-[#1F4D3A] flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            ยอดรับเข้าสต็อก (ชิ้น)
          </span>
          <span className="text-2xl font-bold font-mono text-[#1F4D3A] mt-1 block">+{totalIn}</span>
          <span className="text-[10px] text-[#6B6560]">พัสดุสั่งซื้อใหม่</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B6560]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อของ, ผู้เบิก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            >
              <option value="ALL">ทุกประเภทรายการ (เบิก / รับเข้า)</option>
              <option value="OUT">เฉพาะตัดสต็อก (เบิก)</option>
              <option value="IN">เฉพาะรับของเข้า</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            >
              <option value="ALL">ทุกกลุ่มสาระ / แผนก</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-[#6B6560]">
            <History className="w-8 h-8 mx-auto text-[#E5E0D8] mb-2" />
            <p className="font-semibold text-sm text-[#1A1A1A]">ไม่พบประวัติการทำรายการ</p>
            <p className="text-xs text-[#6B6560] mt-1">ลองปรับตัวกรองหรือคำค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E0D8]">
            {filtered.map(tx => {
              const isOut = tx.type === 'OUT';
              const dateObj = new Date(tx.createdAt);
              const dateStr = dateObj.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
              const timeStr = dateObj.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              }) + ' น.';

              return (
                <div
                  key={tx.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F4EF]/50 transition"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Type badge icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isOut ? 'bg-[#FEF0C7] text-[#B54708]' : 'bg-[#E8F0EB] text-[#1F4D3A]'
                      }`}
                    >
                      {isOut ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#6B6560] bg-[#F7F4EF] px-1.5 py-0.5 rounded border border-[#E5E0D8]">
                          {tx.itemCode}
                        </span>
                        <span className="text-xs font-semibold text-[#1A1A1A]">
                          {tx.itemName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6560] mt-1">
                        <span className="flex items-center gap-1 font-medium text-[#1A1A1A]">
                          <Building2 className="w-3.5 h-3.5 text-[#6B6560]" />
                          {tx.department}
                        </span>
                        {tx.requesterName && (
                          <span className="flex items-center gap-1 text-[#6B6560]">
                            <User className="w-3 h-3 text-[#6B6560]" />
                            {tx.requesterName}
                          </span>
                        )}
                        <span className="text-[#6B6560]">
                          • {dateStr} {timeStr}
                        </span>
                      </div>

                      {tx.note && (
                        <p className="text-[11px] text-[#6B6560] mt-1 bg-[#F7F4EF] border border-[#E5E0D8] px-2 py-0.5 rounded inline-block">
                          โน้ต: {tx.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Balance */}
                  <div className="text-right shrink-0 pl-10 sm:pl-0">
                    <span
                      className={`text-base font-bold font-mono block ${
                        isOut ? 'text-[#C45C26]' : 'text-[#1F4D3A]'
                      }`}
                    >
                      {isOut ? `-${tx.quantity}` : `+${tx.quantity}`}
                    </span>
                    <span className="text-[10px] text-[#6B6560] font-mono">
                      คงเหลือ {tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
