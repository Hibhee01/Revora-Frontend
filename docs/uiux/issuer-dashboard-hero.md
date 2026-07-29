# Issuer Dashboard Hero

**Route:** `/startup/dashboard`  
**Component:** `src/components/IssuerDashboardHero.tsx`  
**Page:** `src/pages/StartupDashboard.tsx`  
**Tests:** `src/components/IssuerDashboardHero.test.tsx`

---

## Purpose

Nudge founders toward their upcoming obligations the moment they land on their dashboard. The hero surfaces:

1. A **reporting reminder banner** (conditional — only when a report is due within 7 days, due today, or overdue)
2. Three **KPI tiles** — MRR, ARR, DAU
3. A **Next Payout tile** — date and estimated amount
4. A **primary CTA** whose label and severity change based on report status

---

## Component API

```tsx
interface IssuerDashboardHeroProps {
  companyName?: string;          // e.g. "Acme Corp" → "Acme Corp Dashboard"
  mrr: IssuerKpiData;
  arr: IssuerKpiData;
  dau: IssuerKpiData;
  nextPayout?: NextPayout;       // omit if no payout scheduled
  reportStatus?: ReportStatus;   // 'due' | 'submitted' | 'accepted' | 'overdue' | 'none'
  reportDueDate?: string;        // ISO YYYY-MM-DD
}

interface IssuerKpiData {
  value?: string | null;         // pre-formatted display string
  change?: number;               // % change vs prior period
  changeLabel?: string;          // e.g. "vs last month"
  status: 'loading' | 'error' | 'empty' | 'success';
}

interface NextPayout {
  date: string;                  // ISO YYYY-MM-DD
  estimatedAmount?: number;      // USD amount
  currency?: string;             // default: USD
}
```

---

## Reminder Banner Variants

| Condition | Variant | Colour | `aria-live` |
|---|---|---|---|
| `status='due'`, due in 1–7 days | Due Soon (blue) | `rgba(59,130,246,…)` | `polite` |
| `status='due'`, due today (0 days) | Due Today (red) | `rgba(239,68,68,…)` | `assertive` |
| `status='overdue'`, 1–3 days | Mild (amber) | `rgba(245,158,11, 0.08)` | `polite` |
| `status='overdue'`, 4–29 days | Moderate (amber) | `rgba(245,158,11, 0.12)` | `assertive` |
| `status='overdue'`, ≥ 30 days | Critical (red) | `rgba(239,68,68, 0.12)` | `assertive` |
| `status='submitted'` | **Hidden** | — | — |
| `status='accepted'` | **Hidden** | — | — |
| `status='none'` or `due > 7 days` | **Hidden** | — | — |

The banner severity thresholds reuse `getOverdueSeverity()` from `RevenueReportingCalendar.types.ts`:

```
mild:     1–3 days overdue
moderate: 4–29 days overdue
critical: ≥ 30 days overdue
```

---

## Primary CTA State Machine

| `reportStatus` | Days until due | CTA label | Style |
|---|---|---|---|
| `undefined` / `'none'` | — | Submit Revenue Report | `btn-secondary` |
| `'due'` | > 7 | Submit Revenue Report | `btn-secondary` |
| `'due'` | ≤ 7 | Submit Revenue Report | `btn-primary` |
| `'overdue'` | — | Submit Overdue Report | danger (red-tinted border) |
| `'submitted'` | — | View Submitted Report | `btn-secondary` |
| `'accepted'` | — | View Accepted Report | `btn-secondary` |

All CTA links route to `/startup/report-revenue`.

---

## KPI Tile States

Each KPI tile (`MRR`, `ARR`, `DAU`) supports four states:

| Status | Rendering |
|---|---|
| `loading` | Animated skeleton (`animate-pulse`) + `aria-busy="true"` |
| `error` | Red-tinted card + "Failed to load" text |
| `empty` | Dash icon + "No data yet" |
| `success` | Value, optional trend arrow (+/- %) |

---

## Layout — Responsive Breakpoints

```
mobile  (< 640px):  1-column stack  — hero header → banner → KPIs (stacked)
sm      (≥ 640px):  2-column KPI grid
lg      (≥ 1024px): 4-column KPI grid  [MRR | ARR | DAU | Next Payout]
```

The section heading and CTA wrap to separate rows on mobile (`flex-col`), becoming a side-by-side flex row on `sm+`.

---

## Accessibility Notes (WCAG 2.1 AA)

- `<section aria-labelledby="issuer-hero-heading">` — landmark region labelled by the `<h1>`
- Reminder banner: `role="alert"` + `aria-live="assertive|polite"` + `aria-atomic="true"`
- KPI grid: `role="list"` + `role="listitem"` on each tile wrapper
- Each tile has descriptive `aria-label` covering value and status
- Trend change `<div>` has `aria-label` that vocalises the sign and `changeLabel`
- All links and interactive elements carry `focus-ring`
- Skeletons carry `aria-busy="true"` and `role="status"`
- Tested with `jest-axe` (3 axe coverage tests: nominal, overdue banner, loading state) — **all pass**

---

## Edge Cases Covered

| Scenario | Behaviour |
|---|---|
| All KPIs loading | Three skeletons render; banner + CTA still functional |
| All KPIs errored | Three error tiles render; hero does not crash |
| All KPIs empty | "No data yet" in all tiles; appropriate for a new issuer |
| No payout scheduled | "Not scheduled" in next-payout tile |
| Overdue ≥ 30 days | Critical red banner, `assertive` aria-live |
| `reportDueDate` missing when overdue | `overdueDays` safely falls back to 0 |
| `companyName` omitted | Heading falls back to "Issuer Dashboard" |

---

## Design Tokens Used

All tokens are sourced from `src/index.css` `:root` without modification:

```
--glass-bg / glass-card
--primary / --primary-hover
--error (#ef4444)
--success (#10b981)
--text-main / --text-muted / --text-accent
btn-primary / btn-secondary / focus-ring / animate-fade-in
--spacing-* / --radius-*
```

Custom inline colour overrides follow the pattern established in `ComplianceHoldBanner.tsx` (e.g. `bg-[rgba(…)]`, `border-[rgba(…)]`).

---

## Before / After

**Before:** `/startup/dashboard` rendered a placeholder "This dashboard is currently under construction." with no information.

**After:** A fully-featured hero section showing MRR, ARR, DAU, next payout, and a contextual reminder banner + CTA tied to the issuer's current report obligation.
