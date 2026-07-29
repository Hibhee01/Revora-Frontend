# Error Rate Sparkline Tiles

**Component:** `ErrorRateSparklineTile`  
**Location:** `src/components/ErrorRateSparklineTile/`  
**Used in:** `src/pages/DistributionDashboard.tsx`

---

## Tile Anatomy

```
┌──────────────────────────┐
│ ERROR RATE          ⚠    │ <- Title (uppercase, muted) + icon
│ 2.4%       ╱╲            │ <- Large value + inline SVG sparkline
│            ╱  ╲──        │
│           ╱     ╲╱       │
│ ↓ 0.8% vs prev           │ <- Delta with severity color
│ Issuer: Acme Corp        │ <- Group context (issuer/region + name)
└──────────────────────────┘
```

1. **Header row:** Title (sentence-case label, e.g. "ERROR RATE") and a muted `AlertTriangle` icon.
2. **Body row:** Large bold numeric value (left) and a compact 64×28px SVG sparkline (right).
3. **Delta row:** Direction icon + absolute change percentage, color-coded by severity.
4. **Footer row:** Group label showing issuer or region name.

---

## Delta Color Usage (Severity Tokens)

Delta direction is inverted for error rates (higher = worse):

| Condition | Meaning | Colour Token | CSS Class |
|---|---|---|---|
| `delta > 0` | Errors increasing (worsening) | `var(--error)` / `#ef4444` | `.error-rate-delta--bad` |
| `delta < 0` | Errors decreasing (improving) | `var(--success)` / `#10b981` | `.error-rate-delta--good` |
| `delta === 0` | No change (stable) | `var(--text-muted)` / `#cbd5e1` | `.error-rate-delta--neutral` |

This is the inverse of the `KpiCard` convention where positive change = green. Error rates are "bad" metrics, so improvement is a decrease.

Default sparkline stroke uses the same convention:
- Upward trend → `var(--error)` (red)
- Downward trend → `var(--success)` (green)

---

## Copy Conventions

### Percent format
- Always include one decimal place: `2.4%`, `0.0%`, `-0.8%`
- Delta values show absolute change with directional arrow:
  - `↑ 1.2%` (worsening)
  - `↓ 0.8%` (improving)
  - `→ 0.0%` (no change)
- Use `aria-label` for screen readers:
  - `"Worsened by 1.2%"`
  - `"Improved by 0.8%"`
  - `"No change"`

### Count format
- Group label: `"Issuer: {name}"` or `"Region: {name}"`
- Fallback when no filter value: em-dash (`—`)

### Sparkline aria-label
- `"Trend: increasing"` or `"Trend: decreasing"`

---

## Interaction States

| State | Behaviour |
|---|---|
| **Default** | Glass card with translucent background, border, backdrop blur |
| **Hover** | `.error-rate-tile--interactive:hover` — brighter border, slight lift (`translateY(-1px)`) |
| **Focus-visible** | `outline: 2px solid var(--primary)` with offset, rounded corners |
| **Click** | Navigates via React Router `<Link>` to filtered detail page |
| **Keyboard** | `Enter` / `Space` triggers click via `onKeyDown` handler |

---

## Accessibility (WCAG 2.1 AA)

1. **Landmarks:** Tiles are rendered inside a `<section>` with `aria-labelledby` pointing to the section heading.
2. **List semantics:** Grid uses `role="list"` with `role="listitem"` on each tile wrapper.
3. **Link wrapping:** Clickable tiles are wrapped in a `<Link>` with `aria-labelledby` referencing the value element for accessible name.
4. **Button role:** When `onClick` (no href) is used, the tile has `role="button"`, `tabIndex={0}`, and keyboard handlers.
5. **Icon accessibility:** Tile icon is `aria-hidden="true"`.
6. **Sparkline SVG:** Has `role="img"` with descriptive `aria-label` stating the trend.
7. **Delta aria:** The delta row has `aria-label` for screen readers (`"Improved by 0.8%"`).
8. **Focus indicators:** 2px outline with 2px offset on all interactive elements.
9. **Axe validation:** Confirmed 0 violations.

---

## Responsive Behaviour

| Breakpoint | Layout | Value font | Sparkline size |
|---|---|---|---|
| `≥768px` (md) | 4 columns | `1.5rem` (--font-size-2xl) | 64×28px |
| `<768px` | 2 columns | `1.5rem` | 64×28px |
| `≤480px` | 2 columns | `1.25rem` (--font-size-xl) | 48×22px |

- Uses existing `grid-cols-2 md:grid-cols-4` Tailwind grid.
- Density mode overrides (`cozy`/`compact`) reduce padding and value font size.

---

## Props API

```tsx
interface ErrorRateDataPoint {
  label: string;   // e.g. "Week 1", "Jan"
  value: number;   // error rate percentage (0-100)
}

interface ErrorRateSparklineTileProps {
  id: string;            // unique ID for testid
  title: string;         // tile label (e.g. "ERROR RATE")
  value: string;         // formatted display value (e.g. "2.4%")
  rate: number;          // numeric rate for sparkline scaling
  delta: number;         // change from previous period
  sparklineData: ErrorRateDataPoint[]; // trend data points
  groupBy: 'issuer' | 'region';        // context label type
  filterValue?: string;  // displayed group value
  href?: string;         // click-through link target
  onClick?: () => void;  // click handler (alternative to href)
}
```

---

## Usage Example

```tsx
<ErrorRateSparklineTile
  id="issuer-acme"
  title="ERROR RATE"
  value="2.4%"
  rate={2.4}
  delta={-0.8}
  sparklineData={[
    { label: 'W1', value: 3.2 },
    { label: 'W2', value: 2.8 },
    { label: 'W3', value: 3.5 },
    { label: 'W4', value: 2.4 },
  ]}
  groupBy="issuer"
  filterValue="Acme Corp"
  href="/startup/distributions?issuer=Acme%20Corp&status=failed"
/>
```

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| **Zero errors** | `value="0.0%"`, `rate=0`, sparkline shows flat line, delta `→ 0.0%` |
| **Extreme deltas** | Large values (e.g., `-99.9%`) display correctly with absolute formatting |
| **Empty sparkline data** | SVG is not rendered (null return) |
| **Single data point** | Sparkline renders a single point without error |
| **Flat data** | All values identical — sparkline renders flat, range guard prevents divide-by-zero |
| **Missing filterValue** | Footer shows em-dash fallback (`"Issuer: —"`) |

---

## Dependencies

- `react-router-dom` — `<Link>` for click-through navigation
- `lucide-react` — `TrendingUp`, `TrendingDown`, `Minus`, `AlertTriangle` icons
- Existing design tokens from `index.css` (`--glass-card`, `--error`, `--success`, `--text-muted`, spacing/type scale)
- Density mode tokens (`--density-*`) via `data-density` attribute on `<html>`
