'use client';

import React, { useState, useEffect, Suspense, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppUser, UserRole, ROLE_LABELS } from '@/types/inventory';
import {
  ShieldCheck,
  Database,
  Sliders,
  School,
  UserCheck,
  CheckCircle2,
  Users,
  Copy,
  ExternalLink,
  QrCode,
  KeyRound,
  Server,
  Building2,
  Layers,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  Lock,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

type TabKey = 'users' | 'master' | 'system' | 'general';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'users';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { user, isSuperAdmin, isInventoryManager, canManageUsers } = useAuth();

  // User management state
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states for Add User
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN');

  // Form states for Edit User
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ADMIN');
  const [editPassword, setEditPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['users', 'master', 'system', 'general'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleOpenAddModal = () => {
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewRole('ADMIN');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newName.trim()) {
      setModalError('Full Name, Username, and Password are required.');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          username: newUsername.trim(),
          password: newPassword,
          email: newEmail.trim(),
          role: newRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setIsAddModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Error creating user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email || '');
    setEditRole(u.role);
    setEditPassword('');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          password: editPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setIsEditModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Error updating user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user account "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete user');
        return;
      }
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const tabs: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'users', label: 'Users & Permissions', icon: ShieldCheck },
    { id: 'master', label: 'Master Data', icon: Database },
    { id: 'system', label: 'System & Integrations', icon: Sliders },
    { id: 'general', label: 'School Identity & Info', icon: School },
  ];

  const deductionReasons = [
    { id: 'teach', label: 'Instructional & Classroom Use', desc: 'Learning materials, student handouts, exercise books, textbooks' },
    { id: 'activity', label: 'School Events & Co-Curricular', desc: 'Campus events, sports day, exhibitions, workshops' },
    { id: 'office', label: 'Administrative & Office Operations', desc: 'Office stationery, paper, folders, general office supplies' },
    { id: 'damage', label: 'Damaged / Obsolete / Expired', desc: 'Disposal of unusable, broken, or outdated inventory' },
    { id: 'adjust', label: 'Periodic Stock Audit Adjustment', desc: 'Discrepancy adjustment following physical stock count' },
  ];

  const unitList = [
    'Pcs', 'Book', 'Pen', 'Box', 'Pack', 'Roll', 'Ream', 'Sheet', 'Bottle', 'Unit', 'Set', 'Kg'
  ];

  const warehouseLocations = [
    { name: 'Central Warehouse', desc: 'Administration Building, Floor 1' },
    { name: 'Secondary Store', desc: 'Secondary School Building, Floor 2' },
    { name: 'Primary Store', desc: 'Primary School Building' },
    { name: 'Sports Center', desc: 'Athletics Complex & Swimming Pool' },
    { name: 'School Shop', desc: 'Uniforms, stationery, and student supply counter' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            System Settings (Backend Administration)
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage user roles, master data presets, cloud integrations, and school profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-[#E6F5EF] text-[#0B6B4F] font-semibold rounded-lg border border-[#0B6B4F]/20">
            ERP Operational
          </span>
        </div>
      </div>

      {/* Tabs Bar (Donezo Pill Style) */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E5E7EB] rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-[#0B6B4F] text-white font-semibold shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS & PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Current User Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center text-base font-bold">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <span className="text-xs text-[#6B7280] font-medium block">Active Account</span>
                <span className="text-sm font-bold text-[#111827] block">
                  {user?.user_metadata?.full_name || 'Staff'} <span className="font-mono text-xs font-normal text-slate-500">({user?.user_metadata?.username || user?.email})</span>
                </span>
                <span className="text-xs text-[#0B6B4F] font-semibold inline-flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'Super Admin' : isInventoryManager ? 'Admin' : 'Teacher / Staff'}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#6B7280] bg-[#F3F4F6] px-3 py-2 rounded-xl border border-[#E5E7EB]">
              Authenticated via Staff Credentials
            </div>
          </div>

          {/* User Directory & Management */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0B6B4F]" />
                  <h3 className="text-base font-bold text-[#111827]">Staff Accounts & Credentials</h3>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Controlled credentials access. Only Super Admin and Admin can add, update, and manage accounts.
                </p>
              </div>

              {(isSuperAdmin || isInventoryManager) && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#084D39] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              )}
            </div>

            {loadingUsers ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B6B4F]" />
                <p className="text-xs text-slate-500">Loading user accounts...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usersList.map((u) => {
                  const roleKey = u.role as UserRole;
                  const isUserSuperAdmin = roleKey === 'SUPER_ADMIN';
                  const isUserAdmin = roleKey === 'ADMIN' || roleKey === 'INVENTORY_MANAGER';

                  return (
                    <div
                      key={u.id}
                      className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 leading-tight">
                              {u.name}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                              @{u.username}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                            isUserSuperAdmin
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isUserAdmin
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ROLE_LABELS[roleKey] || 'Admin'}
                        </span>
                      </div>

                      <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          ID: <span className="font-mono">{u.id}</span>
                        </span>

                        {(isSuperAdmin || isInventoryManager) && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1 transition"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {u.username !== 'superadmin' && u.id !== 'usr-superadmin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="px-2 py-1 text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-lg flex items-center gap-1 transition"
                                title="Delete user"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick link to Customers */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#0B6B4F]" />
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Student & Customer Directory (IB Directory)</h4>
                <p className="text-xs text-[#6B7280]">Search and manage students, parents, teachers, and school personnel</p>
              </div>
            </div>
            <Link
              href="/customers"
              className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#0F3D2E] text-white text-xs font-medium rounded-xl transition"
            >
              Go to Directory
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER DATA */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deduction Reasons */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0B6B4F]" />
              <h3 className="text-sm font-bold text-[#111827]">Deduction Reasons</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Standard reason presets for stock issue transactions and audit logging
            </p>
            <div className="space-y-2 pt-1">
              {deductionReasons.map(r => (
                <div key={r.id} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-[#111827] block">{r.label}</span>
                  <span className="text-[11px] text-[#6B7280] block mt-0.5">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Locations */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0B6B4F]" />
              <h3 className="text-sm font-bold text-[#111827]">Storage Locations</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Campus storage depots, department rooms, and fulfillment points
            </p>
            <div className="space-y-2 pt-1">
              {warehouseLocations.map((loc, i) => (
                <div key={i} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-[#111827] block">{loc.name}</span>
                  <span className="text-[11px] text-[#6B7280] block mt-0.5">{loc.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Units of Measure */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B6B4F]" />
              <h3 className="text-sm font-bold text-[#111827]">Units of Measure</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              Standard units used for inventory receipts, issues, and packaging
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {unitList.map(unit => (
                <span
                  key={unit}
                  className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827]"
                >
                  {unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM & API INTEGRATIONS */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Cloud Database (Supabase) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[#0B6B4F]" />
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Cloud Database (Supabase Cloud PostgreSQL)</h3>
                  <span className="text-xs text-[#6B7280]">Realtime storage for items, stock balances, transactions, receipts, and customers</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#027A48] font-semibold bg-[#E6F5EF] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#027A48]"></span>
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-[11px] text-[#6B7280] block">Supabase Project URL</span>
                <span className="font-mono text-[#111827] font-medium block mt-0.5 truncate">
                  https://wiulvyluvgeeaapbjtvc.supabase.co
                </span>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-[11px] text-[#6B7280] block">Service Role Security</span>
                <span className="text-[#027A48] font-medium block mt-0.5">
                  Row Level Security (RLS) Active
                </span>
              </div>
            </div>
          </div>

          {/* Bangkok Bank PromptPay BeMerchant QR */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-[#0B6B4F]" />
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">Bangkok Bank BeMerchant (Thai QR Payment)</h3>
                  <span className="text-xs text-[#6B7280]">Official Roong Aroon International School merchant QR code for POS cashier</span>
                </div>
              </div>
              <span className="text-xs text-[#0B6B4F] font-medium bg-[#E6F5EF] px-2.5 py-1 rounded-lg">
                PromptPay / Thai QR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#6B7280] block">Merchant Account Name</span>
                    <span className="font-bold text-[#111827] text-sm block">ROONG AROON INTERN</span>
                  </div>
                  <span className="text-[11px] text-[#0B6B4F] font-semibold bg-[#E6F5EF] px-2 py-0.5 rounded">Bangkok Bank</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] text-[#6B7280] block">Merchant ID (Ref. 1)</span>
                    <span className="font-mono font-bold text-[#111827] text-sm block mt-0.5">002203089172</span>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] text-[#6B7280] block">Terminal ID (Ref. 3)</span>
                    <span className="font-mono font-bold text-[#111827] text-sm block mt-0.5">43008918</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B7280]">
                  When customers pay via PromptPay QR, funds deposit directly to the school account with receipt reference numbers.
                </p>
              </div>

              {/* QR Preview */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <img
                  src="/images/promptpay_qr.jpg"
                  alt="BeMerchant Thai QR"
                  className="w-36 h-auto rounded-lg shadow-2xs border border-[#E5E7EB]"
                />
                <span className="text-[10px] text-[#6B7280] mt-1.5 font-medium">Official Merchant QR</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL SCHOOL INFO */}
      {activeTab === 'general' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">School Identity & Profile</h3>
              <p className="text-xs text-[#6B7280]">Roong Aroon International School - IB World School</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">School Name (English)</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                Roong Aroon International School
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">School Name (Thai)</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                โรงเรียนนานาชาติรุ่งอรุณ
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">Curriculum Continuum</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                International Baccalaureate (IB) Continuum
              </span>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                Encompassing PYP (EY-G5), MYP (G6-G10), DP & CP (G11-G12)
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">Authorized Email Domain</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                @roong-aroon.ac.th
              </span>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                Restricted to authorized faculty, staff, and administrators
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0B6B4F]" />
                <h3 className="font-bold text-sm text-slate-900">Add New Staff User</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Somchai Sukjai"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. somchai.s"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="min. 4 chars"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. somchai@roong-aroon.ac.th"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                >
                  <option value="ADMIN">Admin (Full inventory, POS cashier, deduct & restock)</option>
                  <option value="TEACHER">Teacher / Staff (Borrow & request supplies)</option>
                  {isSuperAdmin && (
                    <option value="SUPER_ADMIN">Super Admin (System configuration & all privileges)</option>
                  )}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-[#0B6B4F] hover:bg-[#084D39] text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit User Account</h3>
                  <p className="text-[11px] text-slate-500 font-mono">@{editingUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher / Staff</option>
                  {isSuperAdmin && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reset Password (leave empty to keep unchanged)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6B4F]" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
