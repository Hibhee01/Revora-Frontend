# UX153: Canonical Status-Timeline Pattern

## Scope

`StatusTimeline` design-system component — a reusable timeline pattern for milestone-based
progress display. Applicable to revenue report lifecycle, offering registration, KYC verification,
and any future workflow requiring ordered step visualisation.

Changes are UI/UX only; no routing, API, or backend behaviour is altered.

---

## Problem Statement

Several views need a status timeline (revenue report lifecycle, offering registration, KYC)
but previously had no shared pattern. Each implementation risked:

| Issue | Detail |
|---|---|
| Inconsistent visuals | Ad-hoc step indicators with no shared state colours |
| No reusable component | Each view would re-implement the same pattern |
| Missing accessibility | No ARIA roles, keyboard nav, or screen-reader support |
| No responsive strategy | Horizontal layouts breaking on mobile viewports |
| No sub-step support | Complex workflows couldn't show nested progress |

---

## Component Architecture

### `StatusTimeline` (named export from `src/components/StatusTimeline`)

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `milestones` | `Milestone[]` | ✅ | — | Ordered array of milestones |
| `orientation` | `'horizontal' \| 'vertical'` | ❌ | `'horizontal'` | Layout direction |
| `ariaLabel` | `string` | ❌ | `'Status timeline'` | Accessible label for the nav region |

### `Milestone` type

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique identifier |
| `label` | `string` | ✅ | Display label |
| `description` | `string` | ❌ | Longer description beneath label |
| `status` | `MilestoneStatus` | ✅ | One of: `completed`, `in-progress`, `blocked`, `pending`, `skipped` |
| `icon` | `ReactNode` | ❌ | Custom icon override |
| `timestamp` | `string` (ISO) | ❌ | Shown as tooltip on hover/focus |
| `subSteps` | `SubStep[]` | ❌ | Collapsible sub-step list |
| `blockedAction` | `BlockedAction` | ❌ | Action badge when status is `blocked` |
| `onChain` | `OnChainMetadata` | ❌ | On-chain badge + metadata tooltip (see UX256) |
| `onchainRejection` | `OnchainRejectionCardProps` | ❌ | On-chain rejection card when status is `blocked` (see UX229) |

### `SubStep` type

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique identifier |
| `label` | `string` | ✅ | Display label |
| `status` | `'completed' \| 'pending' \| 'blocked'` | ✅ | Sub-step status |

### `BlockedAction` type

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | ✅ | Action button label |
| `onClick` | `() => void` | ✅ | Callback on click |

---

## State Visuals

### Milestone Markers

| Status | Background | Border | Icon | Effect |
|---|---|---|---|---|
| `completed` | Green 12% | `#10b981` solid | ✓ Check | Green glow ring |
| `in-progress` | Blue 12% | `#3b82f6` solid | ● Loader | Pulse animation |
| `blocked` | Red 12% | Red 50% solid | ▲ Alert | Red glow ring |
| `pending` | Slate 8% | Slate 25% solid | ○ Circle | No effect |
| `skipped` | Slate 8% | Slate 25% dashed | — Minus | Reduced opacity |

### Connector Lines

| From → To | Visual |
|---|---|
| completed → completed | Solid green |
| completed → in-progress | Green-to-blue gradient |
| any → blocked | Red |
| any → pending | Muted slate |

---

## Design System Tokens Added (`index.css → :root`)

| Token | Value | Usage |
|---|---|---|
| `--st-gap` | `1.5rem` | Gap between milestones |
| `--st-marker-size` | `2.5rem` | Milestone marker diameter |
| `--st-connector-width` | `2px` | Connector line thickness |
| `--st-milestone-min-w` | `8rem` | Min width per milestone (horizontal) |
| `--st-content-gap` | `0.75rem` | Gap between marker and content (vertical) |
| `--st-completed-bg` | `rgba(16, 185, 129, 0.12)` | Completed marker background |
| `--st-completed-border` | `#10b981` | Completed ring & connector colour |
| `--st-completed-fg` | `#10b981` | Completed icon colour |
| `--st-progress-bg` | `rgba(59, 130, 246, 0.12)` | In-progress marker background |
| `--st-progress-border` | `#3b82f6` | In-progress ring & connector colour |
| `--st-progress-fg` | `#3b82f6` | In-progress icon colour |
| `--st-blocked-bg` | `rgba(239, 68, 68, 0.12)` | Blocked marker background |
| `--st-blocked-border` | `rgba(239, 68, 68, 0.5)` | Blocked ring colour |
| `--st-blocked-fg` | `#ef4444` | Blocked icon colour |
| `--st-pending-bg` | `rgba(148, 163, 184, 0.08)` | Pending marker background |
| `--st-pending-border` | `rgba(148, 163, 184, 0.25)` | Pending ring & connector colour |
| `--st-pending-fg` | `#94a3b8` | Pending icon colour |

