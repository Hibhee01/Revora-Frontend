/**
 * DensityProvider — Issue #174
 *
 * Sets data-density on <html> so the CSS cascade distributes
 * density tokens to all density-aware components globally.
 *
 * Preference is persisted to localStorage under 'revora-density'.
 * Defaults to 'comfortable' (most spacious).
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';

export type DensityMode = 'comfortable' | 'cozy' | 'compact';

const STORAGE_KEY = 'revora-density';
const MODES: DensityMode[] = ['comfortable', 'cozy', 'compact'];
const DEFAULT: DensityMode = 'comfortable';

function readStored(): DensityMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'comfortable' || v === 'cozy' || v === 'compact') return v;
  } catch {
    // SSR / blocked storage — fall through
  }
  return DEFAULT;
}

export interface DensityContextValue {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  cycle: () => void;
}

export const DensityContext = createContext<DensityContextValue | null>(null);

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>(readStored);

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // storage unavailable — proceed without persistence
    }
    // comfortable is the default :root state; no attribute needed
    if (mode === DEFAULT) {
      document.documentElement.removeAttribute('data-density');
    } else {
      document.documentElement.setAttribute('data-density', mode);
    }
  }, []);

  const cycle = useCallback(() => {
    setDensityState((prev) => {
      const next = MODES[(MODES.indexOf(prev) + 1) % MODES.length];
      setDensity(next);
      return next;
    });
  }, [setDensity]);

  // Sync HTML attribute on mount and when density changes
  useEffect(() => {
    if (density === DEFAULT) {
      document.documentElement.removeAttribute('data-density');
    } else {
      document.documentElement.setAttribute('data-density', density);
    }
  }, [density]);

  return (
    <DensityContext.Provider value={{ density, setDensity, cycle }}>
      {children}
    </DensityContext.Provider>
  );
}
