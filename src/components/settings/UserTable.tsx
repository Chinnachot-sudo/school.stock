'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Plus,
  Users,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  User,
  PlusCircle,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { FamilyMember } from '@/types/inventory';

export interface DirectoryItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: string;
  category: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT';
  studentId?: string;
  nickname?: string;
  grade?: string;
  programme?: string;
  parentName?: string;
  guardians?: FamilyMember[];
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  rawItem?: any;
}

interface UserTableProps {
  items: DirectoryItem[];
  loading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDisable: boolean;
  activeFilterTab: string;
  onFilterTabChange: (tab: string) => void;
  onOpenAddModal: (mode: 'single' | 'batch', defaultCategory?: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT') => void;
  onOpenEditModal: (item: DirectoryItem) => void;
  onDeleteItem: (id: string, name: string, category: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT') => void;
  onToggleStatus?: (id: string, currentStatus: string, category: string) => void;
  onBatchAction?: (action: 'activate' | 'suspend' | 'delete', selectedIds: string[]) => void;
}

export function UserTable({
  items,
  loading,
  canCreate,
  canUpdate,
  canDisable,
  activeFilterTab,
  onFilterTabChange,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteItem,
  onToggleStatus,
  onBatchAction
}: UserTableProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'username' | 'role' | 'createdAt'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Selected IDs for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 5 Filter Tabs: Staff, Teachers, Students, Parents, Inactive
  const filterTabs = [
    { id: 'all', label: 'Staff' },
    { id: 'teachers', label: 'Teachers' },
    { id: 'students', label: 'Students' },
    { id: 'parents', label: 'Parents' },
    { id: 'inactive', label: 'Inactive' }
  ];

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isInactive = item.status === 'INACTIVE';

      // 1. Sub-tab filter
      if (activeFilterTab === 'all') {
        if (item.category !== 'STAFF' || isInactive) return false;
      } else if (activeFilterTab === 'teachers') {
        if (item.category !== 'TEACHER' || isInactive) return false;
      } else if (activeFilterTab === 'students') {
        if (item.category !== 'STUDENT' || isInactive) return false;
      } else if (activeFilterTab === 'parents') {
        if (item.category !== 'PARENT' || isInactive) return false;
      } else if (activeFilterTab === 'inactive') {
        if (!isInactive) return false;
      }

      // 2. Search input
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(query);
        const matchUser = (item.username || '').toLowerCase().includes(query);
        const matchEmail = (item.email || '').toLowerCase().includes(query);
        const matchPhone = (item.phone || '').includes(query);
        const matchStudentId = (item.studentId || '').toLowerCase().includes(query);
        const matchParent = (item.parentName || '').toLowerCase().includes(query);
        const matchGrade = (item.grade || '').toLowerCase().includes(query);
        if (!matchName && !matchUser && !matchEmail && !matchPhone && !matchStudentId && !matchParent && !matchGrade) {
          return false;
        }
      }

      // 3. Role filter dropdown
      if (roleFilter !== 'ALL') {
        if ((item.role || '').toUpperCase() !== roleFilter) return false;
      }

      // 4. Status filter dropdown
      if (statusFilter === 'ACTIVE' && isInactive) return false;
      if (statusFilter === 'INACTIVE' && !isInactive) return false;

      return true;
    }).sort((a, b) => {
      let valA: string = '';
      let valB: string = '';
      if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'username') {
        valA = a.username || '';
        valB = b.username || '';
      } else if (sortField === 'role') {
        valA = a.role || '';
        valB = b.role || '';
      } else if (sortField === 'createdAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }
      const comparison = valA.localeCompare(valB);
      return sortAsc ? comparison : -comparison;
    });
  }, [items, activeFilterTab, searchTerm, roleFilter, statusFilter, sortField, sortAsc]);

  // Paginated Data
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Checkbox Selection
  const allCurrentSelected =
    paginatedItems.length > 0 && paginatedItems.every((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const next = new Set(selectedIds);
      paginatedItems.forEach((u) => next.delete(u.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedItems.forEach((u) => next.add(u.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const getRoleBadge = (role: string, category: string) => {
    const r = (role || '').toUpperCase();
    if (category === 'STUDENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <GraduationCap className="w-3 h-3 text-sky-600" />
          <span>Student</span>
        </span>
      );
    }
    if (category === 'PARENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <HeartHandshake className="w-3 h-3 text-amber-600" />
          <span>Parent / Guardian</span>
        </span>
      );
    }
    if (r === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldAlert className="w-3 h-3 text-purple-600" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (r === 'ADMIN' || r === 'INVENTORY_MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          <span>Admin</span>
        </span>
      );
    }
    if (r === 'WAREHOUSE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShieldCheck className="w-3 h-3 text-indigo-600" />
          <span>Warehouse</span>
        </span>
      );
    }
    if (r === 'CASHIER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <User className="w-3 h-3 text-amber-600" />
          <span>Cashier</span>
        </span>
      );
    }
    if (r === 'ACCOUNTANT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <ShieldCheck className="w-3 h-3 text-teal-600" />
          <span>Accountant</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <User className="w-3 h-3 text-emerald-600" />
        <span>Teacher</span>
      </span>
    );
  };

  // Determine current tab default category
  const currentCategoryHint: 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT' =
    activeFilterTab === 'students'
      ? 'STUDENT'
      : activeFilterTab === 'parents'
      ? 'PARENT'
      : activeFilterTab === 'teachers'
      ? 'TEACHER'
      : 'STAFF';

  return (
    <div className="space-y-4">
      {/* Sub-tabs as Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none" aria-label="Directory Sub-tabs">
          {filterTabs.map((tab) => {
            const isActive = activeFilterTab === tab.id;
            // Calculate counts
            let count = 0;
            if (tab.id === 'all') {
              count = items.filter((u) => u.category === 'STAFF' && u.status !== 'INACTIVE').length;
            } else if (tab.id === 'teachers') {
              count = items.filter((u) => u.category === 'TEACHER' && u.status !== 'INACTIVE').length;
            } else if (tab.id === 'students') {
              count = items.filter((u) => u.category === 'STUDENT' && u.status !== 'INACTIVE').length;
            } else if (tab.id === 'parents') {
              count = items.filter((u) => u.category === 'PARENT' && u.status !== 'INACTIVE').length;
            } else if (tab.id === 'inactive') {
              count = items.filter((u) => u.status === 'INACTIVE').length;
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onFilterTabChange(tab.id);
                  setCurrentPage(1);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0B6B4F] text-[#0B6B4F] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-100 text-[#0B6B4F]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons: Add User & Bulk Import Users */}
        {canCreate && (
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => onOpenAddModal('batch', currentCategoryHint)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>Bulk Import Users</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('single', currentCategoryHint)}
              className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#08543E] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        )}
      </div>

      {/* Toolbar: Search, Filters, Sort */}
      <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activeFilterTab === 'students'
                ? 'Search student name, ID, grade, or parent name...'
                : activeFilterTab === 'parents'
                ? 'Search parent name, phone, or email...'
                : 'Search by name, username, or email...'
            }
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F] focus:border-transparent transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="username">Username / ID</option>
              <option value="role">Role / Type</option>
              <option value="createdAt">Date Created</option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? 'Ascending' : 'Descending'}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#0B6B4F] text-white font-bold text-[11px]">
              {selectedIds.size} Selected
            </span>
            <span className="text-emerald-950 font-medium">Bulk user operations</span>
          </div>

          <div className="flex items-center gap-2">
            {onBatchAction && (
              <>
                <button
                  type="button"
                  onClick={() => onBatchAction('activate', Array.from(selectedIds))}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-[#0B6B4F] border border-emerald-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => onBatchAction('suspend', Array.from(selectedIds))}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Suspend
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          /* Loading Skeleton */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-4 h-4 bg-slate-200 rounded" />
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
                <div className="w-24 h-6 bg-slate-200 rounded-full" />
                <div className="w-16 h-8 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              {activeFilterTab === 'students' ? (
                <GraduationCap className="w-7 h-7" />
              ) : activeFilterTab === 'parents' ? (
                <HeartHandshake className="w-7 h-7" />
              ) : (
                <Users className="w-7 h-7" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {activeFilterTab === 'students'
                ? 'No students found'
                : activeFilterTab === 'parents'
                ? 'No parents found'
                : 'No users found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No users match the selected filters. Try changing or clearing your search criteria.'
                : activeFilterTab === 'students'
                ? 'There are no students registered in the directory yet. Click Add User to register a student and their parent contact.'
                : activeFilterTab === 'parents'
                ? 'There are no parent records in the directory yet.'
                : 'There are no registered users in this directory tab yet.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Clear all filters
              </button>
            ) : canCreate ? (
              <button
                type="button"
                onClick={() => onOpenAddModal('single', currentCategoryHint)}
                className="mt-2 px-4 py-2 bg-[#0B6B4F] hover:bg-[#08543E] text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                + Add User
              </button>
            ) : null}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={allCurrentSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allCurrentSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0B6B4F]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>

                  {/* Dynamic Headers based on Tab */}
                  {activeFilterTab === 'students' ? (
                    <>
                      <th className="py-3 px-4">Student Name & Nickname</th>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Class / Grade</th>
                      <th className="py-3 px-4">Parent Information</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </>
                  ) : activeFilterTab === 'parents' ? (
                    <>
                      <th className="py-3 px-4">Parent Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Student in Care</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">User Name & Login</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Role & Access</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isInactive = item.status === 'INACTIVE';
                  const initial = item.name ? item.name[0].toUpperCase() : 'U';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(item.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0B6B4F]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* STUDENTS ROW VIEW */}
                      {activeFilterTab === 'students' ? (
                        <>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 border border-sky-200">
                                {initial}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                {item.nickname && (
                                  <span className="text-[11px] text-sky-600 font-medium">({item.nickname})</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {item.studentId || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {item.grade || item.programme || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {item.guardians && item.guardians.length > 0 ? (
                              <div className="space-y-1.5">
                                {item.guardians.map((g, gIdx) => {
                                  const initials = g.name
                                    ? g.name
                                        .split(' ')
                                        .map((part) => part[0])
                                        .filter(Boolean)
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()
                                    : 'P';

                                  return (
                                    <div key={g.id || gIdx} className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-slate-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {initials}
                                      </div>
                                      <span className="font-semibold text-slate-800 text-xs">{g.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 font-medium rounded border border-slate-200">
                                        {g.relationship}
                                      </span>
                                      {g.phone && (
                                        <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                                          ({g.phone})
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : item.parentName ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 block text-xs">{item.parentName}</span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  {item.phone && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {item.phone}
                                    </span>
                                  )}
                                  {item.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-slate-400" />
                                      {item.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(item)}
                                  title="Edit student details"
                                  className="p-1.5 text-slate-500 hover:text-[#0B6B4F] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDisable && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteItem(item.id, item.name, item.category)}
                                  title="Delete student profile"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      ) : activeFilterTab === 'parents' ? (
                        /* PARENTS ROW VIEW */
                        <>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-200">
                                {initial}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                <span className="text-[11px] text-slate-400">Parent / Guardian</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-slate-700">{item.phone || '—'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-600">{item.email || '—'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-700 font-medium">{item.studentId || item.grade || '—'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(item)}
                                  title="Edit parent details"
                                  className="p-1.5 text-slate-500 hover:text-[#0B6B4F] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDisable && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteItem(item.id, item.name, item.category)}
                                  title="Delete parent record"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        /* STAFF & TEACHERS ROW VIEW */
                        <>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                                {initial}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                {item.username ? (
                                  <span className="font-mono text-[11px] text-slate-500">@{item.username}</span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">No login credential</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-600">{item.email || '—'}</span>
                          </td>

                          <td className="py-3 px-4">{getRoleBadge(item.role, item.category)}</td>

                          <td className="py-3 px-4">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>Inactive</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(item)}
                                  title="Edit user details"
                                  className="p-1.5 text-slate-500 hover:text-[#0B6B4F] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canDisable && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteItem(item.id, item.name, item.category)}
                                  title="Delete user account"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Counter Bar */}
        {!loading && filteredItems.length > 0 && (
          <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-700">
                {Math.min(currentPage * pageSize, filteredItems.length)}
              </span>{' '}
              of <span className="font-bold text-slate-700">{filteredItems.length}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
