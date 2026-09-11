'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Boxes,
  BarChart3,
  Settings,
  ChevronRight,
  School,
  ScanLine,
  Store,
  Scissors,
  Plus,
  QrCode,
  History,
  FileText,
  Users,
  ShieldCheck,
  Database,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiresManager?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string; // If single link (like Dashboard)
  subItems?: SubMenuItem[];
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSuperAdmin, isInventoryManager, canPrintQr } = useAuth();

  // Active section management
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    operations: true,
    stock: true,
    reports: false,
    settings: false,
  });

  // Automatically expand group containing active route
  useEffect(() => {
    if (pathname.startsWith('/inventory') || pathname.startsWith('/print-qr')) {
      setExpandedGroups(prev => ({ ...prev, stock: true }));
    } else if (pathname.startsWith('/pos')) {
      setExpandedGroups(prev => ({ ...prev, operations: true }));
    } else if (pathname.startsWith('/history') || pathname.startsWith('/finance')) {
      setExpandedGroups(prev => ({ ...prev, reports: true }));
    } else if (pathname.startsWith('/settings') || pathname.startsWith('/customers')) {
      setExpandedGroups(prev => ({ ...prev, settings: true }));
    }
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด',
      icon: LayoutDashboard,
      href: '/',
    },
    {
      id: 'operations',
      label: 'การทำงาน',
      icon: Layers,
      subItems: [
        { label: 'สแกนพัสดุ', href: '/?action=scan', icon: ScanLine },
        { label: 'เบิก / POS สวัสดิการ', href: '/pos', icon: Store },
        { label: 'ตัดสต็อกด่วน', href: '/?action=deduct', icon: Scissors },
        { label: 'รับเข้าสต็อก', href: '/?action=restock', icon: Plus },
      ],
    },
    {
      id: 'stock',
      label: 'สต็อก',
      icon: Boxes,
      subItems: [
        { label: 'รายการสินค้าทั้งหมด', href: '/inventory', icon: Boxes },
        { label: 'พัสดุใกล้หมดเกณฑ์', href: '/inventory?filter=low', icon: Boxes },
        ...(canPrintQr ? [{ label: 'ป้าย QR / บาร์โค้ด', href: '/print-qr', icon: QrCode }] : []),
      ],
    },
    {
      id: 'reports',
      label: 'รายงาน',
      icon: BarChart3,
      subItems: [
        { label: 'ประวัติธุรกรรม', href: '/history', icon: History },
        ...(isInventoryManager ? [{ label: 'การเงิน / ออกใบเสร็จ', href: '/finance', icon: DollarSign }] : []),
        { label: 'ส่งออกข้อมูล (Export)', href: '/history?tab=export', icon: FileText },
      ],
    },
    {
      id: 'settings',
      label: 'ตั้งค่า (Backend)',
      icon: Settings,
      subItems: [
        ...(isInventoryManager ? [{ label: 'ผู้ใช้และสิทธิ์', href: '/settings?tab=users', icon: ShieldCheck }] : []),
        ...(isInventoryManager ? [{ label: 'ฐานข้อมูลนักเรียน/ลูกค้า', href: '/customers', icon: Users }] : []),
        ...(isInventoryManager ? [{ label: 'เหตุผล / หน่วย / ที่เก็บ', href: '/settings?tab=master', icon: Database }] : []),
        { label: 'เชื่อมต่อระบบ / API', href: '/settings?tab=system', icon: Sliders },
        { label: 'ข้อมูลโรงเรียน & ทั่วไป', href: '/settings?tab=general', icon: School },
      ],
    },
  ];

  // Pre-login check: Don't render sidebar
  if (!user || pathname === '/login') {
    return null;
  }

  const isCurrentActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/' && !searchParams.get('action');
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const params = new URLSearchParams(query);
      if (pathname !== path) return false;
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }
    return pathname === href;
  };

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#E5E7EB] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center shrink-0 shadow-xs">
          <School className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold text-[#111827] tracking-tight block leading-tight truncate">
            Roong Aroon · พัสดุ
          </span>
          <span className="text-[10px] text-[#6B7280] block font-mono truncate">
            โรงเรียนนานาชาติรุ่งอรุณ
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {menuGroups.map(group => {
          const GroupIcon = group.icon;
          const isSingle = !!group.href;
          const isSingleActive = isSingle && isCurrentActive(group.href);
          const isExpanded = !!expandedGroups[group.id];

          // Check if any child of this group is active
          const hasActiveChild = group.subItems?.some(sub => isCurrentActive(sub.href));

          if (isSingle) {
            return (
              <Link
                key={group.id}
                href={group.href!}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 ${
                  isSingleActive
                    ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <GroupIcon className={`w-4 h-4 shrink-0 ${isSingleActive ? 'text-[#0B6B4F]' : 'text-[#6B7280]'}`} />
                <span className="flex-1 truncate">{group.label}</span>
              </Link>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Trigger with Right Arrow */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 ${
                  hasActiveChild
                    ? 'text-[#0B6B4F] bg-[#E6F5EF]/60 font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-[#0B6B4F]' : 'text-[#6B7280]'}`} />
                  <span className="truncate">{group.label}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 shrink-0 ${
                    isExpanded ? 'rotate-90 text-[#0B6B4F]' : ''
                  }`}
                />
              </button>

              {/* Submenu Items */}
              {isExpanded && group.subItems && (
                <div className="pl-4 pr-1 py-0.5 space-y-1 border-l-2 border-[#E5E7EB] ml-4 my-1">
                  {group.subItems.map(sub => {
                    const isActive = isCurrentActive(sub.href);
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onNavigate}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold'
                            : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {SubIcon ? (
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0B6B4F]' : 'text-[#6B7280]'}`} />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-[#0B6B4F]' : 'bg-[#9CA3AF]'
                            }`}
                          />
                        )}
                        <span className="truncate">{sub.label}</span>
                        {sub.badge && (
                          <span className="ml-auto text-[10px] bg-[#E6F5EF] text-[#0B6B4F] px-1.5 py-0.5 rounded-full font-mono font-medium">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F9FAFB] shrink-0">
        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <span className="font-medium text-[#111827]">ERP คลังพัสดุ v2.0</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#027A48] animate-pulse"></span>
            คลาวด์ออนไลน์
          </span>
        </div>
      </div>
    </aside>
  );
}
