# UX272: Payout Timeline RTL Mirror Pass

## Scope

`PayoutTimeline` design-system component and the `PayoutSchedule` page that hosts
it. Chronological payout events must read left-to-right in LTR and **mirror** in
RTL locales: today marker, tooltip placement, and scroll direction all follow
inline-start, while **numeric dates stay LTR** per Unicode bidi rules.

UI/UX only — no API or payout calculation changes.

---

## Problem Statement

| Issue | Detail |
|---|---|
| Page was empty-only | `PayoutSchedule` showed EmptyState with no timeline to mirror |
| Physical CSS | `left`/`right` today markers and tooltip arrows break in RTL |
| Scroll direction | Overflow scroll must advance toward reading-start in RTL |
| Digit mirroring | Dates like `27 Jul 2026` must not reorder under Arabic |
| Tooltip clipping | Tooltips need RTL-first anchoring toward inline-start |

---

## Component Architecture

### `PayoutTimeline` (`src/components/PayoutTimeline`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `events` | `PayoutEvent[]` | — | Payout milestones |
| `today` | `string` (ISO) | local today | Drives today marker |
| `ariaLabel` | `string` | `'Payout schedule timeline'` | Section label |
| `autoScrollToToday` | `boolean` | `true` | `scrollIntoView({ inline: 'center' })` — RTL-aware |
| `className` | `string` | `''` | Optional |

### `PayoutEvent`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable key |
| `date` | `string` ISO | Always rendered in an LTR isolate |
| `label` | `string` | May be mixed-direction (`unicode-bidi: plaintext`) |
| `amount` | `string?` | Currency string; LTR isolate |
| `status` | `paid \| scheduled \| processing \| missed` | Visual + a11y |
| `detail` | `string?` | Tooltip body |

### Helpers

- `sortPayoutEvents` — chronological document order (never reversed for RTL)
- `getTodayMarkerPercent` — `[0,100]` along the track
- `formatDisplayDate` / `toIsoDate` / `daysBetween` / `statusLabel`

---

## RTL Technique

| Concern | Approach |
|---|---|
| Event order | Document order stays chronological; flex row + logical connectors mirror |
| Connectors | `inset-inline-start/end`; gradient angles flip under `[dir="rtl"]` |
| Today marker | `inset-inline-start: var(--pt-today)`; RTL uses `translateX(50%)` |
| Scroll | Scrollport inherits `dir`; `scrollIntoView({ inline: 'center' })` |
| Tooltips | **RTL-first**: LTR centred above marker; RTL anchored to `inset-inline-end: 0` (reading start) |
| Dates / amounts | `dir="ltr"` + `unicode-bidi: isolate` + tabular nums |
| Dark mode | Higher-contrast tooltip borders; today line at full opacity |

### Numeric date bidi rules

1. ISO and formatted dates live in LTR isolates so adjacent Arabic labels cannot
   reorder day/month/year digits.
2. Prefer `Intl.DateTimeFormat` output; keep the isolate wrapper regardless of locale.
3. Do not reverse chronological sequence — earliest payout remains first in the DOM.

```html
<span class="payout-timeline__date" dir="ltr">27 Jul 2026</span>
```

### Tooltip RTL placement rules

| Mode | Placement |
|---|---|
| LTR | Centred above marker (`inset-inline-start: 50%` + `translateX(-50%)`) |
| RTL | Prefer **inline-start** edge of the item (`inset-inline-end: 0`); arrow inset toward start |
| Focus / hover | Shown on `:focus-visible` / `:hover` / `:focus-within` |
| Mobile | Same rules; scrollport may clip — prefer start-side anchor to keep label readable |

---

## LTR / RTL Side-by-Side

```
LTR                                         RTL
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│  Paid ── Proc ── Sched           │        │           Sched ── Proc ── Paid  │
│   •──────●──────○     │Today     │        │     Today│   ○──────●──────•     │
│  Jan    Mar    Jun               │        │               Jun    Mar    Jan  │
│                                  │        │                                  │
│  scroll →                        │        │                        ← scroll  │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

- **Today** sits at the same chronological percent; physically mirrored via
  `inset-inline-start`.
- Dates still read `Jan / Mar / Jun` (LTR digits), not reversed glyphs.
- Unit smoke test mounts both panels (`ltr-panel` / `rtl-panel`).

---

## Accessibility (WCAG 2.1 AA)

| Criterion | How |
|---|---|
| 1.3.1 | `<section>` + scroll `role="region"` + `<ol>` list of events |
| 1.3.2 | Source order chronological; CSS-only mirror |
| 1.4.3 / 1.4.11 | Status colours + today pink meet contrast on dark surfaces |
| 2.1.1 | Markers are `<button>`; scroll region is focusable |
| 2.4.7 | `:focus-visible` rings on markers and scrollport |
| 4.1.2 | `aria-label` on markers; `role="tooltip"` + `aria-describedby` |

### axe notes

`PayoutTimeline.test.tsx` and `PayoutSchedule.test.tsx` run `jest-axe` for LTR
and RTL (timeline) and the page composition. Expect **zero violations**.

```bash
npx vitest run src/components/PayoutTimeline src/pages/PayoutSchedule.test.tsx
```

---

## Responsive & edge cases

| Case | Behaviour |
|---|---|
| ≤640px | Shorter `--pt-track-min`, denser markers; horizontal RTL scroll retained |
| Very long durations | Extra events get fixed flex basis → wide scroll width |
| Mobile RTL scroll | Same scrollport; swipe toward inline-start |
| Dark mode | Tooltip border/opacity boost; today line full opacity |
| Empty events | Component returns `null`; page shows EmptyState |
| `prefers-reduced-motion` | `scroll-behavior: auto`; instant `scrollIntoView` |

---

## Integration

| File | Role |
|---|---|
| `src/pages/PayoutSchedule.tsx` | Demo events + empty state |
| `src/components/PayoutTimeline/*` | Design-system timeline |

---

## Test Coverage

| File | Focus |
|---|---|
| `PayoutTimeline.test.tsx` | Helpers, order, today %, scroll, tooltips, axe LTR/RTL, side-by-side |
| `PayoutSchedule.test.tsx` | Demo data, empty state, axe |

Thresholds: ≥95% on `PayoutTimeline.tsx` and `PayoutSchedule.tsx`.

---

## Files Changed

| Path | Change |
|---|---|
| `src/components/PayoutTimeline/*` | New component + CSS + tests |
| `src/pages/PayoutSchedule.tsx` | Timeline + demo/empty |
| `src/pages/PayoutSchedule.test.tsx` | Page tests |
| `docs/uiux/ux272-payout-timeline-rtl-mirror.md` | This doc |
| `vite.config.ts` | Coverage include |

---

## Before / After

| Before | After |
|---|---|
| Empty-state-only payout page | Horizontal schedule with today marker |
| No RTL story | Mirrored connectors, tooltips, scroll, dates isolated |
| No axe coverage | LTR + RTL axe green |
