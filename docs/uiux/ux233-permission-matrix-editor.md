# UX-233 · Multi-issuer Admin Permission-Matrix Editor

**Status:** Implemented  
**Component path:** `src/components/PermissionMatrix/`  
**Page path:** `src/pages/PermissionMatrixPage.tsx`  
**Route:** `/admin/permissions`

---

## 1. Problem statement

Admins need a way to configure per-role, per-issuer access controls that is:

- **Scannable** - the matrix shape lets admins see the whole permission landscape at a glance instead of reading a long list of rules.
- **Safe to edit** - bulk operations must preview affected cells before commit; individual cell changes collect into a diff that requires confirmation before saving.
- **Accessible** - WCAG 2.1 AA; fully keyboard-operable.
- **Responsive** - usable on tablets and large phone screens, not just desktops.

---

## 2. Component anatomy

```
PermissionMatrix (wrapper)
├── Toolbar                  — bulk select + apply controls
├── pm-scroll-container      — horizontal scroll region (ARIA: region)
│   └── <table role="grid">
│       ├── <thead>          — sticky header with issuer columns
│       │   ├── th.pm-th-role  (frozen, position: sticky inline-start)
│       │   └── th × N       — per-issuer header + select-all checkbox
│       └── <tbody>
│           └── <tr> × M     — one row per role
│               ├── td.pm-td-role  (frozen)  — row checkbox + role name
│               └── td × N   — PermissionCell button
├── Keyboard hint bar
├── Legend
├── Footer                   — unsaved-changes count + Cancel / Review & Save
└── PermissionMatrixDiffModal (portal-less inline dialog)
    ├── before/after diff table
    └── Cancel / Save N changes
```

---

## 3. Cell states

| State     | Icon | Colour swatch                          | Meaning                                      |
|-----------|------|----------------------------------------|----------------------------------------------|
| `allow`   | `✓`  | Emerald 400 on emerald-12% bg          | Role has explicit permission for this issuer |
| `deny`    | `✗`  | Rose 400 on rose-15% bg                | Role is explicitly blocked for this issuer   |
| `inherit` | `–`  | Slate 400 on slate-8% bg               | Defers to the role's parent/global setting   |
| `mixed`   | `~`  | Amber 400 on amber-12% bg              | Read-only: conflicting child states (admin-set) |

### Cycling order (click / Space / Enter)

```
allow → deny → inherit → allow → …
mixed → allow → deny → inherit → allow → …  (mixed treated as inherit for cycling)
```

---

## 4. Column freezing & horizontal scroll

The role column uses `position: sticky; inset-inline-start: 0` so it stays visible during horizontal scrolling. RTL is handled automatically via logical CSS properties. A drop-shadow on the right edge of the frozen column provides a scroll affordance.

```css
.pm-th-role,
.pm-td-role {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  box-shadow: 2px 0 6px -2px rgba(0, 0, 0, 0.4);
}
```

---

## 5. Selection model

| Interaction           | Effect                                                              |
|-----------------------|---------------------------------------------------------------------|
| Row checkbox          | Selects / deselects all cells in that role's row                   |
| Column checkbox       | Selects / deselects all cells in that issuer's column              |
| Double-click a cell   | Toggles individual cell selection                                  |
| `Esc` key             | Clears the entire selection                                        |
| Clear button          | Clears the entire selection                                        |

---

## 6. Bulk apply

1. Select cells (row checkbox, column checkbox, or individual double-click).
2. Choose a target state from the `<select>` dropdown in the toolbar.
3. Click **Apply to selected** — all selected cells immediately update to the chosen state.
4. The unsaved-changes counter in the footer updates in real time.
5. No confirmation is needed for bulk apply itself; the diff modal covers all pending changes at save time.

---

## 7. Diff summary modal (pre-save review)

When the admin clicks **Review & Save**:

1. A dialog opens listing every pending change in a table:  
   `Role` | `Issuer` | `From` (badge) | `→` | `To` (badge)
2. If there are no changes, the **Save** button is disabled and a "No permission changes to save" message is shown.
3. The admin can **Cancel** (discard modal, keep edits) or **Save N changes** (trigger `onSave`).
4. Focus is trapped inside the modal while open, and restored to the trigger button on close.
5. `Escape` cancels the modal.

---

## 8. Keyboard navigation

