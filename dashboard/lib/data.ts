import { supabase } from '@/lib/supabase/client';
import { OpportunityItem, SourceRecord, WatchlistRecord, DashboardKPIs, VelocityPoint, SectorCount } from '@/types/intelligence';

export async function fetchOpportunities(): Promise<{ data: OpportunityItem[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error.message);
      return { data: [], error: error.message };
    }

    return { data: (data as OpportunityItem[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

export async function fetchSources(): Promise<{ data: SourceRecord[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as SourceRecord[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

export async function fetchWatchlist(): Promise<{ data: WatchlistRecord[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('watch_value', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as WatchlistRecord[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

export async function updateWatchlistStatus(id: string, isWatchlisted: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('items')
      .update({ is_watchlisted: isWatchlisted, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update prevented (likely RLS policy for anonymous key); maintaining client session state:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function calculateKPIs(items: OpportunityItem[]): DashboardKPIs {
  const activeIntelligence = items.length;
  
  // Government opportunities: item_type or source or sector indicating government / tender / CPPP / GeM
  const governmentOpportunities = items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const org = (item.organisation || '').toLowerCase();
    const type = (item.opportunity_type || '').toLowerCase();
    const sName = (item.source_name || '').toLowerCase();
    return (
      type.includes('tender') ||
      type.includes('tor') ||
      type.includes('eoi') ||
      sName.includes('cppp') ||
      sName.includes('gem') ||
      sName.includes('procure') ||
      org.includes('ministry') ||
      org.includes('department') ||
      org.includes('government') ||
      org.includes('authority') ||
      org.includes('corporation') ||
      title.includes('tender') ||
      title.includes('procurement')
    );
  }).length;

  // CSR & Funding opportunities
  const csrFunding = items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const org = (item.organisation || '').toLowerCase();
    const type = (item.opportunity_type || '').toLowerCase();
    const sectors = (item.sector || []).map(s => s.toLowerCase());
    return (
      type.includes('grant') ||
      type.includes('rfp') ||
      sectors.includes('csr') ||
      title.includes('csr') ||
      title.includes('grant') ||
      title.includes('foundation') ||
      org.includes('foundation') ||
      org.includes('trust') ||
      org.includes('ltd') ||
      org.includes('csr')
    );
  }).length;

  // Closing Soon: Deadline within the next 7 days from current time
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const closingSoon = items.filter(item => {
    if (!item.deadline) return false;
    const d = new Date(item.deadline);
    return !isNaN(d.getTime()) && d >= now && d <= sevenDaysFromNow;
  }).length;

  // High Priority: explicitly marked HIGH or opportunity_score >= 80
  const highPriority = items.filter(item => {
    return item.priority === 'HIGH' || (item.opportunity_score !== null && item.opportunity_score >= 75);
  }).length;

  return {
    activeIntelligence,
    governmentOpportunities,
    csrFunding,
    closingSoon,
    highPriority
  };
}

export function getSectorDistribution(items: OpportunityItem[]): SectorCount[] {
  const map: Record<string, number> = {};
  let totalSectorTags = 0;

  items.forEach(item => {
    const sectors = item.sector || ['Cross-Sector / General'];
    sectors.forEach(s => {
      const trimmed = s.trim();
      if (trimmed) {
        map[trimmed] = (map[trimmed] || 0) + 1;
        totalSectorTags++;
      }
    });
  });

  const list = Object.entries(map).map(([name, count]) => ({
    name,
    count,
    percentage: totalSectorTags > 0 ? Math.round((count / totalSectorTags) * 100) : 0
  }));

  // Sort descending by count
  return list.sort((a, b) => b.count - a.count);
}

export function getVelocityData(items: OpportunityItem[], range: '7D' | '30D' | '90D' | '1Y'): VelocityPoint[] {
  const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : 365;
  const stepDays = days <= 7 ? 1 : days <= 30 ? 3 : days <= 90 ? 10 : 30;
  const numSteps = Math.ceil(days / stepDays);
  
  const now = new Date();
  const points: VelocityPoint[] = [];

  for (let i = numSteps - 1; i >= 0; i--) {
    const stepEndDate = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
    const stepStartDate = new Date(stepEndDate.getTime() - stepDays * 24 * 60 * 60 * 1000);
    
    const label = days <= 7 
      ? stepEndDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
      : stepEndDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    let govt = 0;
    let csr = 0;
    let dev = 0;

    items.forEach(item => {
      const itemDate = new Date(item.published_at || item.created_at);
      if (itemDate >= stepStartDate && itemDate <= stepEndDate) {
        const type = (item.opportunity_type || '').toLowerCase();
        const sName = (item.source_name || '').toLowerCase();
        if (type.includes('tender') || sName.includes('cppp') || sName.includes('gem')) {
          govt++;
        } else if (type.includes('grant') || (item.title || '').toLowerCase().includes('csr')) {
          csr++;
        } else {
          dev++;
        }
      }
    });

    // Provide baseline activity distribution if dataset is clustered on a single date
    const total = govt + csr + dev;
    points.push({
      dateLabel: label,
      government: govt,
      csr: csr,
      development: dev,
      total: total
    });
  }

  return points;
}

export function formatDeadline(deadlineStr: string | null): { text: string; urgent: boolean; expired: boolean } {
  if (!deadlineStr) {
    return { text: 'Date unstated', urgent: false, expired: false };
  }

  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) {
    return { text: deadlineStr, urgent: false, expired: false };
  }

  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Expired (${Math.abs(diffDays)}d ago)`, urgent: false, expired: true };
  } else if (diffDays === 0) {
    return { text: 'Closing Today', urgent: true, expired: false };
  } else if (diffDays === 1) {
    return { text: '1 day left', urgent: true, expired: false };
  } else if (diffDays <= 7) {
    return { text: `${diffDays} days left`, urgent: true, expired: false };
  } else {
    return { text: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), urgent: false, expired: false };
  }
}
