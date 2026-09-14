'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ScannerModal from '@/components/ScannerModal';
import { X } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawerOpen(prev => !prev);
    } else {
      setDesktopSidebarOpen(prev => !prev);
    }
  };

  // Pre-login screen: completely bare, no sidebar, no header, no bottom nav
  if (pathname === '/login' || pathname === '/auth/callback') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#F3F4F6] text-[#111827]">
      {/* 1. Desktop Left Sidebar (Sticky Full Height, Collapsible) */}
      <aside
        className={`hidden lg:block lg:sticky lg:top-0 lg:h-screen shrink-0 z-40 transition-all duration-300 ease-in-out overflow-hidden ${
          desktopSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <React.Suspense fallback={<div className="w-72 bg-white border-r border-[#E5E7EB] h-full" />}>
          <Sidebar />
        </React.Suspense>
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-4 right-3.5 p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
            >
              <X className="w-4 h-4" />
            </button>
            <React.Suspense fallback={<div className="w-full bg-white h-full" />}>
              <Sidebar onNavigate={() => setMobileDrawerOpen(false)} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* 3. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (4 primary warehouse actions) */}
      <div className="lg:hidden">
        <React.Suspense fallback={null}>
          <MobileBottomNav />
        </React.Suspense>
      </div>

      {/* Global Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={code => {
            setIsScannerOpen(false);
            window.location.href = `/?scan=${encodeURIComponent(code)}`;
          }}
        />
      )}
    </div>
  );
}
