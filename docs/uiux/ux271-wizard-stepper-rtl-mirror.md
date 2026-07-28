# UX271: Wizard Stepper RTL Mirror Pass

## Scope

Design-system `WizardStepper` — the canonical progress indicator for multi-step
wizards hosted under `AppShell` (e.g. Two-Factor setup). This pass makes the
stepper flow **right-to-left** in RTL locales: mirrored connectors, mirrored
progress fill (extends from the right), while **preserving numeric sequence**
and LTR digit formatting per Unicode bidi rules.

Changes are UI/UX only; no routing, API, or backend behaviour is altered.

---

## Problem Statement

| Issue | Detail |
|---|---|
| Physical CSS | Left/right connectors and `to right` gradients do not mirror under `dir="rtl"` |
| Digit mirroring | Arabic locales must not reverse step numbers (`1 2 3` stays `1 2 3`) |
| Missing styles | Legacy `.tfa-steps` markup had no CSS; wizards looked broken |
| Progress direction | Users expect fills to grow from the **inline-start** edge (right in RTL) |
| Docs gap | No LTR/RTL side-by-side examples for wizard progress |

---

## Component Architecture

### `WizardStepper` (`src/components/WizardStepper`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `WizardStep[]` | — | Ordered steps (document order never reversed) |
| `currentIndex` | `number` | — | 0-based active step |
| `ariaLabel` | `string` | `'Wizard progress'` | Nav accessible name |
| `showProgressTrack` | `boolean` | `true` | Continuous track under the row |
| `className` | `string` | `''` | Optional wrapper class |

### `WizardStep`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable React key |
| `label` | `string` | May be LTR, RTL, or mixed-direction |
| `number` | `number?` | Badge; defaults to 1-based index; always LTR-isolated |

### Helpers

- `getStepState(index, currentIndex)` → `'completed' \| 'active' \| 'pending'`
- `getWizardProgressPercent(currentIndex, total)` → `0–100`

---

## RTL Technique

| Concern | Approach |
|---|---|
| Step row direction | Flex row + logical layout; **no DOM reversal** |
| Connectors | `inset-inline-start` / `inset-inline-end` between markers |
| Active connector gradient | LTR `to right`; RTL override `to left` |
| Progress fill | `inset-inline-start: 0` + width `%`; RTL gradient mirrored |
| Numeric badges | `dir="ltr"` + `unicode-bidi: isolate` + tabular nums |
| Mixed titles | `unicode-bidi: plaintext` on labels |
| Directional icons | Existing `.icon-rtl` (`scaleX(-1)`) on chevrons |
| Vertical timeline parity | StatusTimeline vertical connectors use RTL `translateX` fix |

### Numeric-label bidi rules

1. Step indices and “N of M” counters are **weak** characters; wrap them in an
   LTR isolate so adjacent Arabic text cannot reorder digits.
2. Prefer Western digits (`1–9`) for wizard indices (consistency with product
   analytics and support scripts).
3. Do **not** reverse the sequence visually — step 1 remains the first milestone
   in document order; only the **layout** mirrors.

```html
<span class="wizard-stepper__num" dir="ltr">2</span>
```

```css
.wizard-stepper__num {
  direction: ltr;
  unicode-bidi: isolate;
  font-variant-numeric: tabular-nums;
}
```

---

## LTR / RTL Side-by-Side

```
LTR (dir="ltr")                         RTL (dir="rtl")
┌────────────────────────────────┐      ┌────────────────────────────────┐
│ ████░░░░  50%                  │      │                  ░░░░████ 50% │
│                                │      │                                │
│ (1)───(2)───(3)                │      │                (3)───(2)───(1) │
│  ✓     ●     ○                 │      │                 ○     ●     ✓ │
│ Start  Now   Done              │      │              Done   Now  Start │
│                                │      │                                │
│ Step 2 of 3: Now               │      │              Step 2 of 3: Now  │
└────────────────────────────────┐      └────────────────────────────────┘
```

Notes:

- Marker **numbers** read `1`, `2`, `3` in both panels (LTR isolate).
- Visual **flow** of connectors and fill mirrors; completed work sits toward
  inline-start (left in LTR, right in RTL).
- Screen readers still hear “Step 1, Step 2, Step 3” in document order.

Interactive smoke test in unit suite: mounts both panels under
`data-testid="ltr-panel"` / `rtl-panel`.

---

## Accessibility (WCAG 2.1 AA)

| Criterion | How we meet it |
|---|---|
| 1.3.1 Info & Relationships | `<nav>` + `<ol>` / `<li>`; `aria-current="step"` on active |
| 1.3.2 Meaningful Sequence | Source order preserved; CSS-only mirror |
| 1.4.3 Contrast | Active/completed markers use brand greens/blues on dark surfaces |
| 2.4.6 Headings & Labels | `aria-label` on nav; polite live status line |
| 4.1.2 Name, Role, Value | Track exposes `role="progressbar"` + valuemin/max/now |
| 2.3.3 Animation | `prefers-reduced-motion` disables fill transition |

### axe notes

`WizardStepper.test.tsx` runs `jest-axe` for both `dir="ltr"` and `dir="rtl"`
wrappers. Expected: **zero violations**. Re-run after visual changes:

```bash
npx vitest run src/components/WizardStepper/WizardStepper.test.tsx
```

---

## Responsive

| Breakpoint | Behaviour |
|---|---|
| `> 640px` | Markers + truncated labels + status line |
| `≤ 640px` | Compact markers; **hide** per-step labels; keep status line + track |

---

## Integration

| Consumer | Change |
|---|---|
| `TwoFactorSetup` | Replaced inline `StepIndicator` with `WizardStepper` |
| `ProgressBar` | Flex `justify-content: start` so determinate fills pack to inline-start |
| `StatusTimeline` | Vertical connector RTL centering fix |
| AppShell-hosted pages | Use `.wizard-stepper` inside shell content; tighter margin via `.app-shell .wizard-stepper` |

---

## Test Coverage

**File:** `src/components/WizardStepper/WizardStepper.test.tsx`

| Case | Verifies |
|---|---|
| State helpers | completed / active / pending + progress % |
| `aria-current` | Active step only |
| Document order | Unchanged under `dir="rtl"` |
| Numeric `dir="ltr"` | All `.wizard-stepper__num` |
| Progress CSS var | `--ws-progress` updates |
| Mixed-direction titles | Arabic + Latin labels |
| axe LTR / RTL | No violations |
| Side-by-side panels | Both dirs mount |

Coverage thresholds enforced for `WizardStepper.tsx` (≥95%).

---

## Files Changed

| Path | Role |
|---|---|
| `src/components/WizardStepper/*` | New design-system stepper |
| `src/components/TwoFactorSetup.tsx` | Consumes WizardStepper; `.icon-rtl` on chevrons |
| `src/components/StatusTimeline/StatusTimeline.css` | Vertical connector RTL fix |
| `src/index.css` | ProgressBar inline-start fill |
| `docs/uiux/ux271-wizard-stepper-rtl-mirror.md` | This document |
| `vite.config.ts` | Coverage include + thresholds |

---

## Before / After

| Before | After |
|---|---|
| Unstyled `.tfa-steps` dots | Full marker / connector / track system |
| No RTL gradient overrides | `[dir="rtl"]` mirrored connector + fill gradients |
| Digits could bidi-reorder | Isolated LTR numeric badges |
| No axe coverage on stepper | LTR + RTL axe assertions |
