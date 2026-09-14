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
      setFormError('Please enter student / customer name');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add customer');

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
      showToast(`Added customer "${data.customer.name}" successfully`);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name?.trim()) return;

    try {
      const payload = {
        ...editingCustomer,
        name: editingCustomer.name.trim(),
        nickname: (editingCustomer.nickname || '').trim() || null,
        grade: (editingCustomer.grade || '').trim(),
        studentId: (editingCustomer.studentId || '').trim() || null,
        parentName: (editingCustomer.parentName || '').trim() || null,
        phone: (editingCustomer.phone || '').trim() || null,
        email: (editingCustomer.email || '').trim() || null,
        note: (editingCustomer.note || '').trim() || null
      };

      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update customer');

      setCustomers(prev => prev.map(c => (c.id === data.customer.id ? data.customer : c)));
      setEditingCustomer(null);
      showToast(`Updated customer "${data.customer.name}" successfully`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete customer');

      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast(`Deleted customer "${name}" successfully`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) return;

    const exportRows = filteredCustomers.map((c, idx) => ({
      No: idx + 1,
      StudentID: c.studentId || '-',
      FullName: c.name,
      Type: CUSTOMER_TYPE_LABELS[c.type] || c.type,
      IBProgramme: c.programme || '-',
      Grade: c.grade || '-',
      ParentName: c.parentName || '-',
      Phone: c.phone || '-',
      Email: c.email || '-',
      Note: c.note || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Customers');

    const fileName = `IB_Student_Directory_RAIS_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            Student & Customer Directory (IB Directory)
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            Manage PYP, MYP, DP, CP students and parents for checkout integration at School Store (POS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F7F4EF] disabled:opacity-40 text-[#1A1A1A] text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1F4D3A]" />
            <span>Export Excel</span>
          </button>

          {(isSuperAdmin || isInventoryManager) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-white text-xs font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Student / Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* IB Programme Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {studentCount} <span className="text-xs font-normal text-[#6B6560]">Students</span>
          </div>
          <span className="text-[11px] text-[#6B6560] mt-0.5 block">Registered in ERP system</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B6560]">PYP (Early & Primary)</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] text-[#1F4D3A] flex items-center justify-center text-[11px] font-mono font-semibold">
              EY-G5
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1A1A1A] mt-2">
            {pypCount} <span className="text-xs font-normal text-[#6B6560]">Students</span>
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
            {mypCount} <span className="text-xs font-normal text-[#6B6560]">Students</span>
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
            {dpCpCount} <span className="text-xs font-normal text-[#6B6560]">Students</span>
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
              placeholder="Search name, student ID, parent, phone..."
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
              <option value="ALL">All IB Programmes (PYP, MYP, DP, CP)</option>
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
              <option value="ALL">All Customer Types (Student / Parent / Teacher / General)</option>
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="TEACHER">Teacher / Staff</option>
              <option value="GENERAL">General Public</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6B6560]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F4D3A]" />
            <p className="text-xs font-medium">Loading student directory...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560]">
            <Users className="w-8 h-8 mx-auto text-[#E5E0D8] mb-2" />
            <p className="font-semibold text-sm text-[#1A1A1A]">No student or customer found</p>
            <p className="text-xs text-[#6B6560] mt-1">Try changing your search query or click &quot;+ Add Student / Customer&quot;</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#F7F4EF] text-[#6B6560] font-semibold">
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">IB Programme & Grade</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Parent / Contact</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                            Parent: {customer.parentName}
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
                            onClick={() => setEditingCustomer({
                              ...customer,
                              nickname: customer.nickname || '',
                              studentId: customer.studentId || '',
                              parentName: customer.parentName || '',
                              phone: customer.phone || '',
                              email: customer.email || '',
                              note: customer.note || '',
                              grade: customer.grade || ''
                            })}
                            className="p-1.5 text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF] rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {(isSuperAdmin || isInventoryManager) && (
                            <button
                              onClick={() => handleDelete(customer.id, customer.name)}
                              className="p-1.5 text-[#6B6560] hover:text-[#B42318] hover:bg-red-50 rounded-lg transition"
                              title="Delete"
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
                <span>Add New Student / Customer</span>
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
                    Customer Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as CustomerType })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent</option>
                    <option value="TEACHER">Teacher / Staff</option>
                    <option value="GENERAL">General Public</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    Student / Staff ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAIS-2024-055"
                    value={formData.studentId}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natthanon Sukswasdi (Nick)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              {/* IB Programme & Grade Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    IB Programme
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
                    Grade
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
                    Parent Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kamol Sukswasdi"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">
                    Contact Phone
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
                  Email (Optional)
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  Save Customer
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
                <span>Edit Customer: {editingCustomer.name}</span>
              </h2>
              <button onClick={() => setEditingCustomer(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Student ID</label>
                  <input
                    type="text"
                    value={editingCustomer.studentId || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, studentId: e.target.value })}
                    className="w-full font-mono bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Type</label>
                  <select
                    value={editingCustomer.type}
                    onChange={e => setEditingCustomer({ ...editingCustomer, type: e.target.value as CustomerType })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PARENT">Parent</option>
                    <option value="TEACHER">Teacher / Staff</option>
                    <option value="GENERAL">General Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">IB Programme</label>
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
                  <label className="block font-medium text-[#1A1A1A] mb-1">Grade</label>
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
                  <label className="block font-medium text-[#1A1A1A] mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={editingCustomer.parentName || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, parentName: e.target.value })}
                    className="w-full bg-[#F7F4EF] border border-[#E5E0D8] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A1A1A] mb-1">Phone Number</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#1F4D3A] hover:bg-[#183D2E] text-xs font-medium text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
