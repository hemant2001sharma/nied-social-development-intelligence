'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { OpportunityTable } from '@/components/OpportunityTable';
import { 
  Building, 
  FolderKanban, 
  Newspaper, 
  Scale, 
  Lightbulb, 
  Layers, 
  Search, 
  Award,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

function IntelligenceContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'projects';
  const [currentView, setCurrentView] = useState<string>(initialView);
  const [search, setSearch] = useState('');
  const { items, selectItem, toggleWatchlist } = useAppIntelligence();

  // Organizations aggregation
  const orgMap = useMemo(() => {
    const map: Record<string, { count: number; sectors: Set<string>; items: typeof items }> = {};
    items.forEach(item => {
      const org = item.organisation || 'Unstated Entity';
      if (!map[org]) {
        map[org] = { count: 0, sectors: new Set(), items: [] };
      }
      map[org].count++;
      map[org].items.push(item);
      (item.sector || []).forEach(s => map[org].sectors.add(s));
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        sectors: Array.from(data.sectors),
        items: data.items
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Consultancies & Projects
  const projectItems = useMemo(() => {
    return items.filter(i => {
      const type = (i.opportunity_type || '').toLowerCase();
      return type.includes('consultancy') || type.includes('tor') || type.includes('project') || type.includes('eoi');
    });
  }, [items]);

  // Policy & Schemes
  const policyItems = useMemo(() => {
    return items.filter(i => {
      const title = (i.title || '').toLowerCase();
      const org = (i.organisation || '').toLowerCase();
      return title.includes('scheme') || title.includes('policy') || title.includes('mission') || org.includes('ministry');
    });
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
          Thematic Intelligence Dossiers
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          Cross-Sector Intelligence Observatory
        </h1>
        <p className="text-xs text-[#607080] mt-1 max-w-3xl">
          Deep-dive analysis across active institutional entities, policy schemes, emerging execution models, and technical consultancy notices.
        </p>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[#D9E1E7] space-x-6 text-xs font-semibold">
        <button
          onClick={() => setCurrentView('projects')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            currentView === 'projects'
              ? 'border-b-2 border-[#1769AA] text-[#1769AA]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Projects & ToRs ({projectItems.length})</span>
        </button>

        <button
          onClick={() => setCurrentView('orgs')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            currentView === 'orgs'
              ? 'border-b-2 border-[#1769AA] text-[#1769AA]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Tracked Organisations ({orgMap.length})</span>
        </button>

        <button
          onClick={() => setCurrentView('policy')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            currentView === 'policy'
              ? 'border-b-2 border-[#1769AA] text-[#1769AA]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Policy & Schemes ({policyItems.length})</span>
        </button>

        <button
          onClick={() => setCurrentView('models')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            currentView === 'models'
              ? 'border-b-2 border-[#1769AA] text-[#1769AA]'
              : 'text-[#607080] hover:text-[#17232E]'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Emerging Models</span>
        </button>
      </div>

      {/* Projects View */}
      {currentView === 'projects' && (
        <OpportunityTable
          items={projectItems}
          onSelectItem={selectItem}
          onToggleWatchlist={toggleWatchlist}
          title="Consultancies, ToRs & Programmatic Projects"
        />
      )}

      {/* Policy View */}
      {currentView === 'policy' && (
        <OpportunityTable
          items={policyItems}
          onSelectItem={selectItem}
          onToggleWatchlist={toggleWatchlist}
          title="Policy Interventions, Missions & Government Schemes"
        />
      )}

      {/* Organisations View */}
      {currentView === 'orgs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#607080]">
              Showing <span className="font-bold text-[#12304A]">{orgMap.length}</span> verified issuing entities tracked across active feeds.
            </span>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2 text-[#8E9FAA]" />
              <input
                type="text"
                placeholder="Search organisations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D9E1E7] rounded text-xs text-[#17232E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgMap
              .filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()))
              .map((org, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-[#D9E1E7] flex flex-col justify-between hover:border-[#1769AA] transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-[#12304A] leading-snug">{org.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF4FC] text-[#1769AA] shrink-0">
                        {org.count} {org.count === 1 ? 'Notice' : 'Notices'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {org.sectors.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 bg-[#F4F7F9] text-[#607080] rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#EAEFF3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8E9FAA]">Verified Publisher</span>
                    <button
                      onClick={() => selectItem(org.items[0])}
                      className="text-[#1769AA] font-semibold text-xs hover:underline flex items-center gap-1"
                    >
                      Inspect Latest &rarr;
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Emerging Models View */}
      {currentView === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#D98C19]" />
              <h3 className="font-bold text-sm text-[#12304A]">Micro-Enterprise Incubation Model</h3>
            </div>
            <p className="text-xs text-[#607080] leading-relaxed">
              Cluster-based women self-help group federations transitioned to producer organizations through market-linked digital onboarding and financial literacy enablement.
            </p>
            <div className="text-[11px] text-[#2E7D5B] font-semibold bg-[#EDF7F2] p-2 rounded border border-[#B9E0CD]">
              Sector Alignment: Women & Entrepreneurship · Livelihoods
            </div>
          </div>

          <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#008C95]" />
              <h3 className="font-bold text-sm text-[#12304A]">Climate Responsive Livelihood Framework</h3>
            </div>
            <p className="text-xs text-[#607080] leading-relaxed">
              Decentralized renewable energy (DRE) application integration with agrarian post-harvest processing units to reduce carbon intensity and increase farmer net margins.
            </p>
            <div className="text-[11px] text-[#008C95] font-semibold bg-[#E6F6F7] p-2 rounded border border-[#B3E8EB]">
              Sector Alignment: Climate · Renewable Energy · Rural Development
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#607080]">Loading Intelligence Observatory...</div>}>
      <IntelligenceContent />
    </Suspense>
  );
}
