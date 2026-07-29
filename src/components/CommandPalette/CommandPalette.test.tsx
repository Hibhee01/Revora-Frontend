/**
 * CommandPalette — comprehensive test suite
 * Coverage target: ≥95% statements, branches, functions, lines
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CommandPalette } from './CommandPalette';
import type { CommandItem } from './commandPaletteData';
import { COMMAND_GROUPS, ALL_COMMANDS, groupSearchResults, searchCommands } from './commandPaletteData';

const noop = () => {};

// Sample recent commands for tests
const RECENT_ITEMS: CommandItem[] = [
  { id: 'nav:dashboard', group: 'navigate', label: 'Go to Dashboard', icon: 'LayoutDashboard' },
  { id: 'action:sign-out', group: 'actions', label: 'Sign Out', icon: 'LogOut' },
];

function renderPalette(overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const defaults: React.ComponentProps<typeof CommandPalette> = {
    isOpen: true,
    onClose: noop,
    isMac: false,
    recentCommands: [],
    onCommandExecute: noop,
    onClearRecent: noop,
  };
  return render(<CommandPalette {...defaults} {...overrides} />);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('CommandPalette', () => {
  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      renderPalette({ isOpen: false });
      expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument();
    });

    it('renders dialog when isOpen is true', () => {
      renderPalette();
      expect(screen.getByTestId('command-palette-dialog')).toBeInTheDocument();
    });

    it('has role="dialog" with aria-modal="true"', () => {
      renderPalette();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('renders search input with correct ARIA attributes', () => {
      renderPalette();
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-controls');
    });

    it('focuses the search input on open', async () => {
      renderPalette();
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveFocus();
      });
    });

    it('renders the listbox with role="listbox"', () => {
      renderPalette();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('renders empty-query state when no recents and no query', () => {
      renderPalette({ recentCommands: [] });
      expect(screen.getByTestId('cp-empty-query')).toBeInTheDocument();
    });

    it('renders hint text in empty-query state', () => {
      renderPalette({ recentCommands: [] });
      expect(screen.getByText('Search commands')).toBeInTheDocument();
    });
  });

  // ─── Recent Actions ─────────────────────────────────────────────────────────

  describe('recent actions', () => {
    it('renders Recent section when recentCommands are provided', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      expect(screen.getByRole('group', { name: 'Recent' })).toBeInTheDocument();
    });

    it('renders recent item labels', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('renders Clear history button when recents exist', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      expect(screen.getByRole('button', { name: 'Clear recent command history' })).toBeInTheDocument();
    });

    it('does NOT render Clear history button when recents are empty', () => {
      renderPalette({ recentCommands: [] });
      expect(screen.queryByRole('button', { name: 'Clear recent command history' })).not.toBeInTheDocument();
    });

    it('calls onClearRecent when Clear history is clicked', () => {
      const onClearRecent = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onClearRecent });
      fireEvent.click(screen.getByRole('button', { name: 'Clear recent command history' }));
      expect(onClearRecent).toHaveBeenCalledTimes(1);
    });

    it('shows empty-query state once recents are cleared (recentCommands=[])', () => {
      const { rerender } = renderPalette({ recentCommands: RECENT_ITEMS });
      rerender(
        <CommandPalette
          isOpen={true}
          onClose={noop}
          isMac={false}
          recentCommands={[]}
          onCommandExecute={noop}
          onClearRecent={noop}
        />,
      );
      expect(screen.getByTestId('cp-empty-query')).toBeInTheDocument();
    });

    it('does not show Recent section when query is non-empty', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dashboard' } });
      expect(screen.queryByRole('group', { name: 'Recent' })).not.toBeInTheDocument();
    });
  });

  // ─── Search / Grouped results ────────────────────────────────────────────────

  describe('search and grouped results', () => {
    it('shows results grouped by section when query matches', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'go to' } });
      expect(screen.getByRole('group', { name: 'Navigate' })).toBeInTheDocument();
    });

    it('shows Actions group when query matches actions', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sign out' } });
      expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
    });

    it('shows Settings group when query matches settings', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'density' } });
      expect(screen.getByRole('group', { name: 'Settings' })).toBeInTheDocument();
    });

    it('renders group headers as h3', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dashboard' } });
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('shows no-results state for unmatched query', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyznotexist' } });
      expect(screen.getByTestId('cp-no-results')).toBeInTheDocument();
    });

    it('echoes the query in the no-results message', () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyznotexist' } });
      expect(screen.getByText('"xyznotexist"')).toBeInTheDocument();
    });

    it('returns to empty-query state when query is cleared', () => {
      renderPalette({ recentCommands: [] });
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'home' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByTestId('cp-empty-query')).toBeInTheDocument();
    });

    it('respects per-group resultLimit (≤5 per group)', () => {
      renderPalette();
      // 'e' matches many items across groups
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'e' } });
      const groups = screen.queryAllByRole('group');
      // Each group that appears should have at most resultLimit items
      COMMAND_GROUPS.forEach((g) => {
        const matchCount = g.items.filter(
          (i) => i.label.toLowerCase().includes('e') || (i.description ?? '').toLowerCase().includes('e'),
        ).length;
        if (matchCount > 0) {
          const groupEl = screen.queryByRole('group', { name: g.label });
          if (groupEl) {
            const options = groupEl.querySelectorAll('[role="option"]');
            expect(options.length).toBeLessThanOrEqual(g.resultLimit);
          }
        }
      });
      expect(groups).toBeDefined();
    });
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('closes on Escape key', () => {
      const onClose = vi.fn();
      renderPalette({ onClose });
      fireEvent.keyDown(screen.getByTestId('command-palette-dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape with preventDefault', () => {
      renderPalette();
      const dialog = screen.getByTestId('command-palette-dialog');
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      const spy = vi.spyOn(event, 'preventDefault');
      dialog.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('ArrowDown selects first item', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      fireEvent.keyDown(screen.getByTestId('command-palette-dialog'), { key: 'ArrowDown' });
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowDown wraps from last to first', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      const dialog = screen.getByTestId('command-palette-dialog');
      // Move to last item
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      // Wrap
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowUp wraps from first to last', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      const dialog = screen.getByTestId('command-palette-dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowDown' }); // go to index 0
      fireEvent.keyDown(dialog, { key: 'ArrowUp' });   // wrap to last
      const options = screen.getAllByRole('option');
      expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
    });

    it('Enter activates highlighted item', () => {
      const onCommandExecute = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onCommandExecute });
      const dialog = screen.getByTestId('command-palette-dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'Enter' });
      expect(onCommandExecute).toHaveBeenCalledWith(RECENT_ITEMS[0]);
    });

    it('Enter closes the palette after activation', () => {
      const onClose = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onClose });
      const dialog = screen.getByTestId('command-palette-dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'Enter' });
      expect(onClose).toHaveBeenCalled();
    });

    it('Enter does nothing if no item is selected (index -1)', () => {
      const onCommandExecute = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onCommandExecute });
      fireEvent.keyDown(screen.getByTestId('command-palette-dialog'), { key: 'Enter' });
      expect(onCommandExecute).not.toHaveBeenCalled();
    });

    it('ArrowDown does nothing when no items are visible', () => {
      // Empty query + no recents => no items
      renderPalette({ recentCommands: [] });
      expect(() => {
        fireEvent.keyDown(screen.getByTestId('command-palette-dialog'), { key: 'ArrowDown' });
      }).not.toThrow();
    });
  });

  // ─── Mouse interactions ──────────────────────────────────────────────────────

  describe('mouse interactions', () => {
    it('clicking an item calls onCommandExecute with that item', () => {
      const onCommandExecute = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onCommandExecute });
      const options = screen.getAllByRole('option');
      fireEvent.click(options[0]);
      expect(onCommandExecute).toHaveBeenCalledWith(RECENT_ITEMS[0]);
    });

    it('clicking an item closes the palette', () => {
      const onClose = vi.fn();
      renderPalette({ recentCommands: RECENT_ITEMS, onClose });
      fireEvent.click(screen.getAllByRole('option')[0]);
      expect(onClose).toHaveBeenCalled();
    });

    it('hovering an item sets it as active (aria-selected)', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      const options = screen.getAllByRole('option');
      fireEvent.mouseEnter(options[1]);
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking the backdrop calls onClose', () => {
      const onClose = vi.fn();
      renderPalette({ onClose });
      fireEvent.click(screen.getByTestId('command-palette-overlay'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clicking the dialog itself does NOT call onClose', () => {
      const onClose = vi.fn();
      renderPalette({ onClose });
      fireEvent.click(screen.getByTestId('command-palette-dialog'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ─── onExecute callback on CommandItem ───────────────────────────────────────

  describe('item onExecute callback', () => {
    it('calls item.onExecute when item is activated', () => {
      const onExecute = vi.fn();
      const item: CommandItem = { id: 'test:exec', group: 'actions', label: 'Test', onExecute };
      renderPalette({ recentCommands: [item] });
      fireEvent.click(screen.getByRole('option'));
      expect(onExecute).toHaveBeenCalledTimes(1);
    });

    it('does not throw when item has no onExecute', () => {
      const item: CommandItem = { id: 'test:noexec', group: 'actions', label: 'No Exec' };
      renderPalette({ recentCommands: [item] });
      expect(() => fireEvent.click(screen.getByRole('option'))).not.toThrow();
    });
  });

  // ─── Focus management ────────────────────────────────────────────────────────

  describe('focus management', () => {
    it('restores focus to trigger element on close', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Open';
      document.body.appendChild(trigger);
      trigger.focus();

      const { rerender } = renderPalette();

      rerender(
        <CommandPalette
          isOpen={false}
          onClose={noop}
          isMac={false}
          recentCommands={[]}
          onCommandExecute={noop}
          onClearRecent={noop}
        />,
      );

      expect(document.activeElement).toBe(trigger);
      document.body.removeChild(trigger);
    });

    it('locks body scroll when open', () => {
      renderPalette();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = renderPalette();
      rerender(
        <CommandPalette
          isOpen={false}
          onClose={noop}
          isMac={false}
          recentCommands={[]}
          onCommandExecute={noop}
          onClearRecent={noop}
        />,
      );
      expect(document.body.style.overflow).toBe('');
    });
  });

  // ─── Accessibility / ARIA ────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has no axe violations in base state', async () => {
      const { container } = renderPalette({ recentCommands: [] });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with recent items', async () => {
      const { container } = renderPalette({ recentCommands: RECENT_ITEMS });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with search results', async () => {
      const { container } = renderPalette({ recentCommands: [] });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dashboard' } });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations in no-results state', async () => {
      const { container } = renderPalette({ recentCommands: [] });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyznotexist' } });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('result items have role="option"', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(RECENT_ITEMS.length);
    });

    it('live status region has role="status" aria-live="polite"', () => {
      renderPalette();
      // The sr-only status div
      const statusEl = document.querySelector('[role="status"][aria-live="polite"]');
      expect(statusEl).toBeInTheDocument();
    });

    it('announces result count when query produces results', async () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dashboard' } });
      await waitFor(() => {
        const statusEl = document.querySelector('[role="status"][aria-live="polite"]');
        expect(statusEl?.textContent).toMatch(/result/i);
      });
    });

    it('announces no results when query matches nothing', async () => {
      renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyznotexist' } });
      await waitFor(() => {
        const statusEl = document.querySelector('[role="status"][aria-live="polite"]');
        expect(statusEl?.textContent).toMatch(/no results/i);
      });
    });
  });

  // ─── Platform labels ─────────────────────────────────────────────────────────

  describe('platform-aware labels', () => {
    it('shows ⌘K on Mac', () => {
      renderPalette({ isMac: true });
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('shows Ctrl+K on non-Mac', () => {
      renderPalette({ isMac: false });
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
    });

    it('renders ⌘ shortcut key for Mac in result rows', () => {
      const item: CommandItem = {
        id: 'nav:home',
        group: 'navigate',
        label: 'Go to Home',
        shortcutKeys: ['mod', 'shift', 'h'],
      };
      renderPalette({ recentCommands: [item], isMac: true });
      const kbds = document.querySelectorAll('.cp-shortcut-key');
      const cmdKey = Array.from(kbds).find((el) => el.textContent === '⌘');
      expect(cmdKey).toBeTruthy();
    });

    it('renders Ctrl shortcut key for non-Mac in result rows', () => {
      const item: CommandItem = {
        id: 'nav:home',
        group: 'navigate',
        label: 'Go to Home',
        shortcutKeys: ['mod', 'shift', 'h'],
      };
      renderPalette({ recentCommands: [item], isMac: false });
      const kbds = document.querySelectorAll('.cp-shortcut-key');
      const ctrlKey = Array.from(kbds).find((el) => el.textContent === 'Ctrl');
      expect(ctrlKey).toBeTruthy();
    });
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles no recents gracefully — shows empty-query placeholder', () => {
      renderPalette({ recentCommands: [] });
      expect(screen.getByTestId('cp-empty-query')).toBeInTheDocument();
    });

    it('handles exactly 5 recent commands', () => {
      const fiveRecents: CommandItem[] = ALL_COMMANDS.slice(0, 5).map((c) => ({ ...c }));
      renderPalette({ recentCommands: fiveRecents });
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5);
    });

    it('still works when recentCommands contain items not in ALL_COMMANDS', () => {
      const ghostItem: CommandItem = { id: 'ghost:1', group: 'actions', label: 'Ghost Item' };
      expect(() => renderPalette({ recentCommands: [ghostItem] })).not.toThrow();
      expect(screen.getByText('Ghost Item')).toBeInTheDocument();
    });

    it('resets active index when query changes', () => {
      renderPalette({ recentCommands: RECENT_ITEMS });
      const dialog = screen.getByTestId('command-palette-dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dashboard' } });
      // After query change, no item should be active initially
      const options = screen.getAllByRole('option');
      options.forEach((o) => expect(o).toHaveAttribute('aria-selected', 'false'));
    });

    it('query is cleared when palette is reopened', () => {
      const { rerender } = renderPalette();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'home' } });
      // Close
      rerender(<CommandPalette isOpen={false} onClose={noop} isMac={false} recentCommands={[]} onCommandExecute={noop} onClearRecent={noop} />);
      // Reopen
      rerender(<CommandPalette isOpen={true} onClose={noop} isMac={false} recentCommands={[]} onCommandExecute={noop} onClearRecent={noop} />);
      expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('');
    });

    it('handles very long query strings without crashing', () => {
      renderPalette();
      const longQuery = 'a'.repeat(500);
      expect(() =>
        fireEvent.change(screen.getByRole('combobox'), { target: { value: longQuery } }),
      ).not.toThrow();
    });

    it('renders items with no icon gracefully', () => {
      const item: CommandItem = { id: 'no-icon', group: 'actions', label: 'No Icon Item' };
      renderPalette({ recentCommands: [item] });
      expect(screen.getByText('No Icon Item')).toBeInTheDocument();
    });

    it('renders item description when present', () => {
      const item: CommandItem = { id: 'with-desc', group: 'navigate', label: 'Item', description: '/some/path' };
      renderPalette({ recentCommands: [item] });
      expect(screen.getByText('/some/path')).toBeInTheDocument();
    });
  });

  // ─── Tab focus trap ──────────────────────────────────────────────────────────

  describe('tab focus trap', () => {
    it('does not call onClose on Tab key', () => {
      const onClose = vi.fn();
      renderPalette({ onClose });
      fireEvent.keyDown(screen.getByTestId('command-palette-dialog'), { key: 'Tab' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

// ─── commandPaletteData unit tests ───────────────────────────────────────────

describe('commandPaletteData', () => {
  it('COMMAND_GROUPS has 3 groups', () => {
    expect(COMMAND_GROUPS).toHaveLength(3);
  });

  it('all groups have a label, key, resultLimit, and items', () => {
    COMMAND_GROUPS.forEach((g) => {
      expect(g.label).toBeTruthy();
      expect(g.key).toBeTruthy();
      expect(g.resultLimit).toBeGreaterThan(0);
      expect(g.items.length).toBeGreaterThan(0);
    });
  });

  it('all items have a unique id', () => {
    const ids = ALL_COMMANDS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all items have a label and group', () => {
    ALL_COMMANDS.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.group).toBeTruthy();
    });
  });

  describe('searchCommands', () => {
    it('returns empty array for empty query', () => {
      expect(searchCommands('')).toHaveLength(0);
    });

    it('returns empty array for whitespace query', () => {
      expect(searchCommands('   ')).toHaveLength(0);
    });

    it('matches by label (case-insensitive)', () => {
      const results = searchCommands('DASHBOARD');
      expect(results.some((r) => r.id === 'nav:dashboard')).toBe(true);
    });

    it('matches by description', () => {
      const results = searchCommands('/dashboard');
      expect(results.some((r) => r.id === 'nav:dashboard')).toBe(true);
    });

    it('returns no results for unmatched query', () => {
      expect(searchCommands('xyznotexist')).toHaveLength(0);
    });
  });

  describe('groupSearchResults', () => {
    it('returns only groups that have matching items', () => {
      const items = searchCommands('sign out');
      const groups = groupSearchResults(items);
      expect(groups.every((g) => g.items.length > 0)).toBe(true);
    });

    it('respects per-group resultLimit', () => {
      // Query 'e' matches many items
      const items = searchCommands('e');
      const groups = groupSearchResults(items);
      groups.forEach(({ group, items: groupItems }) => {
        expect(groupItems.length).toBeLessThanOrEqual(group.resultLimit);
      });
    });

    it('returns empty array when no items match', () => {
      const groups = groupSearchResults([]);
      expect(groups).toHaveLength(0);
    });

    it('preserves group order (navigate, actions, settings)', () => {
      const items = ALL_COMMANDS;
      const groups = groupSearchResults(items);
      const keys = groups.map((g) => g.group.key);
      // Only check groups that appear; they must be in the declared order
      const declared = COMMAND_GROUPS.map((g) => g.key);
      const filtered = declared.filter((k) => keys.includes(k));
      expect(keys).toEqual(filtered);
    });
  });
});
