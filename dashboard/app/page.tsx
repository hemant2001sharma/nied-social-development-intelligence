"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Opportunity = {
  id: string;
  title: string;
  organisation: string | null;
  sector: string[] | null;
  geography: string[] | null;
  deadline: string | null;
  priority: string | null;
  strategic_score: number | null;
  opportunity_score: number | null;
  urgency_score: number | null;
  opportunity_type: string | null;
  description: string | null;
  relevance_reason: string | null;
  capability_match: string | null;
  capability_gap: string | null;
  recommended_action: string | null;
  source_name: string | null;
  source_url: string | null;
  is_verified: boolean | null;
};

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("deadline");

  useEffect(() => {
    async function loadOpportunities() {
      const { data, error } = await supabase
        .from("items")
        .select(
          "id, title, organisation, sector, geography, deadline, priority, strategic_score, opportunity_score, urgency_score, opportunity_type, description, relevance_reason, capability_match, capability_gap, recommended_action, source_name, source_url, is_verified"
        )
        .eq("item_type", "OPPORTUNITY");

      if (error) {
        setError(error.message);
      } else {
        setOpportunities(data || []);
      }

      setLoading(false);
    }

    loadOpportunities();
  }, []);

  const sectors = useMemo(() => {
    const values = new Set<string>();

    opportunities.forEach((item) => {
      item.sector?.forEach((sector) => {
        if (sector) values.add(sector);
      });
    });

    return Array.from(values).sort();
  }, [opportunities]);

  const types = useMemo(() => {
    const values = new Set<string>();

    opportunities.forEach((item) => {
      if (item.opportunity_type) {
        values.add(item.opportunity_type);
      }
    });

    return Array.from(values).sort();
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    const result = opportunities.filter((item) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText) ||
        (item.organisation || "").toLowerCase().includes(searchText) ||
        (item.sector || [])
          .join(" ")
          .toLowerCase()
          .includes(searchText);

      const matchesSector =
        sectorFilter === "ALL" ||
        (item.sector || []).includes(sectorFilter);

      const matchesPriority =
        priorityFilter === "ALL" ||
        item.priority === priorityFilter;

      const matchesType =
        typeFilter === "ALL" ||
        item.opportunity_type === typeFilter;

      return (
        matchesSearch &&
        matchesSector &&
        matchesPriority &&
        matchesType
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "score") {
        return (
          (b.opportunity_score || 0) -
          (a.opportunity_score || 0)
        );
      }

      if (sortBy === "strategic") {
        return (
          (b.strategic_score || 0) -
          (a.strategic_score || 0)
        );
      }

      if (sortBy === "urgency") {
        return (
          (b.urgency_score || 0) -
          (a.urgency_score || 0)
        );
      }

      return (
        new Date(a.deadline || "9999-12-31").getTime() -
        new Date(b.deadline || "9999-12-31").getTime()
      );
    });
  }, [
    opportunities,
    search,
    sectorFilter,
    priorityFilter,
    typeFilter,
    sortBy,
  ]);

  const total = opportunities.length;

  const urgent = opportunities.filter(
    (x) => x.priority === "URGENT"
  ).length;

  const high = opportunities.filter(
    (x) => x.priority === "HIGH"
  ).length;

  const dueSoon = opportunities.filter((x) => {
    if (!x.deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(x.deadline);
    deadline.setHours(0, 0, 0, 0);

    const days =
      (deadline.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return days >= 0 && days <= 7;
  }).length;

  const actNow = opportunities
    .filter(
      (x) => x.priority === "URGENT" || x.priority === "HIGH"
    )
    .sort(
      (a, b) =>
        new Date(a.deadline || "9999-12-31").getTime() -
        new Date(b.deadline || "9999-12-31").getTime()
    );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>

        {/* HEADER */}

        <header style={headerStyle}>
          <div style={eyebrowStyle}>
            NIED • SOCIAL DEVELOPMENT INTELLIGENCE HUB
          </div>

          <div style={headerRowStyle}>
            <div>
              <h1 style={titleStyle}>
                Social Development Intelligence
              </h1>

              <p style={subtitleStyle}>
                Live intelligence on opportunities, partnerships and
                development-sector activity.
              </p>
            </div>

            <div style={liveBadgeStyle}>
              <span style={liveDotStyle}></span>
              LIVE
            </div>
          </div>
        </header>

        {/* KPI CARDS */}

        <section style={kpiGridStyle}>
          <KpiCard label="TOTAL OPPORTUNITIES" value={total} />
          <KpiCard label="URGENT" value={urgent} emphasis="urgent" />
          <KpiCard label="HIGH PRIORITY" value={high} emphasis="high" />
          <KpiCard
            label="DUE WITHIN 7 DAYS"
            value={dueSoon}
            emphasis="due"
          />
        </section>

        {/* ACT NOW */}

        <section style={sectionStyle}>
          <SectionHeading
            title="Act Now"
            description="Highest-priority opportunities requiring immediate attention."
          />

          <div style={actNowGridStyle}>
            {actNow.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                style={cardButtonStyle}
              >
                <OpportunityCard item={item} />
              </button>
            ))}
          </div>
        </section>

        {/* OPPORTUNITIES */}

        <section style={sectionStyle}>
          <SectionHeading
            title="Opportunity Intelligence"
            description="Search, filter and prioritise the live opportunity pipeline."
          />

          <div style={filterBarStyle}>

            <input
              type="text"
              placeholder="Search opportunities, organisations or sectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Sectors</option>

              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Types</option>

              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectStyle}
            >
              <option value="deadline">Sort: Deadline</option>
              <option value="score">Sort: Opportunity Score</option>
              <option value="strategic">Sort: Strategic Score</option>
              <option value="urgency">Sort: Urgency</option>
            </select>

          </div>

          <div style={resultCountStyle}>
            Showing <strong>{filteredOpportunities.length}</strong> of{" "}
            <strong>{total}</strong> opportunities
          </div>

          {loading && (
            <div style={emptyStyle}>
              Loading intelligence...
            </div>
          )}

          {error && (
            <div style={errorStyle}>
              <strong>Supabase error:</strong> {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredOpportunities.length > 0 && (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>OPPORTUNITY</th>
                      <th style={thStyle}>ORGANISATION</th>
                      <th style={thStyle}>SECTOR</th>
                      <th style={thStyle}>TYPE</th>
                      <th style={thStyle}>DEADLINE</th>
                      <th style={scoreThStyle}>FIT</th>
                      <th style={scoreThStyle}>SCORE</th>
                      <th style={scoreThStyle}>URGENCY</th>
                      <th style={thStyle}>PRIORITY</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOpportunities.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelected(item)}
                        style={clickableRowStyle}
                      >
                        <td style={titleCellStyle}>
                          {item.title}
                        </td>

                        <td style={tdStyle}>
                          {item.organisation || "—"}
                        </td>

                        <td style={tdStyle}>
                          {item.sector?.join(", ") || "—"}
                        </td>

                        <td style={tdStyle}>
                          {item.opportunity_type || "—"}
                        </td>

                        <td style={deadlineCellStyle}>
                          {formatDate(item.deadline)}
                        </td>

                        <td style={scoreCellStyle}>
                          {item.strategic_score ?? "—"}
                        </td>

                        <td style={scoreCellStyle}>
                          {item.opportunity_score ?? "—"}
                        </td>

                        <td style={scoreCellStyle}>
                          {item.urgency_score ?? "—"}
                        </td>

                        <td style={tdStyle}>
                          <PriorityBadge priority={item.priority} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <footer style={footerStyle}>
          NIED Social Development Intelligence Hub
          <span> • </span>
          Live opportunity intelligence
        </footer>
      </div>

      {/* DETAIL PANEL */}

      {selected && (
        <div
          style={overlayStyle}
          onClick={() => setSelected(null)}
        >
          <div
            style={detailPanelStyle}
            onClick={(e) => e.stopPropagation()}
          >

            <div style={detailHeaderStyle}>
              <div style={{ flex: 1 }}>
                <div style={eyebrowStyle}>
                  OPPORTUNITY INTELLIGENCE
                </div>

                <h2 style={detailTitleStyle}>
                  {selected.title}
                </h2>

                <div style={detailOrganisationStyle}>
                  {selected.organisation || "Organisation not specified"}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={detailBadgesStyle}>
              <PriorityBadge priority={selected.priority} />

              <span style={detailTypeBadgeStyle}>
                {selected.opportunity_type || "Opportunity"}
              </span>

              {selected.is_verified && (
                <span style={verifiedBadgeStyle}>
                  VERIFIED
                </span>
              )}
            </div>

            <div style={detailGridStyle}>

              <InfoBox
                label="DEADLINE"
                value={formatDate(selected.deadline)}
              />

              <InfoBox
                label="SECTOR"
                value={
                  selected.sector?.join(", ") || "Not specified"
                }
              />

              <InfoBox
                label="GEOGRAPHY"
                value={
                  selected.geography?.join(", ") || "Not specified"
                }
              />

              <InfoBox
                label="SOURCE"
                value={selected.source_name || "Not specified"}
              />

            </div>

            <div style={scoreGridStyle}>
              <ScoreBox
                label="STRATEGIC FIT"
                value={selected.strategic_score}
              />

              <ScoreBox
                label="OPPORTUNITY SCORE"
                value={selected.opportunity_score}
              />

              <ScoreBox
                label="URGENCY"
                value={selected.urgency_score}
              />
            </div>

            <DetailSection
              title="NIED Relevance"
              value={selected.relevance_reason}
            />

            <DetailSection
              title="Capability Match"
              value={selected.capability_match}
            />

            <DetailSection
              title="Capability Gap"
              value={selected.capability_gap}
            />

            <DetailSection
              title="Recommended Action"
              value={selected.recommended_action}
            />

            {selected.description && (
              <DetailSection
                title="Description"
                value={selected.description}
              />
            )}

            {selected.source_url && (
              <a
                href={selected.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={sourceButtonStyle}
              >
                Open Source →
              </a>
            )}

          </div>
        </div>
      )}
    </main>
  );
}


/* COMPONENTS */

function KpiCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: string;
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>{label}</div>

      <div
        style={{
          ...kpiValueStyle,
          ...(emphasis === "urgent"
            ? { color: "#fca5a5" }
            : {}),
          ...(emphasis === "high"
            ? { color: "#fdba74" }
            : {}),
          ...(emphasis === "due"
            ? { color: "#fde68a" }
            : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      <p style={sectionDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function OpportunityCard({
  item,
}: {
  item: Opportunity;
}) {
  return (
    <div style={opportunityCardStyle}>
      <div style={cardTopStyle}>

        <div style={{ flex: 1 }}>
          <div style={cardTitleStyle}>
            {item.title}
          </div>

          <div style={organisationStyle}>
            {item.organisation || "Organisation not specified"}
          </div>
        </div>

        <PriorityBadge priority={item.priority} />

      </div>

      <div style={cardMetaStyle}>
        <span>
          <strong>Deadline</strong>{" "}
          {formatDate(item.deadline)}
        </span>

        <span>
          <strong>Score</strong>{" "}
          {item.opportunity_score ?? "—"}
        </span>

        <span>
          <strong>Fit</strong>{" "}
          {item.strategic_score ?? "—"}
        </span>
      </div>

      <div style={sectorCardStyle}>
        {item.sector?.join(" • ") || "Sector not specified"}
      </div>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string | null;
}) {
  const label = priority || "LOW";

  let background = "#1e293b";
  let text = "#cbd5e1";

  if (label === "URGENT") {
    background = "#7f1d1d";
    text = "#fecaca";
  }

  if (label === "HIGH") {
    background = "#78350f";
    text = "#fed7aa";
  }

  if (label === "MEDIUM") {
    background = "#164e63";
    text = "#a5f3fc";
  }

  return (
    <span
      style={{
        display: "inline-block",
        background,
        color: text,
        borderRadius: "999px",
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoBoxStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div style={scoreBoxStyle}>
      <div style={infoLabelStyle}>{label}</div>

      <div style={scoreValueStyle}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div style={detailSectionStyle}>
      <h3 style={detailSectionTitleStyle}>
        {title}
      </h3>

      <p style={detailSectionTextStyle}>
        {value}
      </p>
    </div>
  );
}


/* HELPERS */

function formatDate(date: string | null) {
  if (!date) return "—";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]} ${getMonth(parts[1])} ${parts[0]}`;
}

function getMonth(month: string) {
  const months: Record<string, string> = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };

  return months[month] || month;
}


/* STYLES */

const pageStyle = {
  minHeight: "100vh",
  background: "#050816",
  color: "#f8fafc",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "1550px",
  margin: "0 auto",
};

const headerStyle = {
  marginBottom: "30px",
};

const eyebrowStyle = {
  fontSize: "12px",
  color: "#93c5fd",
  letterSpacing: "2px",
  fontWeight: 700,
  marginBottom: "10px",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};

const titleStyle = {
  fontSize: "36px",
  margin: 0,
  fontWeight: 700,
};

const subtitleStyle = {
  color: "#94a3b8",
  marginTop: "10px",
  fontSize: "15px",
};

const liveBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "999px",
  padding: "8px 13px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#cbd5e1",
};

const liveDotStyle = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#4ade80",
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "16px",
  marginBottom: "34px",
};

const kpiCardStyle = {
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "21px",
};

const kpiLabelStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.2px",
};

const kpiValueStyle = {
  fontSize: "34px",
  fontWeight: 700,
  marginTop: "9px",
};

const sectionStyle = {
  marginBottom: "36px",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 700,
};

const sectionDescriptionStyle = {
  color: "#94a3b8",
  marginTop: "6px",
  marginBottom: 0,
};

const actNowGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
};

const cardButtonStyle = {
  border: "none",
  padding: 0,
  margin: 0,
  background: "transparent",
  color: "inherit",
  textAlign: "left" as const,
  cursor: "pointer",
};

const opportunityCardStyle = {
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "20px",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
};

const cardTitleStyle = {
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: 1.45,
};

const organisationStyle = {
  color: "#94a3b8",
  marginTop: "8px",
  fontSize: "14px",
};

const cardMetaStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "20px",
  marginTop: "18px",
  color: "#cbd5e1",
  fontSize: "13px",
};

const sectorCardStyle = {
  marginTop: "14px",
  color: "#93c5fd",
  fontSize: "12px",
};

const filterBarStyle = {
  display: "grid",
  gridTemplateColumns: "2fr repeat(4, 1fr)",
  gap: "10px",
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "12px",
};

const searchInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#050816",
  color: "#f8fafc",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "11px 13px",
  fontSize: "13px",
  outline: "none",
};

const selectStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#050816",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "11px 10px",
  fontSize: "12px",
};

const resultCountStyle = {
  color: "#64748b",
  fontSize: "12px",
  marginBottom: "12px",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
  border: "1px solid #1e293b",
  borderRadius: "12px",
  background: "#0b1120",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "1250px",
};

const thStyle = {
  textAlign: "left" as const,
  padding: "14px",
  fontSize: "11px",
  color: "#94a3b8",
  borderBottom: "1px solid #1e293b",
  whiteSpace: "nowrap" as const,
  background: "#111827",
};

const scoreThStyle = {
  ...thStyle,
  textAlign: "center" as const,
};

const tdStyle = {
  padding: "15px 14px",
  borderBottom: "1px solid #172033",
  fontSize: "13px",
  color: "#cbd5e1",
  verticalAlign: "top" as const,
};

const titleCellStyle = {
  ...tdStyle,
  color: "#f8fafc",
  fontWeight: 600,
  minWidth: "350px",
  lineHeight: 1.4,
};

const deadlineCellStyle = {
  ...tdStyle,
  whiteSpace: "nowrap" as const,
  color: "#e2e8f0",
};

const scoreCellStyle = {
  ...tdStyle,
  textAlign: "center" as const,
  fontWeight: 700,
};

const clickableRowStyle = {
  cursor: "pointer",
};

const errorStyle = {
  background: "#2a1115",
  border: "1px solid #7f1d1d",
  borderRadius: "12px",
  padding: "20px",
  color: "#fecaca",
};

const emptyStyle = {
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "25px",
  color: "#94a3b8",
};

const footerStyle = {
  borderTop: "1px solid #1e293b",
  paddingTop: "20px",
  marginTop: "50px",
  color: "#64748b",
  fontSize: "12px",
};


/* DETAIL PANEL STYLES */

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0, 0, 0, 0.72)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 100,
};

const detailPanelStyle = {
  width: "min(720px, 92vw)",
  height: "100vh",
  overflowY: "auto" as const,
  background: "#080d1a",
  borderLeft: "1px solid #263449",
  padding: "30px",
  boxSizing: "border-box" as const,
};

const detailHeaderStyle = {
  display: "flex",
  gap: "20px",
  alignItems: "flex-start",
};

const detailTitleStyle = {
  fontSize: "26px",
  lineHeight: 1.35,
  margin: "5px 0 0",
};

const detailOrganisationStyle = {
  color: "#94a3b8",
  marginTop: "10px",
  fontSize: "14px",
};

const closeButtonStyle = {
  background: "#111827",
  border: "1px solid #334155",
  color: "#cbd5e1",
  borderRadius: "8px",
  width: "38px",
  height: "38px",
  fontSize: "25px",
  cursor: "pointer",
};

const detailBadgesStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  marginTop: "20px",
};

const detailTypeBadgeStyle = {
  background: "#172033",
  color: "#cbd5e1",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "11px",
  fontWeight: 700,
};

const verifiedBadgeStyle = {
  background: "#14532d",
  color: "#bbf7d0",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "11px",
  fontWeight: 700,
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
  marginTop: "24px",
};

const infoBoxStyle = {
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "10px",
  padding: "15px",
};

const infoLabelStyle = {
  fontSize: "10px",
  color: "#64748b",
  fontWeight: 700,
  letterSpacing: "1px",
};

const infoValueStyle = {
  marginTop: "7px",
  color: "#e2e8f0",
  fontSize: "13px",
  lineHeight: 1.4,
};

const scoreGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
  marginTop: "10px",
};

const scoreBoxStyle = {
  background: "#0b1120",
  border: "1px solid #1e293b",
  borderRadius: "10px",
  padding: "15px",
  textAlign: "center" as const,
};

const scoreValueStyle = {
  fontSize: "27px",
  fontWeight: 700,
  marginTop: "7px",
  color: "#93c5fd",
};

const detailSectionStyle = {
  marginTop: "24px",
  paddingTop: "20px",
  borderTop: "1px solid #1e293b",
};

const detailSectionTitleStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#e2e8f0",
};

const detailSectionTextStyle = {
  color: "#94a3b8",
  lineHeight: 1.65,
  fontSize: "14px",
  marginTop: "9px",
  whiteSpace: "pre-wrap" as const,
};

const sourceButtonStyle = {
  display: "inline-block",
  marginTop: "28px",
  background: "#1d4ed8",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "8px",
  padding: "11px 17px",
  fontSize: "13px",
  fontWeight: 700,
};