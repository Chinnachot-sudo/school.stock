'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ScanLine, Store, Boxes, History } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  const items = [
    { label: 'สแกน', href: '/?action=scan', icon: ScanLine, isHome: true },
    { label: 'เบิก / POS', href: '/pos', icon: Store },
    { label: 'สต็อก', href: '/inventory', icon: Boxes },
    { label: 'ประวัติ', href: '/history', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] py-1.5 px-3 flex items-center justify-around shadow-sm select-none">
      {items.map(item => {
        const Icon = item.icon;
        let isActive = false;

        if (item.isHome) {
          isActive = pathname === '/' || searchParams.get('action') === 'scan';
        } else {
          isActive = pathname === item.href;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 min-w-[64px] min-h-[44px] ${
              isActive
                ? 'text-[#0B6B4F] font-semibold'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-[#E6F5EF]' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
