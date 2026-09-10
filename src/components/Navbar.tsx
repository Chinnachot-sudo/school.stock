'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, Boxes, History, QrCode, School, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isConfigured, role, isSuperAdmin, isInventoryManager, canPrintQr, signOut } = useAuth();

  const navItems = [
    { label: 'สแกนเบิกด่วน', href: '/', icon: ScanLine },
    { label: 'คลังพัสดุ', href: '/inventory', icon: Boxes },
    { label: 'ประวัติเบิก-รับ', href: '/history', icon: History },
    ...(canPrintQr ? [{ label: 'พิมพ์ป้าย QR', href: '/print-qr', icon: QrCode }] : [])
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const userAvatar = user?.user_metadata?.avatar_url || '';

  return (
    <>
      {/* Top Header (Mobile & Desktop) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <School className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base leading-tight block font-extrabold text-blue-900">
                ระบบคลังพัสดุโรงเรียน
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 block">
                Roong-Aroon Stock
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section (Desktop & Mobile) */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-6 h-6 rounded-full border border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {userName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700 max-w-[110px] truncate leading-tight hidden sm:inline">
                      {userName}
                    </span>
                    <span className="text-[9px] font-bold leading-none mt-0.5">
                      {isSuperAdmin ? (
                        <span className="text-amber-700 bg-amber-100 px-1 py-0.2 rounded">👑 Super Admin</span>
                      ) : isInventoryManager ? (
                        <span className="text-blue-700 bg-blue-100 px-1 py-0.2 rounded">📦 พัสดุ</span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-1 py-0.2 rounded">👨‍🏫 ครู</span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isConfigured ? (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            ) : null}
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex justify-around items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? 'bg-blue-100/80 text-blue-600' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
