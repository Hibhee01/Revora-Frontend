# Distribution Filter & Segmentation Toolbar — Issue #214

## Overview

The **Distribution Filter and Segmentation Toolbar** (`DistributionFilterToolbar`) provides operations staff with a consistent, discoverable toolbar for filtering payout history by Date Range, Issuer, Region, and Status, plus segmentation controls that group metrics by category and toggle side-by-side comparison mode within the Distribution Dashboard (`src/pages/DistributionDashboard.tsx`).

---

## Design Rationale & UX Goals

1. **Discoverable Slicing**: Operations teams managing multi-jurisdiction revenue distributions require rapid filtering without cluttering the screen. Popover dropdown triggers keep the toolbar compact while exposing detailed filter selections.
2. **Segmentation & Comparison**: Slicing metrics by Region (e.g. North America vs Europe), Issuer (e.g. Nexus Cloud vs AeroDynamics), Status, or Investor Tier enables ops staff to identify bottlenecks or high-volume regions immediately.
3. **Preset Management**: Ops staff frequently re-apply complex filter combinations. The toolbar persists custom filter presets in `localStorage` under `revora_distribution_saved_filters` and provides built-in operational shortcuts ("Q3 Failed Batches", "North America Institutional").
4. **URL Synchronization**: All filter parameters automatically mirror in the browser URL query string (`?search=...&date=...&issuer=...&region=...&status=...&segment=...&compare=...`), supporting shareable deep links.
5. **Responsive Collapsible Sheet (< 768px)**: On mobile viewports, the toolbar collapses into a single `"Filters (n)"` button with an active filter counter badge `(n)`. Clicking opens a touch-friendly mobile filter drawer.

---

## Toolbar Layout & Component Architecture

```
+------------------------------------------------------------------------------------------------------------------------+
|  [🔍 Search ID, offering...]   [📅 Date: 90D ▼]   [🏢 Issuer: All ▼]   [🌍 Region: All ▼]   [⚡ Status: Failed ▼]        |
|                                                                         | Segment: [By Region ▼] | [x] Compare         |
+------------------------------------------------------------------------------------------------------------------------+
|  Active: (Search: "Nexus" ✕) (Status: Failed ✕) (Region: North America ✕)  [Clear All]   [⭐ Presets (2) ▼]              |
+------------------------------------------------------------------------------------------------------------------------+
```

### Component Files
- `src/components/DistributionFilterToolbar/DistributionFilterToolbar.tsx`: Main toolbar component with popover triggers, active pills, preset manager, compare toggle, and mobile sheet.
- `src/components/DistributionFilterToolbar/DistributionFilterToolbar.css`: CSS styling, glassmorphism backdrop, popover elevation, active pill badges, and mobile drawer animations.
- `src/components/DistributionFilterToolbar/DistributionFilterToolbar.types.ts`: TypeScript definitions for `DistributionFilterState`, `FilterPreset`, and props.
- `src/components/DistributionFilterToolbar/DistributionFilterToolbar.test.tsx`: Vitest & `jest-axe` test suite.

---

## URL Synchronization Specification

The toolbar automatically syncs active filter properties to React Router `searchParams`:

| Filter Property | URL Parameter Key | Parameter Values |
|-----------------|-------------------|------------------|
| `searchQuery` | `search` | Free-text string (e.g. `?search=Nexus`) |
| `dateRange` | `date` | `all`, `30d`, `90d`, `ytd`, `custom` |
| `issuer` | `issuer` | `all` or exact offering name |
| `region` | `region` | `all`, `Global`, `North America`, `Europe`, `Asia Pacific`, `LATAM` |
| `status` | `status` | `all`, `completed`, `processing`, `failed`, `scheduled` |
| `segmentBy` | `segment` | `none`, `region`, `offering`, `status`, `tier` |
| `compareMode` | `compare` | `true` or omitted |

---

## Accessibility Checklist (WCAG 2.1 AA)

| Criteria | Implementation | Status |
|----------|----------------|--------|
| **Toolbar Semantics** | `role="toolbar"`, `aria-label="Distribution filters and segmentation"` | Pass |
| **Popover Dialogs** | `aria-haspopup="dialog"`, `aria-expanded="true/false"`, `role="dialog"` | Pass |
| **Keyboard Dismissal** | Pressing `Escape` closes open popovers and mobile filter sheet | Pass |
| **Focus Outlines** | Visible `:focus-visible` rings on all interactive inputs and buttons | Pass |
| **Contrast Ratio** | Text colors exceed 4.5:1 contrast on dark mode background | Pass |
| **RTL Support** | Active filter tag list supports `[dir="rtl"]` flex reversal | Pass |
| **Axe Core Audit** | Zero violations reported by `jest-axe` | Pass |

---

## Testing & Verification

- **Automated Tests**: 30 passing tests across `DistributionFilterToolbar.test.tsx`, `DistributionDashboard.test.tsx`, and `PayoutDrillDownPanel.test.tsx`.
- **Test Coverage**: >95% statement and line coverage.
- **Accessibility**: 0 `jest-axe` violations.
