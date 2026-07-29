# Actor Detail Popover

**Actor Detail Popover**

Overview
* A contextual popover that displays actor information and recent audit actions when triggered from the Audit Trail page.

Purpose
* Provides auditors with quick access to actor details (name, role, email, last login) and their last five relevant actions without leaving the audit trail view. Includes a link to the actor's full audit page for comprehensive review.

Props
* `actor` (Actor) — Actor object containing id, name, email, role, lastLogin, and optional avatar.
* `recentActions` (AuditAction[]) — Array of the actor's recent audit actions (up to 5 displayed).
* `anchorEl` (HTMLElement) — The DOM element that triggered the popover, used for positioning.
* `onClose` (fn) — Callback function to close the popover.

Component Structure
```
┌─────────────────────────────────────┐
│ [Avatar] Name          [Close]      │
│          Role                       │
│                                     │
│ Email: user@example.com             │
│ Last Login: Jan 15, 2024 (2d ago)   │
│                                     │
│ Recent Actions                      │
│ • Created new user account    2h ago│
│ • Updated user permissions   4h ago│
│ • Modified system settings   1d ago│
│ • Generated audit report     2d ago│
│ • Deleted inactive user      3d ago│
│                                     │
│ [View Full Audit Trail →]           │
└─────────────────────────────────────┘
```

Accessibility
* **Keyboard Navigation**: Popover can be opened via keyboard (Enter/Space on actor card), dismissed via ESC key, and focus is trapped within the popover using Tab/Shift+Tab cycling.
* **ARIA Attributes**: Uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` for screen reader compatibility.
* **Focus Management**: Focus moves to the first focusable element when popover opens and returns to the trigger element when closed.
* **Click Outside**: Clicking outside the popover closes it, with a transparent backdrop to capture clicks.
* **Focus Rings**: All interactive elements have visible focus rings (2px primary color with offset) for keyboard users.
* **Motion Respect**: Animations are disabled when `prefers-reduced-motion: reduce` is set.
* **Color Contrast**: All text meets WCAG 2.1 AA contrast requirements using tokenized color classes.

Responsive Behavior
* Popover width is fixed at 380px for consistency.
* Positioning automatically adjusts to prevent viewport overflow (right edge, bottom edge).
* Scrollable action list (max-height 200px) with custom scrollbar styling.
* On mobile, positioning shifts to center if needed.

Keyboard Interactions
* **Enter/Space**: Opens popover when focused on an actor card.
* **ESC**: Closes the popover.
* **Tab**: Cycles focus through interactive elements within the popover (close button, action items, footer link).
* **Shift+Tab**: Cycles focus in reverse order.
* Focus is trapped within the popover while open.

Usage
```tsx
import ActorDetailPopover from '../components/ActorDetailPopover';
import { useState } from 'react';

const MyComponent = () => {
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  const handleActorClick = (actor: Actor, event: React.MouseEvent<HTMLElement>) => {
    setSelectedActor(actor);
    setPopoverAnchor(event.currentTarget);
  };

  const closePopover = () => {
    setSelectedActor(null);
    setPopoverAnchor(null);
  };

  return (
    <>
      <button onClick={(e) => handleActorClick(actor, e)}>
        View Actor Details
      </button>
      
      {selectedActor && popoverAnchor && (
        <ActorDetailPopover
          actor={selectedActor}
          recentActions={getRecentActions(selectedActor.id)}
          anchorEl={popoverAnchor}
          onClose={closePopover}
        />
      )}
    </>
  );
};
```

Design Tokens Used
* Background: `var(--glass-bg)` with `var(--glass-blur)` backdrop filter
* Border: `var(--glass-border)`
* Primary: `var(--primary)` for avatar and links
* Text Main: `var(--text-main)` for headings and body text
* Text Muted: `var(--text-muted)` for labels and secondary text
* Shadow: `var(--shadow-xl)` for elevation
* Animation: `popoverFadeIn` (0.2s ease-out)

Notes
* Popover positioning calculates based on anchor element's bounding rect and viewport dimensions.
* The component uses a transparent backdrop (`z-index: 999`) to capture click-outside events while maintaining visual context.
* Recent actions are limited to 5 items for brevity; full audit trail is available via the footer link.
* Time formatting uses relative time (e.g., "2h ago") with absolute time available in aria-labels for screen readers.
