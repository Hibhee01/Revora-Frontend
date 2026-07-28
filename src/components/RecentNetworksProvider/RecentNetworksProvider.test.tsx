import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecentNetworksProvider, RecentNetworksContext } from './RecentNetworksProvider';

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

function Consumer() {
  const ctx = React.useContext(RecentNetworksContext)!;
  return (
    <div>
      <span data-testid="recents">{ctx.recentNetworkIds.join(',')}</span>
      <button onClick={() => ctx.addRecentNetwork('polygon')}>add-polygon</button>
      <button onClick={() => ctx.addRecentNetwork('solana')}>add-solana</button>
      <button onClick={() => ctx.addRecentNetwork('ethereum')}>add-ethereum</button>
      <button onClick={() => ctx.addRecentNetwork('arbitrum')}>add-arbitrum</button>
    </div>
  );
}

describe('RecentNetworksProvider', () => {
  it('starts with empty recents', () => {
    render(<RecentNetworksProvider><Consumer /></RecentNetworksProvider>);
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('');
  });

  it('adds a network to recents', () => {
    render(<RecentNetworksProvider><Consumer /></RecentNetworksProvider>);
    fireEvent.click(document.querySelector('button')!);
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('polygon');
  });

  it('preserves max 3 recents (drops oldest)', () => {
    render(<RecentNetworksProvider><Consumer /></RecentNetworksProvider>);
    const btns = document.querySelectorAll('button');
    fireEvent.click(btns[0]); // polygon
    fireEvent.click(btns[1]); // solana
    fireEvent.click(btns[2]); // ethereum
    fireEvent.click(btns[3]); // arbitrum -> drops polygon
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('arbitrum,ethereum,solana');
  });

  it('moves existing network to front on re-add', () => {
    render(<RecentNetworksProvider><Consumer /></RecentNetworksProvider>);
    const btns = document.querySelectorAll('button');
    fireEvent.click(btns[0]); // polygon
    fireEvent.click(btns[1]); // solana
    fireEvent.click(btns[2]); // ethereum
    fireEvent.click(btns[0]); // polygon again -> moves to front
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('polygon,ethereum,solana');
  });

  it('persists to localStorage', () => {
    render(<RecentNetworksProvider userId="test-user"><Consumer /></RecentNetworksProvider>);
    const btns = document.querySelectorAll('button');
    fireEvent.click(btns[0]);
    fireEvent.click(btns[1]);
    expect(JSON.parse(store['revora-recent-networks:test-user'])).toEqual(['solana', 'polygon']);
  });

  it('restores from localStorage on mount', () => {
    store['revora-recent-networks:test-user'] = JSON.stringify(['ethereum', 'polygon']);
    render(<RecentNetworksProvider userId="test-user"><Consumer /></RecentNetworksProvider>);
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('ethereum,polygon');
  });

  it('ignores corrupted localStorage', () => {
    store['revora-recent-networks:test-user'] = 'not-json';
    render(<RecentNetworksProvider userId="test-user"><Consumer /></RecentNetworksProvider>);
    expect(document.querySelector('[data-testid="recents"]')!.textContent).toBe('');
  });

  it('separates storage per userId', () => {
    store['revora-recent-networks:alice'] = JSON.stringify(['ethereum']);
    store['revora-recent-networks:bob'] = JSON.stringify(['polygon']);
    const { container } = render(
      <>
        <RecentNetworksProvider userId="alice"><Consumer /></RecentNetworksProvider>
        <RecentNetworksProvider userId="bob"><Consumer /></RecentNetworksProvider>
      </>,
    );
    const spans = container.querySelectorAll('[data-testid="recents"]');
    expect(spans[0].textContent).toBe('ethereum');
    expect(spans[1].textContent).toBe('polygon');
  });
});
