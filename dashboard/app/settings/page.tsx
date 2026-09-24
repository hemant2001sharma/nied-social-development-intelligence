'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Radio
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#D9E1E7] pb-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA]">
          System & Integration Parameters
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12304A] mt-0.5">
          Platform Configuration & Intelligence Settings
        </h1>
        <p className="text-xs text-[#607080] mt-1">
          Operational thresholds, automated collector cycle definitions, and live data layer endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Connection */}
        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAEFF3] pb-2">
            <Database className="w-4 h-4 text-[#1769AA]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
              Persistence Layer (Supabase PostgREST)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#607080] font-semibold block mb-1">Database Cluster Host</label>
              <input
                type="text"
                readOnly
                value="https://wzfbbosshfeyjypjahjf.supabase.co"
                className="w-full p-2 bg-[#F4F7F9] border border-[#D9E1E7] rounded font-mono text-[11px] text-[#17232E]"
              />
            </div>
            <div>
              <label className="text-[#607080] font-semibold block mb-1">Access Authorization Level</label>
              <input
                type="text"
                readOnly
                value="Client Publishable Key (Anon Role / Read-only Enforced)"
                className="w-full p-2 bg-[#F4F7F9] border border-[#D9E1E7] rounded text-xs text-[#2E7D5B] font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Collector Schedule */}
        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAEFF3] pb-2">
            <Clock className="w-4 h-4 text-[#008C95]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
              Automation & Ingestion Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#607080] font-semibold block mb-1">GitHub Actions Cron Interval</label>
              <div className="p-2 bg-[#F8FAFC] border border-[#D9E1E7] rounded font-mono text-xs text-[#12304A] font-bold">
                */15 * * * * (Every 15 minutes)
              </div>
            </div>
            <div>
              <label className="text-[#607080] font-semibold block mb-1">Deduplication Integrity Hash</label>
              <div className="p-2 bg-[#F8FAFC] border border-[#D9E1E7] rounded font-mono text-xs text-[#1769AA]">
                SHA-256 (Normalized Title + Organisation)
              </div>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="p-5 bg-white rounded-lg border border-[#D9E1E7] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAEFF3] pb-2">
            <Sliders className="w-4 h-4 text-[#D98C19]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#12304A]">
              Console Display & Density Preferences
            </h2>
          </div>

          <div className="space-y-3 text-xs text-[#17232E]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
              <span>Enable automatic 15-minute dashboard re-sync</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
              <span>Flag upcoming closing deadlines (&lt; 7 days) in bold amber/red</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#1769AA]" />
              <span>Display NIED strategic fit score gauges in dossiers</span>
            </label>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-[#EDF7F2] border border-[#B9E0CD] text-[#2E7D5B] text-xs font-semibold rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully for this session.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-[#1769AA] hover:bg-[#125387] text-white font-semibold text-xs rounded shadow-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
