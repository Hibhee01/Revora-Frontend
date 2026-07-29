# Undo Banner Pattern

A consistent, accessible pattern for **reversible destructive actions** —
delete draft, remove from blacklist, archive offering. Instead of a blocking
"Are you sure?" confirmation, the action happens immediately and a banner offers
a short window to **Undo** before it becomes permanent.

> Implementation: [`UndoBanner`](../../src/components/UndoBanner/UndoBanner.tsx),
> [`useUndoBanners`](../../src/hooks/useUndoBanners.ts),
> [`useUndoKeyboard`](../../src/hooks/useUndoKeyboard.ts),
> [`useReducedMotion`](../../src/hooks/useReducedMotion.ts).

## Why this over a confirm dialog

- **Lower friction** for frequent, low-stakes destructive actions.
- **Reversible by default** — the safety net is the Undo, not a modal gate.
- **Non-blocking** — the user keeps working; nothing steals focus.

Use a confirmation dialog instead when an action is **irreversible** or
**high-impact** (e.g. deleting an account). Undo is for the *recoverable* cases.

## Anatomy

```
┌─────────────────────────────────────────────┐  ▲
│  2 pending actions           ↶ Undo all  ✕  │  │  Aggregate Stack Header
├─────────────────────────────────────────────┤  │  (shown when >1 active items)
│  ◷  Deleted "Q4 forecast"       ↶ Undo   ✕  │  │  Newest Banner (top)
├─────────────────────────────────────────────┤  │
│  ◷  Deleted "Q3 report"         ↶ Undo   ✕  │  │  Older Banner
├─────────────────────────────────────────────┤  │
│  +2 more pending                            │  ▼  Overflow Summary
└─────────────────────────────────────────────┘     (visible when > maxVisible)
```

- **Countdown ring** — depletes over the reversible window (default 5s, auto-scaled for bursts),
  signalling time-to-permanence. Decorative (`aria-hidden`).
- **Message** — past-tense description of what happened (`Deleted "Q3 report"`).
- **Undo CTA** — primary action; reverses the change and removes the banner.
- **Dismiss (✕)** — commits the action immediately and removes the banner.
- **Aggregate "Undo all" Header** — shown when multiple actions (`>1`) are pending; reverses all stacked actions in reverse chronological order.

## Action contract (for engineers)

Drive banners through `useUndoBanners`. Each reversible action provides:

| Field | Required | Meaning |
| --- | --- | --- |
| `message` | yes | Past-tense summary shown in the banner. |
| `onUndo` | yes | Reverse the action (restore UI + cancel/rollback any persistence). |
| `onCommit` | no | Make the action permanent — runs when the timer elapses **or** the user dismisses. Omit if the action is already persisted and only `onUndo` changes state. |
| `actionLabel` | no | CTA label, defaults to `Undo`. |
| `durationMs` | no | Reversible window, defaults to `5000` (+1000ms scaling per existing item in stack when omitted). |

```tsx
const { banners, registerUndo, undo, dismiss, undoAll, dismissAll } = useUndoBanners();

function deleteDraft(draft: Draft) {
  removeDraftFromList(draft.id);              // optimistic UI update
  registerUndo({
    message: `Deleted "${draft.title}"`,
    onUndo: () => restoreDraftToList(draft),  // reverse the optimistic update
    onCommit: () => api.deleteDraft(draft.id) // persist only after the window
  });
}

return (
  <>
    {/* …page… */}
    <UndoBanner
      banners={banners}
      onUndo={undo}
      onDismiss={dismiss}
      onUndoAll={undoAll}
      onDismissAll={dismissAll}
      maxVisible={4}
    />
  </>
);
```

Timing is owned by the hook (a single shared ticker), so `<UndoBanner />` stays a
pure render of the current stack.

## Placement & stacking

- **Placement** — pinned via `position: fixed` to the bottom centre, **above the
  page footer** (`bottom-16`), at `z-50`. The container is
  `pointer-events-none` so it never blocks the page; each banner re-enables
  pointer events for its own controls.
- **Stacking** — multiple banners stack vertically with the **newest on top**.
  Beyond `maxVisible` (defaults to **4**) older banners collapse into a `+N more pending`
  summary rather than overflowing the viewport.
- **Undo all affordance** — when 2 or more actions are active, an aggregate header appears offering
  an **Undo all** button to bulk-revert all actions and a **Dismiss all (✕)** control to commit all.
- **Independent lifecycles** — each banner maintains its own timer; expiring or
  undoing one item preserves remaining items in the stack.

## Auto-dismiss timing per stack size

To prevent rapid action bursts from overwhelming users before they can react, auto-dismiss durations scale dynamically with stack size when explicit `durationMs` is omitted:

| Active Stack Size | Reversible Window Duration |
| --- | --- |
| 1 item | 5.0s (5000ms) |
| 2 items | 6.0s (6000ms) |
| 3 items | 7.0s (7000ms) |
| 4 items | 8.0s (8000ms) |
| 5+ items | 9.0s - 10.0s max (10000ms cap) |

