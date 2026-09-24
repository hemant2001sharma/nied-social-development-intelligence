'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LucideIcon,
  LayoutDashboard, 
  Radio, 
  Briefcase, 
  Landmark, 
  FileText, 
  Gift, 
  Globe2, 
  FolderKanban, 
  Newspaper, 
  Scale, 
  Lightbulb, 
  Building, 
  Layers, 
  Map, 
  Star, 
  Search, 
  FileSpreadsheet, 
  Database, 
  Activity, 
  Settings,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  count?: number;
  indent?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  itemCount?: number;
  highPriorityCount?: number;
}

export function Sidebar({ isOpen, onClose, itemCount = 58, highPriorityCount = 3 }: SidebarProps) {
  const pathname = usePathname();

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Live Feed', href: '/live-feed', icon: Radio, badge: 'Live' }
      ]
    },
    {
      group: 'OPPORTUNITIES',
      items: [
        { label: 'All Opportunities', href: '/?tab=all', icon: Briefcase, count: itemCount },
        { label: 'Government', href: '/government', icon: Landmark },
        { label: 'GeM', href: '/government?platform=GeM', icon: Landmark, indent: true },
        { label: 'CPPP / eProcurement', href: '/government?platform=CPPP', icon: FileText, indent: true },
        { label: 'CSR & Funding', href: '/csr', icon: Gift },
        { label: 'RFPs / EOIs', href: '/?type=RFP', icon: FileText, indent: true },
        { label: 'Grants', href: '/?type=Grant', icon: Gift, indent: true }
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { label: 'Projects', href: '/intelligence?view=projects', icon: FolderKanban },
        { label: 'News', href: '/intelligence?view=news', icon: Newspaper },
        { label: 'Policy & Schemes', href: '/intelligence?view=policy', icon: Scale },
        { label: 'Emerging Models', href: '/intelligence?view=models', icon: Lightbulb },
        { label: 'Organisations', href: '/intelligence?view=orgs', icon: Building },
        { label: 'Sectors', href: '/geography?view=sectors', icon: Layers },
        { label: 'Geography', href: '/geography', icon: Map }
      ]
    },
    {
      group: 'MONITORING',
      items: [
        { label: 'Watchlist', href: '/watchlist', icon: Star, count: highPriorityCount },
        { label: 'Saved Searches', href: '/watchlist?tab=searches', icon: Search },
        { label: 'Reports', href: '/reports', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Sources', href: '/sources', icon: Database, badge: '8 Active' },
        { label: 'Data Health', href: '/sources?tab=health', icon: Activity },
        { label: 'Settings', href: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0D2235]/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#12304A] text-white flex flex-col border-r border-[#0D2235] transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Institutional Brand Header */}
        <div className="p-4 border-b border-[#1A4468] flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[#1769AA] flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm group-hover:bg-[#008C95] transition-colors">
              N
            </div>
            <div>
              <div className="font-bold text-xs tracking-wider uppercase text-white leading-tight">
                NIED SDI HUB
              </div>
              <div className="text-[10px] text-[#8E9FAA] tracking-wide">
                Social Development Intel
              </div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8E9FAA]">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Precise path matching
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]));

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded font-medium transition-colors ${
                        item.indent ? 'pl-6 text-[11px]' : ''
                      } ${
                        isActive
                          ? 'bg-[#1769AA] text-white font-semibold shadow-xs'
                          : 'text-[#D9E1E7] hover:bg-[#1A4468]/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#8E9FAA]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#008C95] text-white">
                          {item.badge}
                        </span>
                      )}

                      {item.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#1A4468] text-[#8E9FAA]'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System & Data Integrity Footer */}
        <div className="p-3 border-t border-[#1A4468] bg-[#0D2235]/60 text-[11px] text-[#8E9FAA] shrink-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
              <span className="text-white/90 font-medium">Supabase Active</span>
            </span>
            <span className="font-mono text-[10px] text-[#82E0AA]">15m Sync</span>
          </div>
          <div className="text-[10px] text-[#8E9FAA] truncate">
            Collector v1.6 · NGOBox + One Purpos
          </div>
        </div>
      </aside>
    </>
  );
}
