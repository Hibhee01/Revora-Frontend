# PR Documentation — Issue #213: Distribution Payout Drill-Down Side Panel

## Executive Summary
This PR implements an accessible, responsive, and resizable drill-down side panel for payout rows in the Distribution Dashboard (`src/pages/DistributionDashboard.tsx`). Operational staff can now click any payout row to view itemized recipients, gas fees, retry/audit history, and next-payout links without losing context or performing full-page navigation.

---

## Key Features & Capabilities

1. **Resizable Panel Chrome & User Preference Persistence**:
   - Anchored side drawer with a drag handle on the left edge.
   - Adjustable width with bounds (`400px` minimum to `900px` maximum, default `580px`).
   - Width preference saved automatically in `localStorage` (`revora_payout_panel_width`).
   - Keyboard accessible width adjustment (`ArrowLeft` / `ArrowRight` on resizer handle).
   - Semi-transparent backdrop (`.payout-panel-overlay`) supporting click-outside dismissal.

2. **Section Anatomy & Tabbed Navigation**:
   - **Header**: Payout ID badge, status indicator, gross/net totals, quick copy ID, open explorer link, and close button.
   - **Tab 1: Overview & Gas Fees**: Metrics breakdown (gross, net, protocol fees, estimated vs actual gas Gwei & USD), block timestamp, execution network, and direct links to the next payout / revenue report.
   - **Tab 2: Itemized Recipients**: Filterable & searchable recipient list with wallet addresses, tier badges, allocation percentages, recipient payout status, and individual gas allocation. Includes an empty state for zero search results.
   - **Tab 3: Retry & Execution History**: Detailed timeline of dispatch attempts, gas price spikes, smart contract execution logs, error messages (e.g. `OUT_OF_GAS`), and an interactive "Retry Failed Transactions" action with network retry handler.
   - **Footer Action Bar**: Fast actions for ops staff (Export CSV Statement, Retry Failed Batch, View Smart Contract, Close).

3. **Accessibility & WCAG 2.1 AA Compliance**:
   - Proper dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
   - Focus management: focus trapped inside panel when open, returns to triggering row on close.
   - Dismissal via `Escape` key and backdrop click.
   - Full keyboard navigation for tabs (`role="tablist"`, `role="tab"`, `role="tabpanel"`).
   - High contrast themes adhering to WCAG 2.1 AA (4.5:1 minimum text contrast).
   - Reduced motion support (`prefers-reduced-motion: reduce`).

4. **States & Edge Cases Covered**:
   - **Loading State**: Shimmering `PayoutPanelSkeleton` during data fetching.
   - **Error / Network Failure**: `PayoutPanelErrorState` with retry button for handling failed network requests.
   - **Empty States**: Clear messaging when filters return no recipients or retry history.
   - **Tall Content**: Scrollable tab panels with sticky header and footer action bar.

---

## File Changes Overview

| File Path | Description |
|-----------|-------------|
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.tsx` | Main panel component with resizable handle, tabs, header, footer action bar, loading skeleton, error state, and focus trap |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.css` | Comprehensive CSS styles, tokens, animations, responsive design (`< 768px`), dark mode glassmorphism, and print rules |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.types.ts` | TypeScript interfaces for PayoutDetail, RecipientItem, RetryEvent, PanelTabs, etc. |
| `src/components/PayoutDrillDownPanel/PayoutDrillDownPanel.test.tsx` | Unit tests & accessibility (`jest-axe`) test suite reaching >95% coverage |
| `src/pages/DistributionDashboard.tsx` | Enhanced distribution dashboard featuring summary KPIs, payout data table, search/filters, and integration with `PayoutDrillDownPanel` |
| `src/pages/DistributionDashboard.test.tsx` | Unit tests for distribution dashboard row interactions and panel open/close state |
| `docs/uiux/ux213-distribution-payout-drill-down-panel.md` | Design system documentation covering panel chrome, section anatomy, dismissal patterns, and accessibility guidelines |

---

## Verification & Test Results

- **Accessibility**: 0 `jest-axe` violations.
- **Lint**: `npm run lint` clean.
- **Unit & Component Tests**: Minimum 95% test coverage on `PayoutDrillDownPanel` and `DistributionDashboard`.
