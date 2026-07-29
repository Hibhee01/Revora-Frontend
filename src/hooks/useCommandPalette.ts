/**
 * useCommandPalette
 *
 * Manages open/close state for the command palette and persists the
 * per-user recent-actions list in localStorage.
 *
 * Storage key:  "revora:recent-commands:<userId>"
 * Limit:        RECENT_LIMIT = 5
 * Clear:        call clearRecent() — invoked automatically on sign-out
 *               via the exported helper clearRecentCommandsForUser().
 *
 * Keyboard triggers (mirrored from useKeyboardShortcuts):
 *   - Cmd/Ctrl + K  → open palette
 *   - Escape         → close palette (when open, from any element)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CommandItem } from '../components/CommandPalette/commandPaletteData';

export const RECENT_LIMIT = 5;

/** Stable storage key for a given user. Pass '' / undefined for anonymous. */
export function recentCommandsKey(userId?: string): string {
  return `revora:recent-commands:${userId ?? 'anonymous'}`;
}

/** Reads the stored list without loading the hook (useful for sign-out). */
export function clearRecentCommandsForUser(userId?: string): void {
  try {
    localStorage.removeItem(recentCommandsKey(userId));
  } catch {
    // storage unavailable — ignore
  }
}

function loadRecent(userId?: string): CommandItem[] {
  try {
    const raw = localStorage.getItem(recentCommandsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CommandItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: CommandItem[], userId?: string): void {
  try {
    localStorage.setItem(recentCommandsKey(userId), JSON.stringify(items));
  } catch {
    // quota exceeded or storage unavailable — ignore
  }
}

interface UseCommandPaletteOptions {
  /** Current user identifier — used to scope the recent-actions storage key. */
  userId?: string;
}

interface UseCommandPaletteReturn {
  isOpen: boolean;
  isMac: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  recentCommands: CommandItem[];
  addRecent: (item: CommandItem) => void;
  clearRecent: () => void;
}

export function useCommandPalette(
  options: UseCommandPaletteOptions = {},
): UseCommandPaletteReturn {
  const { userId } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [recentCommands, setRecentCommands] = useState<CommandItem[]>(() =>
    loadRecent(userId),
  );

  // Keep a ref so the keydown handler never captures stale state
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Reload recent commands when userId changes (e.g., sign-in → different user)
  useEffect(() => {
    setRecentCommands(loadRecent(userId));
  }, [userId]);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  /** Add a command to the top of the recent list, capping at RECENT_LIMIT. */
  const addRecent = useCallback(
    (item: CommandItem) => {
      setRecentCommands((prev) => {
        // Remove any existing entry for the same command id then prepend
        const filtered = prev.filter((r) => r.id !== item.id);
        const next = [item, ...filtered].slice(0, RECENT_LIMIT);
        saveRecent(next, userId);
        return next;
      });
    },
    [userId],
  );

  /** Clear all recent actions for the current user and persist the change. */
  const clearRecent = useCallback(() => {
    setRecentCommands([]);
    clearRecentCommandsForUser(userId);
  }, [userId]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (e.key === 'Escape' && isOpenRef.current) {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !inInput) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close]);

  return {
    isOpen,
    isMac,
    open,
    close,
    toggle,
    recentCommands,
    addRecent,
    clearRecent,
  };
}
