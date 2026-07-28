# Distribution Payout Drill-Down Side Panel — Issue #213

## Overview

The **Distribution Payout Drill-Down Side Panel** (`PayoutDrillDownPanel`) allows operations staff to click any payout row within the Distribution Dashboard (`src/pages/DistributionDashboard.tsx`) to inspect itemized recipient wallet allocations, gas fee breakdowns, retry history, smart contract execution logs, and next-payout scheduling without full page navigation.

---

## Design Rationale & UX Goals

1. **Context Retention**: Ops staff frequently review distribution status across multiple offerings. Switching full pages to view recipient lists or gas fee spikes interrupts workflows. A slide-over panel keeps the primary table visible in the background.
2. **Resizable Panel Chrome**: Screen sizes and ops preferences vary. The panel allows fluid width adjustment (between `400px` min and `900px` max, default `580px`) via a left-edge drag handle, persisting user width choices in `localStorage` under `revora_payout_panel_width`.
3. **Comprehensive Section Anatomy**:
   - **Header**: Payout ID badge, execution status pill, gross total amount, quick copy ID button, Etherscan link, and close button.
   - **Tabbed Body**:
     - *Overview & Gas*: Gross/net pool breakdown, Gwei gas prices, estimated vs actual variance, protocol maintenance fee, block number, execution network, contract address, and direct "Report Revenue" link for the next payout cycle.
     - *Recipients*: Filterable & searchable list of recipient investor wallet addresses, tier labels, share percentages, net payout amounts, recipient status pills, and gas allocation.
     - *Retry History*: Audit trail timeline of execution attempts, gas price spikes, VM exception messages, and an interactive "Retry Failed Batch" action button.
   - **Footer Action Bar**: Fast operational actions including "Export CSV Statement" and "Close".
4. **WCAG 2.1 AA Accessibility**: Full keyboard support (`Escape` dismissal, focus trap inside panel, focus restoration to clicked row on close, ARIA dialog and tablist roles, keyboard width resizer controls).

---

## Panel Anatomy & Layout Schema

```
+-------------------------------------------------------------------+
|  [||]  Payout #PO-2026-004   [FAILED]             [📋] [↗] [✕]    |  <-- Sticky Header
|        Nexus Cloud Series A • Jul 24, 2026 • $124,500.00          |
+-------------------------------------------------------------------+
| [ Overview & Gas ]  [ Recipients (48) ]  [ Retry History (1) ]    |  <-- Accessible Tablist
+-------------------------------------------------------------------+
|                                                                   |
|   GROSS AMOUNT           NET DISTRIBUTED                          |
|   $124,500.00            $121,387.50                              |
|                                                                   |
|   ⚡ Gas & Protocol Fees                                         |
|   - Actual Gas Spent: $42.15 (0.0125 ETH)                         |
|   - Gas Price: 24.5 Gwei                                          |
|   - Estimated Variance: $45.00 (26.0 Gwei)                        |
|   - Protocol Maintenance Fee: $3,112.50                           |
|                                                                   |
|   🔗 On-Chain Execution                                           |
|   - Network: Ethereum Mainnet                                     |
|   - Block Number: #20485912                                       |
|   - Contract: 0x71C7656E...8976F                                  |
|   - Tx Hash: 0x3a91b8d8...4092 ↗                                  |
|                                                                   |
|   +-----------------------------------------------------------+   |
|   | Next Scheduled Payout: Aug 24, 2026 • Est. $130,000.00    |   |  <-- Next-payout link
|   |                                       [ Report Revenue ↗ ]|   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+-------------------------------------------------------------------+
| [📥 Export CSV Statement]                                 [Close] |  <-- Sticky Footer
+-------------------------------------------------------------------+
   ^
   Drag Handle (Left Edge, Resizable 400px - 900px)
```

---

## Technical Architecture & State Management

