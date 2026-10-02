'use client';

import React from 'react';

export interface SettingsTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SettingsSubTabsProps {
  tabs: SettingsTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function SettingsSubTabs({
  tabs,
  activeTab,
  onChange,
  className = ''
}: SettingsSubTabsProps) {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#0B6B4F] text-[#0B6B4F] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-100 text-[#0B6B4F]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
