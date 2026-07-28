/**
 * PermissionMatrix
 * Issue #233 – Multi-issuer admin permission-matrix editor
 *
 * A fully accessible, keyboard-navigable grid editor.
 *
 * Features
 * ─────────
 * • Four cell states: allow ✓ | deny ✗ | inherit – | mixed ~
 * • Frozen role column with horizontal scroll for many issuers
 * • Row- and column-level select-all checkboxes
 * • Bulk-apply toolbar: set selected cells to a given state
 * • Diff summary modal before save (shows before/after per cell)
 * • Full keyboard navigation (Arrow keys, Home/End/PageUp/PageDown,
 *   Space/Enter to cycle state, Escape to clear selection)
 * • RTL-aware (uses logical CSS properties throughout)
 * • WCAG 2.1 AA: every interactive element has focus ring + aria labels
 */

import React, {
    useState,
    useCallback,
    useMemo,
    useRef,
    useId,
} from 'react';
import { ShieldCheck, X } from 'lucide-react';

import type {
    PermissionMatrixProps,
    PermissionEntry,
    PermissionState,
    PermissionMap,
    PermissionDiff,
    CellCoord,
} from './PermissionMatrix.types';

import { PermissionMatrixDiffModal } from './PermissionMatrixDiffModal';
import './PermissionMatrix.css';

/* ─── Constants ───────────────────────────────────────────────────────────── */

/** Cycling order for user click/Space interactions */
const CYCLE_ORDER: PermissionState[] = ['allow', 'deny', 'inherit'];

const STATE_LABEL: Record<PermissionState, string> = {
    allow:   'Allow',
    deny:    'Deny',
    inherit: 'Inherit',
    mixed:   'Mixed',
};

