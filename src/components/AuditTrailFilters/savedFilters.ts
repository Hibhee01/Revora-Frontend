/**
 * Saved-filter model for the Audit Trail (Issue #235).
 *
 * Auditors reuse the same complex filter combinations daily. This module
 * provides:
 *   - the audit filter state shape + URL (de)serialization so any filter
 *     combination is shareable via link,
 *   - per-user persistence of named saved filters in localStorage,
 *   - pin / unpin / reorder for the pinned-search sidebar,
 *   - validation (required name, length limits, duplicate detection).
 *
 * Storage is per-user by default: keys are namespaced by the current user id.
 * There is no auth wired in this app yet, so `getCurrentUserId()` is the
 * single seam to swap for the real session user id later.
 */

/* ─── Filter state ──────────────────────────────────────────────────────── */

export interface AuditFilterState {
  /** Free-text search over actor / entity / details. */
  query: string;
  /** Action type, e.g. 'payout' | 'investment' | 'login' | '' (any). */
  action: string;
  /** Actor (user or system) name filter. '' = any. */
  actor: string;
  /** ISO date (yyyy-mm-dd) lower bound, '' = open. */
  dateFrom: string;
  /** ISO date (yyyy-mm-dd) upper bound, '' = open. */
  dateTo: string;
}

export const EMPTY_FILTERS: AuditFilterState = {
  query: '',
  action: '',
  actor: '',
  dateFrom: '',
  dateTo: '',
};

/** True when at least one filter field is set. */
export function hasActiveFilters(filters: AuditFilterState): boolean {
  return Object.values(filters).some((v) => v.trim() !== '');
}

/** Human-readable one-line summary of a filter combination. */
export function describeFilters(filters: AuditFilterState): string {
  const parts: string[] = [];
  if (filters.query.trim()) parts.push(`“${filters.query.trim()}”`);
  if (filters.action.trim()) parts.push(`action: ${filters.action.trim()}`);
  if (filters.actor.trim()) parts.push(`actor: ${filters.actor.trim()}`);
  if (filters.dateFrom.trim()) parts.push(`from ${filters.dateFrom.trim()}`);
  if (filters.dateTo.trim()) parts.push(`to ${filters.dateTo.trim()}`);
  return parts.length > 0 ? parts.join(' · ') : 'No filters';
}

/* ─── URL (de)serialization — shareable links ───────────────────────────── */

const URL_KEYS: Array<[keyof AuditFilterState, string]> = [
  ['query', 'q'],
  ['action', 'action'],
  ['actor', 'actor'],
  ['dateFrom', 'from'],
  ['dateTo', 'to'],
];

/** Serialize filters into URLSearchParams (only non-empty fields). */
export function filtersToSearchParams(filters: AuditFilterState): URLSearchParams {
  const params = new URLSearchParams();
  for (const [field, key] of URL_KEYS) {
    const value = filters[field].trim();
    if (value) params.set(key, value);
  }
  return params;
}

/** Parse filters from URLSearchParams; unknown params are ignored. */
export function filtersFromSearchParams(params: URLSearchParams): AuditFilterState {
  const filters: AuditFilterState = { ...EMPTY_FILTERS };
  for (const [field, key] of URL_KEYS) {
    const value = params.get(key);
    if (value != null) filters[field] = value;
  }
  return filters;
}

/* ─── Saved filter model ────────────────────────────────────────────────── */

export interface SavedFilter {
  id: string;
  /** Display name (unique per user, case-insensitive). */
  name: string;
  /** Optional longer description shown as row tooltip / dialog text. */
  description: string;
  filters: AuditFilterState;
  /** Pinned filters appear in the sidebar in `pinnedOrder`. */
  pinned: boolean;
  createdAt: string;
}

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;

/**
 * Sidebar shows at most this many pinned rows before collapsing the rest
 * behind a "Show all" disclosure (overflow state).
 */
export const PINNED_VISIBLE_LIMIT = 5;

export type SavedFilterValidationError =
  | 'NAME_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'NAME_DUPLICATE'
  | 'DESCRIPTION_TOO_LONG';

/**
 * Validate a candidate name/description against existing filters.
 * Returns the first error, or null when valid. `ignoreId` allows renaming a
 * filter without tripping its own duplicate check.
 */
