import React, { useState, useMemo, useCallback, useId } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegionStatus = "allowed" | "blocked" | "restricted";

export interface Region {
  code: string;
  name: string;
  isHighRisk?: boolean;
}

export type Continent = string;

// ─── Data ─────────────────────────────────────────────────────────────────────

export const REGIONS_BY_CONTINENT: Record<Continent, Region[]> = {
  Africa: [
    { code: "NG", name: "Nigeria" },
    { code: "ZA", name: "South Africa" },
    { code: "KE", name: "Kenya" },
    { code: "EG", name: "Egypt" },
    { code: "GH", name: "Ghana" },
    { code: "MA", name: "Morocco" },
  ],
  Asia: [
    { code: "JP", name: "Japan" },
    { code: "SG", name: "Singapore" },
    { code: "KR", name: "South Korea" },
    { code: "IN", name: "India" },
    { code: "CN", name: "China" },
    { code: "HK", name: "Hong Kong" },
    { code: "AE", name: "UAE" },
    { code: "IL", name: "Israel" },
  ],
  Europe: [
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "GB", name: "United Kingdom" },
    { code: "NL", name: "Netherlands" },
    { code: "CH", name: "Switzerland" },
    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "DK", name: "Denmark" },
    { code: "PL", name: "Poland" },
  ],
  "North America": [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "MX", name: "Mexico" },
  ],
  "South America": [
    { code: "BR", name: "Brazil" },
    { code: "AR", name: "Argentina" },
    { code: "CO", name: "Colombia" },
    { code: "CL", name: "Chile" },
  ],
  Oceania: [
    { code: "AU", name: "Australia" },
    { code: "NZ", name: "New Zealand" },
  ],
  "High-Risk / Sanctioned": [
    { code: "IR", name: "Iran", isHighRisk: true },
    { code: "KP", name: "North Korea", isHighRisk: true },
    { code: "RU", name: "Russia", isHighRisk: true },
    { code: "BY", name: "Belarus", isHighRisk: true },
    { code: "CU", name: "Cuba", isHighRisk: true },
    { code: "SY", name: "Syria", isHighRisk: true },
    { code: "VE", name: "Venezuela", isHighRisk: true },
  ],
};

// Build a flat list of all regions for summary calculations
const ALL_REGIONS: Region[] = Object.values(REGIONS_BY_CONTINENT).flat();

