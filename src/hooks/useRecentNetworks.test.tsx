import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecentNetworksProvider } from '../components/RecentNetworksProvider/RecentNetworksProvider';
import { useRecentNetworks } from './useRecentNetworks';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  localStorageMock.clear();
});

function HookConsumer() {
  const { recentNetworkIds, addRecentNetwork } = useRecentNetworks();
  return (
    <div>
      <span data-testid="recents">{recentNetworkIds.join(',')}</span>
      <button onClick={() => addRecentNetwork('solana')}>add-solana</button>
    </div>
  );
}

describe('useRecentNetworks', () => {
  it('returns recent IDs from provider', () => {
    render(
      <RecentNetworksProvider>
        <HookConsumer />
      </RecentNetworksProvider>,
    );
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('');
  });

  it('addRecentNetwork updates the list', () => {
    render(
      <RecentNetworksProvider>
        <HookConsumer />
      </RecentNetworksProvider>,
    );
    fireEvent.click(document.querySelector('button')!);
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('solana');
  });

  it('throws when used outside RecentNetworksProvider', () => {
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<HookConsumer />)).toThrow(
      'useRecentNetworks must be used inside <RecentNetworksProvider>',
    );
    console.error = originalError;
  });
});