| Key(s)                 | Action                                              |
|------------------------|-----------------------------------------------------|
| `↑ ↓ ← →`              | Move focus between cells (roving tabindex pattern)  |
| `Home` / `End`         | Jump to first / last cell in the current row        |
| `PageUp` / `PageDown`  | Jump to first / last cell in the current column     |
| `Space` or `Enter`     | Cycle the focused cell's state                      |
| `Esc`                  | Clear the current selection                         |
| `Dbl-click`            | Toggle cell selection                               |

Navigation clamps at edges (no wrap-around) to match common data-grid conventions.  
RTL: `ArrowLeft` and `ArrowRight` reverse visual direction automatically via `document.dir`.

---

## 9. Accessibility notes

- **Role:** `<table role="grid">` so assistive technologies announce row/column context.
- **Cell labels:** Each cell button has `aria-label="<Role> × <Issuer>: <State> [(selected)]"`.
- **Selection state:** `aria-pressed="true|false"` reflects selection.
- **Live regions:** unsaved-change count and selection count use `aria-live="polite" aria-atomic="true"`.
- **Focus management:** Modal uses `useEffect` to focus the cancel button on open and restore prior focus on close.
- **Focus ring:** All interactive elements have a 2px `outline` on `:focus-visible`. Cells use a blue ring; the frozen column uses the same ring without being obscured.
- **Touch targets:** All cell buttons are `min-height: 44px; min-width: 44px` (WCAG 2.5.5 AAA).
- **Reduced motion:** `transform` transitions are disabled via `@media (prefers-reduced-motion: reduce)`.
- **Colour independence:** All states are communicated via text icon _and_ label in `aria-label`; colour is supplemental.

---

## 10. Responsive behaviour

| Viewport             | Behaviour                                                          |
|----------------------|--------------------------------------------------------------------|
| `≥ 1024px` (desktop) | Full matrix with 14 rem frozen column                             |
| `640–1023px` (tablet)| Horizontal scroll, frozen column narrows to 10 rem                |
| `< 640px` (mobile)   | Same scroll, frozen column 10 rem; toolbar wraps to 2 lines       |

---

## 11. Design tokens

All colour and spacing values reference existing `:root` design-system tokens. Component-scoped tokens are namespaced `--pm-*` and defined in `PermissionMatrix.css`.

```
--pm-cell-size: 2.75rem          (44px touch target)
--pm-freeze-col-w: 14rem
--pm-allow-fg:   #34d399         (Emerald 400 — 8.5:1 on dark bg)
--pm-deny-fg:    #f87171         (Rose 400   — 6.8:1 on dark bg)
--pm-inherit-fg: #94a3b8         (Slate 400  — 4.7:1 on dark bg)
--pm-mixed-fg:   #fbbf24         (Amber 400  — 11.8:1 on dark bg)
```

---

## 12. Test coverage

- **Framework:** Vitest + React Testing Library + `@testing-library/user-event`
- **File:** `src/components/PermissionMatrix/PermissionMatrix.test.tsx`
- **Target:** ≥ 95% branches, functions, lines, statements

Coverage areas:
- Rendering: roles, issuers, initial states, readOnly mode
- Cell state cycling: all four states including `mixed`
- Row / column / individual cell selection
- Bulk apply: allow / deny / inherit to multi-cell selection
- Keyboard navigation: all keys including RTL mirror
- Save flow: diff generation, modal open/close, onSave callback
- Diff modal: rendering, focus trap, Escape, aria attributes
- Edge cases: sparse permissions, single-cell matrix, many rows/cols

---

## 13. Decisions & rationale

**Why `<table role="grid">` rather than CSS Grid?**  
Screen readers understand `grid`/`row`/`gridcell` semantics and announce row × column position. A CSS grid layout would require many extra ARIA attributes to achieve the same result.

**Why roving tabindex instead of individual `tabindex="0"` per cell?**  
With 10+ issuers × 10+ roles the tab order would be enormous. Roving tabindex lets the user navigate the entire matrix with arrow keys after focusing any single cell.

**Why `position: sticky` instead of a two-panel layout for column freezing?**  
A sticky column keeps the table a single `<table>` element, which is critical for correct `headers` association and screen-reader row/column announcement. Two-panel approaches require duplicating rows and careful synchronisation.

**Why inline diff modal instead of a separate route?**  
The admin may have many tabs open. An inline modal is faster and keeps context. The diff is ephemeral state, not a persisted entity worth its own URL.
