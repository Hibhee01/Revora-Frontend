# UX235: Audit Trail Saved Filters & Pinned Searches

## Scope

Saved-filter and pinned-search UX for the Audit Trail
(`/investor/audit-trail`). Auditors can save the current filter combination
under a name (plus optional description), pin frequent searches to a sidebar,
reorder pins, and share any filter combination via URL.

New building blocks (all under `src/components/AuditTrailFilters/`):

| File | Role |
|---|---|
| `savedFilters.ts` | Model: filter state, URL codec, validation, per-user storage, pin/reorder ops |
| `SaveFilterDialog.tsx` | Accessible modal for naming/saving the current filters |
| `PinnedSearchSidebar.tsx` | Pinned-search rail with apply / reorder / unpin / delete |
| `AuditTrailFilters.css` | Feature styles (tokens, logical properties, responsive) |

`src/pages/AuditTrail.tsx` composes these with a filter bar (search, action,
actor, date range) and a results table over mock data.

## Problem Statement

Auditors reuse the same complex filters daily. Rebuilding a five-field
combination each session is slow and error-prone, and there was no way to
hand a colleague "the exact view I'm looking at". The Audit Trail page was a
stub with no filtering at all.

## Solution

### Filter state is URL-first

The URL query string (`?q=…&action=…&actor=…&from=…&to=…`) is the single
source of truth. Typing in the filter bar rewrites the query string
(`replace: true`, so history does not fill with keystrokes), and loading a
link restores the exact view — **shareable by default**. "Copy link" copies
the canonical URL; when the clipboard is blocked the URL is surfaced inline
for manual copy.

### Saved filters are per-user by default

Saved filters persist in `localStorage` under
`revora-audit-saved-filters:<userId>`. There is no auth context in the app
yet, so `getCurrentUserId()` returns a stable local id and is the single
seam to swap for the real session user once auth lands. Malformed stored
entries are dropped defensively; blocked storage (private mode/quota)
degrades to session-only behavior instead of crashing.

### Save dialog

"Save filter" (enabled only when at least one filter is active) opens a
modal with **Name** (required) and **Description** (optional). Validation is
inline: blank name, names > 60 chars, descriptions > 200 chars, and
duplicate names (case-insensitive, trimmed) are rejected with specific copy.
Saving pins the filter and marks it active in the sidebar.

### Pinned-search sidebar rows and reorder controls

- Rows show a pin glyph + name; the row itself applies the filter.
- Per-row controls: **move up / move down / unpin / delete**, grouped under
  `role="group"` labelled "Manage {name}". Reorder is button-based
  (keyboard-first) rather than drag-and-drop; order changes are announced
  via a polite live region ("X moved up to position 2 of 5").
- Boundary buttons disable (first row can't move up, last can't move down).
- The active row gets `aria-current="true"` and a tinted background.

### Empty and overflow states

- **Empty**: guidance copy ("No pinned searches yet…") pointing at Save filter.
- **Overflow**: only the first 5 pins render; the rest collapse behind a
  "Show all (N more)" disclosure with `aria-expanded`.
- Results area keeps two distinct empty states: *filtered-empty* (with a
  "Clear filters" action and an echo of how many entries are hidden) and
  *truly-empty* (branded `EmptyState`, unchanged from the stub).

### Edge cases

- **Very long filter names**: single-line CSS ellipsis in the row; the full
  name stays in `title` and the button's `aria-label`, so nothing is lost to
  assistive tech. Name length is capped at 60 chars at save time.
- **Duplicate names**: rejected at save time, case-insensitive and trimmed;
  renaming support in the model ignores the filter's own id.
- **RTL**: all feature CSS uses logical properties
  (`inline-size`, `margin-block-*`, `text-align: start`), so the layout
  mirrors correctly under `dir="rtl"`; covered by a test with Arabic content.

## Accessibility (WCAG 2.1 AA)

- Sidebar is a labelled `<nav>` landmark with list semantics.
- Dialog: `role="dialog"`, `aria-modal`, labelled by its heading and described
  by the filter summary; focus moves to the name field on open, is trapped
  (Tab/Shift+Tab wrap), Escape closes, and focus returns to the trigger.
- Validation: `aria-invalid` + `aria-describedby` on the field, `role="alert"`
  message inside an `aria-live="polite"` region.
- All icon-only controls have accessible names that include the filter name.
- Filter bar is `role="search"` with visible `<label>`s for every field.
- Results table has a caption (visually hidden) and `scope="col"` headers.
- 44px touch targets for icon buttons on coarse pointers;
  `prefers-reduced-motion` disables transitions.

### axe results

`jest-axe` runs against: the dialog (default + error states), the sidebar
(populated, empty, and overflow states), and the full page — **0 violations**
in all runs (see `*.test.tsx` files; executed via `npm test`).

## Responsive

Two-column grid (16rem rail + fluid main) collapses to a single column below
900px, with the sidebar re-ordered *below* the filter bar so the primary task
(filtering) stays first. Filter fields wrap fluidly (`flex-wrap` with
`min-inline-size` floors).

## Usage Examples

```tsx
// Shareable link — restores this exact view:
//   /investor/audit-trail?action=payout&actor=system&from=2026-07-01

<PinnedSearchSidebar
  savedFilters={savedFilters}
  activeFilterId={activeId}
  onApply={(f) => setSearchParams(filtersToSearchParams(f.filters))}
  onMove={(id, dir) => setSavedFilters(movePinned(savedFilters, id, dir))}
  onUnpin={(id) => setSavedFilters(togglePinned(savedFilters, id))}
  onDelete={(id) => setSavedFilters(removeSavedFilter(savedFilters, id))}
/>
```

## Integration Map

- `src/App.tsx` — route `/investor/audit-trail` + Home link.
- `src/pages/AuditTrail.tsx` — page composition.
- Reuses: `EmptyState` (design system), `input-group` / `input-field` /
  `btn` classes, glass-card surface, spacing/radius/color tokens.

## Testing

79 tests across four suites (run: `npm test`):

- `savedFilters.test.ts` — URL round-trips (incl. unicode/RTL text),
  duplicate/long-name validation, per-user storage isolation, corrupt and
  blocked storage, pin/unpin/reorder boundaries.
- `SaveFilterDialog.test.tsx` — save flow, all validation errors, focus
  management (trap, restore), Escape/backdrop close, axe.
- `PinnedSearchSidebar.test.tsx` — apply/reorder/unpin/delete, empty +
  overflow states, long names, RTL, axe.
- `AuditTrail.test.tsx` — URL-driven filters, save → pin → apply loop,
  persistence across mounts, clipboard success/failure, empty states, axe.

Coverage for the four new files is gated at **95% (branches, functions,
lines, statements)** in `vite.config.ts`; measured 96–100% on all metrics.

## Before / After

- **Before**: static stub — heading + branded empty state, no filtering, no
  route (page wasn't mounted).
- **After**: mounted at `/investor/audit-trail`; five-field filter bar synced
  to the URL, save/pin/reorder/share loop, filtered results table, and both
  empty states. (No visual-regression tooling exists in this repo; before/
  after is documented here and verifiable via the route.)

## Security Notes

- Saved filters live client-side only; no filter contents leave the browser.
- Stored JSON is schema-checked on load; malformed entries are discarded.
- Filter values are rendered as React text nodes (no `dangerouslySetInnerHTML`),
  so hostile saved names/queries cannot inject markup.
- Share links contain only filter parameters — no tokens or user identifiers.
