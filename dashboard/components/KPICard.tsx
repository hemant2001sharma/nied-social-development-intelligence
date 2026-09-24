'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  accentColor?: 'navy' | 'blue' | 'teal' | 'amber' | 'red' | 'green';
  onClick?: () => void;
  isSelected?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  accentColor = 'navy',
  onClick,
  isSelected = false
}: KPICardProps) {
  const colorMap = {
    navy: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#12304A] ring-1 ring-[#12304A]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#12304A]/10 text-[#12304A]',
      valColor: 'text-[#12304A]'
    },
    blue: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#1769AA] ring-1 ring-[#1769AA]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#1769AA]/10 text-[#1769AA]',
      valColor: 'text-[#1769AA]'
    },
    teal: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#008C95] ring-1 ring-[#008C95]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#008C95]/10 text-[#008C95]',
      valColor: 'text-[#008C95]'
    },
    amber: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#D98C19] ring-1 ring-[#D98C19]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#D98C19]/10 text-[#D98C19]',
      valColor: 'text-[#D98C19]'
    },
    red: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#C94C4C] ring-1 ring-[#C94C4C]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#C94C4C]/10 text-[#C94C4C]',
      valColor: 'text-[#C94C4C]'
    },
    green: {
      bg: 'bg-white',
      border: isSelected ? 'border-[#2E7D5B] ring-1 ring-[#2E7D5B]' : 'border-[#D9E1E7]',
      iconBg: 'bg-[#2E7D5B]/10 text-[#2E7D5B]',
      valColor: 'text-[#2E7D5B]'
    }
  };

  const style = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-150 ${style.bg} ${style.border} ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-wider text-[#607080] uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-md ${style.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight ${style.valColor}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-[11px] font-semibold ${
            trendDirection === 'up' ? 'text-[#2E7D5B]' : trendDirection === 'down' ? 'text-[#C94C4C]' : 'text-[#607080]'
          }`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] text-[#8E9FAA] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