---

## CSS Component Classes

| Class | Applied to | Purpose |
|---|---|---|
| `.status-timeline` | Root `<nav>` | Flex container |
| `.status-timeline--horizontal` | Root (modifier) | Horizontal layout |
| `.status-timeline--vertical` | Root (modifier) | Vertical layout |
| `.st-milestone` | Milestone wrapper | Flex item containing marker + content |
| `.st-marker` | Marker circle | Base circular marker styles |
| `.st-marker--{status}` | Marker (modifier) | Status-specific colours & effects |
| `.st-connector` | Connector line | Positioned line between milestones |
| `.st-connector--{status}` | Connector (modifier) | Status-specific line colours |
| `.st-content` | Content wrapper | Label, description, sub-steps |
| `.st-label` | Label `<span>` | Milestone label typography |
| `.st-description` | Description `<span>` | Muted description text |
| `.st-timestamp-trigger` | Tooltip trigger | Wrapper for hover/focus tooltip |
| `.st-timestamp-tooltip` | Tooltip | Glassmorphic floating tooltip |
| `.st-substeps` | Sub-step `<ul>` | Collapsible sub-step list |
| `.st-substep` | Sub-step `<li>` | Individual sub-step row |
| `.st-substeps-toggle` | Toggle button | Expand/collapse sub-steps |
| `.st-blocked-action` | Action badge | Blocked milestone call-to-action |

---

## Layout — Horizontal

```
┌─ <nav.status-timeline.status-timeline--horizontal> ─────────────────────────────────┐
│                                                                                       │
│   [●]──────────[●]──────────[●]──────────[○]──────────[○]                            │
│  Draft     Submitted   Under Review   Payout Calc   Distributed                      │
│                         ▼ 3 sub-steps                                                 │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Layout — Vertical

```
┌─ <nav.status-timeline.status-timeline--vertical> ──────────────────┐
│                                                                     │
│  [●]  Draft                                                         │
│   │    Prepare your revenue figures                                 │
│   │                                                                 │
│  [●]  Submitted                                                     │
│   │    Report sent for verification                                 │
│   │                                                                 │
│  [●]  Under Review                                                  │
│   │    Accounting team reviewing                                    │
│   │    ▶ Show 3 sub-steps                                          │
│   │                                                                 │
│  [○]  Payout Calculated                                             │
│   │    RevenueShare amounts finalised                               │
│   │                                                                 │
│  [○]  Distributed                                                   │
│        Payouts sent via smart contract                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Concrete Contexts

### 1. Revenue Report Lifecycle

**File:** `src/components/StatusTimeline/presets.ts` → `getRevenueReportMilestones(stage)`

| Milestone | Description |
|---|---|
| Draft | Prepare your revenue figures |
| Submitted | Report sent for verification |
| Under Review | Accounting team reviewing (3 sub-steps) |
| Payout Calculated | RevenueShare amounts finalised |
| Distributed | Payouts sent via smart contract |

**Usage:**

```tsx
import { StatusTimeline } from '../components/StatusTimeline';
import { getRevenueReportMilestones } from '../components/StatusTimeline/presets';

<StatusTimeline
  milestones={getRevenueReportMilestones('under-review')}
  ariaLabel="Revenue report progress"
/>
```

### 2. Offering Registration Flow

**File:** `src/components/StatusTimeline/presets.ts` → `getOfferingRegistrationMilestones(stage, options?)`

| Milestone | Description |
|---|---|
| Application | Submit offering details |
| KYC Check | Identity & business verification (can be blocked) |
| Compliance Review | Regulatory compliance review (2 sub-steps) |
| Listed | Offering published to portal |
| Funding Open | Accepting investor capital |

Supports `kycBlocked` option which shows a blocked state with an action badge.

### 3. KYC Verification Pipeline

**File:** `src/components/StatusTimeline/presets.ts` → `getKycVerificationMilestones(stage, options?)`

| Milestone | Description |
|---|---|
| ID Upload | Government-issued ID document |
| Liveness Check | Video selfie verification (can be skipped) |
| Address Proof | Utility bill or bank statement (can be blocked) |
| AML Screening | Anti-money laundering check |
| Approved | KYC verification complete |

