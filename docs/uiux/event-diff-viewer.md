# Event Diff Viewer — Audit Trail

## Purpose

The Audit Trail event diff viewer helps reviewers understand field-level changes without leaving the activity log. It presents before/after values in a compact, accessible layout that supports long strings, JSON payloads, and redacted content.

## Anatomy

- Toggle button: opens and closes the diff panel for a single audit row.
- Field rows: each row shows a field label and two value columns for before and after.
- Change badges: indicate whether a field was added, removed, or changed.
- Toolbar actions: copy the plain-text diff and download it as a `.txt` file.

## Behavior

- The panel is collapsed by default and can be expanded per row.
- Long values collapse after a threshold and can be expanded inline.
- String values use lightweight inline tokenization for insert/delete/equal differences.
- JSON-like payloads are rendered as pretty-printed text for readability.
- Redacted and binary values are surfaced with explicit labels instead of raw payloads.

## Accessibility

- All controls support keyboard navigation and visible focus indicators.
- The toggle button announces whether the diff is shown or hidden.
- The copy action uses an aria-live region to announce success.
- The layout stacks vertically on narrow screens and retains logical reading order.

## Responsive and print notes

- Below 600px, the panel switches to a stacked single-column layout.
- In print, interactive actions are hidden and the content remains readable as a simple list.

## Implementation notes

- The component lives in [src/components/EventDiffViewer/EventDiffViewer.tsx](src/components/EventDiffViewer/EventDiffViewer.tsx).
- The Audit Trail page integrates it from [src/pages/AuditTrail.tsx](src/pages/AuditTrail.tsx).
