'use client';

import React, { useState } from 'react';
import { VelocityPoint } from '@/types/intelligence';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface VelocityChartProps {
  data: VelocityPoint[];
  currentRange: '7D' | '30D' | '90D' | '1Y';
  onRangeChange: (range: '7D' | '30D' | '90D' | '1Y') => void;
}

export function VelocityChart({ data, currentRange, onRangeChange }: VelocityChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<VelocityPoint | null>(null);

  const maxValue = Math.max(...data.map(d => Math.max(d.government + d.csr + d.development, d.total, 4)), 8);
  const chartHeight = 140;

  return (
    <div className="p-4 bg-white rounded-lg border border-[#D9E1E7]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1769AA]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
              Opportunity Activity Velocity
            </h3>
          </div>
          <p className="text-[11px] text-[#607080] mt-0.5">
            Ingestion rate and thematic distribution across procurement & philanthropy streams
          </p>
        </div>

        {/* Time Range Filters */}
        <div className="flex items-center gap-1 bg-[#F4F7F9] p-1 rounded border border-[#D9E1E7]">
          {(['7D', '30D', '90D', '1Y'] as const).map(range => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                currentRange === range
                  ? 'bg-[#12304A] text-white shadow-xs'
                  : 'text-[#607080] hover:text-[#17232E]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[11px] text-[#607080]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#1769AA]" />
          <span>Government / Tenders</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#008C95]" />
          <span>CSR & Philanthropy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#8E9FAA]" />
          <span>Development Sector</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative">
        <div className="h-[140px] flex items-end gap-1.5 pt-4">
          {data.map((point, idx) => {
            const govtHeight = (point.government / maxValue) * chartHeight;
            const csrHeight = (point.csr / maxValue) * chartHeight;
            const devHeight = (point.development / maxValue) * chartHeight;
            const totalHeight = Math.max(govtHeight + csrHeight + devHeight, 4);

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Stacked bar */}
                <div 
                  className="w-full max-w-[28px] rounded-t flex flex-col-reverse overflow-hidden transition-all duration-150 group-hover:brightness-110"
                  style={{ height: `${totalHeight}px` }}
                >
                  <div style={{ height: `${govtHeight}px` }} className="bg-[#1769AA] w-full" />
                  <div style={{ height: `${csrHeight}px` }} className="bg-[#008C95] w-full" />
                  <div style={{ height: `${devHeight}px` }} className="bg-[#8E9FAA] w-full" />
                </div>

                {/* X-axis label */}
                <span className="mt-2 text-[10px] text-[#8E9FAA] truncate max-w-full text-center">
                  {point.dateLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-0 right-0 bg-[#12304A] text-white p-2.5 rounded shadow-lg text-[11px] pointer-events-none z-20 space-y-1">
            <div className="font-semibold border-b border-white/20 pb-1">{hoveredPoint.dateLabel}</div>
            <div className="flex justify-between gap-4">
              <span className="text-[#96C7F2]">Government:</span>
              <span className="font-bold">{hoveredPoint.government}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#89DFE5]">CSR & Grants:</span>
              <span className="font-bold">{hoveredPoint.csr}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/70">Development:</span>
              <span className="font-bold">{hoveredPoint.development}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/20 pt-1 font-bold">
              <span>Total Batch:</span>
              <span>{hoveredPoint.total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
