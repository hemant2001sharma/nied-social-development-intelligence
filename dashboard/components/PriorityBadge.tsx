'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string | null;
  score?: number | null;
  showScore?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, score, showScore = false, className = '' }: PriorityBadgeProps) {
  const norm = (priority || 'LOW').toUpperCase();

  if (norm === 'HIGH') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#FDF2F2] text-[#C94C4C] border border-[#F8C8C8] ${className}`}>
        <AlertCircle className="w-3 h-3 text-[#C94C4C]" />
        High Priority
        {showScore && score !== null && score !== undefined && (
          <span className="ml-0.5 opacity-80 font-normal">({score})</span>
        )}
      </span>
    );
  }

  if (norm === 'MEDIUM') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#FEF7EC] text-[#D98C19] border border-[#F8E1BA] ${className}`}>
        <AlertTriangle className="w-3 h-3 text-[#D98C19]" />
        Medium Priority
        {showScore && score !== null && score !== undefined && (
          <span className="ml-0.5 opacity-80 font-normal">({score})</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase bg-[#F4F7F9] text-[#607080] border border-[#D9E1E7] ${className}`}>
      <Info className="w-3 h-3 text-[#607080]" />
      Standard
      {showScore && score !== null && score !== undefined && (
        <span className="ml-0.5 opacity-80">({score})</span>
      )}
    </span>
  );
}
