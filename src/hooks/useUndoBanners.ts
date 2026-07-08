/**
 * useUndoBanners
 *
 * State manager for the Undo banner pattern (Issue #162). It owns a stack of
 * pending reversible actions, each with a countdown to permanence. When a
 * countdown elapses (or the user dismisses the banner) the action is committed;
 * if the user presses "Undo" the action is reversed instead.
 *
 * The hook is the single source of truth for timing so the presentational
 * `<UndoBanner />` stays a pure render of the current stack.
 *
 * @example
 * const { banners, registerUndo, undo, dismiss } = useUndoBanners();
 *
 * function deleteDraft(draft) {
 *   removeFromUI(draft);
 *   registerUndo({
 *     message: `Deleted "${draft.title}"`,
 *     onUndo: () => restoreToUI(draft),
 *     onCommit: () => api.deleteDraft(draft.id),
 *   });
 * }
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Default time a destructive action remains reversible. */
export const DEFAULT_UNDO_DURATION_MS = 5000;

/** How often the countdown is recomputed. */
const TICK_MS = 100;

export interface RegisterUndoOptions {
  /** Human-readable description of what happened, e.g. `Deleted "Q3 report"`. */
  message: string;
  /** Reverse the action. Called when the user presses Undo. */
  onUndo: () => void;
  /**
   * Make the action permanent. Called when the countdown elapses or the user
   * dismisses the banner. Optional — omit when the action is already persisted
   * and Undo is the only thing that changes state.
   */
  onCommit?: () => void;
  /** Label for the Undo button. Defaults to "Undo". */
  actionLabel?: string;
  /** How long the action stays reversible, in ms. Defaults to 5000. */
  durationMs?: number;
}

export interface UndoBannerItem {
  id: string;
  message: string;
  actionLabel: string;
  durationMs: number;
  /** Milliseconds remaining before the action becomes permanent. */
  remainingMs: number;
}

interface InternalEntry extends UndoBannerItem {
  expiresAt: number;
  onUndo: () => void;
  onCommit?: () => void;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `undo-${counter}-${Math.floor(performance.now())}`;
}

export interface UseUndoBannersResult {
  banners: UndoBannerItem[];
  /** Register a reversible action and show its banner. Returns the banner id. */
  registerUndo: (options: RegisterUndoOptions) => string;
  /** Reverse the action and remove its banner. */
  undo: (id: string) => void;
  /** Commit the action immediately and remove its banner. */
  dismiss: (id: string) => void;
}

export function useUndoBanners(): UseUndoBannersResult {
  const [banners, setBanners] = useState<UndoBannerItem[]>([]);
  const entriesRef = useRef<Map<string, InternalEntry>>(new Map());

  const sync = useCallback(() => {
    const now = performance.now();
    const visible: UndoBannerItem[] = [];
    const expired: InternalEntry[] = [];

    for (const entry of entriesRef.current.values()) {
      const remainingMs = Math.max(0, entry.expiresAt - now);
      if (remainingMs <= 0) {
        expired.push(entry);
      } else {
        visible.push({
          id: entry.id,
          message: entry.message,
          actionLabel: entry.actionLabel,
          durationMs: entry.durationMs,
          remainingMs,
        });
      }
    }

    // Commit any elapsed actions (outside of render).
    for (const entry of expired) {
      entriesRef.current.delete(entry.id);
      entry.onCommit?.();
    }

    setBanners(visible);
  }, []);

  // A single shared ticker keeps every countdown in step.
  useEffect(() => {
    const interval = window.setInterval(sync, TICK_MS);
    return () => window.clearInterval(interval);
  }, [sync]);

  const registerUndo = useCallback(
    (options: RegisterUndoOptions): string => {
      const id = nextId();
      const durationMs = options.durationMs ?? DEFAULT_UNDO_DURATION_MS;
      entriesRef.current.set(id, {
        id,
        message: options.message,
        actionLabel: options.actionLabel ?? "Undo",
        durationMs,
        remainingMs: durationMs,
        expiresAt: performance.now() + durationMs,
        onUndo: options.onUndo,
        onCommit: options.onCommit,
      });
      sync();
      return id;
    },
    [sync],
  );

  const undo = useCallback(
    (id: string) => {
      const entry = entriesRef.current.get(id);
      if (!entry) return;
      entriesRef.current.delete(id);
      entry.onUndo();
      sync();
    },
    [sync],
  );

  const dismiss = useCallback(
    (id: string) => {
      const entry = entriesRef.current.get(id);
      if (!entry) return;
      entriesRef.current.delete(id);
      entry.onCommit?.();
      sync();
    },
    [sync],
  );

  return { banners, registerUndo, undo, dismiss };
}
