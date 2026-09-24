'use client';

import React from 'react';
import { SectorCount } from '@/types/intelligence';
import { Compass, Filter, Check } from 'lucide-react';

interface SectorPulseProps {
  sectors: SectorCount[];
  activeSector: string;
  onSelectSector: (sector: string) => void;
}

export function SectorPulse({ sectors, activeSector, onSelectSector }: SectorPulseProps) {
  // Show top sectors
  const displayed = sectors.slice(0, 10);

  return (
    <div className="p-4 bg-white rounded-lg border border-[#D9E1E7]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#008C95]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
            Sector Pulse & Thematic Distribution
          </h3>
        </div>
        {activeSector !== 'ALL' && (
          <button
            onClick={() => onSelectSector('ALL')}
            className="text-[11px] font-semibold text-[#1769AA] hover:underline flex items-center gap-1"
          >
            Clear Filter ({activeSector})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onSelectSector('ALL')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
            activeSector === 'ALL'
              ? 'bg-[#12304A] text-white shadow-xs'
              : 'bg-[#F4F7F9] text-[#607080] hover:bg-[#EAEFF3] hover:text-[#17232E]'
          }`}
        >
          All Sectors
        </button>

        {displayed.map((sector) => {
          const isSelected = activeSector.toLowerCase() === sector.name.toLowerCase();
          return (
            <button
              key={sector.name}
              onClick={() => onSelectSector(isSelected ? 'ALL' : sector.name)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-[#008C95] text-white shadow-xs'
                  : 'bg-[#F4F7F9] text-[#17232E] hover:bg-[#E6F6F7] hover:text-[#008C95]'
              }`}
            >
              <span>{sector.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#D9E1E7] text-[#607080]'
              }`}>
                {sector.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
