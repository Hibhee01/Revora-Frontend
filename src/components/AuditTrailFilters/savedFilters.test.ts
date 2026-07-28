/**
 * Tests for the saved-filter model (Issue #235).
 * Covers URL round-trips, validation (duplicates, very long names), per-user
 * storage, pin/unpin/reorder, and storage failure behavior.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  EMPTY_FILTERS,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  PINNED_VISIBLE_LIMIT,
  type AuditFilterState,
  type SavedFilter,
  createSavedFilter,
  describeFilters,
  filtersFromSearchParams,
  filtersToSearchParams,
  getCurrentUserId,
  hasActiveFilters,
  loadSavedFilters,
  movePinned,
  persistSavedFilters,
  pinnedFilters,
  removeSavedFilter,
  storageKeyForUser,
  togglePinned,
  validateSavedFilterInput,
  validationMessage,
} from './savedFilters';

const SAMPLE_FILTERS: AuditFilterState = {
  query: 'payout batch',
  action: 'payout',
  actor: 'maria.chen',
  dateFrom: '2026-07-01',
  dateTo: '2026-07-31',
};

function saved(name: string, overrides: Partial<SavedFilter> = {}): SavedFilter {
  return { ...createSavedFilter(name, '', SAMPLE_FILTERS, { id: `id-${name}` }), ...overrides };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ─── filter state helpers ──────────────────────────────────────────────── */

describe('hasActiveFilters', () => {
  it('is false for the empty state and whitespace-only values', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: '   ' })).toBe(false);
  });

  it('is true when any field is set', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, action: 'payout' })).toBe(true);
  });
});

describe('describeFilters', () => {
  it('summarizes all active fields', () => {
    const summary = describeFilters(SAMPLE_FILTERS);
    expect(summary).toContain('payout batch');
    expect(summary).toContain('action: payout');
    expect(summary).toContain('actor: maria.chen');
    expect(summary).toContain('from 2026-07-01');
    expect(summary).toContain('to 2026-07-31');
  });

  it('falls back to "No filters" for the empty state', () => {
    expect(describeFilters(EMPTY_FILTERS)).toBe('No filters');
  });
});

/* ─── URL round-trip (shareable links) ──────────────────────────────────── */

describe('filtersToSearchParams / filtersFromSearchParams', () => {
  it('round-trips a full filter combination', () => {
    const params = filtersToSearchParams(SAMPLE_FILTERS);
    expect(filtersFromSearchParams(params)).toEqual(SAMPLE_FILTERS);
  });

  it('omits empty fields from the URL', () => {
    const params = filtersToSearchParams({ ...EMPTY_FILTERS, query: 'x' });
    expect(params.toString()).toBe('q=x');
  });

  it('ignores unknown params when parsing', () => {
    const params = new URLSearchParams('q=hello&utm_source=email&page=3');
    expect(filtersFromSearchParams(params)).toEqual({ ...EMPTY_FILTERS, query: 'hello' });
  });

  it('parses an empty query string to the empty filter state', () => {
    expect(filtersFromSearchParams(new URLSearchParams())).toEqual(EMPTY_FILTERS);
  });

  it('preserves unicode / RTL text through the round-trip', () => {
    const rtl = { ...EMPTY_FILTERS, query: 'دفعة المدقق' };
    expect(filtersFromSearchParams(filtersToSearchParams(rtl))).toEqual(rtl);
  });
});

/* ─── validation ────────────────────────────────────────────────────────── */

describe('validateSavedFilterInput', () => {
  it('accepts a valid name and description', () => {
    expect(validateSavedFilterInput('Quarterly payouts', 'desc', [])).toBeNull();
  });

  it('requires a non-blank name', () => {
    expect(validateSavedFilterInput('', '', [])).toBe('NAME_REQUIRED');
    expect(validateSavedFilterInput('   ', '', [])).toBe('NAME_REQUIRED');
  });

  it('rejects very long names past the limit', () => {
    expect(validateSavedFilterInput('a'.repeat(NAME_MAX_LENGTH), '', [])).toBeNull();
    expect(validateSavedFilterInput('a'.repeat(NAME_MAX_LENGTH + 1), '', [])).toBe('NAME_TOO_LONG');
  });

  it('rejects duplicate names case-insensitively and after trimming', () => {
    const existing = [saved('Failed Payouts')];
    expect(validateSavedFilterInput('failed payouts', '', existing)).toBe('NAME_DUPLICATE');
    expect(validateSavedFilterInput('  FAILED PAYOUTS  ', '', existing)).toBe('NAME_DUPLICATE');
  });

  it('allows keeping the same name when renaming (ignoreId)', () => {
    const existing = [saved('Mine')];
    expect(validateSavedFilterInput('Mine', '', existing, 'id-Mine')).toBeNull();
  });

  it('rejects over-long descriptions', () => {
    expect(
      validateSavedFilterInput('ok', 'd'.repeat(DESCRIPTION_MAX_LENGTH + 1), [])
    ).toBe('DESCRIPTION_TOO_LONG');
  });

  it('has human copy for every error', () => {
    for (const code of ['NAME_REQUIRED', 'NAME_TOO_LONG', 'NAME_DUPLICATE', 'DESCRIPTION_TOO_LONG'] as const) {
      expect(validationMessage(code).length).toBeGreaterThan(0);
    }
  });
});