const STATE_ICON: Record<PermissionState, string> = {
    allow:   '✓',
    deny:    '✗',
    inherit: '–',
    mixed:   '~',
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function cellKey(roleId: string, issuerId: string): string {
    return `${roleId}:${issuerId}`;
}

function buildInitialMap(entries: PermissionEntry[]): PermissionMap {
    const map: PermissionMap = new Map();
    for (const e of entries) {
        map.set(cellKey(e.roleId, e.issuerId), e.state);
    }
    return map;
}

function cycleState(current: PermissionState): PermissionState {
    // 'mixed' treated as 'inherit' for cycling purposes
    const effective = current === 'mixed' ? 'inherit' : current;
    const idx = CYCLE_ORDER.indexOf(effective);
    return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
                                                                      roles,
                                                                      issuers,
                                                                      initialPermissions,
                                                                      onSave,
                                                                      onCancel,
                                                                      readOnly = false,
                                                                  }) => {
    const titleId  = useId();
    const hintId   = useId();

    /* ── Working permission map ─────────────────────────────────────────── */
    const [permissions, setPermissions] = useState<PermissionMap>(() =>
        buildInitialMap(initialPermissions)
    );

    /* ── Selection set ─────────────────────────────────────────────────── */
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    /* ── Keyboard focus coords ─────────────────────────────────────────── */
    const [focusCoord, setFocusCoord] = useState<CellCoord | null>(null);

    /* ── Diff modal ────────────────────────────────────────────────────── */
    const [diffModalOpen, setDiffModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    /* ── Row/col select-all tracking ───────────────────────────────────── */
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());

    /* ── Bulk-apply target state ────────────────────────────────────────── */
    const [bulkState, setBulkState] = useState<PermissionState>('allow');

    /* ── Refs ────────────────────────────────────────────────────────────── */
    const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    /* ────────────────────────────────────────────────────────────────────
     * Derived: compute diff vs. the initial snapshot
     * ──────────────────────────────────────────────────────────────────── */
    const initialMap = useMemo(() => buildInitialMap(initialPermissions), [initialPermissions]);

    const diffs = useMemo((): PermissionDiff[] => {
        const result: PermissionDiff[] = [];
        const allKeys = new Set([...initialMap.keys(), ...permissions.keys()]);
        for (const key of allKeys) {
            const from = initialMap.get(key) ?? 'inherit';
            const to   = permissions.get(key) ?? 'inherit';
            if (from !== to) {
                const [roleId, issuerId] = key.split(':');
                const role   = roles.find((r) => r.id === roleId);
                const issuer = issuers.find((i) => i.id === issuerId);
                if (role && issuer) {
                    result.push({ roleId, issuerId, roleName: role.name, issuerName: issuer.name, from, to });
                }
            }
        }
        return result;
    }, [permissions, initialMap, roles, issuers]);

    /* ────────────────────────────────────────────────────────────────────
     * Cell read / write helpers
     * ──────────────────────────────────────────────────────────────────── */
    const getCellState = useCallback(
        (roleId: string, issuerId: string): PermissionState =>
            permissions.get(cellKey(roleId, issuerId)) ?? 'inherit',
        [permissions]
    );

    const setCellState = useCallback(
        (roleId: string, issuerId: string, state: PermissionState) => {
            setPermissions((prev) => {
                const next = new Map(prev);
                next.set(cellKey(roleId, issuerId), state);
                return next;
            });
        },
        []
    );

    /* ────────────────────────────────────────────────────────────────────
     * Single-cell click handler
     * ──────────────────────────────────────────────────────────────────── */
    const handleCellClick = useCallback(
        (roleId: string, issuerId: string) => {
            if (readOnly) return;
            const key = cellKey(roleId, issuerId);
            const current = permissions.get(key) ?? 'inherit';
            setCellState(roleId, issuerId, cycleState(current));
        },
        [permissions, readOnly, setCellState]
    );

    /* ────────────────────────────────────────────────────────────────────
     * Cell selection
     * ──────────────────────────────────────────────────────────────────── */
    const toggleCellSelection = useCallback(
        (roleId: string, issuerId: string) => {
            const key = cellKey(roleId, issuerId);
            setSelectedKeys((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            });
        },
        []
    );

    const handleRowSelectAll = useCallback(
        (roleId: string, checked: boolean) => {
            setSelectedRows((prev) => {
                const next = new Set(prev);
                if (checked) next.add(roleId);
                else next.delete(roleId);
                return next;
            });
            setSelectedKeys((prev) => {
                const next = new Set(prev);
                for (const issuer of issuers) {
                    const key = cellKey(roleId, issuer.id);
                    if (checked) next.add(key);
                    else next.delete(key);
                }
                return next;
            });
        },
        [issuers]
    );

    const handleColSelectAll = useCallback(
        (issuerId: string, checked: boolean) => {
            setSelectedCols((prev) => {
                const next = new Set(prev);
                if (checked) next.add(issuerId);
                else next.delete(issuerId);
                return next;
            });
            setSelectedKeys((prev) => {
                const next = new Set(prev);
                for (const role of roles) {
                    const key = cellKey(role.id, issuerId);
                    if (checked) next.add(key);
                    else next.delete(key);
                }
                return next;
            });
        },
        [roles]
    );

    const clearSelection = useCallback(() => {
        setSelectedKeys(new Set());
        setSelectedRows(new Set());
        setSelectedCols(new Set());
    }, []);

    /* ────────────────────────────────────────────────────────────────────
     * Bulk apply
     * ──────────────────────────────────────────────────────────────────── */
    const handleBulkApply = useCallback(
        (state: PermissionState) => {
            if (readOnly || selectedKeys.size === 0) return;
            setPermissions((prev) => {
                const next = new Map(prev);
                for (const key of selectedKeys) {
                    next.set(key, state);
                }
                return next;
            });
        },
        [readOnly, selectedKeys]
    );

    /* ────────────────────────────────────────────────────────────────────
     * Keyboard grid navigation
     * ──────────────────────────────────────────────────────────────────── */
    const handleCellKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>, ri: number, ci: number) => {
            const maxRi = roles.length - 1;
            const maxCi = issuers.length - 1;

            let newRi = ri;
            let newCi = ci;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRi = Math.max(0, ri - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newRi = Math.min(maxRi, ri + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCi = document.dir === 'rtl' ? Math.min(maxCi, ci + 1) : Math.max(0, ci - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newCi = document.dir === 'rtl' ? Math.max(0, ci - 1) : Math.min(maxCi, ci + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    newCi = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    newCi = maxCi;
                    break;
                case 'PageUp':
                    e.preventDefault();
                    newRi = 0;
                    break;
                case 'PageDown':
                    e.preventDefault();
                    newRi = maxRi;
                    break;
                case ' ':
                case 'Enter':
                    if (!readOnly) {
                        e.preventDefault();
                        handleCellClick(roles[ri].id, issuers[ci].id);
                    }
                    return;
                case 'Escape':
                    e.preventDefault();
                    clearSelection();
                    return;
                default:
                    return;
            }

            if (newRi !== ri || newCi !== ci) {
                const key = cellKey(roles[newRi].id, issuers[newCi].id);
                const el = cellRefs.current.get(key);
                if (el) {
                    el.focus();
                    setFocusCoord({ roleIndex: newRi, issuerIndex: newCi });
                }
            }
        },
        [roles, issuers, readOnly, handleCellClick, clearSelection]
    );

    /* ────────────────────────────────────────────────────────────────────
     * Save flow
     * ──────────────────────────────────────────────────────────────────── */
    const handleSaveRequest = useCallback(() => {
        setDiffModalOpen(true);
    }, []);

    const handleConfirmSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const updated: PermissionEntry[] = [];
            for (const role of roles) {
                for (const issuer of issuers) {
                    const state = permissions.get(cellKey(role.id, issuer.id)) ?? 'inherit';
                    updated.push({ roleId: role.id, issuerId: issuer.id, state });
                }
            }
            onSave(updated, diffs);
        } finally {
            setIsSaving(false);
            setDiffModalOpen(false);
        }
    }, [roles, issuers, permissions, diffs, onSave]);

    const handleCancelSave = useCallback(() => {
        setDiffModalOpen(false);
    }, []);

    /* ────────────────────────────────────────────────────────────────────
     * Render
     * ──────────────────────────────────────────────────────────────────── */
    return (
        <div className="pm-wrapper" data-testid="permission-matrix">
            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            {!readOnly && (
                <div className="pm-toolbar" role="toolbar" aria-label="Bulk permission actions">
          <span className="pm-toolbar-label" id={titleId}>
            Bulk apply:
          </span>

                    {/* State selector */}
                    <select
                        className="pm-bulk-select"
                        value={bulkState}
                        onChange={(e) => setBulkState(e.target.value as PermissionState)}
                        aria-label="Select state to bulk apply"
                    >
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                        <option value="inherit">Inherit</option>
                    </select>

                    {/* Apply button */}
                    <button
                        className={`pm-bulk-btn pm-bulk-btn--${bulkState}`}
                        onClick={() => handleBulkApply(bulkState)}
                        disabled={selectedKeys.size === 0}
                        aria-describedby={titleId}
                        data-testid="pm-bulk-apply-btn"
                    >
                        Apply to selected
                    </button>

                    {/* Selection counter */}
                    {selectedKeys.size > 0 && (
                        <>
              <span className="pm-selection-count" aria-live="polite" aria-atomic="true">
                {selectedKeys.size} selected
              </span>
                            <button
                                className="pm-clear-selection"
                                onClick={clearSelection}
                                aria-label="Clear all selections"
                                data-testid="pm-clear-selection"
                            >
                                <X size={12} aria-hidden="true" /> Clear
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Matrix table ─────────────────────────────────────────────── */}
            <div
                className="pm-scroll-container"
                role="region"
                aria-label="Permission matrix — scroll horizontally to see all issuers"
                tabIndex={-1}
            >
                <table
                    className="pm-table"
                    role="grid"
                    aria-label="Permission matrix"
                    aria-describedby={hintId}
                    aria-readonly={readOnly}
                >
                    <thead className="pm-thead">
                    <tr>
                        {/* Frozen role header */}
                        <th scope="col" className="pm-th pm-th-role">
                            Role / Issuer
                        </th>

                        {/* Issuer column headers */}
                        {issuers.map((issuer) => (
                            <th
                                key={issuer.id}
                                scope="col"
                                className="pm-th"
                                aria-label={`${issuer.name} (${issuer.code})`}
                            >
                                <div className="pm-th-col-inner">
                                    {!readOnly && (
                                        <input
                                            type="checkbox"
                                            className="pm-col-check"
                                            checked={selectedCols.has(issuer.id)}
                                            onChange={(e) => handleColSelectAll(issuer.id, e.target.checked)}
                                            aria-label={`Select all cells in ${issuer.name} column`}
                                            data-testid={`pm-col-check-${issuer.id}`}
                                        />
                                    )}
                                    <span className="pm-col-name" title={issuer.name}>
                      {issuer.code}
                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {roles.map((role, ri) => (
                        <tr key={role.id} className="pm-tr">
                            {/* Frozen role cell */}
                            <td className="pm-td-role">
                                <div className="pm-role-cell-inner">
                                    {!readOnly && (
                                        <input
                                            type="checkbox"
                                            className="pm-row-check"
                                            checked={selectedRows.has(role.id)}
                                            onChange={(e) => handleRowSelectAll(role.id, e.target.checked)}
                                            aria-label={`Select all cells in ${role.name} row`}
                                            data-testid={`pm-row-check-${role.id}`}
                                        />
                                    )}
                                    <div>
                                        <div className="pm-role-name">{role.name}</div>
                                        {role.description && (
                                            <div className="pm-role-desc">{role.description}</div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Permission cells */}
                            {issuers.map((issuer, ci) => {
                                const key = cellKey(role.id, issuer.id);
                                const state = getCellState(role.id, issuer.id);
                                const isSelected = selectedKeys.has(key);
                                const isFocused =
                                    focusCoord?.roleIndex === ri && focusCoord?.issuerIndex === ci;

                                return (
                                    <td key={issuer.id} className="pm-td">
                                        <button
                                            ref={(el) => {
                                                if (el) cellRefs.current.set(key, el);
                                                else cellRefs.current.delete(key);
                                            }}
                                            className={[
                                                'pm-cell-btn',
                                                `pm-cell--${state}`,
                                                isSelected ? 'pm-cell--selected' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                            onClick={() => handleCellClick(role.id, issuer.id)}
                                            onDoubleClick={() => !readOnly && toggleCellSelection(role.id, issuer.id)}
                                            onKeyDown={(e) => handleCellKeyDown(e, ri, ci)}
                                            onFocus={() => setFocusCoord({ roleIndex: ri, issuerIndex: ci })}
                                            disabled={readOnly}
                                            aria-label={`${role.name} × ${issuer.name}: ${STATE_LABEL[state]}${isSelected ? ' (selected)' : ''}`}
                                            aria-pressed={isSelected}
                                            data-state={state}
                                            data-focused={isFocused ? 'true' : undefined}
                                            data-testid={`pm-cell-${role.id}-${issuer.id}`}
                                            tabIndex={ri === 0 && ci === 0 ? 0 : -1}
                                        >
                                            <span aria-hidden="true">{STATE_ICON[state]}</span>
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* ── Keyboard hint ─────────────────────────────────────────────── */}
            <p id={hintId} className="pm-keyboard-hint" aria-label="Keyboard navigation hints">
        <span>
          <kbd className="pm-kbd">↑ ↓ ← →</kbd> navigate
        </span>
                <span>
          <kbd className="pm-kbd">Space</kbd> / <kbd className="pm-kbd">Enter</kbd> cycle state
        </span>
                <span>
          <kbd className="pm-kbd">Dbl-click</kbd> select cell
        </span>
                <span>
          <kbd className="pm-kbd">Esc</kbd> clear selection
        </span>
                <span>
          <kbd className="pm-kbd">Home</kbd> / <kbd className="pm-kbd">End</kbd> row edges
        </span>
            </p>

            {/* ── Legend ────────────────────────────────────────────────────── */}
            <div className="pm-legend" role="list" aria-label="Cell state legend">
                {(['allow', 'deny', 'inherit', 'mixed'] as PermissionState[]).map((s) => (
                    <span key={s} className="pm-legend-item" role="listitem">
            <span className={`pm-legend-swatch pm-legend-swatch--${s}`} aria-hidden="true">
              {STATE_ICON[s]}
            </span>
                        {STATE_LABEL[s]}
          </span>
                ))}
            </div>

            {/* ── Footer actions ────────────────────────────────────────────── */}
            {!readOnly && (
                <div className="pm-footer">
          <span className="pm-diff-count" aria-live="polite" aria-atomic="true">
            {diffs.length > 0
                ? `${diffs.length} unsaved change${diffs.length !== 1 ? 's' : ''}`
                : 'No unsaved changes'}
          </span>

                    {onCancel && (
                        <button
                            className="pm-btn-cancel"
                            onClick={onCancel}
                            data-testid="pm-cancel-btn"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        className="pm-btn-save"
                        onClick={handleSaveRequest}
                        disabled={diffs.length === 0}
                        aria-disabled={diffs.length === 0}
                        data-testid="pm-save-btn"
                    >
                        <ShieldCheck size={15} aria-hidden="true" />
                        Review &amp; Save
                    </button>
                </div>
            )}

            {/* ── Diff modal ────────────────────────────────────────────────── */}
            <PermissionMatrixDiffModal
                isOpen={diffModalOpen}
                diffs={diffs}
                isSaving={isSaving}
                onConfirm={handleConfirmSave}
                onCancel={handleCancelSave}
            />
        </div>
    );
};
