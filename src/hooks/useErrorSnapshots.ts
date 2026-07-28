import { useState, useCallback, useRef, useEffect } from 'react';

export type SnapshotGroup = 'Forms' | 'Uploads' | 'Transactions' | 'Other';

export interface ErrorSnapshot {
  id: string;
  group: SnapshotGroup;
  title: string;
  description?: string;
  timestamp: number;
  onRetry?: () => void | Promise<void>;
  onDiscard?: () => void | Promise<void>;
}

export interface UseErrorSnapshotsResult {
  snapshots: ErrorSnapshot[];
  unreadCount: number;
  addSnapshot: (snapshot: Omit<ErrorSnapshot, 'id' | 'timestamp'>) => string;
  removeSnapshot: (id: string) => void;
  clearAll: () => void;
  markAllRead: () => void;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `snapshot-${counter}-${Math.floor(performance.now())}`;
}

// Global state so that the panel and AppShell share the same list
let globalSnapshots: ErrorSnapshot[] = [];
let globalUnreadCount = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function useErrorSnapshots(): UseErrorSnapshotsResult {
  const [, forceRender] = useState({});

  useEffect(() => {
    const listener = () => forceRender({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  
  const addSnapshot = useCallback((snapshot: Omit<ErrorSnapshot, 'id' | 'timestamp'>) => {
    const id = nextId();
    const newSnapshot: ErrorSnapshot = {
      ...snapshot,
      id,
      timestamp: Date.now(),
    };
    globalSnapshots = [newSnapshot, ...globalSnapshots];
    globalUnreadCount += 1;
    notifyListeners();
    return id;
  }, []);

  const removeSnapshot = useCallback((id: string) => {
    const exists = globalSnapshots.some(s => s.id === id);
    if (!exists) return;
    
    globalSnapshots = globalSnapshots.filter((s) => s.id !== id);
    globalUnreadCount = Math.min(globalUnreadCount, globalSnapshots.length);
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    globalSnapshots = [];
    globalUnreadCount = 0;
    notifyListeners();
  }, []);

  const markAllRead = useCallback(() => {
    if (globalUnreadCount > 0) {
      globalUnreadCount = 0;
      notifyListeners();
    }
  }, []);

  return {
    snapshots: globalSnapshots,
    unreadCount: globalUnreadCount,
    addSnapshot,
    removeSnapshot,
    clearAll,
    markAllRead,
  };
}

// For testing purposes
export function resetGlobalState() {
  globalSnapshots = [];
  globalUnreadCount = 0;
  listeners.clear();
}
