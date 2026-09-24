export interface OpportunityItem {
  id: string;
  fingerprint?: string;
  item_type: string;
  title: string;
  description: string | null;
  organisation: string | null;
  sector: string[] | null;
  geography: string[] | null;
  opportunity_type: string | null;
  deadline: string | null;
  source_id: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  fetched_at: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string | null;
  opportunity_score: number | null;
  strategic_score: number | null;
  urgency_score: number | null;
  relevance_reason: string | null;
  capability_match: string | null;
  capability_gap: string | null;
  recommended_action: string | null;
  is_watchlisted: boolean | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface SourceRecord {
  id: string;
  name: string;
  source_url: string;
  source_type: string;
  reliability: string;
  active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface WatchlistRecord {
  id: string;
  watch_type: string;
  watch_value: string;
  active: boolean;
  created_at: string;
}

export interface DashboardKPIs {
  activeIntelligence: number;
  governmentOpportunities: number;
  csrFunding: number;
  closingSoon: number;
  highPriority: number;
  totalTrackedPoolEstimatedCr?: number;
}

export interface VelocityPoint {
  dateLabel: string;
  government: number;
  csr: number;
  development: number;
  total: number;
}

export interface SectorCount {
  name: string;
  count: number;
  percentage: number;
}
