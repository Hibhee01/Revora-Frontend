# Design: Error Recovery Side Panel

## Description
Beyond inline banners, this pull request introduces a dedicated persistent side-panel that lists all recoverable snapshots (unsent forms, unfinished uploads, failed txs).

The panel is accessible from a global toolbar affordance in the `AppShell` with an unread count badge. It groups snapshots by category and allows users to either retry or discard individual actions. A global "clear all" option is also provided for convenience.

## Changes Included
* **State Management**: Added `useErrorSnapshots` hook for persisting and managing error states, replacing the ephemeral lifecycle of inline banners for these specific errors.
* **Component `ErrorRecoveryPanel`**: Designed with grouped rows, empty and error states, and responsive behavior for mobile.
* **AppShell Integration**: Drafted the toolbar affordance button (`⚠️`) with a real-time unread badge, linking directly to the side panel toggle.
* **Testing & Accessibility**: Added comprehensive tests ensuring WCAG 2.1 AA compliance (ARIA attributes, keyboard navigation, focus trap) and test coverage across the hook and UI components.

## Edge Cases Covered
* **Old Snapshots**: Addressed by displaying timestamp tracking for each snapshot.
* **Cross-device sync**: Currently mocked via module-level state, easily extendable to context or backend sync in the future.
* **RTL Orientation**: Explicit styles added in `ErrorRecoveryPanel.css` ensuring correct slide-in and layout when `[dir="rtl"]` is applied.

Closes #[Issue_Number]
