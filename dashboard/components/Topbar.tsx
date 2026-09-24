'use client';

import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  RefreshCw, 
  Download, 
  SlidersHorizontal, 
  Radio, 
  Check, 
  ShieldCheck,
  Bell
} from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenExport?: () => void;
  onGlobalSearch?: (query: string) => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
}

export function Topbar({
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
  onOpenExport,
  onGlobalSearch,
  autoSyncEnabled = true,
  onToggleAutoSync
}: TopbarProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onGlobalSearch) {
      onGlobalSearch(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#D9E1E7] px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Live Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded text-[#607080] hover:bg-[#F4F7F9] hover:text-[#17232E]"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B9E0CD]">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
            Live Data · Supabase Active
          </span>
          <span className="hidden sm:inline-block text-[11px] text-[#607080] border-l border-[#D9E1E7] pl-2">
            Last Sync: <span className="font-medium text-[#17232E]">Just Now</span>
          </span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#8E9FAA]" />
          <input
            type="text"
            placeholder="Global search across notices, tenders, ministries..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F4F7F9] border border-[#D9E1E7] rounded text-xs text-[#17232E] placeholder-[#8E9FAA] focus:bg-white focus:ring-1 focus:ring-[#1769AA]"
          />
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-2">
        {/* Auto Sync Toggle */}
        <button
          onClick={onToggleAutoSync}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            autoSyncEnabled
              ? 'bg-[#EBF4FC] text-[#1769AA] border-[#BDDCF6]'
              : 'bg-[#F4F7F9] text-[#607080] border-[#D9E1E7]'
          }`}
          title="Toggle 15-minute background auto-sync polling"
        >
          <Radio className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'animate-pulse text-[#1769AA]' : ''}`} />
          <span>Auto Sync: {autoSyncEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded text-[#607080] hover:bg-[#F4F7F9] hover:text-[#17232E] border border-[#D9E1E7] transition-colors"
            title="Refresh Supabase intelligence stream"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1769AA]' : ''}`} />
          </button>
        )}

        {/* Export Brief */}
        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1769AA] hover:bg-[#125387] text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Brief</span>
          </button>
        )}

        {/* Customize View */}
        <div className="relative">
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="p-1.5 rounded text-[#607080] hover:bg-[#F4F7F9] hover:text-[#17232E] border border-[#D9E1E7] transition-colors"
            title="Customize view density and filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {showCustomizer && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-[#D9E1E7] shadow-lg p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="font-bold text-[#12304A] border-b border-[#EAEFF3] pb-1.5 mb-2">
                Display Preferences
              </div>
              <div className="space-y-2 text-[#17232E]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
                  <span>High density tabular mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
                  <span>Show Strategic Fit scores</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
                  <span>Highlight &lt; 7D deadlines</span>
                </label>
              </div>
              <div className="mt-3 pt-2 border-t border-[#EAEFF3] flex justify-end">
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="px-2 py-0.5 bg-[#1769AA] text-white rounded text-[11px] font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
