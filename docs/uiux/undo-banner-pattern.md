# Undo Banner Pattern

A consistent, accessible pattern for **reversible destructive actions** —
delete draft, remove from blacklist, archive offering. Instead of a blocking
"Are you sure?" confirmation, the action happens immediately and a banner offers
a short window to **Undo** before it becomes permanent.

> Implementation: [`UndoBanner`](../../src/components/UndoBanner/UndoBanner.tsx),
> [`useUndoBanners`](../../src/hooks/useUndoBanners.ts),
> [`useReducedMotion`](../../src/hooks/useReducedMotion.ts).

## Why this over a confirm dialog

- **Lower friction** for frequent, low-stakes destructive actions.
- **Reversible by default** — the safety net is the Undo, not a modal gate.
- **Non-blocking** — the user keeps working; nothing steals focus.

Use a confirmation dialog instead when an action is **irreversible** or
**high-impact** (e.g. deleting an account). Undo is for the *recoverable* cases.

## Anatomy

```
┌─────────────────────────────────────────────┐
│  ◷  Deleted "Q3 report"        ↶ Undo    ✕   │
└─────────────────────────────────────────────┘
   │              │                  │       │
 countdown     message          Undo CTA   dismiss
   ring                        (primary)  (commit now)
```

- **Countdown ring** — depletes over the reversible window (default 5s),
  signalling time-to-permanence. Decorative (`aria-hidden`).
- **Message** — past-tense description of what happened (`Deleted "Q3 report"`).
- **Undo CTA** — primary action; reverses the change and removes the banner.
- **Dismiss (✕)** — commits the action immediately and removes the banner.

## Action contract (for engineers)

Drive banners through `useUndoBanners`. Each reversible action provides:

| Field | Required | Meaning |
| --- | --- | --- |
| `message` | yes | Past-tense summary shown in the banner. |
| `onUndo` | yes | Reverse the action (restore UI + cancel/rollback any persistence). |
| `onCommit` | no | Make the action permanent — runs when the timer elapses **or** the user dismisses. Omit if the action is already persisted and only `onUndo` changes state. |
| `actionLabel` | no | CTA label, defaults to `Undo`. |
| `durationMs` | no | Reversible window, defaults to `5000`. |

```tsx
const { banners, registerUndo, undo, dismiss } = useUndoBanners();

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
    <UndoBanner banners={banners} onUndo={undo} onDismiss={dismiss} />
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
  Beyond `maxVisible` (default 3) older banners collapse into a `+N more pending`
  summary rather than overflowing the viewport.
- **Independent lifecycles** — each banner has its own countdown; expiring or
  undoing one never affects the others.

## Responsive behaviour

- Banners are `w-full max-w-md`: full width with side padding on small screens,
  capped to a comfortable card width on larger screens.
- The layout is a single flex row; the message truncates (`truncate`) so the
  Undo and dismiss controls always remain reachable.

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
  `focus:ring` styles and are reachable in DOM order. Triggering an action from
  the originating control keeps the user's focus context; the transient banner
  does not steal focus.
- **Dismiss labelling** — the ✕ control has an explicit
  `aria-label="Dismiss: <message>"` so its purpose is unambiguous out of context.

### axe notes

`UndoBanner.test.tsx` runs `jest-axe` against a rendered banner and asserts
**no violations**. Points verified during design:

- Contrast: white text and the `#60a5fa` Undo CTA on the `#1f2937` banner
  surface meet AA contrast for normal text.
- Decorative SVG ring carries `aria-hidden="true"` and no role, so it is not
  announced.
- All interactive elements expose an accessible name (button text or
  `aria-label`).

## Test coverage

- [`UndoBanner.test.tsx`](../../src/components/UndoBanner/UndoBanner.test.tsx) —
  rendering, Undo/dismiss callbacks, custom labels, newest-on-top stacking,
  `+N more` overflow, decorative ring, reduced-motion fallback, and axe.
- [`useUndoBanners.test.tsx`](../../src/hooks/useUndoBanners.test.tsx) —
  registration, countdown→commit, undo (with no late commit), dismiss→commit,
  and independent stacked lifecycles.
