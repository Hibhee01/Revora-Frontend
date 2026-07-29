/**
 * useUndoKeyboard
 *
 * Keyboard shortcut hook for the Undo banner pattern (Issue #279).
 *
 * Listens for Cmd/Ctrl+Z when at least one undo banner is visible and
 * focus is NOT inside an editable element (input, textarea, select,
 * contenteditable) — this protects against conflicting with the browser's
 * native undo in text fields.
 *
 * When the shortcut fires it:
 *  1. Calls onUndo with the ID of the newest (most recent) banner.
 *  2. Restores keyboard focus to the element that was active when the
 *     banner first appeared (the "origin element"), so the user can
 *     continue working without a manual refocus.
 *
 * Usage:
 *   const { captureOrigin } = useUndoKeyboard({ banners, onUndo });
 *
 *   // Call captureOrigin() right before triggering a reversible action
 *   // so focus can be returned there after an undo.
 *
 * @example
 *   const { banners, registerUndo, undo } = useUndoBanners();
 *   const { captureOrigin } = useUndoKeyboard({ banners, onUndo: undo });
 *
 *   function handleDelete(draft) {
 *     captureOrigin();
 *     removeFromUI(draft);
 *     registerUndo({ message: `Deleted "${draft.title}"`, onUndo: () => restore(draft) });
 *   }
 */

import { useEffect, useRef } from "react";
import type { UndoBannerItem } from "./useUndoBanners";

export interface UseUndoKeyboardOptions {
  /** Current stack of undo banners. The shortcut fires only when non-empty. */
  banners: UndoBannerItem[];
  /** Called with the ID of the newest banner when Cmd/Ctrl+Z is pressed. */
  onUndo: (id: string) => void;
  /**
   * When true the shortcut listener is skipped entirely. Useful when a
   * modal or other overlay that should capture keyboard events is open.
   * @default false
   */
  disabled?: boolean;
}

export interface UseUndoKeyboardResult {
  /**
   * Capture the currently focused element as the "origin" so focus can
   * be restored there after a keyboard undo. Call this right before
   * dispatching a reversible action.
   */
  captureOrigin: () => void;
}

// Elements where Cmd/Ctrl+Z should be left to the browser's native undo.
const EDITABLE_SELECTORS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditable(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (EDITABLE_SELECTORS.has(target.tagName)) return true;
  // Check both the standard IDL property and the attribute directly
  // (JSDOM does not implement isContentEditable).
  return (
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true" ||
    target.contentEditable === "true"
  );
}

export function useUndoKeyboard({
  banners,
  onUndo,
  disabled = false,
}: UseUndoKeyboardOptions): UseUndoKeyboardResult {
  const originRef = useRef<HTMLElement | null>(null);

  // Keep stable refs so the effect doesn't recycle on every tick.
  const bannersRef = useRef(banners);
  bannersRef.current = banners;

  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Must be Cmd/Ctrl+Z without Shift or Alt modifiers.
      const isModZ =
        (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === "z";

      if (!isModZ) return;

      // Don't intercept when the user is typing in an editable element.
      if (isEditable(e.target)) return;

      const currentBanners = bannersRef.current;
      if (currentBanners.length === 0) return;

      e.preventDefault();

      // Undo the newest banner (last in the stack).
      const newest = currentBanners[currentBanners.length - 1];
      onUndoRef.current(newest.id);

      // Restore focus to the origin element if it's still in the DOM.
      const origin = originRef.current;
      if (origin && document.contains(origin)) {
        origin.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled]);

  return {
    captureOrigin: () => {
      originRef.current = document.activeElement as HTMLElement;
    },
  };
}
