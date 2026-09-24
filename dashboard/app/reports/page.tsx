'use client';

import React from 'react';
import { useAppIntelligence } from '@/components/AppShell';
import { KPICard } from '@/components/KPICard';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Award,
  Layers
} from 'lucide-react';

export default function ReportsPage() {
  const { items, openExportModal } = useAppIntelligence();

  const closingSoonCount = items.filter(i => {
    if (!i.deadline) return false;
    const d = new Date(i.deadline);
    const now = new Date();
    const in7 = new Date();
    in7.setDate(now.getDate() + 7);
    return d >= now && d <= in7;
  }).length;

  const highFitCount = items.filter(i => (i.opportunity_score || 0) >= 60 || i.priority === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
              Institutional Briefings & Analytics
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
              Intelligence Reports & Executive Briefs
            </h1>
            <p className="text-xs text-[#607080] mt-1 max-w-3xl">
              Generate structured analytical dossiers, RFP priority digests, and executive briefing spreadsheets for NIED governance and project management units.
            </p>
          </div>

          <button
            onClick={openExportModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1769AA] hover:bg-[#125387] text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Generate Full Dataset Brief</span>
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2 rounded bg-[#EBF4FC] text-[#1769AA] w-fit mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#12304A]">Weekly Executive Briefing</h3>
            <p className="text-xs text-[#607080] mt-1 leading-relaxed">
              Consolidated spreadsheet with all indexed tenders, ToRs, and CSR RFPs with strategic fit scoring, deadlines, and direct source links.
            </p>
          </div>
          <button
            onClick={openExportModal}
            className="w-full py-2 bg-[#F4F7F9] hover:bg-[#EAEFF3] text-[#1769AA] font-semibold text-xs rounded border border-[#D9E1E7] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV / JSON</span>
          </button>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2 rounded bg-[#FDF2F2] text-[#C94C4C] w-fit mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#12304A]">Urgent Deadlines Digest</h3>
            <p className="text-xs text-[#607080] mt-1 leading-relaxed">
              Targeted list of {closingSoonCount} opportunities expiring within the next 7 days requiring immediate bid / no-bid qualification.
            </p>
          </div>
          <button
            onClick={openExportModal}
            className="w-full py-2 bg-[#F4F7F9] hover:bg-[#EAEFF3] text-[#C94C4C] font-semibold text-xs rounded border border-[#D9E1E7] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Urgent List</span>
          </button>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2 rounded bg-[#EDF7F2] text-[#2E7D5B] w-fit mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#12304A]">High Strategic Alignment Digest</h3>
            <p className="text-xs text-[#607080] mt-1 leading-relaxed">
              Curated dossier of {highFitCount} opportunities with opportunity & strategic scores above 60, filtered for core NIED thematic capabilities.
            </p>
          </div>
          <button
            onClick={openExportModal}
            className="w-full py-2 bg-[#F4F7F9] hover:bg-[#EAEFF3] text-[#2E7D5B] font-semibold text-xs rounded border border-[#D9E1E7] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export High Fit Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
