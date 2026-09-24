'use client';

import React, { useState, useMemo } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDeadline } from '@/lib/data';
import { 
  Landmark, 
  MapPin, 
  IndianRupee, 
  Award, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Radio,
  FileText
} from 'lucide-react';

export default function GovernmentPage() {
  const { items, selectItem, toggleWatchlist } = useAppIntelligence();
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Filter government opportunities
  const govtItems = useMemo(() => {
    return items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const org = (item.organisation || '').toLowerCase();
      const type = (item.opportunity_type || '').toLowerCase();
      const sName = (item.source_name || '').toLowerCase();
      const isGovt = (
        type.includes('tender') ||
        type.includes('tor') ||
        type.includes('eoi') ||
        sName.includes('cppp') ||
        sName.includes('gem') ||
        sName.includes('procure') ||
        org.includes('ministry') ||
        org.includes('department') ||
        org.includes('government') ||
        org.includes('authority') ||
        org.includes('corporation') ||
        title.includes('tender') ||
        title.includes('procurement')
      );
      return isGovt;
    });
  }, [items]);

  // Source strip platforms
  const platforms = [
    { name: 'All Government', key: 'ALL' },
    { name: 'GeM Portal', key: 'GeM' },
    { name: 'CPPP eProcure', key: 'CPPP' },
    { name: 'UP eProc', key: 'UP' },
    { name: 'Haryana eProc', key: 'Haryana' },
    { name: 'Rajasthan eProc', key: 'Rajasthan' },
    { name: 'Uttarakhand eProc', key: 'Uttarakhand' },
    { name: 'Ministry Direct', key: 'Ministry' }
  ];

  // Apply filters
  const filteredGovtItems = useMemo(() => {
    return govtItems.filter(item => {
      const q = search.toLowerCase().trim();
      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const orgMatch = (item.organisation || '').toLowerCase().includes(q);
        if (!titleMatch && !orgMatch) return false;
      }

      if (platformFilter !== 'ALL') {
        const title = (item.title || '').toLowerCase();
        const org = (item.organisation || '').toLowerCase();
        const sName = (item.source_name || '').toLowerCase();
        const key = platformFilter.toLowerCase();
        if (!title.includes(key) && !org.includes(key) && !sName.includes(key)) {
          return false;
        }
      }

      return true;
    });
  }, [govtItems, search, platformFilter]);

  const activeNotices = govtItems.length;
  const statesCovered = useMemo(() => {
    const states = new Set<string>();
    govtItems.forEach(i => (i.geography || []).forEach(g => states.add(g)));
    return Math.max(states.size, 1);
  }, [govtItems]);

  const highFitCount = govtItems.filter(i => (i.opportunity_score || 0) >= 60 || i.priority === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
          Public Procurement & State Tenders
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          Government Intelligence Console
        </h1>
        <p className="text-xs text-[#607080] mt-1 max-w-3xl">
          Centralized surveillance of Central Ministries, GeM, CPPP eProcurement, and State Government RFP/ToR notices matching NIED development capabilities.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          title="Active Notices"
          value={activeNotices}
          subtitle="Tenders & ToRs tracked"
          icon={Landmark}
          accentColor="blue"
        />
        <KPICard
          title="States & UTs"
          value={statesCovered}
          subtitle="Spatial coverage"
          icon={MapPin}
          accentColor="teal"
        />
        <KPICard
          title="Aggregate Outlay"
          value="Calculated on notice"
          subtitle="Values published in bids"
          icon={IndianRupee}
          accentColor="amber"
        />
        <KPICard
          title="High NIED Fit"
          value={highFitCount}
          subtitle="Fit score >= 60"
          icon={Award}
          accentColor="green"
        />
      </div>

      {/* Government Source Strip */}
      <div className="p-3 bg-white rounded-lg border border-[#D9E1E7]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#607080] mb-2">
          Procurement Platform Filter
        </div>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map(p => (
            <button
              key={p.key}
              onClick={() => setPlatformFilter(p.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                platformFilter === p.key
                  ? 'bg-[#1769AA] text-white shadow-xs'
                  : 'bg-[#F4F7F9] text-[#17232E] hover:bg-[#EBF4FC] hover:text-[#1769AA]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-lg border border-[#D9E1E7] overflow-hidden">
        <div className="p-4 border-b border-[#D9E1E7] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1769AA]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#12304A]">
              Government Tender & Notice Registry ({filteredGovtItems.length})
            </h2>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E9FAA]" />
            <input
              type="text"
              placeholder="Search government bids..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#D9E1E7] rounded text-xs text-[#17232E]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F7F9] border-b border-[#D9E1E7] text-[11px] font-bold text-[#607080] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-32">Bid / Notice ID</th>
                <th className="py-2.5 px-4">Opportunity Title</th>
                <th className="py-2.5 px-3 w-32">Platform</th>
                <th className="py-2.5 px-4 w-44">Department / State</th>
                <th className="py-2.5 px-3 w-36">Estimated Value</th>
                <th className="py-2.5 px-3 w-32">Deadline</th>
                <th className="py-2.5 px-3 w-28 text-center">NIED Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF3] text-xs">
              {filteredGovtItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#607080]">
                    No government procurement notices match this platform filter.
                  </td>
                </tr>
              ) : (
                filteredGovtItems.map((item) => {
                  const deadline = formatDeadline(item.deadline);
                  const bidId = item.source_id || item.id.slice(0, 8).toUpperCase();

                  return (
                    <tr
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#1769AA]">
                        #{bidId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#17232E] group-hover:text-[#1769AA] transition-colors">
                        <div>{item.title}</div>
                        <div className="text-[10px] text-[#8E9FAA] font-normal mt-0.5">
                          {item.opportunity_type || 'Notice'}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge type="source" label={item.source_name || 'Govt Portal'} />
                      </td>
                      <td className="py-3 px-4 text-[#12304A] font-medium">
                        {item.organisation || 'State Authority'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[#607080] italic">
                        Value unstated
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-medium ${deadline.urgent ? 'text-[#C94C4C] font-semibold' : 'text-[#17232E]'}`}>
                          {deadline.text}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B9E0CD]">
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
      </div>
    </div>
  );
}