### Component Structure
- `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.tsx`: Primary dialog component with focus trap, tab navigation, drag resizer, copy clipboard, and audit history.
- `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.css`: Glassmorphic styling, design tokens, responsive modal overrides (`< 768px`), dark mode aesthetics, and print rules.
- `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.types.ts`: TypeScript interfaces for `PayoutDetail`, `RecipientItem`, `RetryEvent`, and props.
- `src/pages/DistributionDashboard.tsx`: Operations dashboard with summary metrics, payout data table, search/filter controls, and side panel integration.

### Resizable Width Persistence
The panel reads and writes width preferences to `localStorage`:
```typescript
const STORAGE_KEY_WIDTH = 'revora_payout_panel_width';
// Min: 400px, Max: 900px, Default: 580px
```
- Dragging the left resizer handle updates `panelWidth` in real time.
- Mouse up or keyboard arrow adjustment (`ArrowLeft`/`ArrowRight` on the resizer handle) saves the clamped value.

---

## Dismissal & Focus Return Patterns

1. **Close Triggering**:
   - Clicking header close button (`✕`)
   - Clicking footer "Close" button
   - Clicking semi-transparent backdrop overlay (`.payout-panel-overlay`)
   - Pressing `Escape` key at any point
2. **Focus Management & Trap**:
   - Upon opening, the previously focused element (`document.activeElement` or `triggerRef`) is stored in `previousFocusRef`.
   - Initial focus moves to the header close button (`closeBtnRef`).
   - Focus is trapped within the panel using a `Tab` / `Shift+Tab` keyboard listener that wraps focus between first and last focusable elements inside `panelRef`.
   - Upon closing, focus is automatically restored to the `triggerRef` (the inspect button / table row that opened the panel).

---

## Accessibility Checklist (WCAG 2.1 AA)

| Criteria | Implementation | Status |
|----------|----------------|--------|
| **Dialog Semantics** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="payout-panel-title"` | Pass |
| **Focus Restoration** | Stores `activeElement` on open, returns focus on close | Pass |
| **Keyboard Navigation** | `Escape` key closes panel; `ArrowLeft`/`ArrowRight` resizes width & switches tabs | Pass |
| **Focus Trap** | Tab cycles within active panel controls | Pass |
| **Axe Core Audit** | `jest-axe` tests return zero violations | Pass |
| **Contrast Ratio** | Text colors adhere to 4.5:1 minimum on glass dark mode background | Pass |
| **Reduced Motion** | `@media (prefers-reduced-motion: reduce)` disables slide animation | Pass |
| **Touch Targets** | All interactive buttons meet 44x44px target area on mobile | Pass |

---

## States & Edge Cases

1. **Loading Skeleton State (`loading={true}`)**:
   - Displays shimmering placeholder blocks while payout details are fetched from the API.
2. **Network Error State (`error="..."`)**:
   - Displays warning icon, error description, and a "Retry Loading" action button.
3. **Empty Recipient Search**:
   - When filtering recipients in Tab 2, entering a search term with no matches displays a friendly empty state message.
4. **Mobile Responsiveness (`< 768px`)**:
   - Resizer handle is hidden and panel transitions to a full-width (`100vw`) responsive bottom/side drawer with single-column metric grids.
5. **Print Styles**:
   - `@media print` explicitly hides overlay and panel to prevent print obstruction.

---

## File Summary

| File Path | Description |
|-----------|-------------|
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.tsx` | Main drill-down panel component |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.css` | Styles, tokens, responsive overrides, and animations |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.types.ts` | TypeScript interfaces |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.test.tsx` | Unit tests & accessibility assertions (>95% coverage) |
| `src/components/PayoutDrillDownPanel/index.ts` | Barrel export file |
| `src/pages/DistributionDashboard.tsx` | Enhanced operational dashboard |
| `src/pages/DistributionDashboard.test.tsx` | Unit tests for distribution dashboard |
| `docs/uiux/ux213-distribution-payout-drill-down-panel.md` | Design system documentation |
