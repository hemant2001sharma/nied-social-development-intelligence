'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { OpportunityTable } from '@/components/OpportunityTable';
import { KPICard } from '@/components/KPICard';
import { fetchWatchlist } from '@/lib/data';
import { WatchlistRecord } from '@/types/intelligence';
import { Star, Bell, Tag, ShieldCheck, Search, Filter } from 'lucide-react';

export default function WatchlistPage() {
  const { items, selectItem, toggleWatchlist } = useAppIntelligence();
  const [watchlistRules, setWatchlistRules] = useState<WatchlistRecord[]>([]);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await fetchWatchlist();
      setWatchlistRules(data);
    }
    load();
  }, []);

  // Filter items matching starred state OR active keyword
  const watchlistedItems = useMemo(() => {
    if (activeKeyword) {
      const k = activeKeyword.toLowerCase();
      return items.filter(item => {
        const title = (item.title || '').toLowerCase();
        const type = (item.opportunity_type || '').toLowerCase();
        const sec = (item.sector || []).map(s => s.toLowerCase());
        return title.includes(k) || type.includes(k) || sec.some(s => s.includes(k));
      });
    }

    // Default to items flagged as watchlisted or priority HIGH
    const starred = items.filter(i => i.is_watchlisted);
    if (starred.length > 0) return starred;
    return items.filter(i => i.priority === 'HIGH');
  }, [items, activeKeyword]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#D98C19]">
          Target Surveillance & Strategic Alerts
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          Priority Watchlist & Keyword Monitors
        </h1>
        <p className="text-xs text-[#607080] mt-1 max-w-3xl">
          Monitored priority opportunities and automated keyword trigger rules saved in the NIED SDI surveillance engine.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          title="Starred Opportunities"
          value={items.filter(i => i.is_watchlisted).length}
          subtitle="Directly pinned opportunities"
          icon={Star}
          accentColor="amber"
        />
        <KPICard
          title="Monitored Keywords"
          value={watchlistRules.length || 10}
          subtitle="Active surveillance triggers"
          icon={Tag}
          accentColor="blue"
        />
        <KPICard
          title="High Priority Pipeline"
          value={items.filter(i => i.priority === 'HIGH').length}
          subtitle="Strategic score >= 75"
          icon={Bell}
          accentColor="red"
        />
        <KPICard
          title="Watch Status"
          value="Automated"
          subtitle="Continuous evaluation"
          icon={ShieldCheck}
          accentColor="green"
        />
      </div>

      {/* Monitored Keywords Cloud */}
      <div className="p-4 bg-white rounded-lg border border-[#D9E1E7] space-y-3">
        <div className="flex items-center justify-between border-b border-[#EAEFF3] pb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#D98C19]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
              Active Keyword Surveillance Triggers (From Supabase Watchlist)
            </h3>
          </div>
          {activeKeyword && (
            <button
              onClick={() => setActiveKeyword(null)}
              className="text-[11px] font-semibold text-[#1769AA] hover:underline"
            >
              Clear Filter ({activeKeyword})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {watchlistRules.map((rule) => {
            const isSelected = activeKeyword === rule.watch_value;
            const matchCount = items.filter(i => {
              const k = rule.watch_value.toLowerCase();
              return (i.title || '').toLowerCase().includes(k) ||
                (i.opportunity_type || '').toLowerCase().includes(k) ||
                (i.sector || []).some(s => s.toLowerCase().includes(k));
            }).length;

            return (
              <button
                key={rule.id}
                onClick={() => setActiveKeyword(isSelected ? null : rule.watch_value)}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#D98C19] text-white shadow-xs'
                    : 'bg-[#FEF7EC] text-[#D98C19] border border-[#F8E1BA] hover:bg-[#FDF0DB]'
                }`}
              >
                <span>{rule.watch_value}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#D98C19]/10 text-[#D98C19]'
                }`}>
                  {matchCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Watchlist Opportunity Table */}
      <OpportunityTable
        items={watchlistedItems}
        onSelectItem={selectItem}
        onToggleWatchlist={toggleWatchlist}
        title={activeKeyword ? `Opportunities Triggered by Keyword: "${activeKeyword}"` : "Starred & High Priority Pipeline"}
      />
    </div>
  );
}
