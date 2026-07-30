/**
 * commandPaletteData.ts
 *
 * Registry of all commands surfaced in the command palette.
 *
 * Groups (rendered in this order):
 *   1. Navigate  – route changes (max 5 results shown per group)
 *   2. Actions   – functional operations (max 5)
 *   3. Settings  – configuration (max 5)
 *
 * The "Recent" group is synthesised at runtime from the
 * useCommandPalette hook and does NOT appear in this file.
 *
 * Adding a command:
 *   1. Pick (or create) a group in COMMAND_GROUPS.
 *   2. Add a CommandItem — give it a globally-unique `id`.
 *   3. Provide an `onExecute` callback; it is called when the user
 *      activates the item (Enter or click) and BEFORE the palette closes.
 */

export type CommandGroupKey = 'navigate' | 'actions' | 'settings';

export interface CommandItem {
  /** Globally unique identifier — used for deduplication in recent list. */
  id: string;
  /** Human-readable label shown in the result row. */
  label: string;
  /** Optional secondary hint (e.g. path, shortcut hint). */
  description?: string;
  /** Lucide icon name string — resolved in the component. */
  icon?: string;
  /** Called when the command is activated. */
  onExecute?: () => void;
  /** Group this item belongs to (used for filtering). */
  group: CommandGroupKey;
  /** Optional keyboard shortcut hint shown on the trailing end of the row. */
  shortcutKeys?: string[];
  /**
   * Whether this command is destructive. When true, the palette swaps the row
   * into an inline confirm/cancel state instead of executing immediately.
   */
  destructive?: boolean;
  /**
   * Label for the confirm button (e.g. "Delete offering", "Revoke session").
   * Required when `destructive` is true.
   */
  confirmLabel?: string;
  /**
   * Additional context shown in the confirm row beneath the confirm label.
   * e.g. "This will permanently delete the offering and all associated data."
   */
  confirmDescription?: string;
}

export interface CommandGroup {
  key: CommandGroupKey;
  /** Display label for the group header. */
  label: string;
  /** Maximum number of results shown per group when query is non-empty. */
  resultLimit: number;
  items: CommandItem[];
}

// ---------------------------------------------------------------------------
// Command registry
// ---------------------------------------------------------------------------

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    key: 'navigate',
    label: 'Navigate',
    resultLimit: 5,
    items: [
      {
        id: 'nav:home',
        group: 'navigate',
        label: 'Go to Home',
        description: '/',
        icon: 'Home',
        shortcutKeys: ['mod', 'shift', 'h'],
      },
      {
        id: 'nav:dashboard',
        group: 'navigate',
        label: 'Go to Dashboard',
        description: '/dashboard',
        icon: 'LayoutDashboard',
        shortcutKeys: ['mod', 'shift', 'd'],
      },
      {
        id: 'nav:discovery',
        group: 'navigate',
        label: 'Investor Discovery',
        description: '/discovery',
        icon: 'Search',
        shortcutKeys: ['mod', 'shift', 'i'],
      },
      {
        id: 'nav:revenue',
        group: 'navigate',
        label: 'Report Revenue',
        description: '/management/revenue',
        icon: 'BarChart2',
        shortcutKeys: ['mod', 'shift', 'r'],
      },
      {
        id: 'nav:payout-schedule',
        group: 'navigate',
        label: 'Payout Schedule',
        description: '/management/payouts',
        icon: 'Calendar',
      },
      {
        id: 'nav:audit-trail',
        group: 'navigate',
        label: 'Audit Trail',
        description: '/management/audit',
        icon: 'ClipboardList',
      },
      {
        id: 'nav:sessions',
        group: 'navigate',
        label: 'Session Management',
        description: '/settings/sessions',
        icon: 'Monitor',
      },
    ],
  },
  {
    key: 'actions',
    label: 'Actions',
    resultLimit: 5,
    items: [
      {
        id: 'action:toggle-notifications',
        group: 'actions',
        label: 'Toggle Notifications',
        icon: 'Bell',
        shortcutKeys: ['n'],
      },
      {
        id: 'action:toggle-shortcuts',
        group: 'actions',
        label: 'Open Keyboard Shortcuts',
        icon: 'Keyboard',
        shortcutKeys: ['?'],
      },
      {
        id: 'action:new-distribution',
        group: 'actions',
        label: 'Create New Distribution',
        description: 'Initiate a distribution round',
        icon: 'PlusCircle',
      },
      {
        id: 'action:export-ledger',
        group: 'actions',
        label: 'Export Ledger',
        description: 'Download CSV / PDF',
        icon: 'Download',
      },
      {
        id: 'action:sign-out',
        group: 'actions',
        label: 'Sign Out',
        icon: 'LogOut',
      },
      {
        id: 'action:delete-offering',
        group: 'actions',
        label: 'Delete Offering',
        description: 'Permanently delete an offering',
        icon: 'X',
        destructive: true,
        confirmLabel: 'Delete Offering',
        confirmDescription:
          'This will permanently delete the offering and all associated data. This action cannot be undone.',
      },
      {
        id: 'action:revoke-session',
        group: 'actions',
        label: 'Revoke Session',
        description: 'Force-logout a user session',
        icon: 'LogOut',
        destructive: true,
        confirmLabel: 'Revoke Session',
        confirmDescription:
          'The user will be immediately logged out and must re-authenticate. This action is audit-logged.',
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    resultLimit: 5,
    items: [
      {
        id: 'settings:density-comfortable',
        group: 'settings',
        label: 'Density: Comfortable',
        icon: 'AlignJustify',
      },
      {
        id: 'settings:density-cozy',
        group: 'settings',
        label: 'Density: Cozy',
        icon: 'AlignJustify',
      },
      {
        id: 'settings:density-compact',
        group: 'settings',
        label: 'Density: Compact',
        icon: 'AlignJustify',
      },
      {
        id: 'settings:profile',
        group: 'settings',
        label: 'Edit Profile',
        description: '/settings/profile',
        icon: 'UserCog',
      },
      {
        id: 'settings:security',
        group: 'settings',
        label: 'Security & 2FA',
        description: '/settings/security',
        icon: 'ShieldCheck',
      },
      {
        id: 'settings:network',
        group: 'settings',
        label: 'Switch Network',
        icon: 'Globe',
      },
    ],
  },
];

// Flat list of all items — useful for search
export const ALL_COMMANDS: CommandItem[] = COMMAND_GROUPS.flatMap(
  (g) => g.items,
);

/** Map from id → item for O(1) lookup when hydrating the recent list. */
export const COMMAND_BY_ID: Map<string, CommandItem> = new Map(
  ALL_COMMANDS.map((item) => [item.id, item]),
);

/** Filter and score items against a lowercase query string. */
export function searchCommands(query: string): CommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_COMMANDS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q),
  );
}

/** Apply per-group result limits and return groups that have results. */
export function groupSearchResults(
  items: CommandItem[],
): { group: CommandGroup; items: CommandItem[] }[] {
  return COMMAND_GROUPS.reduce<{ group: CommandGroup; items: CommandItem[] }[]>(
    (acc, group) => {
      const matching = items
        .filter((i) => i.group === group.key)
        .slice(0, group.resultLimit);
      if (matching.length > 0) {
        acc.push({ group, items: matching });
      }
      return acc;
    },
    [],
  );
}
