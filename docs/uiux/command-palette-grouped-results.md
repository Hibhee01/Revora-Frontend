# Command Palette — Grouped Results & Recent Actions

**Issue:** UX — Command Palette grouped-results and recent-actions section  
**Status:** Implemented  
**Files:**
- `src/components/CommandPalette/CommandPalette.tsx`
- `src/components/CommandPalette/CommandPalette.css`
- `src/components/CommandPalette/commandPaletteData.ts`
- `src/hooks/useCommandPalette.ts`
- Tests: `src/components/CommandPalette/CommandPalette.test.tsx`, `src/hooks/useCommandPalette.test.tsx`

---

## Overview

The command palette (`Cmd/Ctrl+K`) is a modal dialog that lets users quickly navigate and execute commands. Results are rendered in labelled sections (Navigate, Actions, Settings) with per-section limits. A **Recent Actions** section surfaces the five most-recently used commands and is persisted per-user in `localStorage`.

---

## Anatomy

```
┌─────────────────────────────────────────────────────┐
│ 🔍  Search commands…                         Esc ×  │  ← cp-header
├─────────────────────────────────────────────────────┤
│ RECENT                                   Clear history│  ← cp-group-header (sticky)
│  🕐  Go to Dashboard           /dashboard            │  ← cp-result-item
│  🚪  Sign Out                                        │
├─────────────────────────────────────────────────────┤
│ NAVIGATE                                             │
│  🏠  Go to Home               Ctrl Shift H           │
│  📊  Go to Dashboard          /dashboard             │
│   ⋮                                                  │
├─────────────────────────────────────────────────────┤
│ ACTIONS                                              │
│   ⋮                                                  │
├─────────────────────────────────────────────────────┤
│ ↑ ↓ navigate   ↵ select   Esc close        Ctrl+K   │  ← cp-footer
└─────────────────────────────────────────────────────┘
```

---

## States

| State | Trigger | Rendered |
|---|---|---|
| **Empty query, no recents** | First open, no history | `cp-empty-query` placeholder with search icon + hint copy |
| **Empty query, has recents** | Open after using commands | Recent Actions section only (top 5) |
| **Non-empty query, results** | User types | Grouped sections: Navigate / Actions / Settings |
| **Non-empty query, no results** | Query matches nothing | `cp-no-results` with echoed query |

---

## Section Headers

Each result group renders a `<div role="group" aria-label="…">` with:

- A sticky `<div class="cp-group-header">` containing an `<h3 class="cp-group-label">` (uppercase, accent-coloured, 12px, semibold, 0.06em tracking)
- The Recent group also renders a **Clear history** `<button>` in the header trailing end

```
.cp-group-label
  font-size: var(--font-size-xs)       /* 12px */
  font-weight: var(--font-weight-semibold)
  color: var(--text-accent)
  text-transform: uppercase
  letter-spacing: 0.06em
```

---

## Result Row

```
.cp-result-item
  min-height: 2.75rem     /* 44px — WCAG 2.5.5 touch target */
  padding: --spacing-xs --spacing-lg
  display: flex, align-items: center, gap: --spacing-sm

├── .cp-result-icon    16×16 Lucide icon, color: --text-muted → --text-accent on hover
├── .cp-result-text
│   ├── .cp-result-label   14px, medium, --text-main
│   └── .cp-result-desc    12px, --text-muted  (optional)
└── .cp-result-shortcut    trailing kbd badges (hidden on <480px)
```

**Interaction states:**
- Default: transparent background
- Hover / `aria-selected="true"`: `var(--glass-bg-accent)` + `inset 3px 0 0 var(--primary)` left border accent
- Focus-visible: same as hover (no separate outline, since items are `tabIndex={-1}` and navigated via Arrow keys)

---

## Per-Section Result Limits

Configured in `commandPaletteData.ts` per `CommandGroup.resultLimit`:

| Group | Limit |
|---|---|
| Navigate | 5 |
| Actions | 5 |
| Settings | 5 |

The `groupSearchResults()` utility applies `.slice(0, resultLimit)` before returning each group's items.

---

## Recent Actions

### Storage
- Key: `revora:recent-commands:<userId>` (or `:anonymous`)
- Format: JSON array of `CommandItem` objects (up to 5)
- Scope: per-user — changing `userId` prop reloads from the correct key
- Clear on sign-out: call `clearRecentCommandsForUser(userId)` from the auth sign-out handler

