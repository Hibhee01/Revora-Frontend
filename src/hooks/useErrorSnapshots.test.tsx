import { renderHook, act } from '@testing-library/react';
import { useErrorSnapshots, resetGlobalState } from './useErrorSnapshots';
import { describe, it, expect, beforeEach } from 'vitest';

describe('useErrorSnapshots', () => {
  beforeEach(() => {
    resetGlobalState();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useErrorSnapshots());
    expect(result.current.snapshots).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should add a snapshot and increment unread count', () => {
    const { result } = renderHook(() => useErrorSnapshots());
    
    act(() => {
      result.current.addSnapshot({
        group: 'Forms',
        title: 'Draft not saved',
        description: 'Failed to save draft'
      });
    });

    expect(result.current.snapshots.length).toBe(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.snapshots[0].title).toBe('Draft not saved');
    expect(result.current.snapshots[0].group).toBe('Forms');
  });

  it('should remove a snapshot', () => {
    const { result } = renderHook(() => useErrorSnapshots());
    
    let id = '';
    act(() => {
      id = result.current.addSnapshot({
        group: 'Forms',
        title: 'Draft not saved',
      });
    });

    expect(result.current.snapshots.length).toBe(1);

    act(() => {
      result.current.removeSnapshot(id);
    });

    expect(result.current.snapshots.length).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should clear all snapshots', () => {
    const { result } = renderHook(() => useErrorSnapshots());
    
    act(() => {
      result.current.addSnapshot({ group: 'Forms', title: '1' });
      result.current.addSnapshot({ group: 'Uploads', title: '2' });
    });

    expect(result.current.snapshots.length).toBe(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.snapshots.length).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should mark all as read', () => {
    const { result } = renderHook(() => useErrorSnapshots());
    
    act(() => {
      result.current.addSnapshot({ group: 'Forms', title: '1' });
    });

    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.snapshots.length).toBe(1); // snapshots still exist
  });
});
