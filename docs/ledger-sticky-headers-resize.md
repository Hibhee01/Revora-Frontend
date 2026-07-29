# Ledger: Sticky Headers & Column Resize (Design Spec)

Status: Draft

Purpose
- Keep column headers visible while scrolling long ledgers.
- Provide drag-to-resize and keyboard resize alternatives.
- Persist column widths per-user and per-view.

Anatomy
- Header cell: label, optional sort indicator, resize handle (12px wide). The handle is keyboard-focusable and has `role="separator"`.
- Resize handle visuals: 2px vertical grab line + hit target expanding to 12px; visible focus ring.

Interactions
- Mouse: drag handle horizontally to resize; constrained by min/max widths.
- Keyboard: Tab into the header handle, then use Left/Right arrows to shrink/grow by 8px. Hold Shift to change by 1px.
- Accessible name: "Resize column {columnName}".

Persistence
- Store widths in per-user settings keyed by view id (e.g. `ledger:activeView:v1`) via API or localStorage fallback.
- Provide API endpoint to save/retrieve widths for long-term persistence and cross-device sync.

Reset affordance
- Add "Reset column widths" action in the table's kebab/menu. Confirmation: none (instant reset) with an undo toast.

Accessibility
- Ensure keyboard focus, ARIA labels, and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` on the handle.
- Test with screen readers and RTL layouts.

Edge cases
- Very narrow columns clamp to 36px min.
- Virtualized list: ensure header remains sticky and in sync with column alignments.

Next steps
- Implement `src/pages/Ledger.tsx` header cell and resize hook.
- Add unit + visual tests and axe accessibility tests.
