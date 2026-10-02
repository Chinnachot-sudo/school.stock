'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  // Group 1: Dashboard
  LayoutDashboard,
  ClipboardCheck,
  Bell,
  Calendar,

  // Group 2: My Space
  UserCheck,
  PlusCircle,
  ClipboardList,
  Receipt,
  AlertCircle,
  Search,

  // Group 3: Point of Sale
  Store,
  ShoppingCart,
  Clock,
  CalendarDays,
  RotateCcw,
  History,
  Users,

  // Group 4: Inventory
  Boxes,
  LayoutGrid,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  Truck,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,

  // Group 5: Invoicing & Receivables
  FileText,
  FilePlus,
  CreditCard,
  FileMinus,

  // Group 6: Assets
  Briefcase,
  TrendingDown,
  Trash2,
  Repeat,
  CheckCircle2,

  // Group 7: Reports
  BarChart3,
  TrendingUp,
  Layers,
  DollarSign,
  PiggyBank,
  Activity,

  // Group 8: Settings
  Settings,
  ShieldCheck,
  School,
  Database,
  Tag,
  GitPullRequest,
  Hash,
  HardDriveDownload,

  // UI Icons
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

import {
  navigationConfig,
  features,
  FeatureFlags,
  NavigationGroup,
  NavigationSubItem,
  NavigationSubGroup
} from '@/config/navigation.config';

export interface MenuSubGroup {
  id: string;
  label: string;
  items: NavigationSubItem[];
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  href?: string;
  subItems?: NavigationSubItem[];
  subGroups?: MenuSubGroup[];
}

