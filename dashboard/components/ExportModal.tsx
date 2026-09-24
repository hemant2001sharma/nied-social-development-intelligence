'use client';

import React, { useState } from 'react';
import { OpportunityItem } from '@/types/intelligence';
import { X, Download, FileSpreadsheet, FileJson, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  items: OpportunityItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ items, isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'json') {
      const exportData = {
        title: 'NIED Social Development Intelligence Hub — Intelligence Brief',
        generated_at: new Date().toISOString(),
        total_records: items.length,
        items: items.map(i => ({
          title: i.title,
          organisation: i.organisation,
          sector: i.sector,
          geography: i.geography,
          opportunity_type: i.opportunity_type,
          deadline: i.deadline,
          source_name: i.source_name,
          source_url: i.source_url,
          priority: i.priority,
          opportunity_score: i.opportunity_score,
          strategic_score: i.strategic_score,
          urgency_score: i.urgency_score,
          relevance_reason: i.relevance_reason,
          capability_match: i.capability_match,
          recommended_action: i.recommended_action
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NIED_Intelligence_Brief_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV Format
      const headers = ['Priority', 'Title', 'Organisation', 'Type', 'Sectors', 'Geography', 'Deadline', 'Fit Score', 'Source', 'URL'];
      const rows = items.map(i => [
        `"${(i.priority || 'LOW').replace(/"/g, '""')}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        `"${(i.organisation || '').replace(/"/g, '""')}"`,
        `"${(i.opportunity_type || '').replace(/"/g, '""')}"`,
        `"${(i.sector || []).join('; ').replace(/"/g, '""')}"`,
        `"${(i.geography || []).join('; ').replace(/"/g, '""')}"`,
        `"${(i.deadline || 'Unstated').replace(/"/g, '""')}"`,
        i.opportunity_score || 0,
        `"${(i.source_name || '').replace(/"/g, '""')}"`,
        `"${(i.source_url || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NIED_Intelligence_Brief_${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D2235]/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-[#D9E1E7] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[#12304A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#89DFE5]" />
            <h3 className="text-sm font-bold tracking-wide">Export Intelligence Brief</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-[#607080]">
            Export <span className="font-semibold text-[#17232E]">{items.length} opportunities</span> currently displayed, including strategic fit scores, deadlines, and issuing entities.
          </p>

          <div className="space-y-2">
            <label className="font-semibold text-[#17232E] block">Choose Export Format:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded border flex flex-col items-center gap-2 text-center transition-all ${
                  format === 'csv'
                    ? 'border-[#1769AA] bg-[#EBF4FC] text-[#1769AA] font-bold'
                    : 'border-[#D9E1E7] bg-[#F8FAFC] text-[#607080] hover:bg-[#EAEFF3]'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span>Spreadsheet (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded border flex flex-col items-center gap-2 text-center transition-all ${
                  format === 'json'
                    ? 'border-[#1769AA] bg-[#EBF4FC] text-[#1769AA] font-bold'
                    : 'border-[#D9E1E7] bg-[#F8FAFC] text-[#607080] hover:bg-[#EAEFF3]'
                }`}
              >
                <FileJson className="w-6 h-6" />
                <span>Structured (JSON)</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#F4F7F9] rounded border border-[#D9E1E7] text-[11px] text-[#607080]">
            Generated from verified Supabase records. Suitable for executive briefing and procurement committee review.
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] border-t border-[#D9E1E7] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-[#D9E1E7] text-[#607080] hover:bg-[#EAEFF3] font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloaded}
            className="px-4 py-1.5 rounded bg-[#1769AA] hover:bg-[#125387] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Brief
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
