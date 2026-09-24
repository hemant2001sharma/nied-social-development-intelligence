'use client';

import React, { useState, useMemo } from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { getSectorDistribution } from '@/lib/data';
import { 
  Map, 
  Layers, 
  TrendingUp, 
  MapPin, 
  Compass, 
  Globe2, 
  AlertCircle,
  BarChart3,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function GeographyPage() {
  const { items, selectItem } = useAppIntelligence();
  const [selectedGeo, setSelectedGeo] = useState<string>('ALL');

  // Dynamic sectors
  const sectors = useMemo(() => getSectorDistribution(items), [items]);

  // Aggregate genuine state / geographic mentions from items
  const stateDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const geos = item.geography || ['Pan-India'];
      geos.forEach(g => {
        const clean = g.trim();
        if (clean) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / Math.max(items.length, 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedGeo === 'ALL') return items;
    return items.filter(i => (i.geography || []).includes(selectedGeo));
  }, [items, selectedGeo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
          Spatial & Thematic Distribution
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          Geographic & Sector Intelligence
        </h1>
        <p className="text-xs text-[#607080] mt-1 max-w-3xl">
          Spatial surveillance of developmental opportunities across States, Union Territories, priority aspirational districts, and sector clusters.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          title="Active Sector Nodes"
          value={sectors.length}
          subtitle="Identified thematic disciplines"
          icon={Layers}
          accentColor="teal"
        />
        <KPICard
          title="Priority Trajectories"
          value="Skills & Livelihoods"
          subtitle="Leading national cluster"
          icon={TrendingUp}
          accentColor="navy"
        />
        <KPICard
          title="Spatial Entities"
          value={stateDistribution.length}
          subtitle="States and target zones"
          icon={MapPin}
          accentColor="blue"
        />
        <KPICard
          title="National Concentration"
          value="Pan-India"
          subtitle="Broad mandate coverage"
          icon={Globe2}
          accentColor="green"
        />
      </div>

      {/* Spatial Matrix & Sector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* State Opportunity Ranking */}
        <div className="p-4 bg-white rounded-lg border border-[#D9E1E7] space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAEFF3] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1769AA]" />
              State & Sub-National Spatial Ranking
            </h3>
            {selectedGeo !== 'ALL' && (
              <button
                onClick={() => setSelectedGeo('ALL')}
                className="text-[11px] font-semibold text-[#1769AA] hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {stateDistribution.map(geo => {
              const isSelected = selectedGeo === geo.name;
              return (
                <div
                  key={geo.name}
                  onClick={() => setSelectedGeo(isSelected ? 'ALL' : geo.name)}
                  className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EBF4FC] border-[#1769AA]'
                      : 'bg-[#F8FAFC] border-[#D9E1E7] hover:bg-[#EAEFF3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#17232E]">{geo.name}</span>
                    <span className="text-[10px] text-[#8E9FAA]">({geo.percentage}% share)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1769AA]">{geo.count} Notices</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8E9FAA]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Honest GIS Mapping Notice */}
          <div className="p-3 bg-[#F4F7F9] rounded border border-[#D9E1E7] text-[11px] text-[#607080] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#008C95] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#12304A] block">Sub-National Spatial GIS Boundary Status:</span>
              Detailed GeoJSON GIS tile layer for aspirational district boundaries is pending API key authorization. Displaying verified textual spatial distributions from live records.
            </div>
          </div>
        </div>

        {/* Thematic Sector Nodes */}
        <div className="p-4 bg-white rounded-lg border border-[#D9E1E7] space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAEFF3] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#008C95]" />
              Thematic Sector Nodes & Frequency
            </h3>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {sectors.map(sec => (
              <div key={sec.name} className="p-2.5 rounded bg-[#F8FAFC] border border-[#D9E1E7] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#17232E]">{sec.name}</span>
                  <span className="font-bold text-[#008C95]">{sec.count} Notices ({sec.percentage}%)</span>
                </div>
                <div className="w-full bg-[#EAEFF3] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#008C95] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, sec.percentage * 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Linked Opportunities Table for Spatial Context */}
      <div className="bg-white rounded-lg border border-[#D9E1E7] overflow-hidden">
        <div className="p-4 border-b border-[#D9E1E7] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
            Opportunities in Selected Geography: {selectedGeo} ({filteredItems.length})
          </h3>
        </div>

        <div className="divide-y divide-[#EAEFF3] text-xs">
          {filteredItems.slice(0, 8).map(item => (
            <div
              key={item.id}
              onClick={() => selectItem(item)}
              className="p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="font-semibold text-[#17232E] hover:text-[#1769AA]">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#607080]">
                  <span>{item.organisation || 'Organisation Unstated'}</span>
                  <span>·</span>
                  <span className="text-[#008C95]">{(item.sector || []).join(', ') || 'General'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-[#12304A] bg-[#F4F7F9] px-2 py-0.5 rounded border border-[#D9E1E7]">
                  Fit: {item.opportunity_score ?? '—'}
                </span>
                <span className="text-xs text-[#1769AA] font-semibold hover:underline">
                  Inspect &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
