/**
 * useNetworkSwitcher — Network Switcher Hook (Issue #153 / UIUX)
 *
 * Provides access to connected wallet chain, app target chain, mismatch state,
 * wallet capabilities, and switching actions.
 * Must be used inside <NetworkSwitcherProvider>.
 */

import { useContext } from 'react';
import {
  NetworkSwitcherContext,
  NetworkSwitcherContextValue,
} from '../components/NetworkSwitcher/NetworkSwitcherContext';

export function useNetworkSwitcher(): NetworkSwitcherContextValue {
  const ctx = useContext(NetworkSwitcherContext);
  if (!ctx) {
    throw new Error('useNetworkSwitcher must be used within a <NetworkSwitcherProvider>');
  }
  return ctx;
}
