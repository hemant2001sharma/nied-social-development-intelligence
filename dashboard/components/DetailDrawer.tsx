'use client';

import React from 'react';
import { OpportunityItem } from '@/types/intelligence';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatDeadline } from '@/lib/data';
import { 
  X, 
  ExternalLink, 
  Star, 
  Building2, 
  Calendar, 
  MapPin, 
  Layers, 
  Award, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Share2, 
  Copy,
  ShieldCheck
} from 'lucide-react';

interface DetailDrawerProps {
  item: OpportunityItem | null;
  onClose: () => void;
  onToggleWatchlist?: (id: string, currentState: boolean) => void;
}

export function DetailDrawer({ item, onClose, onToggleWatchlist }: DetailDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!item) return null;

  const deadlineInfo = formatDeadline(item.deadline);

  const handleCopyLink = () => {
    if (item.source_url) {
      navigator.clipboard.writeText(item.source_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0D2235]/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl z-10 flex flex-col h-full border-l border-[#D9E1E7] animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-[#12304A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-white/10 text-white/90">
              Opportunity Intelligence Dossier
            </span>
            {item.is_verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#82E0AA] bg-white/10 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist && onToggleWatchlist(item.id, !!item.is_watchlisted)}
              className={`p-1.5 rounded transition-colors ${
                item.is_watchlisted 
                  ? 'bg-[#D98C19] text-white hover:bg-[#B77413]' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
              title={item.is_watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badges Bar */}
        <div className="px-6 py-2.5 bg-[#F4F7F9] border-b border-[#D9E1E7] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={item.priority} score={item.opportunity_score} showScore />
            <StatusBadge type="opportunity_type" label={item.opportunity_type || 'Notice'} />
            <StatusBadge type="source" label={item.source_name || 'Direct / Feed'} />
          </div>
          <div className="flex items-center gap-1 text-[12px] text-[#607080]">
            <Clock className="w-3.5 h-3.5" />
            <span>Deadline:</span>
            <span className={`font-semibold ${deadlineInfo.urgent ? 'text-[#C94C4C]' : 'text-[#17232E]'}`}>
              {deadlineInfo.text}
            </span>
          </div>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title & Organization */}
          <div>
            <h2 className="text-lg font-bold text-[#17232E] leading-snug">
              {item.title}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#607080]">
              <Building2 className="w-4 h-4 text-[#1769AA]" />
              <span className="font-semibold text-[#12304A]">
                {item.organisation || 'Organisation Unstated'}
              </span>
            </div>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] rounded-lg border border-[#D9E1E7]">
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-[#008C95] mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#607080] block">Sector(s)</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(item.sector && item.sector.length > 0) ? (
                    item.sector.map((s, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 text-[11px] font-medium bg-[#E6F6F7] text-[#008C95] rounded">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8E9FAA]">Unspecified Sector</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#C94C4C] mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#607080] block">Target Geography</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(item.geography && item.geography.length > 0) ? (
                    item.geography.map((g, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 text-[11px] font-medium bg-[#F1F4F7] text-[#12304A] rounded">
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8E9FAA]">National / Pan-India</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Analytics Card */}
          <div className="p-4 bg-white rounded-lg border border-[#D9E1E7] shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#12304A] flex items-center gap-1.5 border-b border-[#EAEFF3] pb-2">
              <Target className="w-4 h-4 text-[#1769AA]" />
              Strategic Intelligence Scoring Metrics
            </h3>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded bg-[#F4F7F9] border border-[#EAEFF3] text-center">
                <span className="text-[11px] font-medium text-[#607080] block">Strategic Score</span>
                <span className="text-lg font-bold text-[#1769AA]">
                  {item.strategic_score ?? '—'}
                  <span className="text-xs font-normal text-[#8E9FAA]">/100</span>
                </span>
                <div className="w-full bg-[#D9E1E7] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-[#1769AA] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.strategic_score || 0))}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#F4F7F9] border border-[#EAEFF3] text-center">
                <span className="text-[11px] font-medium text-[#607080] block">Opportunity Score</span>
                <span className="text-lg font-bold text-[#2E7D5B]">
                  {item.opportunity_score ?? '—'}
                  <span className="text-xs font-normal text-[#8E9FAA]">/100</span>
                </span>
                <div className="w-full bg-[#D9E1E7] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-[#2E7D5B] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.opportunity_score || 0))}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#F4F7F9] border border-[#EAEFF3] text-center">
                <span className="text-[11px] font-medium text-[#607080] block">Urgency Score</span>
                <span className="text-lg font-bold text-[#D98C19]">
                  {item.urgency_score ?? '—'}
                  <span className="text-xs font-normal text-[#8E9FAA]">/100</span>
                </span>
                <div className="w-full bg-[#D9E1E7] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-[#D98C19] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.urgency_score || 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* NIED Relevance & Action Matrix */}
          <div className="p-4 bg-[#EDF7F2]/60 rounded-lg border border-[#B9E0CD] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#2E7D5B]" />
              NIED Strategic Alignment & Capability Assessment
            </h3>

            {/* Relevance Reason */}
            <div className="text-xs">
              <span className="font-semibold text-[#17232E] block mb-0.5">Strategic Alignment:</span>
              <p className="text-[#36495A] leading-relaxed">
                {item.relevance_reason || 'Preliminary assessment based on thematic sector indicators.'}
              </p>
            </div>

            {/* Capability Match */}
            <div className="text-xs flex items-start gap-2 pt-1 border-t border-[#B9E0CD]/60">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D5B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#17232E] block">Capability Match:</span>
                <p className="text-[#36495A]">{item.capability_match || 'Aligned with NIED core developmental focus areas.'}</p>
              </div>
            </div>

            {/* Capability Gap */}
            {item.capability_gap && (
              <div className="text-xs flex items-start gap-2 pt-1 border-t border-[#B9E0CD]/60">
                <AlertOctagon className="w-4 h-4 text-[#D98C19] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#17232E] block">Considerations / Gaps:</span>
                  <p className="text-[#36495A]">{item.capability_gap}</p>
                </div>
              </div>
            )}

            {/* Recommended Action */}
            <div className="text-xs flex items-start gap-2 pt-2 border-t border-[#B9E0CD] font-medium text-[#12304A] bg-white/70 p-2 rounded">
              <Zap className="w-4 h-4 text-[#1769AA] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1769AA] uppercase tracking-wider text-[11px] block">Recommended Next Step:</span>
                <p className="text-[#17232E]">{item.recommended_action || 'Review opportunity requirements and evaluate consortia eligibility.'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#607080]">
              Notice Description & Scope of Work
            </h3>
            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#D9E1E7] text-xs leading-relaxed text-[#17232E] whitespace-pre-line max-h-60 overflow-y-auto">
              {item.description || 'No detailed scope of work published with this notice. Please consult the original platform notice.'}
            </div>
          </div>

          {/* Audit Provenance */}
          <div className="p-3 bg-[#F4F7F9] rounded border border-[#D9E1E7] text-[11px] text-[#607080] space-y-1">
            <div className="flex justify-between">
              <span>Source Feed:</span>
              <span className="font-medium text-[#17232E]">{item.source_name || 'Direct'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ingested At:</span>
              <span className="font-medium text-[#17232E]">
                {item.fetched_at ? new Date(item.fetched_at).toLocaleString('en-IN') : 'Synchronized'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database Record ID:</span>
              <span className="font-mono text-[#8E9FAA] text-[10px]">{item.id}</span>
            </div>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-white border-t border-[#D9E1E7] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 text-xs font-medium text-[#607080] bg-[#F4F7F9] hover:bg-[#EAEFF3] border border-[#D9E1E7] rounded flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={() => onToggleWatchlist && onToggleWatchlist(item.id, !!item.is_watchlisted)}
              className={`px-3 py-2 text-xs font-medium border rounded flex items-center gap-1.5 transition-colors ${
                item.is_watchlisted
                  ? 'bg-[#FEF7EC] text-[#D98C19] border-[#F8E1BA] hover:bg-[#FDF0DB]'
                  : 'bg-[#F4F7F9] text-[#607080] border-[#D9E1E7] hover:bg-[#EAEFF3]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              {item.is_watchlisted ? 'Watchlisted' : 'Watchlist'}
            </button>
          </div>

          {item.source_url ? (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1769AA] hover:bg-[#125387] rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Access Original Source Notice</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-[#8E9FAA] italic">
              Original link not provided
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