/* ─── per-user persistence ──────────────────────────────────────────────── */

describe('persistence', () => {
  it('namespaces the storage key by user id', () => {
    expect(storageKeyForUser('alice')).toBe('revora-audit-saved-filters:alice');
    expect(storageKeyForUser()).toContain(getCurrentUserId());
  });

  it('round-trips saved filters per user', () => {
    const mine = [saved('Mine')];
    persistSavedFilters(mine, 'alice');
    persistSavedFilters([saved('Theirs')], 'bob');

    expect(loadSavedFilters('alice').map((f) => f.name)).toEqual(['Mine']);
    expect(loadSavedFilters('bob').map((f) => f.name)).toEqual(['Theirs']);
  });

  it('returns [] for missing, corrupt, or non-array data', () => {
    expect(loadSavedFilters('nobody')).toEqual([]);

    localStorage.setItem(storageKeyForUser('corrupt'), '{not json');
    expect(loadSavedFilters('corrupt')).toEqual([]);

    localStorage.setItem(storageKeyForUser('object'), '{"a":1}');
    expect(loadSavedFilters('object')).toEqual([]);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const valid = saved('Valid');
    localStorage.setItem(
      storageKeyForUser('mixed'),
      JSON.stringify([valid, { id: 'bad' }, null, 42])
    );
    expect(loadSavedFilters('mixed').map((f) => f.name)).toEqual(['Valid']);
  });

  it('survives blocked storage (private mode / quota)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => persistSavedFilters([saved('x')])).not.toThrow();
    expect(loadSavedFilters()).toEqual([]);
  });
});

/* ─── list operations ───────────────────────────────────────────────────── */

describe('createSavedFilter', () => {
  it('trims name/description, copies filters, and pins by default', () => {
    const created = createSavedFilter('  Name  ', '  desc  ', SAMPLE_FILTERS);
    expect(created.name).toBe('Name');
    expect(created.description).toBe('desc');
    expect(created.pinned).toBe(true);
    expect(created.filters).toEqual(SAMPLE_FILTERS);
    expect(created.filters).not.toBe(SAMPLE_FILTERS); // defensive copy
    expect(created.id).toMatch(/^sf-/);
  });

  it('generates unique ids', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => createSavedFilter('n', '', EMPTY_FILTERS).id)
    );
    expect(ids.size).toBe(50);
  });
});

describe('pin / unpin / remove', () => {
  it('togglePinned flips only the target', () => {
    const list = [saved('a'), saved('b')];
    const next = togglePinned(list, 'id-a');
    expect(next.find((f) => f.id === 'id-a')?.pinned).toBe(false);
    expect(next.find((f) => f.id === 'id-b')?.pinned).toBe(true);
  });

  it('removeSavedFilter drops the target', () => {
    const next = removeSavedFilter([saved('a'), saved('b')], 'id-a');
    expect(next.map((f) => f.name)).toEqual(['b']);
  });

  it('pinnedFilters returns only pinned entries', () => {
    const list = [saved('a'), saved('b', { pinned: false })];
    expect(pinnedFilters(list).map((f) => f.name)).toEqual(['a']);
  });
});

describe('movePinned (reorder)', () => {
  const list = () => [saved('a'), saved('b', { pinned: false }), saved('c'), saved('d')];

  it('moves a pinned filter down past unpinned entries', () => {
    const next = movePinned(list(), 'id-a', 1);
    // pinned order was [a, c, d] → [c, a, d]; unpinned b stays in place
    expect(next.map((f) => f.name)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('moves a pinned filter up', () => {
    const next = movePinned(list(), 'id-d', -1);
    expect(next.filter((f) => f.pinned).map((f) => f.name)).toEqual(['a', 'd', 'c']);
  });

  it('is a no-op at the boundaries', () => {
    expect(movePinned(list(), 'id-a', -1).map((f) => f.name)).toEqual(['a', 'b', 'c', 'd']);
    expect(movePinned(list(), 'id-d', 1).map((f) => f.name)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is a no-op for unknown or unpinned ids', () => {
    expect(movePinned(list(), 'missing', 1).map((f) => f.name)).toEqual(['a', 'b', 'c', 'd']);
    expect(movePinned(list(), 'id-b', 1).map((f) => f.name)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('overflow constant', () => {
  it('keeps the sidebar overflow threshold sane', () => {
    expect(PINNED_VISIBLE_LIMIT).toBeGreaterThanOrEqual(3);
  });
});
