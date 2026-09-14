'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  ScanLine,
  LogOut,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface TopHeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileDrawer?: () => void;
  onOpenScanner?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function TopHeader({ onToggleSidebar, onOpenMobileDrawer, onOpenScanner, isSidebarCollapsed = false }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, isInventoryManager, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch low stock count for notification bell
  useEffect(() => {
    if (!user) return;
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const count = data.items.filter((i: any) => i.currentStock <= i.minStock).length;
          setLowStockCount(count);
        }
      })
      .catch(() => {});
  }, [user]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Pre-login check
  if (pathname === '/login' || pathname === '/auth/callback') {
    return null;
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Staff';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || '';

  const roleDisplay = isSuperAdmin
    ? 'Super Admin'
    : isInventoryManager
    ? 'Admin'
    : 'Teacher / Staff';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Hamburger Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* 3-Line Hamburger Menu Button (Shows on mobile or when desktop sidebar is collapsed) */}
        <button
          type="button"
          onClick={onToggleSidebar || onOpenMobileDrawer}
          className={`p-1.5 rounded-lg text-[#0B6B4F] bg-emerald-50 hover:bg-emerald-100/80 border-2 border-[#0B6B4F] transition items-center justify-center shadow-xs cursor-pointer shrink-0 active:scale-95 ${
            isSidebarCollapsed ? 'flex' : 'flex lg:hidden'
          }`}
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#0B6B4F]" />
        </button>

        {/* Global Search Bar (Donezo style) */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search items, SKU, or press ⌘K..."
            className="w-full bg-[#F3F4F6] border border-transparent hover:border-[#E5E7EB] focus:border-[#0B6B4F] focus:bg-white text-xs text-[#111827] placeholder:text-[#6B7280] pl-9 pr-14 py-2 rounded-xl transition duration-150 outline-none"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E5E7EB] rounded text-[#6B7280] shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Quick Action, Notifications & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Scan Button (Desktop & Mobile) */}
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0B6B4F] bg-[#E6F5EF] hover:bg-[#d6f0e4] transition"
            title="Open Barcode Scanner"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {lowStockCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B42318] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <span className="text-xs font-bold text-[#111827]">Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-[#6B7280] hover:text-[#111827]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="py-2 space-y-2">
                {lowStockCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      router.push('/inventory?filter=low');
                    }}
                    className="w-full text-left p-2 rounded-xl bg-[#FEF0C7]/40 hover:bg-[#FEF0C7] border border-[#B54708]/20 flex items-start gap-2.5 transition"
                  >
                    <AlertCircle className="w-4 h-4 text-[#B54708] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-[#B54708] block">
                        Low Stock Alert ({lowStockCount} items)
                      </span>
                      <span className="text-[11px] text-[#6B7280] block mt-0.5">
                        Click to review items requiring restock
                      </span>
                    </div>
                  </button>
                ) : (
                  <p className="text-xs text-[#6B7280] text-center py-4">
                    No new notifications
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill (Donezo style) */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full border border-[#E5E7EB] object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
              {userName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="hidden md:block text-left">
            <span className="text-xs font-bold text-[#111827] block leading-tight truncate max-w-[140px]">
              {userName}
            </span>
            <span className="text-[10px] text-[#0B6B4F] font-medium bg-[#E6F5EF] px-1.5 py-0.2 rounded block w-fit mt-0.5">
              {roleDisplay}
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="p-2 text-[#6B7280] hover:text-[#B42318] hover:bg-red-50 rounded-xl transition ml-0.5"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
