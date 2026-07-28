# UX221: Per-Payout Status Pills with Tooltip Semantics

## Scope

Status pills on the Payout Schedule previously overloaded colour to convey
meaning. This design introduces a **canonical status set** with tokens, labeled
icons, and screen-reader-first tooltips so meaning survives high-contrast
modes, print, and assistive tech.

| File | Role |
|---|---|
| `src/components/PayoutStatusPill/payoutStatuses.ts` | Canonical statuses, tones, copy, normalize helpers |
| `src/components/PayoutStatusPill/PayoutStatusPill.tsx` | Compact / full pill + ESC-dismissible tooltip |
| `src/components/PayoutStatusPill/PayoutStatusPill.css` | Tokens, density, forced-colors, print, reduced-motion |
| `src/pages/PayoutSchedule.tsx` | Legend + schedule table hosting the pills |

Route: `/investor/payouts`.

## Problem Statement

Colour-only pills fail WCAG 1.4.1 (Use of Color) and leave screen-reader users
without context. Hover-only tooltips fail keyboard users. Print and
high-contrast modes often strip colour, leaving an unlabeled blob.

## Solution

### Canonical status set

| Status | Label | Tone | Icon | Tooltip summary |
|---|---|---|---|---|
| `scheduled` | Scheduled | neutral | calendar | Future distribution; no funds moved |
| `preparing` | Preparing | info | package | Assembling batch / verifying recipients |
| `sending` | Sending | progress | send | Submitted to Stellar; awaiting confirmation |
| `confirmed` | Confirmed | success | check | On-chain; funds delivered |
| `retrying` | Retrying | warning | refresh | Auto-retry after a failed send |
| `failed` | Failed | danger | x | Failed after retries; needs attention |
| `canceled` | Canceled | muted | ban | Will not be sent |

British spelling `cancelled` normalises to `canceled`. Unknown values fall
back to `scheduled` rather than inventing free-form pills.

### Compact and full variants

- **compact** — icon + label; density-token padding for dense table rows.
- **full** — slightly larger face; optional `detail` secondary line
  (e.g. “Ledger #4821”). Used in the status legend.

### Tooltip ARIA pattern

```
<span tabindex="0" aria-describedby="{id}">
  <span class="psp-pill-face">[icon] Label</span>
  <span id="{id}" role="tooltip">Long description…</span>
</span>
```

Behaviour:

1. Opens on **pointer hover** and **keyboard focus**.
2. **Escape** dismisses immediately; stays dismissed until hover/focus fully
   clears, then re-entry can open it again.
3. Tooltip content stays in the accessibility tree for `aria-describedby`
   even when visually hidden (opacity 0) — screen-reader-first.
4. Trigger is focusable (`tabIndex={0}`) with a visible `:focus-visible` ring.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` removes the tooltip opacity
transition so show/hide is instant.

### High contrast

- `prefers-contrast: more` — thicker borders.
- `forced-colors: active` — Canvas / ButtonText system colours; icons inherit
  ButtonText so the glyph remains visible when theme colours are overridden.

### Dense rows

Compact pills consume `--density-font-size` / padding tokens. Under
`[data-density="compact"]` padding tightens further for ledger-like tables.

### Print stylesheet

`@media print` forces black-on-white pill faces with a solid border (so status
remains readable without colour), hides tooltips (interactive chrome), and
avoids breaking the legend across pages.

## Accessibility (WCAG 2.1 AA)

- Icon **and** text label on every pill (1.4.1 Use of Color).
- Focusable trigger + Escape dismiss (2.1.1 Keyboard / tooltip pattern).
- `role="tooltip"` + `aria-describedby` (4.1.2 Name, Role, Value).
- Visible focus ring (2.4.7 Focus Visible).
- Logical CSS properties; arrow/position RTL-safe.
- axe: **0 violations** on the pill set and the full Payout Schedule page.

## Usage Examples

```tsx
{/* Dense table cell */}
<PayoutStatusPill status="sending" variant="compact" />

{/* Detail view */}
<PayoutStatusPill
  status="confirmed"
  variant="full"
  detail="Ledger #4821"
/>

{/* Raw / alias input */}
<PayoutStatusPill status="cancelled" /> {/* → Canceled */}
```

## Integration Map

- `src/App.tsx` — route `/investor/payouts` + Home link.
- Reuses density tokens (`--density-*`), glass-card, lucide icons.
- Aligns severity vocabulary with ComplianceHoldBanner / StatusTimeline tones.

## Testing

```bash
npx vitest run src/components/PayoutStatusPill src/pages/PayoutSchedule.test.tsx
```

Covers: taxonomy + normalisation, compact/full, hover + focus tooltips, ESC
dismiss, tooltip override, density markup, RTL, schedule page legend/table,
empty state, and axe. Coverage gated at **95%** in `vite.config.ts`.

## Before / After

- **Before**: Payout Schedule was an empty-state stub; no status semantics.
- **After**: Legend of all seven statuses (full pills) + schedule table with
  compact, keyboard-reachable, ESC-dismissible tooltips. Verify at
  `/investor/payouts`.

## Security Notes

- Status strings are normalised against an allowlist; unknown values never
  render as free-form labels.
- Tooltip / detail text renders as React text nodes (no HTML injection).
