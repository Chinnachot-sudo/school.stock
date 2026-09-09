'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, Boxes, History, QrCode, School } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'สแกนเบิกด่วน', href: '/', icon: ScanLine },
    { label: 'คลังพัสดุ', href: '/inventory', icon: Boxes },
    { label: 'ประวัติเบิก-รับ', href: '/history', icon: History },
    { label: 'พิมพ์ป้าย QR', href: '/print-qr', icon: QrCode },
  ];

  return (
    <>
      {/* Top Header (Mobile & Desktop) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base leading-tight block font-extrabold text-blue-900">
                ระบบคลังพัสดุโรงเรียน
              </span>
              <span className="text-[10px] font-medium text-slate-500 block">
                Mobile Inventory & Quick Stock
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
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
