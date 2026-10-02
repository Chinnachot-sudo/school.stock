'use client';

import React from 'react';
import {
  Users,
  School,
  Database,
  Tag,
  Settings,
  ShieldCheck,
  MapPin,
  Hash,
  GitPullRequest,
  Bell,
  HardDriveDownload,
  Cloud,
  ChevronDown
} from 'lucide-react';

export interface SettingsNavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTab?: string;
  items?: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const SETTINGS_NAVIGATION: SettingsNavSection[] = [
  {
    id: 'staff',
    label: 'Staff Directory',
    icon: Users,
    defaultTab: 'all'
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: School,
    defaultTab: 'departments'
  },
  {
    id: 'master_data',
    label: 'Master Data',
    icon: Database,
    defaultTab: 'categories',
    items: [
      { id: 'categories', label: 'Categories', icon: Database },
      { id: 'locations', label: 'Storage Locations', icon: MapPin },
      { id: 'uom', label: 'Units of Measure', icon: Hash }
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: Tag,
    defaultTab: 'pricing',
    items: [
      { id: 'pricing', label: 'Pricing & Promotions', icon: Tag },
      { id: 'workflow', label: 'Approval Workflow', icon: GitPullRequest },
      { id: 'numbering', label: 'Document Numbering', icon: Hash }
    ]
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    defaultTab: 'notifications',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'backup', label: 'Backup & Restore', icon: HardDriveDownload },
      { id: 'integrations', label: 'Integrations', icon: Cloud }
    ]
  }
];

interface SettingsSidebarProps {
  activePage: string;
  activeTab: string;
  onNavigate: (pageId: string, tabId: string) => void;
}

export function SettingsSidebar({
  activePage,
  activeTab,
  onNavigate
}: SettingsSidebarProps) {
  // Mobile flat selection list
  const mobileOptions: { value: string; label: string; page: string; tab: string }[] = [];
  SETTINGS_NAVIGATION.forEach((sec) => {
    if (sec.items && sec.items.length > 0) {
      sec.items.forEach((item) => {
        mobileOptions.push({
          value: `${sec.id}:${item.id}`,
          label: `${sec.label} — ${item.label}`,
          page: sec.id,
          tab: item.id
        });
      });
    } else {
      mobileOptions.push({
        value: `${sec.id}:${sec.defaultTab || sec.id}`,
        label: sec.label,
        page: sec.id,
        tab: sec.defaultTab || sec.id
      });
    }
  });

  const currentMobileVal = `${activePage}:${activeTab}`;

  return (
    <aside className="w-full lg:w-60 shrink-0">
      {/* Mobile Select View */}
      <div className="lg:hidden mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <label htmlFor="settings-mobile-nav" className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 px-0.5">
          Settings Section
        </label>
        <div className="relative">
          <select
            id="settings-mobile-nav"
            value={currentMobileVal}
            onChange={(e) => {
              const selected = mobileOptions.find((o) => o.value === e.target.value);
              if (selected) {
                onNavigate(selected.page, selected.tab);
              }
            }}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold py-2.5 px-3.5 pr-8 rounded-xl focus:ring-2 focus:ring-[#0B6B4F] focus:bg-white"
          >
            {mobileOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Desktop Vertical Sub-menu (Sticky) */}
      <div className="hidden lg:block sticky top-20 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
        <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings Navigation</h2>
        </div>

        <nav className="space-y-1" aria-label="Settings Submenu">
          {SETTINGS_NAVIGATION.map((section) => {
            const isSectionActive = activePage === section.id;
            const SectionIcon = section.icon;

            if (!section.items || section.items.length === 0) {
              const isDirectActive = isSectionActive;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onNavigate(section.id, section.defaultTab || section.id)}
                  aria-current={isDirectActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isDirectActive
                      ? 'bg-[#E6F5EF] text-[#0B6B4F] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <SectionIcon
                    className={`w-4 h-4 shrink-0 ${
                      isDirectActive ? 'text-[#0B6B4F]' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            }

            return (
              <div key={section.id} className="pt-2 first:pt-0">
                <button
                  type="button"
                  onClick={() => onNavigate(section.id, section.defaultTab || section.items![0].id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors text-left cursor-pointer ${
                    isSectionActive ? 'text-[#0B6B4F]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                  </span>
                </button>

                <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3.5">
                  {section.items.map((subItem) => {
                    const isItemActive = isSectionActive && activeTab === subItem.id;
                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => onNavigate(section.id, subItem.id)}
                        aria-current={isItemActive ? 'page' : undefined}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                          isItemActive
                            ? 'bg-[#E6F5EF] text-[#0B6B4F] font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isItemActive ? 'text-[#0B6B4F]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