### Behaviour
- Limit: **5 items** (`RECENT_LIMIT = 5`)
- Order: most-recent first (new item prepended, duplicates removed)
- Clear control: "Clear history" button in the Recent section header (`aria-label="Clear recent command history"`)
- Storage errors (quota, parse failure) are swallowed silently — the hook degrades to in-memory only

### `useCommandPalette` hook API

```ts
const {
  isOpen,           // boolean
  isMac,            // boolean
  open,             // () => void
  close,            // () => void
  toggle,           // () => void
  recentCommands,   // CommandItem[]
  addRecent,        // (item: CommandItem) => void
  clearRecent,      // () => void
} = useCommandPalette({ userId?: string });
```

Helper exports:
```ts
clearRecentCommandsForUser(userId?: string): void   // call on sign-out
recentCommandsKey(userId?: string): string          // storage key
RECENT_LIMIT: 5
```

---

## Keyboard Navigation

| Key | Action |
|---|---|
| `Cmd/Ctrl + K` | Open / toggle palette |
| `Escape` | Close palette; restore prior focus |
| `↓` | Move active item down (wraps) |
| `↑` | Move active item up (wraps) |
| `Enter` | Activate highlighted item |
| `Tab` / `Shift+Tab` | Cycle focusable elements inside dialog (focus trap) |

Arrow navigation updates `aria-selected` on the highlighted `role="option"` button, and the `aria-activedescendant` on the `role="combobox"` input.

---

## Accessibility

- `role="dialog" aria-modal="true"` on the overlay
- `role="combobox" aria-autocomplete="list" aria-controls aria-expanded aria-activedescendant` on the input
- `role="listbox" aria-label="Commands"` on the scrollable body
- `role="group" aria-label="<GroupName>"` on each section
- `role="option" aria-selected` on each result button
- `role="status" aria-live="polite" aria-atomic="true"` for result-count announcements
- Focus trap: Tab/Shift+Tab cycle is constrained to the dialog
- Focus restore: previous active element is saved on open and restored on close
- Body scroll lock while open
- Minimum 44px touch target (`min-height: 2.75rem`) on all result items
- All interactive elements have `focus-visible` ring (2px `--primary`, offset 2px)
- Color contrast: all text meets WCAG 2.1 AA (≥4.5:1 for body, ≥3:1 for large/UI)

**axe validation:** all four render states (empty-query, recents, results, no-results) pass `toHaveNoViolations()` in the test suite.

---

## Responsive

| Breakpoint | Behaviour |
|---|---|
| ≥ 481px | Full palette, max-width 640px, positioned at `clamp(3.5rem, 10vh, 8rem)` from top |
| ≤ 480px | Full-width, anchored to top, `border-radius` only on bottom corners; shortcut badges, Esc hint, and footer hidden to save space |

---

## RTL

- CSS logical properties (`padding-inline`, `margin-inline-start/end`) used throughout
- Left-border accent flips to right in `[dir="rtl"]` via:
  ```css
  [dir="rtl"] .cp-result-item[aria-selected="true"] { box-shadow: inset -3px 0 0 var(--primary); }
  ```

---

## Tokens Consumed

All from `src/index.css :root`:

| Token | Usage |
|---|---|
| `--glass-bg`, `--glass-bg-accent`, `--glass-border`, `--glass-blur` | Dialog surface |
| `--shadow-xl` | Dialog elevation |
| `--radius-2xl` | Dialog border-radius |
| `--spacing-*` | Padding / gap throughout |
| `--font-size-xs/sm/base` | Labels, descriptions, group headers |
| `--font-weight-medium/semibold` | Label weights |
| `--text-main/muted/accent` | Text colors |
| `--primary` | Focus rings, left-border accent |

---

## Adding a Command

1. Open `src/components/CommandPalette/commandPaletteData.ts`
2. Add a `CommandItem` to the appropriate group in `COMMAND_GROUPS`
3. Give it a globally unique `id` (convention: `group:slug`)
4. Optionally supply `icon` (Lucide name string), `description`, `shortcutKeys`, `onExecute`
5. Register the icon in the `ICON_MAP` inside `CommandPalette.tsx` if it's new

---

## Before / After

**Before:** No command palette. Navigation required clicking sidebar links or typing in the URL bar. Keyboard power-users had only the `?` shortcut overlay.

**After:** `Cmd/Ctrl+K` opens a searchable palette with grouped results across Navigate, Actions, and Settings. The five most-recently used commands are surfaced immediately on open — zero keystrokes to re-run a recent action.
