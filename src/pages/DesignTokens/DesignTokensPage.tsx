import { useState, useCallback, useRef } from "react";
import { TOKEN_GROUPS, type TokenGroup, type Token } from "./tokens";
import { contrastRatio, wcagGrade, LIGHT_SURFACE, DARK_SURFACE } from "./contrast";
import { DevicePreview } from "./DevicePreview";
import "./DesignTokensPage.css";

// ─── Copy hook ────────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1800);
    });
  }, []);

  return { copied, copy };
}

// ─── JSON export ──────────────────────────────────────────────────────────────
function exportJSON() {
  const payload: Record<string, Record<string, string>> = {};
  for (const group of TOKEN_GROUPS) {
    payload[group.id] = {};
    for (const t of group.tokens) {
      payload[group.id][t.variable] = t.value;
    }
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "revora-design-tokens.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Color token row ──────────────────────────────────────────────────────────
function ColorSwatch({ token, surface }: { token: Token; surface: string }) {
  const { copy, copied } = useCopy();
  const isHex = token.value.startsWith("#");
  const ratio = isHex ? contrastRatio(token.value, surface) : null;
  const grade = wcagGrade(ratio);
  const gradeClass =
    grade === "AAA" || grade === "AA" ? "dt-grade--pass" :
    grade === "AA Large" ? "dt-grade--large" : "dt-grade--fail";

  return (
    <div className="dt-color-row" role="row">
      <div
        className="dt-swatch"
        style={{ background: token.value }}
        aria-label={`Color preview: ${token.value}`}
        role="img"
      />
      <div className="dt-token-info">
        <span className="dt-token-name">{token.name}</span>
        {token.description && (
          <span className="dt-token-desc">{token.description}</span>
        )}
      </div>
      <code className="dt-token-value">{token.value}</code>
      {isHex && (
        <span className={`dt-grade ${gradeClass}`} title={`Contrast ratio: ${ratio}`}>
          {grade} {ratio !== null && <span className="dt-ratio">{ratio}:1</span>}
        </span>
      )}
      {!isHex && <span className="dt-grade dt-grade--na">—</span>}
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy CSS variable ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Spacing token row ────────────────────────────────────────────────────────
function SpacingRow({ token }: { token: Token }) {
  const { copy, copied } = useCopy();
  const px = token.description ?? "";
  const remVal = parseFloat(token.value) * 16;
  const barWidth = Math.min(remVal * 3, 200);

  return (
    <div className="dt-spacing-row" role="row">
      <div className="dt-spacing-bar-wrap">
        <div className="dt-spacing-bar" style={{ width: barWidth }} aria-hidden="true" />
      </div>
      <span className="dt-token-name">{token.name}</span>
      <code className="dt-token-value">{token.value}</code>
      <span className="dt-token-desc">{px}</span>
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Radius token row ─────────────────────────────────────────────────────────
function RadiusRow({ token }: { token: Token }) {
  const { copy, copied } = useCopy();

  return (
    <div className="dt-radius-row" role="row">
      <div
        className="dt-radius-preview"
        style={{ borderRadius: token.value }}
        aria-hidden="true"
      />
      <span className="dt-token-name">{token.name}</span>
      <code className="dt-token-value">{token.value}</code>
      <span className="dt-token-desc">{token.description}</span>
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Typography token row ─────────────────────────────────────────────────────
function TypographyRow({ token }: { token: Token }) {
  const { copy, copied } = useCopy();
  const isSize = token.variable.includes("font-size");
  const isWeight = token.variable.includes("font-weight");

  return (
    <div className="dt-typo-row" role="row">
      <div className="dt-typo-preview">
        {isSize && (
          <span style={{ fontSize: token.value, lineHeight: 1.2, fontWeight: 500 }}>Aa</span>
        )}
        {isWeight && (
          <span style={{ fontWeight: token.value, fontSize: "1.25rem" }}>Aa</span>
        )}
        {!isSize && !isWeight && (
          <span style={{ fontSize: "0.875rem", opacity: 0.6 }}>{token.value}</span>
        )}
      </div>
      <span className="dt-token-name">{token.name}</span>
      <code className="dt-token-value">{token.value}</code>
      <span className="dt-token-desc">{token.description}</span>
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Shadow token row ─────────────────────────────────────────────────────────
function ShadowRow({ token }: { token: Token }) {
  const { copy, copied } = useCopy();

  return (
    <div className="dt-shadow-row" role="row">
      <div
        className="dt-shadow-preview"
        style={{ boxShadow: token.value }}
        aria-hidden="true"
      />
      <div className="dt-token-info">
        <span className="dt-token-name">{token.name}</span>
        <span className="dt-token-desc">{token.description}</span>
      </div>
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Generic token row (motion, etc.) ────────────────────────────────────────
function GenericRow({ token }: { token: Token }) {
  const { copy, copied } = useCopy();

  return (
    <div className="dt-generic-row" role="row">
      <span className="dt-token-name">{token.name}</span>
      <code className="dt-token-value">{token.value}</code>
      <span className="dt-token-desc">{token.description}</span>
      <button
        className="dt-copy-btn"
        onClick={() => copy(token.variable, token.variable)}
        aria-label={`Copy ${token.variable}`}
      >
        {copied === token.variable ? "✓ Copied" : "Copy var"}
      </button>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────
function TokenSection({
  group,
  surface,
  search,
}: {
  group: TokenGroup;
  surface: string;
  search: string;
}) {
  const filtered = search
    ? group.tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.variable.toLowerCase().includes(search) ||
          t.value.toLowerCase().includes(search)
      )
    : group.tokens;

  if (filtered.length === 0) return null;

  return (
    <section
      className="dt-section glass-card"
      aria-labelledby={`section-${group.id}`}
    >
      <h2 id={`section-${group.id}`} className="dt-section-title">
        {group.label}
        <span className="dt-section-count">{filtered.length}</span>
      </h2>

      <div role="table" aria-label={`${group.label} tokens`}>
        {group.type === "color" &&
          filtered.map((t) => (
            <ColorSwatch key={t.variable} token={t} surface={surface} />
          ))}
        {group.type === "spacing" &&
          filtered.map((t) => <SpacingRow key={t.variable} token={t} />)}
        {group.type === "radius" &&
          filtered.map((t) => <RadiusRow key={t.variable} token={t} />)}
        {group.type === "typography" &&
          filtered.map((t) => <TypographyRow key={t.variable} token={t} />)}
        {group.type === "shadow" &&
          filtered.map((t) => <ShadowRow key={t.variable} token={t} />)}
        {group.type === "motion" &&
          filtered.map((t) => <GenericRow key={t.variable} token={t} />)}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DesignTokensPage() {
  const [search, setSearch] = useState("");
  const [surface, setSurface] = useState<"dark" | "light">("dark");
  const { copy, copied } = useCopy();

  const surfaceHex = surface === "dark" ? DARK_SURFACE : LIGHT_SURFACE;
  const normalized = search.toLowerCase().trim();

  const totalTokens = TOKEN_GROUPS.reduce((n, g) => n + g.tokens.length, 0);

  const allVarsCSS = TOKEN_GROUPS.flatMap((g) =>
    g.tokens.map((t) => `  ${t.variable}: ${t.value};`)
  ).join("\n");

  return (
    <div className="dt-page animate-fade-in">
      {/* Page header */}
      <header className="dt-header">
        <div className="dt-header-text">
          <h1 className="dt-page-title">Design Tokens</h1>
          <p className="dt-page-subtitle">
            {totalTokens} tokens across {TOKEN_GROUPS.length} categories — browse, copy, and export.
          </p>
        </div>

        <div className="dt-header-actions">
          {/* Surface toggle for contrast preview */}
          <div className="dt-surface-toggle" role="group" aria-label="Preview surface">
            <button
              className={`dt-surface-btn ${surface === "dark" ? "dt-surface-btn--active" : ""}`}
              onClick={() => setSurface("dark")}
              aria-pressed={surface === "dark"}
            >
              Dark surface
            </button>
            <button
              className={`dt-surface-btn ${surface === "light" ? "dt-surface-btn--active" : ""}`}
              onClick={() => setSurface("light")}
              aria-pressed={surface === "light"}
            >
              Light surface
            </button>
          </div>

          {/* Export buttons */}
          <button className="dt-export-btn" onClick={exportJSON}>
            ↓ Export JSON
          </button>
          <button
            className="dt-export-btn dt-export-btn--secondary"
            onClick={() => copy(`:root {\n${allVarsCSS}\n}`, "__css__")}
            aria-label="Copy all tokens as CSS variables"
          >
            {copied === "__css__" ? "✓ Copied!" : "Copy CSS"}
          </button>
        </div>
      </header>

      {/* Device Preview Section */}
      <DevicePreview surface={surface} />

      {/* Search */}
      <div className="dt-search-wrap">
        <label htmlFor="dt-search" className="input-label">
          Search tokens
        </label>
        <input
          id="dt-search"
          type="search"
          className="input-field dt-search"
          placeholder="Search by name, variable, or value…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search design tokens"
        />
      </div>

      {/* Token sections */}
      <div className="dt-sections">
        {TOKEN_GROUPS.map((group) => (
          <TokenSection
            key={group.id}
            group={group}
            surface={surfaceHex}
            search={normalized}
          />
        ))}
      </div>

      {/* Empty state */}
      {normalized &&
        TOKEN_GROUPS.every(
          (g) =>
            !g.tokens.some(
              (t) =>
                t.name.toLowerCase().includes(normalized) ||
                t.variable.toLowerCase().includes(normalized) ||
                t.value.toLowerCase().includes(normalized)
            )
        ) && (
          <div className="dt-empty" role="status" aria-live="polite">
            <p>No tokens match "<strong>{search}</strong>"</p>
          </div>
        )}
    </div>
  );
}
