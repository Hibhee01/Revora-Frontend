import React, { createContext, useCallback, useState } from 'react';

const STORAGE_KEY_PREFIX = 'revora-recent-networks';
const MAX_RECENTS = 3;

function readStored(userId: string): string[] {
  try {
    const v = localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`);
    if (v) {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed) && parsed.every((id: unknown) => typeof id === 'string')) {
        return parsed.slice(0, MAX_RECENTS);
      }
    }
  } catch {
    // SSR / blocked storage
  }
  return [];
}

export interface RecentNetworksContextValue {
  recentNetworkIds: string[];
  addRecentNetwork: (networkId: string) => void;
}

export const RecentNetworksContext = createContext<RecentNetworksContextValue | null>(null);

interface RecentNetworksProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function RecentNetworksProvider({ children, userId = 'default' }: RecentNetworksProviderProps) {
  const [recentNetworkIds, setRecentNetworkIds] = useState<string[]>(() => readStored(userId));

  const addRecentNetwork = useCallback((networkId: string) => {
    setRecentNetworkIds((prev) => {
      const next = [networkId, ...prev.filter((id) => id !== networkId)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}:${userId}`, JSON.stringify(next));
      } catch {
        // storage unavailable
      }
      return next;
    });
  }, [userId]);

  return (
    <RecentNetworksContext.Provider value={{ recentNetworkIds, addRecentNetwork }}>
      {children}
    </RecentNetworksContext.Provider>
  );
}
