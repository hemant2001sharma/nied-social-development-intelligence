'use client';

import React, { useState, useMemo } from 'react';
import { OpportunityItem } from '@/types/intelligence';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatDeadline } from '@/lib/data';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';

interface OpportunityTableProps {
  items: OpportunityItem[];
  onSelectItem: (item: OpportunityItem) => void;
  onToggleWatchlist?: (id: string, currentState: boolean) => void;
  title?: string;
  initialSearch?: string;
  initialSector?: string;
  initialType?: string;
}

export function OpportunityTable({
  items,
  onSelectItem,
  onToggleWatchlist,
  title = 'Institutional Priority Opportunities Directory',
  initialSearch = '',
  initialSector = 'ALL',
  initialType = 'ALL'
}: OpportunityTableProps) {
  const [search, setSearch] = useState(initialSearch);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState(initialSector);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'opportunity_score' | 'strategic_score'>('priority');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Distinct sources and types for filter dropdowns
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.source_name) s.add(i.source_name); });
    return Array.from(s).sort();
  }, [items]);

  const availableTypes = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.opportunity_type) s.add(i.opportunity_type); });
    return Array.from(s).sort();
  }, [items]);

  const availableSectors = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { (i.sector || []).forEach(sec => s.add(sec)); });
    return Array.from(s).sort();
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    const filtered = items.filter(item => {
      // Search across Title, Organisation, Source, Sector, Geography, Type
      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const orgMatch = (item.organisation || '').toLowerCase().includes(q);
        const sourceMatch = (item.source_name || '').toLowerCase().includes(q);
        const typeMatch = (item.opportunity_type || '').toLowerCase().includes(q);
        const sectorMatch = (item.sector || []).some(s => s.toLowerCase().includes(q));
        const geoMatch = (item.geography || []).some(g => g.toLowerCase().includes(q));
        if (!titleMatch && !orgMatch && !sourceMatch && !typeMatch && !sectorMatch && !geoMatch) {
          return false;
        }
      }

      if (priorityFilter !== 'ALL' && (item.priority || 'LOW') !== priorityFilter) {
        return false;
      }

      if (sectorFilter !== 'ALL' && !(item.sector || []).includes(sectorFilter)) {
        return false;
      }

      if (typeFilter !== 'ALL' && (item.opportunity_type || '') !== typeFilter) {
        return false;
      }

      if (sourceFilter !== 'ALL' && (item.source_name || '') !== sourceFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const pa = order[a.priority || 'LOW'] || 0;
        const pb = order[b.priority || 'LOW'] || 0;
        if (pb !== pa) return pb - pa;
        return (b.opportunity_score || 0) - (a.opportunity_score || 0);
      }

      if (sortBy === 'opportunity_score') {
        return (b.opportunity_score || 0) - (a.opportunity_score || 0);
      }

      if (sortBy === 'strategic_score') {
        return (b.strategic_score || 0) - (a.strategic_score || 0);
      }

      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      return 0;
    });
  }, [items, search, priorityFilter, sectorFilter, typeFilter, sourceFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-lg border border-[#D9E1E7] overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-4 border-b border-[#D9E1E7] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1769AA]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#12304A]">
              {title}
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#EBF4FC] text-[#1769AA] border border-[#C5DFF7]">
              {filteredItems.length} Records
            </span>
          </div>

          {/* Quick Sort Control */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#607080] font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#F4F7F9] border border-[#D9E1E7] text-[#17232E] rounded px-2.5 py-1 font-medium text-xs focus:ring-1 focus:ring-[#1769AA]"
            >
              <option value="priority">Priority & Fit</option>
              <option value="opportunity_score">Opportunity Score</option>
              <option value="strategic_score">Strategic Alignment</option>
              <option value="deadline">Closing Deadline</option>
            </select>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
          {/* Global Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E9FAA]" />
            <input
              type="text"
              placeholder="Search title, organisation, RFP ID, keywords..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#D9E1E7] rounded text-xs text-[#17232E] placeholder-[#8E9FAA] focus:bg-white focus:ring-1 focus:ring-[#1769AA]"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-[#8E9FAA] hover:text-[#17232E]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="bg-[#F8FAFC] border border-[#D9E1E7] text-[#17232E] rounded px-2.5 py-1.5 text-xs font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority Only</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Standard Priority</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#F8FAFC] border border-[#D9E1E7] text-[#17232E] rounded px-2.5 py-1.5 text-xs font-medium truncate"
          >
            <option value="ALL">All Notice Types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="bg-[#F8FAFC] border border-[#D9E1E7] text-[#17232E] rounded px-2.5 py-1.5 text-xs font-medium truncate"
          >
            <option value="ALL">All Ingestion Sources</option>
            {availableSources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F7F9] border-b border-[#D9E1E7] text-[11px] font-bold text-[#607080] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">★</th>
              <th className="py-2.5 px-3 w-28">Priority</th>
              <th className="py-2.5 px-4">Opportunity & Scope</th>
              <th className="py-2.5 px-3 w-32">Source Feed</th>
              <th className="py-2.5 px-3 w-40">Issuing Entity</th>
              <th className="py-2.5 px-3 w-36">Sector</th>
              <th className="py-2.5 px-3 w-28">Geography</th>
              <th className="py-2.5 px-3 w-32">Deadline</th>
              <th className="py-2.5 px-3 w-24 text-center">Fit Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF3] text-xs">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#607080]">
                  <Inbox className="w-8 h-8 mx-auto text-[#8E9FAA] mb-2" />
                  <p className="font-semibold text-[#17232E]">No opportunities match the current criteria.</p>
                  <p className="text-xs text-[#8E9FAA] mt-1">Try resetting filters or adjusting your search query.</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const deadline = formatDeadline(item.deadline);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    {/* Watchlist Star */}
                    <td 
                      className="py-3 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleWatchlist) onToggleWatchlist(item.id, !!item.is_watchlisted);
                      }}
                    >
                      <button 
                        className={`p-1 rounded hover:bg-[#D9E1E7]/50 ${item.is_watchlisted ? 'text-[#D98C19]' : 'text-[#C4D1DB] group-hover:text-[#8E9FAA]'}`}
                        title={item.is_watchlisted ? 'Starred in Watchlist' : 'Add to Watchlist'}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.is_watchlisted ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    {/* Title & Type */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-1.5">
                        <div>
                          <div className="font-semibold text-[#17232E] group-hover:text-[#1769AA] transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-medium text-[#607080] bg-[#F4F7F9] px-1.5 py-0.2 rounded border border-[#EAEFF3]">
                              {item.opportunity_type || 'Notice'}
                            </span>
                            {item.is_verified && (
                              <span className="text-[10px] font-semibold text-[#2E7D5B] bg-[#EDF7F2] px-1.5 py-0.2 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge type="source" label={item.source_name || 'Feed'} />
                    </td>

                    {/* Organisation */}
                    <td className="py-3 px-3">
                      <div className="text-[#12304A] font-medium truncate max-w-[150px]" title={item.organisation || ''}>
                        {item.organisation || '—'}
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(item.sector && item.sector.length > 0) ? (
                          item.sector.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[10px] font-medium text-[#008C95] bg-[#E6F6F7] px-1.5 py-0.2 rounded truncate max-w-[120px]">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#8E9FAA]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Geography */}
                    <td className="py-3 px-3 whitespace-nowrap text-[#607080]">
                      {(item.geography && item.geography.length > 0) ? item.geography[0] : 'India'}
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-medium ${deadline.urgent ? 'text-[#C94C4C] font-semibold' : deadline.expired ? 'text-[#8E9FAA]' : 'text-[#17232E]'}`}>
                        {deadline.text}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#F4F7F9] text-[#12304A] border border-[#D9E1E7]">
                        {item.opportunity_score ?? '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#F4F7F9] border-t border-[#D9E1E7] flex flex-wrap items-center justify-between gap-3 text-xs text-[#607080]">
        <div>
          Showing <span className="font-semibold text-[#17232E]">{paginatedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-semibold text-[#17232E]">{Math.min(currentPage * pageSize, filteredItems.length)}</span> of <span className="font-semibold text-[#17232E]">{filteredItems.length}</span> opportunities
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded border border-[#D9E1E7] bg-white text-[#17232E] hover:bg-[#EAEFF3] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 font-medium transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <span className="font-medium text-[#17232E]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded border border-[#D9E1E7] bg-white text-[#17232E] hover:bg-[#EAEFF3] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 font-medium transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
