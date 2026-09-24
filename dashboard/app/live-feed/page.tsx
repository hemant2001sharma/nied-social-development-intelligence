'use client';

import React, { useMemo, useState } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDeadline } from '@/lib/data';
import { 
  Radio, 
  Clock, 
  Building2, 
  MapPin, 
  Layers, 
  ExternalLink, 
  Search, 
  Filter,
  ArrowRight,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function LiveFeedPage() {
  const { items, selectItem, toggleWatchlist } = useAppIntelligence();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Sorted strictly by newest fetched_at or created_at timestamp
  const chronologicalFeed = useMemo(() => {
    const list = [...items].sort((a, b) => {
      const timeA = new Date(a.fetched_at || a.created_at).getTime();
      const timeB = new Date(b.fetched_at || b.created_at).getTime();
      return timeB - timeA;
    });

    return list.filter(item => {
      const q = search.toLowerCase().trim();
      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const orgMatch = (item.organisation || '').toLowerCase().includes(q);
        if (!titleMatch && !orgMatch) return false;
      }
      if (sourceFilter !== 'ALL' && item.source_name !== sourceFilter) {
        return false;
      }
      return true;
    });
  }, [items, search, sourceFilter]);

  const sources = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.source_name) s.add(i.source_name); });
    return Array.from(s).sort();
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#008C95]">
              <span className="w-2 h-2 rounded-full bg-[#008C95] animate-ping" />
              Real-time Ingestion Stream
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
              Live Intelligence Stream
            </h1>
            <p className="text-xs text-[#607080] mt-1 max-w-3xl">
              Chronological surveillance timeline of notices, tenders, and philanthropic opportunities as they are parsed and indexed by NIED SDI automated collectors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#EDF7F2] text-[#2E7D5B] text-xs font-semibold border border-[#B9E0CD] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#2E7D5B]" />
              Stream Connected ({chronologicalFeed.length} Events)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg border border-[#D9E1E7]">
        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#D9E1E7] text-xs font-medium px-2.5 py-1.5 rounded text-[#17232E]"
          >
            <option value="ALL">All Source Feeds</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E9FAA]" />
          <input
            type="text"
            placeholder="Search live feed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#D9E1E7] rounded text-xs text-[#17232E]"
          />
        </div>
      </div>

      {/* Chronological Stream List */}
      <div className="space-y-3">
        {chronologicalFeed.map((item) => {
          const timestamp = item.fetched_at || item.created_at;
          const timeDate = new Date(timestamp);
          const deadline = formatDeadline(item.deadline);

          return (
            <div
              key={item.id}
              onClick={() => selectItem(item)}
              className="p-4 bg-white rounded-lg border border-[#D9E1E7] hover:border-[#1769AA] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEFF3] pb-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge type="source" label={item.source_name || 'Feed'} />
                  <PriorityBadge priority={item.priority} />
                  <span className="text-[10px] text-[#607080] font-medium bg-[#F4F7F9] px-2 py-0.5 rounded border border-[#EAEFF3]">
                    {item.opportunity_type || 'Notice'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#8E9FAA]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ingested: {isNaN(timeDate.getTime()) ? 'Recently' : timeDate.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#17232E] group-hover:text-[#1769AA] transition-colors leading-snug">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#607080]">
                  <div className="flex items-center gap-1.5 font-medium text-[#12304A]">
                    <Building2 className="w-3.5 h-3.5 text-[#1769AA]" />
                    <span>{item.organisation || 'Organisation Unstated'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C94C4C]" />
                    <span>{(item.geography && item.geography.length > 0) ? item.geography[0] : 'India'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#008C95]" />
                    <span>{(item.sector && item.sector.length > 0) ? item.sector.join(', ') : 'General'}</span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-[#17232E]">
                    <span>Deadline:</span>
                    <span className={deadline.urgent ? 'text-[#C94C4C]' : ''}>{deadline.text}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#EAEFF3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8E9FAA]">Strategic Fit Score:</span>
                  <span className="font-mono font-bold text-[#1769AA]">{item.opportunity_score ?? '—'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(item.id, !!item.is_watchlisted);
                    }}
                    className={`p-1 rounded text-xs flex items-center gap-1 ${
                      item.is_watchlisted ? 'text-[#D98C19] font-bold' : 'text-[#8E9FAA] hover:text-[#17232E]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.is_watchlisted ? 'fill-current' : ''}`} />
                    <span>{item.is_watchlisted ? 'Watchlisted' : 'Watch'}</span>
                  </button>

                  <span className="text-[#1769AA] font-semibold flex items-center gap-1 hover:underline">
                    Dossier &rarr;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