Supports `livenessSkipped` and `addressBlocked` options.

### 4. On-Chain Transaction & Rejection Flow

**File:** `src/components/StatusTimeline/presets.ts` → `getOnchainRejectionMilestones(reason, options?)`

| Milestone | Description |
|---|---|
| Payout Prepared | Transaction parameters & recipient balances compiled |
| On-Chain Execution | Transaction submitted to blockchain network (renders `OnchainRejectionCard` when blocked) |
| Settlement Confirmed | Block confirmation and token transfer finalized |

Supports `insufficient-gas`, `nonce-mismatch`, `slippage-exceeded`, `user-rejected`, `execution-reverted`, and `unknown` rejection reason codes with calm illustration, plain-language error copy, and primary CTA `"Retry with adjusted gas"`.

---

## ARIA & Accessibility

| Element | Role / Attribute | Rationale |
|---|---|---|
| Root `<nav>` | `role="navigation"` + `aria-label` | Landmark region for the timeline |
| Milestone marker | `role="img"` + `aria-label="{label}: {status}"` | Communicates milestone name and status |
| Timestamp tooltip | `role="tooltip"` + `aria-describedby` | Links marker to its timestamp |
| Sub-steps toggle | `aria-expanded` + `aria-controls` | Standard disclosure pattern |
| Sub-steps list | `role="list"` + `aria-label` | Semantic list of sub-steps |
| Blocked action | `aria-label="Action required: {label}"` | Clear call-to-action for AT |
| Decorative icons | `aria-hidden="true"` | Excluded from AT tree |

### WCAG 2.1 AA Mapping

| SC | Description | How addressed |
|---|---|---|
| 1.3.1 Info and Relationships | Structure programmatically determinable | `<nav>`, `role="img"`, `aria-label`, heading hierarchy |
| 1.4.3 Contrast Minimum | Text ≥4.5:1 | All state colours meet contrast on `--bg-color` (#020617) |
| 1.4.11 Non-text Contrast | UI components ≥3:1 | Marker borders meet 3:1 against background |
| 2.1.1 Keyboard | All interactive elements keyboard-accessible | Disclosure toggle, blocked action are native buttons |
| 2.4.7 Focus Visible | Focus indicators visible | Inherited `:focus-visible` rules + component-specific |
| 2.5.5 Target Size | Touch targets ≥44×44 CSS px (enhanced) | Markers 40px, buttons meet minimum |
| 4.1.2 Name, Role, Value | Name and role for all UI | `aria-label` on markers, buttons; `aria-expanded` on toggle |

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- In-progress pulse animation is disabled
- All transitions are removed
- Static icons remain visible

---

## Responsive Behaviour

| Viewport | Layout |
|---|---|
| ≤ 640px | Horizontal timeline auto-reflows to vertical |
| 641–1023px | Horizontal with condensed spacing |
| ≥ 1024px | Full horizontal layout with descriptions |

The vertical layout is always available via `orientation="vertical"` prop.

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Blocked-with-action | Red marker + action badge button |
| Skipped milestone | Dashed border, reduced opacity, strike-through label |
| Mobile vertical reflow | Horizontal auto-reflows to vertical below 640px |
| Keyboard navigation | Tab through disclosure toggles and blocked actions |
| Single milestone | Renders with no connectors |
| All completed | All green markers with completed connectors |
| Empty milestones array | Renders empty `<nav>` element |

---

## Implementation Notes

- `useId()` generates stable, unique IDs for `aria-describedby` / `aria-controls` linking.
- Sub-step disclosure uses the standard `aria-expanded` + `aria-controls` pattern.
- Connector state is derived from the status of adjacent milestones, not stored separately.
- Timestamp formatting uses `Intl.DateTimeFormat` with graceful fallback.
- Preset factory functions (`presets.ts`) compute milestone statuses dynamically from the current stage, making them easy to use with real-time data.
- No new dependencies required — uses existing `lucide-react` icons.

---

## Files Changed

| File | Change |
|---|---|
| `src/index.css` | Added `--st-*` design tokens to `:root` |
| `src/components/StatusTimeline/StatusTimeline.tsx` | New component |
| `src/components/StatusTimeline/StatusTimeline.css` | New styles |
| `src/components/StatusTimeline/index.ts` | Barrel export |
| `src/components/StatusTimeline/presets.ts` | Three context-specific preset factories |
| `docs/uiux/ux153-status-timeline-pattern.md` | This documentation |
