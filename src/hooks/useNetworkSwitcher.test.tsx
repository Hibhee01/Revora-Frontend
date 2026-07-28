import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useNetworkSwitcher } from './useNetworkSwitcher';
import { NetworkSwitcherProvider } from '../components/NetworkSwitcher/NetworkSwitcherContext';

describe('useNetworkSwitcher', () => {
  it('throws error when rendered outside <NetworkSwitcherProvider>', () => {
    expect(() => renderHook(() => useNetworkSwitcher())).toThrow(
      'useNetworkSwitcher must be used within a <NetworkSwitcherProvider>',
    );
  });

  it('provides default network switcher state and handlers', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    expect(result.current.connectedChainId).toBe(1);
    expect(result.current.appChainId).toBe(137);
    expect(result.current.isMismatch).toBe(true);
    expect(result.current.connectedChain.name).toBe('Ethereum Mainnet');
    expect(result.current.appChain.name).toBe('Polygon PoS');
  });

  it('updates connected chain and resolves mismatch when chains match', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    act(() => {
      result.current.setConnectedChainId(137);
    });

    expect(result.current.connectedChainId).toBe(137);
    expect(result.current.isMismatch).toBe(false);
  });

  it('updates app chain and triggers onAppChainChanged callback', () => {
    const onAppChainChanged = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider
        initialConnectedChainId={1}
        initialAppChainId={137}
        onAppChainChanged={onAppChainChanged}
      >
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    act(() => {
      result.current.changeAppChain(1);
    });

    expect(result.current.appChainId).toBe(1);
    expect(result.current.isMismatch).toBe(false);
    expect(onAppChainChanged).toHaveBeenCalledWith(1);
  });

  it('handles programmatic wallet switch action', async () => {
    const onWalletSwitchRequested = vi.fn().mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider
        initialConnectedChainId={1}
        initialAppChainId={137}
        onWalletSwitchRequested={onWalletSwitchRequested}
      >
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    await act(async () => {
      await result.current.switchWalletChain();
    });

    expect(onWalletSwitchRequested).toHaveBeenCalledWith(137);
    expect(result.current.connectedChainId).toBe(137);
    expect(result.current.isMismatch).toBe(false);
  });

  it('manages modal open/close states', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialIsModalOpen={false}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    act(() => {
      result.current.openModal();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('updates walletName and isWalletConnected state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    act(() => {
      result.current.setWalletName('Rabby Wallet');
      result.current.setIsWalletConnected(false);
    });

    expect(result.current.walletName).toBe('Rabby Wallet');
    expect(result.current.isWalletConnected).toBe(false);
    expect(result.current.isMismatch).toBe(false);
  });

  it('parses hex chain IDs correctly using setConnectedChainId and setAppChainId', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId="0x1" initialAppChainId="0x89">
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    expect(result.current.connectedChainId).toBe(1);
    expect(result.current.appChainId).toBe(137);

    act(() => {
      result.current.setConnectedChainId('0x89');
      result.current.setAppChainId('0x1');
    });

    expect(result.current.connectedChainId).toBe(137);
    expect(result.current.appChainId).toBe(1);
  });

  it('handles switchWalletChain error gracefully without updating connected chain', async () => {
    const onWalletSwitchRequested = vi.fn().mockRejectedValue(new Error('User rejected switch'));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider
        initialConnectedChainId={1}
        initialAppChainId={137}
        onWalletSwitchRequested={onWalletSwitchRequested}
      >
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    await act(async () => {
      await result.current.switchWalletChain();
    });

    expect(result.current.connectedChainId).toBe(1);
    expect(result.current.isMismatch).toBe(true);
  });

  it('handles default switchWalletChain timer and changeAppChain without targetChainId parameter', async () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    // Call changeAppChain without target parameter -> defaults to connectedChainId (1)
    act(() => {
      result.current.changeAppChain();
    });
    expect(result.current.appChainId).toBe(1);

    // Reset app chain to 137
    act(() => {
      result.current.setAppChainId(137);
    });

    // Call switchWalletChain without custom onWalletSwitchRequested callback
    const switchPromise = act(async () => {
      const p = result.current.switchWalletChain();
      vi.advanceTimersByTime(700);
      await p;
    });
    await switchPromise;

    expect(result.current.connectedChainId).toBe(137);
    vi.useRealTimers();
  });

  it('handles parseChainId decimal strings and unknown inputs', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NetworkSwitcherProvider initialConnectedChainId="137" initialAppChainId={null as any}>
        {children}
      </NetworkSwitcherProvider>
    );

    const { result } = renderHook(() => useNetworkSwitcher(), { wrapper });

    expect(result.current.connectedChainId).toBe(137);
    expect(result.current.appChainId).toBe(0);
    expect(result.current.appChain.name).toBe('Unknown Network (Chain ID: 0)');

    // Test empty string wallet name for line 136 of walletCapabilities.ts
    act(() => {
      result.current.setWalletName('');
    });
    expect(result.current.walletCapability.type).toBe('generic');
  });
});
