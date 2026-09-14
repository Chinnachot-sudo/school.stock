'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type TabKey = 'users' | 'master' | 'system' | 'general';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'users';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { user, isSuperAdmin, isInventoryManager } = useAuth();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['users', 'master', 'system', 'general'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'users', label: 'Users & Permissions', icon: ShieldCheck },
    { id: 'master', label: 'Master Data', icon: Database },
    { id: 'system', label: 'System & Integrations', icon: Sliders },
    { id: 'general', label: 'School Identity & Info', icon: School },
  ];

  const superAdmins = ['chinnachot@roong-aroon.ac.th'];
  const inventoryManagers = [
    'artima@roong-aroon.ac.th',
    'pakapol@roong-aroon.ac.th',
    'manusnan@roong-aroon.ac.th',
    'pattawadee.k@roong-aroon.ac.th',
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
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center text-base font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs text-[#6B7280] font-medium block">Current Account</span>
                <span className="text-sm font-bold text-[#111827] block">{user?.email}</span>
                <span className="text-xs text-[#0B6B4F] font-medium inline-flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'Super Admin' : isInventoryManager ? 'Inventory Manager' : 'Staff / User'}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#6B7280] bg-[#F3F4F6] px-3 py-2 rounded-xl border border-[#E5E7EB]">
              Authenticated via School Google Workspace
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Super Admins */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0B6B4F]" />
                  <h3 className="text-sm font-bold text-[#111827]">Super Admin</h3>
                </div>
                <span className="text-[11px] bg-[#E6F5EF] text-[#0B6B4F] font-semibold px-2 py-0.5 rounded-full">
                  {superAdmins.length} Accounts
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Full permissions: inventory management, sales receipts, customer records, QR code generator, and role assignment
              </p>
              <div className="space-y-2 pt-1">
                {superAdmins.map(email => (
                  <div key={email} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-xs font-mono text-[#111827]">{email}</span>
                    <span className="text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-md">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Managers */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0B6B4F]" />
                  <h3 className="text-sm font-bold text-[#111827]">Inventory Managers</h3>
                </div>
                <span className="text-[11px] bg-[#E6F5EF] text-[#0B6B4F] font-semibold px-2 py-0.5 rounded-full">
                  {inventoryManagers.length} Accounts
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Warehouse operations, stock issue/receipt, school store POS terminal, and customer records
              </p>
              <div className="space-y-2 pt-1">
                {inventoryManagers.map(email => (
                  <div key={email} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-xs font-mono text-[#111827]">{email}</span>
                    <span className="text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-md">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