export function validateSavedFilterInput(
  name: string,
  description: string,
  existing: SavedFilter[],
  ignoreId?: string
): SavedFilterValidationError | null {
  const trimmed = name.trim();
  if (!trimmed) return 'NAME_REQUIRED';
  if (trimmed.length > NAME_MAX_LENGTH) return 'NAME_TOO_LONG';
  const lower = trimmed.toLowerCase();
  const duplicate = existing.some(
    (f) => f.id !== ignoreId && f.name.trim().toLowerCase() === lower
  );
  if (duplicate) return 'NAME_DUPLICATE';
  if (description.trim().length > DESCRIPTION_MAX_LENGTH) return 'DESCRIPTION_TOO_LONG';
  return null;
}

/** Human copy for validation errors (used inline in the save dialog). */
export function validationMessage(error: SavedFilterValidationError): string {
  switch (error) {
    case 'NAME_REQUIRED':
      return 'Enter a name for this filter.';
    case 'NAME_TOO_LONG':
      return `Names are limited to ${NAME_MAX_LENGTH} characters.`;
    case 'NAME_DUPLICATE':
      return 'A saved filter with this name already exists. Choose another name.';
    case 'DESCRIPTION_TOO_LONG':
      return `Descriptions are limited to ${DESCRIPTION_MAX_LENGTH} characters.`;
  }
}

/* ─── Per-user persistence ──────────────────────────────────────────────── */

const STORAGE_PREFIX = 'revora-audit-saved-filters';

/**
 * The current user id. No auth context exists in this app yet, so this
 * returns a stable local identifier; swap for the session user id when auth
 * lands. Keeping the seam here means storage stays per-user by default.
 */
export function getCurrentUserId(): string {
  return 'local-user';
}

export function storageKeyForUser(userId: string = getCurrentUserId()): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function isSavedFilter(value: unknown): value is SavedFilter {
  const f = value as Partial<SavedFilter> | null;
  return (
    f != null &&
    typeof f === 'object' &&
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.description === 'string' &&
    typeof f.pinned === 'boolean' &&
    typeof f.createdAt === 'string' &&
    f.filters != null &&
    typeof f.filters === 'object' &&
    typeof (f.filters as AuditFilterState).query === 'string'
  );
}

/** Load saved filters for a user. Corrupt or blocked storage yields []. */
export function loadSavedFilters(userId: string = getCurrentUserId()): SavedFilter[] {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedFilter);
  } catch {
    return [];
  }
}

/** Persist saved filters for a user. Storage failures are non-fatal. */
export function persistSavedFilters(
  filters: SavedFilter[],
  userId: string = getCurrentUserId()
): void {
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(filters));
  } catch {
    // Blocked / full storage: the in-memory list still works for the session.
  }
}

/* ─── Pure list operations (persisted by callers) ───────────────────────── */

export function createSavedFilter(
  name: string,
  description: string,
  filters: AuditFilterState,
  options: { pinned?: boolean; now?: Date; id?: string } = {}
): SavedFilter {
  return {
    id: options.id ?? `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    description: description.trim(),
    filters: { ...filters },
    pinned: options.pinned ?? true,
    createdAt: (options.now ?? new Date()).toISOString(),
  };
}

export function pinnedFilters(filters: SavedFilter[]): SavedFilter[] {
  return filters.filter((f) => f.pinned);
}

export function togglePinned(filters: SavedFilter[], id: string): SavedFilter[] {
  return filters.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f));
}

export function removeSavedFilter(filters: SavedFilter[], id: string): SavedFilter[] {
  return filters.filter((f) => f.id !== id);
}

/**
 * Move a pinned filter up (-1) or down (+1) within the pinned subsequence,
 * leaving unpinned entries in place. No-op at the ends of the list.
 */
export function movePinned(
  filters: SavedFilter[],
  id: string,
  direction: -1 | 1
): SavedFilter[] {
  const pinnedIds = filters.filter((f) => f.pinned).map((f) => f.id);
  const from = pinnedIds.indexOf(id);
  if (from === -1) return filters;
  const to = from + direction;
  if (to < 0 || to >= pinnedIds.length) return filters;

  const reordered = [...pinnedIds];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

  const pinnedById = new Map(filters.filter((f) => f.pinned).map((f) => [f.id, f]));
  let cursor = 0;
  return filters.map((f) => (f.pinned ? pinnedById.get(reordered[cursor++])! : f));
}