export interface SidebarProps {
  onNavigate?: () => void;
  onToggleSidebar?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const STORAGE_EXPANDED_KEY = 'school_sidebar_expanded_groups';
const STORAGE_EXPANDED_SUBGROUPS_KEY = 'school_sidebar_expanded_subgroups';

export default function Sidebar({
  onNavigate,
  onToggleSidebar,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, role, can } = useAuth();
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_EXPANDED: Record<string, boolean> = {
    dashboard: true,
    my_space: true,
    pos: true,
    inventory: true,
    invoicing: false,
    assets: false,
    reports: false,
    settings: false,
  };

  const DEFAULT_EXPANDED_SUBGROUPS: Record<string, boolean> = {
    people_access: true,
    master_data: true,
    commerce: true,
    system: true,
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_EXPANDED);
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>(DEFAULT_EXPANDED_SUBGROUPS);

  // Restore expanded groups and sub-groups from localStorage after client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EXPANDED_KEY);
      if (saved) {
        setExpandedGroups(JSON.parse(saved));
      }
      const savedSub = localStorage.getItem(STORAGE_EXPANDED_SUBGROUPS_KEY);
      if (savedSub) {
        setExpandedSubGroups(JSON.parse(savedSub));
      }
    } catch {}
  }, []);

  // Save expanded states to localStorage
  const updateExpandedGroups = (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setExpandedGroups(prev => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_EXPANDED_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    updateExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleSubGroup = (subGroupId: string) => {
    setExpandedSubGroups(prev => {
      const next = {
        ...prev,
        [subGroupId]: prev[subGroupId] === undefined ? false : !prev[subGroupId]
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_EXPANDED_SUBGROUPS_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Helper: check if a URL route matches currently active page
  const isCurrentActive = (href?: string) => {
    if (!href) return false;

    // Special case for dashboard overview
    if (href === '/' || href === '/?tab=overview') {
      return pathname === '/' && !searchParams.get('action') && (!searchParams.get('tab') || searchParams.get('tab') === 'overview');
    }

    // Handle query strings like /history?tab=audit or /finance?tab=invoices
    if (href.includes('?')) {
      const [targetPath, targetQuery] = href.split('?');
      if (pathname !== targetPath) return false;
      const targetParams = new URLSearchParams(targetQuery);

      // Precise matching for /settings routes
      if (pathname === '/settings') {
        const targetTab = targetParams.get('tab');
        const currentTab = searchParams.get('tab');
        const currentPage = searchParams.get('page');

        if (targetTab === 'users') {
          return currentTab === 'users' || currentPage === 'staff' || (!currentTab && !currentPage);
        }
        if (targetTab === 'departments') {
          return currentTab === 'departments' || currentPage === 'departments';
        }
        if (targetTab === 'master') {
          return currentTab === 'master' || currentTab === 'categories' || (currentPage === 'master_data' && currentTab === 'categories');
        }
        if (targetTab === 'locations') {
          return currentTab === 'locations' || (currentPage === 'master_data' && currentTab === 'locations');
        }
        if (targetTab === 'uom') {
          return currentTab === 'uom' || (currentPage === 'master_data' && currentTab === 'uom');
        }
        if (targetTab === 'pricing') {
          return currentTab === 'pricing' || (currentPage === 'commerce' && currentTab === 'pricing');
        }
        if (targetTab === 'workflow') {
          return currentTab === 'workflow' || (currentPage === 'commerce' && currentTab === 'workflow');
        }
        if (targetTab === 'numbering') {
          return currentTab === 'numbering' || (currentPage === 'commerce' && currentTab === 'numbering');
        }
        if (targetTab === 'notifications') {
          return currentTab === 'notifications' || (currentPage === 'system' && currentTab === 'notifications');
        }
        if (targetTab === 'backup') {
          return currentTab === 'backup' || (currentPage === 'system' && currentTab === 'backup');
        }
      }

      for (const [key, value] of targetParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    // For base paths without query, ensure no specific query tab is active
    if (pathname === href) {
      if (searchParams.get('tab') || searchParams.get('filter')) return false;
      return true;
    }

    return false;
  };

  // Helper: check if any child in a group is active
  const isGroupActive = (group: MenuGroup) => {
    if (group.href && isCurrentActive(group.href)) return true;
    if (group.subItems?.some(sub => isCurrentActive(sub.href))) return true;
    if (group.subGroups?.some(sg => sg.items.some(sub => isCurrentActive(sub.href)))) return true;
    return false;
  };

  // Filtered by RBAC / PBAC & Feature Flags from navigation.config.ts
  const navigationGroups = useMemo<MenuGroup[]>(() => {
    const isSuperOrAdmin =
      role === 'super_admin' ||
      role === 'legacy_admin' ||
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN';

    const groups: MenuGroup[] = [];

    navigationConfig.forEach(group => {
      // Group-level permission/role check
      if (group.roles && !isSuperOrAdmin && !group.roles.includes(role)) {
        return;
      }
      if (group.permissions && !isSuperOrAdmin && !group.permissions.some(p => can(p as any))) {
        return;
      }

      // Subitems filtering
      let filteredSubItems: NavigationSubItem[] | undefined;
      if (group.subItems) {
        filteredSubItems = group.subItems.filter(sub => {
          // Feature flag check
          if (sub.featureFlag && !features[sub.featureFlag]) {
            return false;
          }
          // Roles check
          if (sub.roles && !isSuperOrAdmin && !sub.roles.includes(role)) {
            return false;
          }
          // Permissions check
          if (sub.permissions && !isSuperOrAdmin && !sub.permissions.some(p => can(p as any))) {
            return false;
          }
          return true;
        });
      }

      // SubGroups filtering (for 3-level nesting)
      let filteredSubGroups: MenuSubGroup[] | undefined;
      if (group.subGroups) {
        filteredSubGroups = group.subGroups
          .map(sg => {
            const items = sg.items.filter(sub => {
              if (sub.featureFlag && !features[sub.featureFlag]) {
                return false;
              }
              if (sub.roles && !isSuperOrAdmin && !sub.roles.includes(role)) {
                return false;
              }
              if (sub.permissions && !isSuperOrAdmin && !sub.permissions.some(p => can(p as any))) {
                return false;
              }
              return true;
            });
            return {
              id: sg.id,
              label: sg.label,
              items
            };
          })
          .filter(sg => sg.items.length > 0);
      }

      const hasSubItems = filteredSubItems && filteredSubItems.length > 0;
      const hasSubGroups = filteredSubGroups && filteredSubGroups.length > 0;

      if (hasSubItems || hasSubGroups) {
        groups.push({
          id: group.id,
          label: group.label,
          icon: group.icon,
          subItems: filteredSubItems,
          subGroups: filteredSubGroups
        });
      }
    });

    return groups;
  }, [role, can]);

  // Auto-expand the group and sub-group that contains the current active route
  useEffect(() => {
    navigationGroups.forEach(g => {
      const isDirectChildActive = g.subItems?.some(sub => isCurrentActive(sub.href));
      if (isDirectChildActive && !expandedGroups[g.id]) {
        updateExpandedGroups(prev => ({
          ...prev,
          [g.id]: true
        }));
      }

      if (g.subGroups) {
        g.subGroups.forEach(sg => {
          const isSubChildActive = sg.items.some(sub => isCurrentActive(sub.href));
          if (isSubChildActive) {
            if (!expandedGroups[g.id]) {
              updateExpandedGroups(prev => ({
                ...prev,
                [g.id]: true
              }));
            }
            if (!expandedSubGroups[sg.id]) {
              setExpandedSubGroups(prev => {
                const next = { ...prev, [sg.id]: true };
                try {
                  localStorage.setItem(STORAGE_EXPANDED_SUBGROUPS_KEY, JSON.stringify(next));
                } catch {}
                return next;
              });
            }
          }
        });
      }
    });
  }, [pathname, searchParams, navigationGroups]);

  // Flyout handlers for Collapsed mode on desktop
  const handleFlyoutEnter = (groupId: string) => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setActiveFlyout(groupId);
  };

  const handleFlyoutLeave = () => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 150);
  };

  // Pre-login check
  if (pathname === '/login' || pathname === '/auth/callback') {
    return null;
  }

  return (
    <aside
      className={`bg-white border-r border-[#E5E7EB] flex flex-col h-full select-none transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-[72px]' : 'w-72'
      }`}
    >
      {/* 1. Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-[#E5E7EB] shrink-0 bg-white transition-all duration-300 ${
          isCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'
        }`}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0"
          title="Romaneeya - Roong Aroon International School"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-xs border border-[#E5E7EB] bg-[#E6F5EF] p-1 flex items-center justify-center">
            <img
              src="/images/romaneeya_leaf_logo.svg"
              alt="Romaneeya Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-200">
              <span className="text-sm font-extrabold text-[#0B6B4F] tracking-tight block leading-tight">
                Romaneeya
              </span>
              <span className="text-[10px] text-[#6B7280] block font-medium leading-tight whitespace-nowrap">
                Roong Aroon Int. School
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button in Header (Desktop Expanded) */}
        {!isCollapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0B6B4F] hover:bg-[#E6F5EF] transition cursor-pointer hidden lg:flex"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation List (8 Top-Level Groups) */}
      <div
        className={`flex-1 overflow-y-auto space-y-1.5 scrollbar-thin transition-all duration-300 ${
          isCollapsed ? 'px-2 py-3' : 'px-3 py-4'
        }`}
      >
        {navigationGroups.map(group => {
          const GroupIcon = group.icon;
          const isSingle = !!group.href;
          const isSingleActive = isSingle && isCurrentActive(group.href);
          const hasActiveChild = isGroupActive(group);
          const isExpanded = !!expandedGroups[group.id];

          // -------------------------------------------------------------
          // Collapsed Mode (Icon-only with Flyout Tooltip / Submenu)
          // -------------------------------------------------------------
          if (isCollapsed) {
            const isFlyoutOpen = activeFlyout === group.id;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleFlyoutEnter(group.id)}
                onMouseLeave={handleFlyoutLeave}
              >
                {isSingle ? (
                  <Link
                    href={group.href!}
                    onClick={onNavigate}
                    className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 ${
                      isSingleActive
                        ? 'bg-[#E6F5EF] text-[#0B6B4F] shadow-2xs font-bold'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <GroupIcon className="w-5 h-5 shrink-0" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      toggleGroup(group.id);
                      if (onToggleCollapse) onToggleCollapse();
                    }}
                    className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                      hasActiveChild
                        ? 'bg-[#E6F5EF] text-[#0B6B4F] font-bold shadow-2xs'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <GroupIcon className="w-5 h-5 shrink-0" />
                    {hasActiveChild && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0B6B4F]" />
                    )}
                  </button>
                )}

                {/* Floating Flyout Menu on Hover (Collapsed Mode) */}
                {isFlyoutOpen && (
                  <div
                    className="absolute left-full top-0 ml-2 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                    onMouseEnter={() => handleFlyoutEnter(group.id)}
                    onMouseLeave={handleFlyoutLeave}
                  >
                    <div className="px-3 py-1.5 text-xs font-bold text-[#0B6B4F] border-b border-[#E5E7EB] flex items-center gap-2">
                      <GroupIcon className="w-4 h-4" />
                      <span>{group.label}</span>
                    </div>

                    <div className="pt-1 space-y-0.5 max-h-80 overflow-y-auto scrollbar-thin">
                      {group.subItems?.map(sub => {
                        const isActive = isCurrentActive(sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => {
                              setActiveFlyout(null);
                              if (onNavigate) onNavigate();
                            }}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                              isActive
                                ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold'
                                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                                  sub.badgeColor || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}

                      {group.subGroups?.map(sg => (
                        <div key={sg.id} className="pt-2 first:pt-0">
                          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {sg.label}
                          </div>
                          <div className="space-y-0.5">
                            {sg.items.map(sub => {
                              const isActive = isCurrentActive(sub.href);
                              const SubIcon = sub.icon;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  aria-current={isActive ? 'page' : undefined}
                                  onClick={() => {
                                    setActiveFlyout(null);
                                    if (onNavigate) onNavigate();
                                  }}
                                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                                    isActive
                                      ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold'
                                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {sub.badge && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                                        sub.badgeColor || 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // -------------------------------------------------------------
          // Expanded Mode (Full Accordion with Smooth Height/Opacity Transition)
          // -------------------------------------------------------------
          if (isSingle) {
            return (
              <Link
                key={group.id}
                href={group.href!}
                aria-current={isSingleActive ? 'page' : undefined}
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
            <div key={group.id} className="space-y-0.5">
              {/* Group Header Trigger */}
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  hasActiveChild
                    ? 'text-[#0B6B4F] bg-[#E6F5EF]/60 font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-[#0B6B4F]' : 'text-[#6B7280]'}`} />
                  <span className="truncate">{group.label}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-200 shrink-0 ${
                    isExpanded ? 'rotate-90 text-[#0B6B4F]' : ''
                  }`}
                />
              </button>

              {/* Smooth Height & Opacity Transition Accordion */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  {/* Direct SubItems (Flat SubItems) */}
                  {group.subItems && group.subItems.length > 0 && (
                    <div className="pl-3.5 pr-1 py-1 space-y-0.5 border-l-2 border-[#E5E7EB] ml-4 my-0.5">
                      {group.subItems.map(sub => {
                        const isActive = isCurrentActive(sub.href);
                        const SubIcon = sub.icon;

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={onNavigate}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 group ${
                              isActive
                                ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold'
                                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {SubIcon ? (
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isActive ? 'text-[#0B6B4F]' : 'text-[#9CA3AF] group-hover:text-[#111827]'
                                  }`}
                                />
                              ) : (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isActive ? 'bg-[#0B6B4F]' : 'bg-[#D1D5DB]'
                                  }`}
                                />
                              )}
                              <span className="truncate">{sub.label}</span>
                            </div>

                            {sub.badge && (
                              <span
                                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                                  sub.badgeColor || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* 3-Level SubGroups (Nested Second-Level Headers) */}
                  {group.subGroups && group.subGroups.length > 0 && (
                    <div className="pl-3.5 pr-1 py-1 space-y-2 border-l-2 border-[#E5E7EB] ml-4 my-0.5">
                      {group.subGroups.map(subGroup => {
                        const isSubExpanded = expandedSubGroups[subGroup.id] !== false;

                        return (
                          <div key={subGroup.id} className="space-y-0.5">
                            {/* Sub-group header: lighter, smaller, muted, uppercase, not a link */}
                            <button
                              type="button"
                              aria-expanded={isSubExpanded}
                              onClick={() => toggleSubGroup(subGroup.id)}
                              className="w-full flex items-center justify-between px-2 pt-1.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-600 uppercase transition cursor-pointer select-none"
                            >
                              <span className="truncate">{subGroup.label}</span>
                              <ChevronRight
                                className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                                  isSubExpanded ? 'rotate-90 text-slate-600' : ''
                                }`}
                              />
                            </button>

                            {/* SubGroup Items */}
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-150 ease-in-out ${
                                isSubExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                              }`}
                            >
                              <div className="overflow-hidden space-y-0.5 pl-1.5">
                                {subGroup.items.map(sub => {
                                  const isActive = isCurrentActive(sub.href);
                                  const SubIcon = sub.icon;

                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      aria-current={isActive ? 'page' : undefined}
                                      onClick={onNavigate}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 group ${
                                        isActive
                                          ? 'bg-[#E6F5EF] text-[#0B6B4F] font-semibold'
                                          : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        {SubIcon ? (
                                          <SubIcon
                                            className={`w-3.5 h-3.5 shrink-0 ${
                                              isActive ? 'text-[#0B6B4F]' : 'text-[#9CA3AF] group-hover:text-[#111827]'
                                            }`}
                                          />
                                        ) : (
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                              isActive ? 'bg-[#0B6B4F]' : 'bg-[#D1D5DB]'
                                            }`}
                                          />
                                        )}
                                        <span className="truncate">{sub.label}</span>
                                      </div>

                                      {sub.badge && (
                                        <span
                                          className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                                            sub.badgeColor || 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {sub.badge}
                                        </span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Sidebar Footer */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F9FAFB] shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#0B6B4F] hover:bg-[#E6F5EF] flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <span className="w-2 h-2 rounded-full bg-[#027A48] animate-pulse" title="System Online" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
              <span className="font-semibold text-[#111827]">ERP Inventory v2.0</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#027A48] font-medium bg-[#E6F5EF] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#027A48] animate-pulse"></span>
                Cloud Online
              </span>
            </div>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-[#6B7280] hover:text-[#0B6B4F] hover:bg-white rounded-lg border border-transparent hover:border-[#E5E7EB] transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Collapse Sidebar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
