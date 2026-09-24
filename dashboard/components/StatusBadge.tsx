'use client';

import React from 'react';
import { ShieldCheck, Clock, ExternalLink } from 'lucide-react';

interface StatusBadgeProps {
  type?: 'source' | 'verified' | 'opportunity_type' | 'status';
  label: string;
  className?: string;
}

export function StatusBadge({ type = 'status', label, className = '' }: StatusBadgeProps) {
  if (type === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-[#EDF7F2] text-[#2E7D5B] border border-[#B9E0CD] ${className}`}>
        <ShieldCheck className="w-3 h-3 text-[#2E7D5B]" />
        Verified Notice
      </span>
    );
  }

  if (type === 'source') {
    const isGovt = label.includes('CPPP') || label.includes('GeM') || label.includes('eProc');
    const isPurpos = label.includes('One Purpos');
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${
        isGovt 
          ? 'bg-[#EBF4FC] text-[#1769AA] border border-[#BDDCF6]'
          : isPurpos
          ? 'bg-[#F2EDFD] text-[#6332C7] border border-[#DDD0FA]'
          : 'bg-[#F4F7F9] text-[#12304A] border border-[#D9E1E7]'
      } ${className}`}>
        {label}
      </span>
    );
  }

  if (type === 'opportunity_type') {
    const isTender = label.toLowerCase().includes('tender') || label.toLowerCase().includes('eoi');
    const isRFP = label.toLowerCase().includes('rfp');
    const isGrant = label.toLowerCase().includes('grant');
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
        isTender
          ? 'bg-[#EBF4FC] text-[#1769AA] border border-[#C5DFF7]'
          : isGrant
          ? 'bg-[#E6F6F7] text-[#008C95] border border-[#B3E8EB]'
          : isRFP
          ? 'bg-[#FEF7EC] text-[#D98C19] border border-[#F9E2BC]'
          : 'bg-[#F4F7F9] text-[#607080] border border-[#D9E1E7]'
      } ${className}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F4F7F9] text-[#607080] border border-[#D9E1E7] ${className}`}>
      {label}
    </span>
  );
}
