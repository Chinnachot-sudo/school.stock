'use client';

import { useState, useEffect, useMemo } from 'react';
import { Customer, CustomerType, IBProgramme, IB_PROGRAMMES, ALL_IB_GRADES, CUSTOMER_TYPE_LABELS } from '@/types/inventory';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  GraduationCap,
  Phone,
  Mail,
  User,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  School
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomersPage() {
  const { isSuperAdmin, isInventoryManager } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'STUDENT' as CustomerType,
    programme: 'MYP' as IBProgramme,
    grade: 'Grade 7 (MYP 2)',
    studentId: '',
    parentName: '',
    phone: '',
    email: '',
    note: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.studentId && c.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.parentName && c.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.grade && c.grade.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchProg = selectedProgramme === 'ALL' || c.programme === selectedProgramme;
      const matchType = selectedType === 'ALL' || c.type === selectedType;

      return matchSearch && matchProg && matchType;
    });
  }, [customers, searchQuery, selectedProgramme, selectedType]);

  // Calculations for summary cards
  const studentCount = customers.filter(c => c.type === 'STUDENT').length;
  const pypCount = customers.filter(c => c.programme === 'PYP').length;
  const mypCount = customers.filter(c => c.programme === 'MYP').length;
  const dpCpCount = customers.filter(c => c.programme === 'DP' || c.programme === 'CP').length;

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อลูกค้า / นักเรียน');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเพิ่มข้อมูลได้');

      setCustomers(prev => [...prev, data.customer]);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        type: 'STUDENT',
        programme: 'MYP',
        grade: 'Grade 7 (MYP 2)',
        studentId: '',
        parentName: '',
        phone: '',
        email: '',
        note: ''
      });
      showToast(`เพิ่มข้อมูล "${data.customer.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลได้');

      setCustomers(prev => prev.map(c => (c.id === data.customer.id ? data.customer : c)));
      setEditingCustomer(null);
      showToast(`อัปเดตข้อมูล "${data.customer.name}" เรียบร้อย`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อ "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถลบข้อมูลได้');

      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast(`ลบข้อมูล "${name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) return;

    const exportRows = filteredCustomers.map((c, idx) => ({
      ลำดับ: idx + 1,
      รหัสนักเรียน: c.studentId || '-',
      ชื่อสกุล: c.name,
      ประเภท: CUSTOMER_TYPE_LABELS[c.type] || c.type,
      หลักสูตร_IB: c.programme || '-',
      ระดับชั้น: c.grade || '-',
      ชื่อผู้ปกครอง: c.parentName || '-',
      เบอร์โทรศัพท์: c.phone || '-',
      อีเมล: c.email || '-',
      หมายเหตุ: c.note || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักเรียน_ลูกค้า');

    const fileName = `ฐานข้อมูลนักเรียน_IB_RAIS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1F4D3A]" />
            ฐานข้อมูลนักเรียนและลูกค้า (IB Directory)
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            จัดการรายชื่อนักเรียน PYP, MYP, DP, CP และผู้ปกครอง สำหรับเชื่อมต่อระบบขายสินค้าหน้าร้าน (POS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] disabled:opacity-40 text-[#1A1A1A] text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1F4D3A]" />
            <span>ส่งออก Excel</span>
          </button>

          {(isSuperAdmin || isInventoryManager) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-white text-xs font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มลูกค้า / นักเรียนใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* IB Programme Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">นักเรียนทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {studentCount} <span className="text-xs font-normal text-[#6B6560]">คน</span>
          </div>
          <span className="text-[11px] text-[#6B6560] mt-0.5 block">ลงทะเบียนในระบบ ERP</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">PYP (Early & Primary)</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center text-[11px] font-mono font-semibold">
              EY-G5
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {pypCount} <span className="text-xs font-normal text-[#6B6560]">คน</span>
          </div>
          <span className="text-[11px] text-[#6B6560] mt-0.5 block">EY1 - Grade 5</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">MYP (Middle Years)</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center text-[11px] font-mono font-semibold">
              G6-10
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {mypCount} <span className="text-xs font-normal text-[#6B6560]">คน</span>
          </div>
          <span className="text-[11px] text-[#6B6560] mt-0.5 block">Grade 6 - Grade 10</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">DP & CP (Senior)</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center text-[11px] font-mono font-semibold">
              G11-12
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {dpCpCount} <span className="text-xs font-normal text-[#6B6560]">คน</span>
          </div>
          <span className="text-[11px] text-[#6B6560] mt-0.5 block">Grade 11 - Grade 12</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B6560]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสนักเรียน, ผู้ปกครอง, เบอร์โทร..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            />
          </div>

          {/* IB Programme Filter */}
          <div>
            <select
              value={selectedProgramme}
              onChange={e => setSelectedProgramme(e.target.value)}
              className="w-full text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            >
              <option value="ALL">ทุกหลักสูตร IB (PYP, MYP, DP, CP)</option>
              <option value="PYP">Primary Years Programme (PYP)</option>
              <option value="MYP">Middle Years Programme (MYP)</option>
              <option value="DP">Diploma Programme (DP)</option>
              <option value="CP">Career-related Programme (CP)</option>
              <option value="STAFF">Faculty & Staff</option>
            </select>
          </div>

          {/* Customer Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full text-xs bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1F4D3A]"
            >
              <option value="ALL">ทุกประเภท (นักเรียน / ผู้ปกครอง / ครู)</option>
              <option value="STUDENT">นักเรียน (Student)</option>
              <option value="PARENT">ผู้ปกครอง (Parent)</option>
              <option value="TEACHER">ครู / บุคลากร (Teacher)</option>
              <option value="GENERAL">บุคคลภายนอก (General)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6B6560]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F4D3A]" />
            <p className="text-xs font-medium">กำลังโหลดฐานข้อมูลลูกค้า/นักเรียน...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560]">
            <Users className="w-8 h-8 mx-auto text-[#E5E0D8] mb-2" />
            <p className="font-semibold text-sm text-[#1A1A1A]">ไม่พบรายชื่อที่ค้นหา</p>
            <p className="text-xs text-[#6B6560] mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม &quot;เพิ่มลูกค้า/นักเรียนใหม่&quot;</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#F7F4EF] text-[#6B6560] font-semibold">
                  <th className="py-2.5 px-3">รหัสนักเรียน</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3">โปรแกรม & ระดับชั้น IB</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3">ผู้ปกครอง / ติดต่อ</th>
                  <th className="py-2.5 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {filteredCustomers.map(customer => {
                  return (
                    <tr key={customer.id} className="hover:bg-[#F7F4EF]/50 transition">
                      {/* Student ID */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-medium text-[#1A1A1A] bg-[#F7F4EF] border border-[#E5E0D8] px-1.5 py-0.5 rounded">
                          {customer.studentId || '-'}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#1A1A1A]">{customer.name}</div>
                        {customer.email && (
                          <span className="text-[11px] text-[#6B6560] block">{customer.email}</span>
                        )}
                      </td>

                      {/* Programme & Grade */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#E8F0EB] text-[#1F4D3A] border border-[#1F4D3A]/20">
                            {customer.programme}
                          </span>
                          <span className="font-mono text-xs text-[#1A1A1A]">
                            {customer.grade || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Customer Type */}
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-[#6B6560]">
                          {CUSTOMER_TYPE_LABELS[customer.type] || customer.type}
                        </span>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-2.5 px-3 text-xs text-[#6B6560]">
                        {customer.parentName && (
                          <div className="font-medium text-[#1A1A1A]">
                            ผู้ปกครอง: {customer.parentName}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-[#6B6560] mt-0.5">
                            <Phone className="w-3 h-3 text-[#6B6560]" />
                            <span className="font-mono">{customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCustomer(customer)}
                            className="p-1.5 text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] rounded-lg transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {(isSuperAdmin || isInventoryManager) && (
                            <button
                              onClick={() => handleDelete(customer.id, customer.name)}
                              className="p-1.5 text-[#6B6560] hover:text-[#B42318] hover:bg-red-50 rounded-lg transition"
                              title="ลบข้อมูล"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#1F4D3A] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-white/80" />
                <span>เพิ่มข้อมูลนักเรียน / ลูกค้าใหม่</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-[#FEF0C7] border border-[#B54708]/20 text-[#B54708] rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    ประเภทผู้ซื้อ *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as CustomerType })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="STUDENT">นักเรียน (Student)</option>
                    <option value="PARENT">ผู้ปกครอง (Parent)</option>
                    <option value="TEACHER">ครู / บุคลากร (Teacher)</option>
                    <option value="GENERAL">บุคคลภายนอก (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    รหัสนักเรียน / เจ้าหน้าที่
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น RAIS-2024-055"
                    value={formData.studentId}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  ชื่อ - นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ด.ช. ณัฐนนท์ สุขสวัสดิ์ (Nick)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              {/* IB Programme & Grade Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    หลักสูตร IB
                  </label>
                  <select
                    value={formData.programme}
                    onChange={e => {
                      const prog = e.target.value as IBProgramme;
                      const firstGrade = IB_PROGRAMMES[prog]?.grades[0] || '';
                      setFormData({ ...formData, programme: prog, grade: firstGrade });
                    }}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="PYP">PYP (Early & Primary)</option>
                    <option value="MYP">MYP (Middle Years)</option>
                    <option value="DP">DP (Diploma)</option>
                    <option value="CP">CP (Career-related)</option>
                    <option value="STAFF">Faculty & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    ระดับชั้น (Grade)
                  </label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    {IB_PROGRAMMES[formData.programme]?.grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    ชื่อผู้ปกครอง
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น คุณกมล สุขสวัสดิ์"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  อีเมล (ไม่บังคับ)
                </label>
                <input
                  type="email"
                  placeholder="student@roong-aroon.ac.th"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-[#E5E0D8] text-xs font-medium text-[#6B6560] hover:bg-[#F7F4EF]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  บันทึกข้อมูลนักเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#1F4D3A] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-white/80" />
                <span>แก้ไขข้อมูล: {editingCustomer.name}</span>
              </h2>
              <button onClick={() => setEditingCustomer(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    value={editingCustomer.studentId || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, studentId: e.target.value })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">ประเภท</label>
                  <select
                    value={editingCustomer.type}
                    onChange={e => setEditingCustomer({ ...editingCustomer, type: e.target.value as CustomerType })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="STUDENT">นักเรียน (Student)</option>
                    <option value="PARENT">ผู้ปกครอง (Parent)</option>
                    <option value="TEACHER">ครู / บุคลากร (Teacher)</option>
                    <option value="GENERAL">ทั่วไป (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">ชื่อ - สกุล</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">หลักสูตร IB</label>
                  <select
                    value={editingCustomer.programme || 'MYP'}
                    onChange={e => {
                      const prog = e.target.value as IBProgramme;
                      const firstGrade = IB_PROGRAMMES[prog]?.grades[0] || '';
                      setEditingCustomer({ ...editingCustomer, programme: prog, grade: firstGrade });
                    }}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="PYP">PYP</option>
                    <option value="MYP">MYP</option>
                    <option value="DP">DP</option>
                    <option value="CP">CP</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">ระดับชั้น</label>
                  <select
                    value={editingCustomer.grade || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, grade: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    {IB_PROGRAMMES[editingCustomer.programme || 'MYP']?.grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    value={editingCustomer.parentName || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, parentName: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2 rounded-lg border border-[#E5E0D8] text-xs font-medium text-[#6B6560] hover:bg-[#F7F4EF]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
