'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { VelocityChart } from '@/components/VelocityChart';
import { SectorPulse } from '@/components/SectorPulse';
import { SourceHealthStrip } from '@/components/SourceHealthStrip';
import { OpportunityTable } from '@/components/OpportunityTable';
import { calculateKPIs, getSectorDistribution, getVelocityData, fetchSources } from '@/lib/data';
import { SourceRecord } from '@/types/intelligence';
import { 
  Briefcase, 
  Landmark, 
  Gift, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Download,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { items, isLoading, error, selectItem, toggleWatchlist, openExportModal } = useAppIntelligence();
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [velocityRange, setVelocityRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  useEffect(() => {
    async function loadSources() {
      const { data } = await fetchSources();
      setSources(data);
    }
    loadSources();
  }, []);

  // Compute metrics dynamically from live items
  const kpis = useMemo(() => calculateKPIs(items), [items]);
  const sectors = useMemo(() => getSectorDistribution(items), [items]);
  const velocityData = useMemo(() => getVelocityData(items, velocityRange), [items, velocityRange]);

  // Filter items if user clicked a specific KPI card
  const displayedItems = useMemo(() => {
    let result = items;

    if (selectedKpiFilter === 'government') {
      result = result.filter(item => {
        const title = (item.title || '').toLowerCase();
        const org = (item.organisation || '').toLowerCase();
        const type = (item.opportunity_type || '').toLowerCase();
        const sName = (item.source_name || '').toLowerCase();
        return (
          type.includes('tender') ||
          type.includes('tor') ||
          type.includes('eoi') ||
          sName.includes('cppp') ||
          sName.includes('gem') ||
          org.includes('ministry') ||
          org.includes('department') ||
          org.includes('government') ||
          title.includes('tender')
        );
      });
    } else if (selectedKpiFilter === 'csr') {
      result = result.filter(item => {
        const title = (item.title || '').toLowerCase();
        const org = (item.organisation || '').toLowerCase();
        const type = (item.opportunity_type || '').toLowerCase();
        const sec = (item.sector || []).map(s => s.toLowerCase());
        return (
          type.includes('grant') ||
          type.includes('rfp') ||
          sec.includes('csr') ||
          title.includes('csr') ||
          org.includes('foundation')
        );
      });
    } else if (selectedKpiFilter === 'closingSoon') {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);
      result = result.filter(item => {
        if (!item.deadline) return false;
        const d = new Date(item.deadline);
        return !isNaN(d.getTime()) && d >= now && d <= in7Days;
      });
    } else if (selectedKpiFilter === 'highPriority') {
      result = result.filter(item => item.priority === 'HIGH' || (item.opportunity_score !== null && item.opportunity_score >= 75));
    }

    if (selectedSector !== 'ALL') {
      result = result.filter(item => (item.sector || []).includes(selectedSector));
    }

    return result;
  }, [items, selectedKpiFilter, selectedSector]);

  if (isLoading && items.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#607080]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1769AA] mb-3" />
        <h2 className="text-base font-bold text-[#12304A]">Synchronizing NIED SDI Data Streams...</h2>
        <p className="text-xs text-[#8E9FAA] mt-1">Connecting to Supabase repository</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="p-6 bg-[#FDF2F2] rounded-lg border border-[#F8C8C8] text-[#C94C4C] max-w-xl mx-auto my-12">
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Supabase Data Stream Connection Alert</span>
        </div>
        <p className="text-xs mt-2 text-[#607080]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institutional Page Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
              National Institute for Educational Development (NIED)
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
              Social Development Intelligence
            </h1>
            <p className="text-xs text-[#607080] mt-1 max-w-3xl leading-relaxed">
              Monitor opportunities, government activity, funding pipelines, and cross-sector development intelligence in one centralized view.
            </p>
          </div>

          <button
            onClick={openExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F4F7F9] text-[#12304A] font-semibold text-xs border border-[#D9E1E7] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#1769AA]" />
            <span>Generate Executive Brief</span>
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KPICard
          title="Active Intelligence"
          value={kpis.activeIntelligence}
          subtitle="Indexed notices in repository"
          icon={Briefcase}
          accentColor="navy"
          isSelected={selectedKpiFilter === null}
          onClick={() => setSelectedKpiFilter(null)}
        />
        <KPICard
          title="Government Notices"
          value={kpis.governmentOpportunities}
          subtitle="Tenders, ToRs & EOIs"
          icon={Landmark}
          accentColor="blue"
          isSelected={selectedKpiFilter === 'government'}
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'government' ? null : 'government')}
        />
        <KPICard
          title="CSR & Funding"
          value={kpis.csrFunding}
          subtitle="Corporate RFPs & Grants"
          icon={Gift}
          accentColor="teal"
          isSelected={selectedKpiFilter === 'csr'}
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'csr' ? null : 'csr')}
        />
        <KPICard
          title="Closing Soon"
          value={kpis.closingSoon}
          subtitle="Deadlines within 7 days"
          icon={Clock}
          accentColor={kpis.closingSoon > 0 ? 'red' : 'amber'}
          isSelected={selectedKpiFilter === 'closingSoon'}
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'closingSoon' ? null : 'closingSoon')}
        />
        <KPICard
          title="High Priority"
          value={kpis.highPriority}
          subtitle="Strategic score >= 75"
          icon={AlertCircle}
          accentColor="green"
          isSelected={selectedKpiFilter === 'highPriority'}
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === 'highPriority' ? null : 'highPriority')}
        />
      </div>

      {/* Analytics Row: Velocity Chart & Sector Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <VelocityChart
            data={velocityData}
            currentRange={velocityRange}
            onRangeChange={setVelocityRange}
          />
        </div>
        <div className="lg:col-span-1">
          <SectorPulse
            sectors={sectors}
            activeSector={selectedSector}
            onSelectSector={setSelectedSector}
          />
        </div>
      </div>

      {/* Government Procurement & Tender Intelligence Strip */}
      <SourceHealthStrip items={items} sources={sources} />

      {/* Institutional Priority Opportunities Directory */}
      <OpportunityTable
        items={displayedItems}
        onSelectItem={selectItem}
        onToggleWatchlist={toggleWatchlist}
        title={
          selectedKpiFilter
            ? `Filtered Opportunities (${selectedKpiFilter.toUpperCase()})`
            : selectedSector !== 'ALL'
            ? `Opportunities in Sector: ${selectedSector}`
            : 'Priority Opportunities & Development Pipeline'
        }
      />
    </div>
  );
}