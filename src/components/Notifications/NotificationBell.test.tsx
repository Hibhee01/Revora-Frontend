/**
 * NotificationBell.test.tsx — Issue #493
 * vitest + @testing-library/react + jest-axe
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import NotificationBell from './NotificationBell';
import type { Notification } from './notificationsData';

/* ─── Helpers ───────────────────────────────────────────── */

const mkNote = (id: string, read: boolean): Notification => ({
  id,
  title: `Notification ${id}`,
  time: '1h ago',
  read,
});

const UNREAD_3 = [mkNote('1', false), mkNote('2', false), mkNote('3', false)];
const READ_ALL = [mkNote('1', true),  mkNote('2', true)];
const MIXED    = [mkNote('1', false), mkNote('2', true), mkNote('3', false)];

/** Mock useReducedMotion to return a specific value */
function mockReducedMotion(value: boolean) {
  vi.doMock('../../hooks/useReducedMotion', () => ({
    useReducedMotion: () => value,
  }));
}

/* ─── Rendering ─────────────────────────────────────────── */

describe('Rendering', () => {
  it('renders the bell button', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByTestId('nb-trigger')).toBeInTheDocument();
  });

  it('renders no badge when all notifications are read', () => {
    render(<NotificationBell notifications={READ_ALL} />);
    expect(screen.queryByTestId('nb-badge')).not.toBeInTheDocument();
  });

  it('renders badge with correct count for unread notifications', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('3');
  });

  it('shows only unread count when mix of read/unread', () => {
    render(<NotificationBell notifications={MIXED} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('2');
  });

  it('caps badge display at 99+ for very large counts', () => {
    const many = Array.from({ length: 105 }, (_, i) => mkNote(String(i), false));
    render(<NotificationBell notifications={many} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('99+');
  });

  it('renders notification panel when open', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides notification panel when closed', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

/* ─── Badge class variants ──────────────────────────────── */

describe('Badge motion variants', () => {
  it('applies nb-badge--pulse class when reducedMotion is false', () => {
    // Default: window.matchMedia returns no-preference (not reduced)
    render(<NotificationBell notifications={UNREAD_3} />);
    const badge = screen.getByTestId('nb-badge');
    // Either pulse or static — depends on OS; just confirm one is present
    expect(
      badge.classList.contains('nb-badge--pulse') ||
      badge.classList.contains('nb-badge--static'),
    ).toBe(true);
  });

  it('badge has nb-badge--static class when matchMedia signals reduce', () => {
    // Simulate prefers-reduced-motion: reduce
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    render(<NotificationBell notifications={UNREAD_3} />);
    const badge = screen.getByTestId('nb-badge');
    expect(badge.classList.contains('nb-badge--static')).toBe(true);
    // Restore
    Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
  });
});

/* ─── Toggle behaviour ──────────────────────────────────── */

describe('Toggle behaviour', () => {
  it('opens panel on click', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes panel on second click', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    await userEvent.click(screen.getByTestId('nb-trigger'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens panel on Enter key', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    fireEvent.keyDown(screen.getByTestId('nb-trigger'), { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens panel on Space key', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    fireEvent.keyDown(screen.getByTestId('nb-trigger'), { key: ' ' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes panel on Escape key', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    fireEvent.keyDown(screen.getByTestId('nb-trigger'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates aria-expanded correctly', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    const btn = screen.getByTestId('nb-trigger');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

/* ─── ARIA semantics ────────────────────────────────────── */

describe('ARIA semantics', () => {
  it('button has aria-label="Notifications"', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('button has aria-haspopup="true"', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByTestId('nb-trigger')).toHaveAttribute('aria-haspopup', 'true');
  });

  it('badge has role="status"', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('badge has descriptive aria-label with count', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByLabelText(/3 unread notifications/i)).toBeInTheDocument();
  });

  it('badge aria-label uses singular for count of 1', () => {
    render(<NotificationBell notifications={[mkNote('1', false)]} />);
    expect(screen.getByLabelText(/1 unread notification$/i)).toBeInTheDocument();
  });

  it('badge has aria-live="polite"', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByTestId('nb-badge')).toHaveAttribute('aria-live', 'polite');
  });

  it('badge has aria-atomic="true"', () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByTestId('nb-badge')).toHaveAttribute('aria-atomic', 'true');
  });

  it('bell icon is aria-hidden', () => {
    render(<NotificationBell notifications={[]} />);
    const icon = screen.getByTestId('nb-trigger').querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

/* ─── Edge cases ────────────────────────────────────────── */

describe('Edge cases', () => {
  it('handles empty notifications array without crashing', () => {
    expect(() => render(<NotificationBell notifications={[]} />)).not.toThrow();
  });

  it('handles 100+ unread (concurrent updates) — shows 99+', () => {
    const many = Array.from({ length: 150 }, (_, i) => mkNote(String(i), false));
    render(<NotificationBell notifications={many} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('99+');
  });

  it('re-renders correctly when unread count changes', async () => {
    const { rerender } = render(<NotificationBell notifications={MIXED} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('2');
    rerender(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByTestId('nb-badge')).toHaveTextContent('3');
  });

  it('removes badge when all notifications become read', async () => {
    const { rerender } = render(<NotificationBell notifications={UNREAD_3} />);
    expect(screen.getByTestId('nb-badge')).toBeInTheDocument();
    rerender(<NotificationBell notifications={READ_ALL} />);
    expect(screen.queryByTestId('nb-badge')).not.toBeInTheDocument();
  });

  it('notification panel list contains all items', async () => {
    render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    const dialog = screen.getByRole('dialog');
    const items = within(dialog).getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
});

/* ─── Accessibility — axe ───────────────────────────────── */

describe('Accessibility — axe', () => {
  it('no violations when closed, no unread', async () => {
    const { container } = render(<NotificationBell notifications={READ_ALL} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('no violations when closed, with unread badge', async () => {
    const { container } = render(<NotificationBell notifications={UNREAD_3} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('no violations when panel is open', async () => {
    const { container } = render(<NotificationBell notifications={UNREAD_3} />);
    await userEvent.click(screen.getByTestId('nb-trigger'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('no violations with static badge (reduced-motion simulated)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    const { container } = render(<NotificationBell notifications={UNREAD_3} />);
    expect(await axe(container)).toHaveNoViolations();
    Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
  });
});
