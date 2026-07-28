# UX256: On-Chain Status Badge Tooltip

## Scope

`OnChainStatusBadge` — design-system pattern for surfacing ledger metadata beside
`StatusTimeline` milestones (and anywhere an on-chain confirmation badge is needed).

Issue #256. UI/UX only; no API or routing changes.

---

## Problem

Completed workflow steps often have an on-chain anchor (block, transaction hash,
confirmations, time since inclusion). A compact badge must expose that metadata on
hover/focus without cluttering the timeline, remain usable on touch devices, and
support copy + explorer navigation with accessible feedback.

---

## Component

**Export:** `OnChainStatusBadge` from `src/components/StatusTimeline`

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `metadata` | `OnChainMetadata` | ✅ | — | Block/hash/confirmations/timestamp |
| `ariaLabel` | `string` | ❌ | `'On-chain confirmation details'` | Accessible name for badge trigger |

### `OnChainMetadata`

| Field | Type | Description |
|---|---|---|
| `blockNumber` | `number \| string` | Ledger sequence; formatted with grouping |
| `transactionHash` | `string` | Full hash; truncated in UI |
| `confirmations` | `number` | Confirmation count |
| `confirmedAt` | `string` (ISO) | Used for relative “time since” |
| `explorerUrl` | `string` | Overrides default explorer link |
| `network` | `'testnet' \| 'public'` | Stellar Expert network segment |

### StatusTimeline integration

Add optional `onChain?: OnChainMetadata` to `Milestone`. When present, the badge
renders inline with the milestone label (`.st-label-row`).

---

## Layout

Two-column metadata grid inside a glassmorphic panel:

| Column 1 | Column 2 |
|---|---|
| Block (+ copy) | Hash (+ copy, truncated) |
| Confirmations | Time since |

Footer: **Open in explorer** (external link) when URL resolves.

On viewports ≤480px the grid collapses to a single column.

---

## Hash truncation

- Display: first **6** + `…` + last **4** characters (`truncateHash`).
- Copy: always writes the **full** hash.
- Copy button shows a check icon for ~2s after success.

---

## Interaction modes

| Input | Behavior |
|---|---|
| `(pointer: fine)` + hover/focus-within | Tooltip panel visible (`opacity` transition) |
| `(pointer: coarse)` | Badge toggles popover; `aria-expanded` on trigger |
| Escape (popover open) | Closes popover |

Touch devices disable hover-open via `@media (hover: none)` so panels do not stick.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Name | `aria-label` on badge trigger |
| Description | Panel `role="tooltip"` linked via `aria-controls` |
| Copy feedback | `role="status"` + `aria-live="polite"` |
| Keyboard | Focus-visible rings on badge and copy buttons |
| Explorer | `rel="noopener noreferrer"`, visible link text |
| Reduced motion | Transitions disabled under `prefers-reduced-motion` |

### axe

`OnChainStatusBadge.test.tsx` runs `jest-axe` on a fully populated badge.

---

## Edge cases

| Case | UI |
|---|---|
| Missing block/hash/confirmations/time | Em dash (`—`); copy disabled |
| Very long block numbers | Tabular nums + `overflow-wrap: anywhere` |
| RTL (`dir="rtl"`) | Logical positioning for panel anchor |
| No explorer URL/hash | Disabled “Explorer link unavailable” text |

---

## Design tokens (`index.css`)

| Token | Usage |
|---|---|
| `--ocb-badge-*` | Badge colours, padding, focus ring |
| `--ocb-panel-width` | Max tooltip width (18rem) |

Styles: `OnChainStatusBadge.css`

---

## Files

| File | Purpose |
|---|---|
| `OnChainStatusBadge.tsx` | Component |
| `OnChainStatusBadge.css` | Layout + responsive/touch variants |
| `onChainMetadataUtils.ts` | Truncation, formatting, explorer URL |
| `OnChainStatusBadge.test.tsx` | Component + axe tests |
| `onChainMetadataUtils.test.ts` | Formatter unit tests |
| `StatusTimeline.test.tsx` | Milestone integration smoke test |

---

## Before / after (visual)

**Before:** Milestone labels showed no ledger context; users copied hashes from devtools or external tools.

**After:** A green “On-chain” pill beside the label opens a two-column metadata panel with copy actions and Stellar Expert link.

---

## Example

```tsx
import { StatusTimeline } from '../components/StatusTimeline';

<StatusTimeline
  milestones={[
    {
      id: 'anchored',
      label: 'Anchored on ledger',
      status: 'completed',
      onChain: {
        blockNumber: 55001234,
        transactionHash: 'a1b2c3…full hash…',
        confirmations: 128,
        confirmedAt: new Date().toISOString(),
        network: 'public',
      },
    },
  ]}
/>
```
