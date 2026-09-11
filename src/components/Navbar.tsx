'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, Boxes, History, QrCode, School, LogOut, Store, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, isSuperAdmin, isInventoryManager, canPrintQr, signOut } = useAuth();

  // Pre-login: completely hide Top Nav and Bottom Nav
  if (!user || pathname === '/login') {
    return null;
  }

  // Desktop navigation items
  const desktopNavItems = [
    { label: 'สแกน', href: '/', icon: ScanLine },
    { label: 'เบิก / POS', href: '/pos', icon: Store },
    { label: 'คลังพัสดุ', href: '/inventory', icon: Boxes },
    ...(isInventoryManager ? [{ label: 'ลูกค้า/นักเรียน', href: '/customers', icon: Users }] : []),
    ...(isInventoryManager ? [{ label: 'การเงิน/ใบเสร็จ', href: '/finance', icon: DollarSign }] : []),
    { label: 'ประวัติ', href: '/history', icon: History },
    ...(canPrintQr ? [{ label: 'ป้าย QR', href: '/print-qr', icon: QrCode }] : [])
  ];

  // Mobile Bottom Navigation: Exactly 4 focused primary items
  const mobileNavItems = [
    { label: 'สแกน', href: '/', icon: ScanLine },
    { label: 'เบิก / POS', href: '/pos', icon: Store },
    { label: 'สต็อก', href: '/inventory', icon: Boxes },
    { label: 'ประวัติ', href: '/history', icon: History }
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const userAvatar = user?.user_metadata?.avatar_url || '';

  // Clean role text without emojis
  const roleDisplay = isSuperAdmin
    ? 'ผู้ดูแลระบบ'
    : isInventoryManager
    ? 'เจ้าหน้าที่'
    : 'ครู / บุคลากร';

  return (
    <>
      {/* Top Header (Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F4D3A] text-white flex items-center justify-center shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[#1A1A1A] tracking-tight block leading-tight">
                โรงเรียนนานาชาติรุ่งอรุณ • พัสดุ
              </span>
              <span className="text-[10px] text-[#6B6560] block font-mono">
                Roong Aroon International School
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'text-[#1F4D3A] font-semibold bg-[#E8F0EB]'
                      : 'text-[#6B6560] hover:text-[#1A1A1A] hover:bg-[#F7F4EF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full border border-[#E5E0D8] object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center text-[10px] font-semibold">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
              )}
              
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-medium text-[#1A1A1A] max-w-[120px] truncate block">
                  {userName}
                </span>
                <span className="text-[10px] text-[#6B6560] block">
                  {roleDisplay}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              title="ออกจากระบบ"
              className="p-1.5 rounded-md text-[#6B6560] hover:text-[#B42318] hover:bg-[#FEE4E2] transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, strictly 4 items, no pill, thin underline) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E0D8] px-2 py-1.5 flex justify-around items-center">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-1 transition relative min-h-[48px] justify-center ${
                isActive
                  ? 'text-[#1F4D3A] font-semibold'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-tight">{item.label}</span>
              
              {/* Thin underline indicator for active state (strictly no pill/bubble) */}
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-[#1F4D3A] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