// Default statuses: everything allowed
const buildDefaultStatuses = (): Record<string, RegionStatus> => {
  const result: Record<string, RegionStatus> = {};
  ALL_REGIONS.forEach((r) => {
    result[r.code] = "allowed";
  });
  return result;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusToggleProps {
  regionCode: string;
  regionName: string;
  status: RegionStatus;
  onChange: (code: string, status: RegionStatus) => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({
  regionCode,
  regionName,
  status,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Access status for ${regionName}`}>
      <button
        type="button"
        aria-pressed={status === "allowed"}
        aria-label={`Allow ${regionName}`}
        onClick={() => onChange(regionCode, "allowed")}
        className={`px-2.5 py-1 text-xs font-medium rounded-l-md border transition-colors focus-ring
          ${
            status === "allowed"
              ? "bg-primary/20 text-primary border-primary/40"
              : "bg-transparent text-muted border-slate-700 hover:text-main hover:border-slate-500"
          }`}
      >
        Allowed
      </button>
      <button
        type="button"
        aria-pressed={status === "restricted"}
        aria-label={`Restrict ${regionName}`}
        onClick={() => onChange(regionCode, "restricted")}
        className={`px-2.5 py-1 text-xs font-medium border-y transition-colors focus-ring
          ${
            status === "restricted"
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
              : "bg-transparent text-muted border-slate-700 hover:text-main hover:border-slate-500"
          }`}
      >
        Restricted
      </button>
      <button
        type="button"
        aria-pressed={status === "blocked"}
        aria-label={`Block ${regionName}`}
        onClick={() => onChange(regionCode, "blocked")}
        className={`px-2.5 py-1 text-xs font-medium rounded-r-md border transition-colors focus-ring
          ${
            status === "blocked"
              ? "bg-red-500/20 text-red-400 border-red-500/40"
              : "bg-transparent text-muted border-slate-700 hover:text-main hover:border-slate-500"
          }`}
      >
        Blocked
      </button>
    </div>
  );
};

interface ContinentSectionProps {
  continent: Continent;
  regions: Region[];
  statuses: Record<string, RegionStatus>;
  isExpanded: boolean;
  onToggleExpand: (continent: Continent) => void;
  onStatusChange: (code: string, status: RegionStatus) => void;
  onAllowAll: (continent: Continent) => void;
  onBlockAll: (continent: Continent) => void;
}

const ContinentSection: React.FC<ContinentSectionProps> = ({
  continent,
  regions,
  statuses,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onAllowAll,
  onBlockAll,
}) => {
  const headingId = useId();
  const sectionId = useId();

  return (
    <div className="glass-card overflow-hidden">
      {/* Continent header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <button
          type="button"
          id={headingId}
          onClick={() => onToggleExpand(continent)}
          aria-expanded={isExpanded}
          aria-controls={sectionId}
          className="flex items-center gap-2 text-sm font-semibold text-main focus-ring rounded px-1 -ml-1 hover:text-accent transition-colors"
        >
          {isExpanded ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
          {continent}
          <span className="text-xs text-muted font-normal">
            ({regions.length})
          </span>
        </button>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAllowAll(continent)}
            className="text-xs px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors focus-ring"
            aria-label={`Allow all regions in ${continent}`}
          >
            Allow All
          </button>
          <button
            type="button"
            onClick={() => onBlockAll(continent)}
            className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors focus-ring"
            aria-label={`Block all regions in ${continent}`}
          >
            Block All
          </button>
        </div>
      </div>

      {/* Region rows */}
      {isExpanded && (
        <div
          id={sectionId}
          role="region"
          aria-labelledby={headingId}
        >
          <ul role="list" className="divide-y divide-slate-700/30">
            {regions.map((region) => (
              <li
                key={region.code}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
              >
                {/* Region name + badge */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-main font-medium truncate">
                    {region.name}
                  </span>
                  {region.isHighRisk && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0"
                      aria-label="High risk region"
                    >
                      <ShieldAlert size={11} aria-hidden="true" />
                      High Risk
                    </span>
                  )}
                </div>

                {/* Status toggle */}
                <StatusToggle
                  regionCode={region.code}
                  regionName={region.name}
                  status={statuses[region.code] ?? "allowed"}
                  onChange={onStatusChange}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Decorative world map SVG ─────────────────────────────────────────────────

const WorldMapDecoration: React.FC = () => (
  <div className="relative">
    {/* Screen-reader description */}
    <p className="sr-only">
      Decorative world map showing the geographic regions covered by this
      compliance configuration. Use the controls below to set access per region.
    </p>

    <svg
      aria-hidden="true"
      viewBox="0 0 800 300"
      className="w-full h-auto max-h-40 opacity-30 select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ocean background */}
      <rect width="800" height="300" rx="8" fill="#0f172a" />

      {/* Simplified continent blobs */}
      {/* North America */}
      <ellipse cx="155" cy="120" rx="95" ry="75" fill="#334155" />
      {/* South America */}
      <ellipse cx="210" cy="215" rx="50" ry="65" fill="#334155" />
      {/* Europe */}
      <ellipse cx="390" cy="95" rx="55" ry="50" fill="#334155" />
      {/* Africa */}
      <ellipse cx="400" cy="195" rx="65" ry="75" fill="#334155" />
      {/* Asia */}
      <ellipse cx="575" cy="110" rx="130" ry="80" fill="#334155" />
      {/* Oceania */}
      <ellipse cx="655" cy="230" rx="60" ry="40" fill="#334155" />

      {/* Continent labels */}
      <text x="140" y="122" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">N. America</text>
      <text x="210" y="218" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">S. America</text>
      <text x="390" y="98" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">Europe</text>
      <text x="400" y="198" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">Africa</text>
      <text x="575" y="113" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">Asia</text>
      <text x="655" y="233" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">Oceania</text>
    </svg>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ComplianceSettingsTab: React.FC = () => {
  const [regionStatuses, setRegionStatuses] = useState<Record<string, RegionStatus>>(
    buildDefaultStatuses
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(
    () => new Set(Object.keys(REGIONS_BY_CONTINENT))
  );
  const [showHighRiskWarning, setShowHighRiskWarning] = useState(true);

  // Derived: is any high-risk region currently allowed?
  const hasAllowedHighRisk = useMemo(() => {
    return ALL_REGIONS.some(
      (r) => r.isHighRisk && regionStatuses[r.code] === "allowed"
    );
  }, [regionStatuses]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    const counts = { allowed: 0, blocked: 0, restricted: 0 };
    ALL_REGIONS.forEach((r) => {
      const s = regionStatuses[r.code] ?? "allowed";
      counts[s]++;
    });
    return counts;
  }, [regionStatuses]);

  // Filtered continents based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return REGIONS_BY_CONTINENT;
    const q = searchQuery.toLowerCase();
    const result: Record<Continent, Region[]> = {};
    Object.entries(REGIONS_BY_CONTINENT).forEach(([continent, regions]) => {
      const matched = regions.filter((r) =>
        r.name.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[continent] = matched;
    });
    return result;
  }, [searchQuery]);

  // Handlers
  const handleStatusChange = useCallback(
    (code: string, status: RegionStatus) => {
      setRegionStatuses((prev) => ({ ...prev, [code]: status }));
    },
    []
  );

  const handleToggleContinent = useCallback((continent: Continent) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) {
        next.delete(continent);
      } else {
        next.add(continent);
      }
      return next;
    });
  }, []);

  const handleAllowAll = useCallback((continent: Continent) => {
    const regions = REGIONS_BY_CONTINENT[continent] ?? [];
    setRegionStatuses((prev) => {
      const next = { ...prev };
      regions.forEach((r) => {
        next[r.code] = "allowed";
      });
      return next;
    });
  }, []);

  const handleBlockAll = useCallback((continent: Continent) => {
    const regions = REGIONS_BY_CONTINENT[continent] ?? [];
    setRegionStatuses((prev) => {
      const next = { ...prev };
      regions.forEach((r) => {
        next[r.code] = "blocked";
      });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setRegionStatuses(buildDefaultStatuses());
    setSearchQuery("");
    setExpandedContinents(new Set(Object.keys(REGIONS_BY_CONTINENT)));
    setShowHighRiskWarning(true);
  }, []);

  const handleSave = useCallback(() => {
    // TODO: wire up to API
    console.log("Saving compliance settings:", regionStatuses);
  }, [regionStatuses]);

  const continentEntries = Object.entries(filteredData);
  const hasResults = continentEntries.length > 0;

  return (
    <div className="space-y-6">
      {/* High-risk warning banner */}
      {hasAllowedHighRisk && showHighRiskWarning && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300"
        >
          <AlertTriangle
            size={18}
            className="flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm flex-1">
            <strong>Warning:</strong> One or more high-risk or sanctioned
            regions are currently set to <em>Allowed</em>. This may have
            regulatory and compliance implications. Review your settings before
            saving.
          </p>
          <button
            type="button"
            onClick={() => setShowHighRiskWarning(false)}
            aria-label="Dismiss high-risk warning"
            className="flex-shrink-0 p-1 rounded hover:bg-amber-500/20 transition-colors focus-ring"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Page header & search row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-main">
            Regional Access Controls
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Configure which regions are allowed, restricted, or blocked from
            accessing this offering.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regions…"
            aria-label="Search regions"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/60 border border-slate-700 rounded-lg text-main placeholder:text-muted focus-ring transition-colors"
          />
        </div>
      </div>

      {/* Decorative world map */}
      <div className="glass-card p-4 overflow-hidden">
        <WorldMapDecoration />
      </div>

      {/* Continent accordion list */}
      {hasResults ? (
        <div className="space-y-3">
          {continentEntries.map(([continent, regions]) => (
            <ContinentSection
              key={continent}
              continent={continent}
              regions={regions}
              statuses={regionStatuses}
              isExpanded={expandedContinents.has(continent)}
              onToggleExpand={handleToggleContinent}
              onStatusChange={handleStatusChange}
              onAllowAll={handleAllowAll}
              onBlockAll={handleBlockAll}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted text-sm">
            No regions match <strong>"{searchQuery}"</strong>.
          </p>
        </div>
      )}

      {/* Summary + actions footer */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Summary counts */}
        <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">
          <span className="text-green-400 font-medium">
            {summaryCounts.allowed} allowed
          </span>
          {", "}
          <span className="text-red-400 font-medium">
            {summaryCounts.blocked} blocked
          </span>
          {", "}
          <span className="text-yellow-400 font-medium">
            {summaryCounts.restricted} restricted
          </span>
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary text-sm py-2 px-4"
            aria-label="Reset compliance settings to defaults"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary text-sm py-2 px-4"
            aria-label="Save compliance settings"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSettingsTab;
