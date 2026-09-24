'use client';

import React, { useState, useMemo } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { formatDeadline } from '@/lib/data';
import { 
  Gift, 
  Building2, 
  Coins, 
  Award, 
  Search, 
  Layers, 
  Calendar, 
  Compass, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export default function CSRPage() {
  const { items, selectItem, toggleWatchlist } = useAppIntelligence();
  const [funderFilter, setFunderFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'rfps' | 'foundations' | 'schedule7' | 'mca'>('rfps');

  // Filter CSR opportunities
  const csrItems = useMemo(() => {
    return items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const org = (item.organisation || '').toLowerCase();
      const type = (item.opportunity_type || '').toLowerCase();
      const sec = (item.sector || []).map(s => s.toLowerCase());
      return (
        type.includes('grant') ||
        type.includes('rfp') ||
        sec.includes('csr') ||
        title.includes('csr') ||
        title.includes('grant') ||
        org.includes('foundation') ||
        org.includes('trust') ||
        org.includes('ltd') ||
        org.includes('csr')
      );
    });
  }, [items]);

  // Distinct corporate funders
  const funders = useMemo(() => {
    const s = new Set<string>();
    csrItems.forEach(i => { if (i.organisation) s.add(i.organisation); });
    return Array.from(s).sort();
  }, [csrItems]);

  const filteredItems = useMemo(() => {
    return csrItems.filter(item => {
      const q = search.toLowerCase().trim();
      if (q) {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const orgMatch = (item.organisation || '').toLowerCase().includes(q);
        if (!titleMatch && !orgMatch) return false;
      }
      if (funderFilter !== 'ALL' && item.organisation !== funderFilter) {
        return false;
      }
      return true;
    });
  }, [csrItems, search, funderFilter]);

  const highMatchCount = csrItems.filter(i => (i.opportunity_score || 0) >= 60 || i.priority === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#008C95]">
          Corporate Philanthropy & Foundation Grants
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          CSR & Corporate Philanthropy Intelligence
        </h1>
        <p className="text-xs text-[#607080] mt-1 max-w-3xl">
          Surveillance of Schedule VII thematic grant cycles, corporate foundation RFPs, and strategic partnership windows aligned with NIED program execution.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          title="Tracked CSR Opportunities"
          value={csrItems.length}
          subtitle="Corporate calls & RFPs"
          icon={Gift}
          accentColor="teal"
        />
        <KPICard
          title="Active Funders"
          value={funders.length}
          subtitle="Foundations & Trusts"
          icon={Building2}
          accentColor="navy"
        />
        <KPICard
          title="Average Ticket Size"
          value="Per Scope"
          subtitle="Grant scale unstated in notice"
          icon={Coins}
          accentColor="amber"
        />
        <KPICard
          title="NIED Priority Matches"
          value={highMatchCount}
          subtitle="Fit score >= 60"
          icon={Award}
          accentColor="green"
        />
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-[#D9E1E7] space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('rfps')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'rfps'
              ? 'border-b-2 border-[#008C95] text-[#008C95]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Active RFPs & Grants ({csrItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('foundations')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'foundations'
              ? 'border-b-2 border-[#008C95] text-[#008C95]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Corporate Foundations ({funders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule7')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'schedule7'
              ? 'border-b-2 border-[#008C95] text-[#008C95]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Schedule VII Alignment</span>
        </button>

        <button
          onClick={() => setActiveTab('mca')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'mca'
              ? 'border-b-2 border-[#008C95] text-[#008C95]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>MCA-21 Filings Stream</span>
        </button>
      </div>

      {/* Tab 1: RFPs & Grants Directory */}
      {activeTab === 'rfps' && (
        <div className="bg-white rounded-lg border border-[#D9E1E7] overflow-hidden">
          <div className="p-4 border-b border-[#D9E1E7] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#12304A]">
                Strategic CSR Opportunities Directory
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={funderFilter}
                onChange={(e) => setFunderFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#D9E1E7] text-xs font-medium px-2.5 py-1.5 rounded text-[#17232E]"
              >
                <option value="ALL">All Corporate Funders</option>
                {funders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <div className="relative w-48 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2 text-[#8E9FAA]" />
                <input
                  type="text"
                  placeholder="Search grants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1 bg-[#F8FAFC] border border-[#D9E1E7] rounded text-xs text-[#17232E]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F7F9] border-b border-[#D9E1E7] text-[11px] font-bold text-[#607080] uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-28">Priority</th>
                  <th className="py-2.5 px-4">Opportunity & Mandate</th>
                  <th className="py-2.5 px-4 w-44">Corporate Funder</th>
                  <th className="py-2.5 px-3 w-36">Thematic Area</th>
                  <th className="py-2.5 px-3 w-32">Deadline</th>
                  <th className="py-2.5 px-3 w-28 text-center">Fit Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF3] text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#607080]">
                      No CSR opportunities found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const deadline = formatDeadline(item.deadline);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => selectItem(item)}
                        className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#17232E] group-hover:text-[#008C95] transition-colors">
                          <div>{item.title}</div>
                          <div className="text-[10px] text-[#8E9FAA] font-normal mt-0.5">
                            {item.opportunity_type || 'RFP / Grant'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#12304A] font-medium">
                          {item.organisation || 'Foundation'}
                        </td>
                        <td className="py-3 px-3">
                          {(item.sector && item.sector.length > 0) ? (
                            <span className="text-[10px] font-medium text-[#008C95] bg-[#E6F6F7] px-1.5 py-0.5 rounded">
                              {item.sector[0]}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8E9FAA]">—</span>
                          )}
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
      )}

      {/* Tab 2: Corporate Foundations */}
      {activeTab === 'foundations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {funders.map((funder, idx) => {
            const count = csrItems.filter(i => i.organisation === funder).length;
            return (
              <div key={idx} className="p-4 bg-white rounded-lg border border-[#D9E1E7] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-xs text-[#12304A]">{funder}</h3>
                    <span className="text-[10px] font-semibold text-[#008C95] bg-[#E6F6F7] px-2 py-0.5 rounded">
                      {count} {count === 1 ? 'Notice' : 'Notices'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#607080] mt-1">
                    Corporate entity actively issuing development grants and RFPs.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EAEFF3] flex items-center justify-between text-xs">
                  <span className="text-[#8E9FAA]">Pipeline status:</span>
                  <span className="font-semibold text-[#2E7D5B]">Monitored Feed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Schedule VII */}
      {activeTab === 'schedule7' && (
        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-4">
          <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#008C95]" />
            Companies Act 2013 — Schedule VII Thematic Classification
          </h3>
          <p className="text-xs text-[#607080] leading-relaxed">
            The NIED SDI Hub cross-references incoming grants with statutory Schedule VII CSR mandates:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#D9E1E7]">
              <span className="font-bold text-[#12304A] block">Item (i): Poverty, Health & Sanitation</span>
              <p className="text-[#607080] mt-1">Eradicating hunger, poverty, and malnutrition; promoting health care and preventive health care; sanitation including Swachh Bharat.</p>
            </div>
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#D9E1E7]">
              <span className="font-bold text-[#12304A] block">Item (ii): Education, Livelihoods & Skills</span>
              <p className="text-[#607080] mt-1">Promoting education, including special education and employment-enhancing vocational skills, especially among children and women.</p>
            </div>
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#D9E1E7]">
              <span className="font-bold text-[#12304A] block">Item (iii): Gender Equality & Women Empowerment</span>
              <p className="text-[#607080] mt-1">Promoting gender equality, empowering women, setting up homes and hostels for women and orphans; measures for reducing inequalities.</p>
            </div>
            <div className="p-3 rounded bg-[#F8FAFC] border border-[#D9E1E7]">
              <span className="font-bold text-[#12304A] block">Item (iv): Environmental Sustainability</span>
              <p className="text-[#607080] mt-1">Ensuring environmental sustainability, ecological balance, protection of flora and fauna, animal welfare, and conservation of natural resources.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: MCA-21 */}
      {activeTab === 'mca' && (
        <div className="p-8 bg-white rounded-lg border border-[#D9E1E7] text-center max-w-lg mx-auto">
          <Coins className="w-8 h-8 text-[#008C95] mx-auto mb-2" />
          <h3 className="font-bold text-sm text-[#12304A]">MCA-21 Statutory Filings Ingestion</h3>
          <p className="text-xs text-[#607080] mt-1 leading-relaxed">
            Direct ingestion pipeline for Ministry of Corporate Affairs (MCA-21) annual CSR expenditure filings is currently scheduled for Phase 2 data connector rollout.
          </p>
          <div className="mt-3 inline-block px-3 py-1 bg-[#F4F7F9] text-[#1769AA] text-xs font-semibold rounded border border-[#D9E1E7]">
            Source Pipeline Stage: Staged for Integration
          </div>
        </div>
      )}
    </div>
  );
}