## Responsive behaviour

- Banners are `w-full max-w-md`: full width with side padding on small screens,
  capped to a comfortable card width on larger screens.
- Mobile stack caps at `maxVisible = 4` to prevent vertical viewport clipping on smaller devices while leaving interactive controls easily tapable.
- The layout is a single flex row; the message truncates (`truncate`) so the
  Undo and dismiss controls always remain reachable.

## Keyboard shortcut: Cmd/Ctrl+Z (Issue #279)

When at least one undo banner is visible, pressing **`Cmd+Z`** (macOS) or
**`Ctrl+Z`** (Windows/Linux) undoes the **newest (topmost) banner** and
removes it from the stack — equivalent to clicking the "Undo" button on that
banner.

### Activation rules

| Condition | Behaviour |
| --- | --- |
| Focus is on the page (not in an editable element) + ≥1 banner visible | Triggers undo on the newest banner |
| Focus is in an `input`, `textarea`, `select`, or `contentEditable` element | Shortcut is **suppressed** — browser native undo takes priority |
| Modal / overlay is open and `disabled` is set | Shortcut is suppressed entirely |
| No banners visible | No-op |

### Focus-return behaviour

After the undo completes, focus is restored to the **origin element** — the
element that was focused immediately before the first banner appeared. This
lets power users undo actions and continue working without manually tabbing
back. If the origin element is no longer in the DOM (e.g. it was removed by
the undo), focus falls back to `document.body`.

### Implementation

The keyboard model lives in the [`useUndoKeyboard`](../../src/hooks/useUndoKeyboard.ts)
hook, which is integrated into `<UndoBanner />` automatically. Consumers do not
need additional wiring unless they want to customise the shortcut (e.g. disable
it when a modal is open).

The `UndoBanner` accepts an optional `onKeyboardUndo` prop that overrides the
default undo callback specifically for keyboard-initiated undos, in case the
focus-return behaviour should differ from click-initiated undos.

The shortcut is registered in the [Keyboard Shortcuts Overlay](../../src/components/KeyboardShortcutsOverlay/shortcutsData.ts)
under **General** as "Undo last action (when undo banner is visible)" with the
`mod+z` key combination.

### Example: using with a modal

```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

<UndoBanner
  banners={banners}
  onUndo={undo}
  onDismiss={dismiss}
  onKeyboardUndo={isModalOpen ? undefined : undo}
/>
```

## Accessibility (WCAG 2.1 AA)

- **Polite live region** — the container is `role="status"` `aria-live="polite"`
  `aria-atomic="false"`, so newly added banners are announced without
  interrupting the user's current task.
- **Countdown is decorative** — the ring/seconds are `aria-hidden`. Screen-reader
  users are not pressured by a ticking timer; they act through the clearly
  labelled **Undo** button. (Consider pairing with a longer `durationMs` for
  flows where assistive-tech users need more time.)
- **Reduced motion** — when `prefers-reduced-motion: reduce` is set, the animated
  sweeping ring is replaced by a **static whole-second count** (no animation).
  See [reduced-motion-guidelines.md](./reduced-motion-guidelines.md).
- **Keyboard & focus** — Undo and dismiss are native `<button>`s with visible
  `focus:ring` styles and are reachable in DOM order. The global
  **`Cmd/Ctrl+Z`** shortcut provides a power-user path to undo the newest
  banner without reaching for the mouse. After undo, focus returns to the
  element that initiated the action.
- **Dismiss labelling** — the ✕ control has an explicit
  `aria-label="Dismiss: <message>"` so its purpose is unambiguous out of context.

### axe notes

`UndoBanner.test.tsx` runs `jest-axe` against single banners as well as full stacked layouts with "Undo all" headers and asserts
**no violations**. Points verified during design:

- Contrast: white text and the `#60a5fa` Undo CTA on the `#1f2937` banner
  surface meet AA contrast for normal text.
- Decorative SVG ring carries `aria-hidden="true"` and no role, so it is not
  announced.
- All interactive elements expose an accessible name (button text or
  `aria-label`).

## Test coverage

- [`UndoBanner.test.tsx`](../../src/components/UndoBanner/UndoBanner.test.tsx) —
  rendering, Undo/dismiss callbacks, `onUndoAll`/`onDismissAll` aggregate actions, custom labels, newest-on-top stacking,
  `+N more` overflow (max 4 default), decorative ring, reduced-motion fallback, keyboard shortcut integration, and axe assertions.
- [`useUndoBanners.test.tsx`](../../src/hooks/useUndoBanners.test.tsx) —
  registration, countdown→commit, undo (with no late commit), dismiss→commit,
  `undoAll()`, `dismissAll()`, dynamic auto-dismiss scaling by stack size, and independent stacked lifecycles.
- [`useUndoKeyboard.test.tsx`](../../src/hooks/useUndoKeyboard.test.tsx) —
  Cmd/Ctrl+Z triggers undo on newest banner, suppressed in editable elements,
  focus-return to origin element, no-op when no banners are visible, and
  cleanup on unmount.
