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
    { id: 'users', label: 'ผู้ใช้และสิทธิ์', icon: ShieldCheck },
    { id: 'master', label: 'ข้อมูลหลัก Master Data', icon: Database },
    { id: 'system', label: 'เชื่อมต่อระบบ / API', icon: Sliders },
    { id: 'general', label: 'ข้อมูลโรงเรียน & ทั่วไป', icon: School },
  ];

  const superAdmins = ['chinnachot@roong-aroon.ac.th'];
  const inventoryManagers = [
    'artima@roong-aroon.ac.th',
    'pakapol@roong-aroon.ac.th',
    'manusnan@roong-aroon.ac.th',
    'pattawadee.k@roong-aroon.ac.th',
  ];

  const deductionReasons = [
    { id: 'teach', label: 'เบิกใช้ประกอบการเรียนการสอน', desc: 'อุปกรณ์การเรียน เอกสาร สมุด แบบเรียน' },
    { id: 'activity', label: 'กิจกรรมโรงเรียน / งานพิเศษ', desc: 'งานอีเวนต์ กีฬาสี งานนิทรรศการ' },
    { id: 'office', label: 'ใช้งานสำนักงานและฝ่ายบริหาร', desc: 'อุปกรณ์สำนักงาน แฟ้ม กระดาษ' },
    { id: 'damage', label: 'พัสดุชำรุด / เสียหาย / ตกรุ่น', desc: 'ตัดจำหน่ายพัสดุที่ไม่สามารถใช้การได้' },
    { id: 'adjust', label: 'ปรับปรุงยอดตรวจนับประจำงวด', desc: 'ปรับยอดตามการตรวจนับสต็อกจริง' },
  ];

  const unitList = [
    'ชิ้น', 'เล่ม', 'ด้าม', 'กล่อง', 'แพ็ค', 'ห่อ', 'ม้วน', 'รีม', 'แผ่น', 'ขวด', 'อัน', 'ชุด', 'กิโลกรัม'
  ];

  const warehouseLocations = [
    { name: 'คลังกลาง (Central Warehouse)', desc: 'อาคารอำนวยการ ชั้น 1' },
    { name: 'ห้องพัสดุมัธยม (Secondary Store)', desc: 'อาคารมัธยมศึกษา ชั้น 2' },
    { name: 'ห้องวิชาการประถม (Primary Store)', desc: 'อาคารประถมศึกษา' },
    { name: 'ศูนย์กีฬาและนันทนาการ (Sports Center)', desc: 'อาคารพละและสระว่ายน้ำ' },
    { name: 'ห้องสวัสดิการร้านค้า (School Shop)', desc: 'จุดขายชุดนักเรียนและอุปกรณ์' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            ตั้งค่าระบบ (Backend Administration)
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            จัดการสิทธิ์ผู้ใช้งาน ข้อมูลหลัก Master Data การเชื่อมต่อคลาวด์ และข้อมูลโรงเรียน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-[#E6F5EF] text-[#0B6B4F] font-semibold rounded-lg border border-[#0B6B4F]/20">
            ระบบ ERP พร้อมใช้งาน
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
                <span className="text-xs text-[#6B7280] font-medium block">บัญชีของคุณในปัจจุบัน</span>
                <span className="text-sm font-bold text-[#111827] block">{user?.email}</span>
                <span className="text-xs text-[#0B6B4F] font-medium inline-flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' : isInventoryManager ? 'เจ้าหน้าที่พัสดุ (Inventory Manager)' : 'ผู้ใช้งานทั่วไป'}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#6B7280] bg-[#F3F4F6] px-3 py-2 rounded-xl border border-[#E5E7EB]">
              ยืนยันตัวตนผ่าน Google Workspace โรงเรียน
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Super Admins */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0B6B4F]" />
                  <h3 className="text-sm font-bold text-[#111827]">ผู้ดูแลระบบสูงสุด (Super Admin)</h3>
                </div>
                <span className="text-[11px] bg-[#E6F5EF] text-[#0B6B4F] font-semibold px-2 py-0.5 rounded-full">
                  {superAdmins.length} บัญชี
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                มีสิทธิ์เต็มทุกส่วน: จัดการสต็อก, ออกใบเสร็จ, เพิ่ม-ลบข้อมูลลูกค้า, พิมพ์ป้าย QR, กำหนดสิทธิ์
              </p>
              <div className="space-y-2 pt-1">
                {superAdmins.map(email => (
                  <div key={email} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-xs font-mono text-[#111827]">{email}</span>
                    <span className="text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-md">
                      อนุมัติแล้ว
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
                  <h3 className="text-sm font-bold text-[#111827]">เจ้าหน้าที่พัสดุ (Inventory Managers)</h3>
                </div>
                <span className="text-[11px] bg-[#E6F5EF] text-[#0B6B4F] font-semibold px-2 py-0.5 rounded-full">
                  {inventoryManagers.length} บัญชี
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                จัดการงานคลัง ตัด/รับเข้าสต็อก บันทึกจุดขายสวัสดิการ (POS) และจัดการข้อมูลนักเรียน
              </p>
              <div className="space-y-2 pt-1">
                {inventoryManagers.map(email => (
                  <div key={email} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <span className="text-xs font-mono text-[#111827]">{email}</span>
                    <span className="text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-md">
                      อนุมัติแล้ว
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
                <h4 className="text-sm font-bold text-[#111827]">ฐานข้อมูลนักเรียนและลูกค้า (IB Directory)</h4>
                <p className="text-xs text-[#6B7280]">ค้นหาและจัดการรายชื่อนักเรียน ผู้ปกครอง ครู และบุคลากร</p>
              </div>
            </div>
            <Link
              href="/customers"
              className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#0F3D2E] text-white text-xs font-medium rounded-xl transition"
            >
              ไปที่รายชื่อลูกค้า
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
              <h3 className="text-sm font-bold text-[#111827]">เหตุผลการตัดสต็อก (Deduction Reasons)</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              เหตุผลมาตรฐานสำหรับการตัดสต็อกและบันทึกในประวัติธุรกรรม
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
              <h3 className="text-sm font-bold text-[#111827]">จุดจัดเก็บพัสดุ (Storage Locations)</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              จุดคลังพัสดุและอาคารที่เก็บของในโรงเรียน
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
              <h3 className="text-sm font-bold text-[#111827]">หน่วยนับสินค้า (Units of Measure)</h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              หน่วยนับมาตรฐานที่ใช้ในการรับเข้าและตัดจ่ายพัสดุ
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
                  <h3 className="text-sm font-bold text-[#111827]">ระบบฐานข้อมูลคลาวด์ (Supabase Cloud PostgreSQL)</h3>
                  <span className="text-xs text-[#6B7280]">จัดเก็บข้อมูลพัสดุ สต็อก ธุรกรรม ใบเสร็จ และลูกค้าแบบ Realtime</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#027A48] font-semibold bg-[#E6F5EF] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#027A48]"></span>
                เชื่อมต่อแล้ว (Connected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-[11px] text-[#6B7280] block">Supabase Project URL</span>
                <span className="font-mono text-[#111827] font-medium block mt-0.5 truncate">
                  https://bdfjnvuxkrdylfcfbqqy.supabase.co
                </span>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <span className="text-[11px] text-[#6B7280] block">Service Role Security</span>
                <span className="text-[#027A48] font-medium block mt-0.5">
                  เปิดใช้งาน Row Level Security (RLS) ครอบคลุม
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
                  <h3 className="text-sm font-bold text-[#111827]">ระบบชำระเงิน ธนาคารกรุงเทพ BeMerchant (Thai QR Payment)</h3>
                  <span className="text-xs text-[#6B7280]">QR Code ทางการของโรงเรียนนานาชาติรุ่งอรุณ สำหรับจุดขาย POS</span>
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
                    <span className="text-[11px] text-[#6B7280] block">ชื่อบัญชีรับชำระ</span>
                    <span className="font-bold text-[#111827] text-sm block">ROONG AROON INTERNATIONAL</span>
                  </div>
                  <span className="text-[11px] text-[#0B6B4F] font-semibold bg-[#E6F5EF] px-2 py-0.5 rounded">ธนาคารกรุงเทพ</span>
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
                  เมื่อผู้ซื้อชำระผ่าน PromptPay QR ยอดเงินจะเข้าบัญชีโรงเรียนโดยตรง พร้อมระบุเลขอ้างอิงใบเสร็จ
                </p>
              </div>

              {/* QR Preview */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <img
                  src="/images/promptpay_qr.jpg"
                  alt="BeMerchant Thai QR"
                  className="w-36 h-auto rounded-lg shadow-2xs border border-[#E5E7EB]"
                />
                <span className="text-[10px] text-[#6B7280] mt-1.5 font-medium">ป้าย QR ทางการ</span>
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
              <h3 className="text-sm font-bold text-[#111827]">ข้อมูลโรงเรียนนานาชาติรุ่งอรุณ (School Identity)</h3>
              <p className="text-xs text-[#6B7280]">Roong Aroon International School - IB World School</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">ชื่อโรงเรียนภาษาอังกฤษ</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                Roong Aroon International School
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">ชื่อโรงเรียนภาษาไทย</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                โรงเรียนนานาชาติรุ่งอรุณ
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">ระบบหลักสูตร</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                International Baccalaureate (IB) Continuum
              </span>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                ครอบคลุม PYP (EY-G5), MYP (G6-G10), DP & CP (G11-G12)
              </span>
            </div>
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block">อีเมลระบบที่ได้รับอนุญาต</span>
              <span className="text-sm font-bold text-[#111827] block mt-0.5">
                @roong-aroon.ac.th
              </span>
              <span className="text-[11px] text-[#6B7280] block mt-1">
                จำกัดเฉพาะบุคลากรและเจ้าหน้าที่ภายในโรงเรียน
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
