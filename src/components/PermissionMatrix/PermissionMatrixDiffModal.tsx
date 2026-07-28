/**
 * PermissionMatrixDiffModal
 * Issue #233 – Multi-issuer admin permission-matrix editor
 *
 * Shows a before/after summary of every pending change before the user
 * commits them. Follows the WAI-ARIA `dialog` pattern with focus trapping
 * and Escape-to-cancel.
 */

import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import type { PermissionDiff, PermissionState } from './PermissionMatrix.types';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const STATE_LABELS: Record<PermissionState, string> = {
    allow:   'Allow',
    deny:    'Deny',
    inherit: 'Inherit',
    mixed:   'Mixed',
};

const STATE_ICONS: Record<PermissionState, string> = {
    allow:   '✓',
    deny:    '✗',
    inherit: '–',
    mixed:   '~',
};

interface StateBadgeProps {
    state: PermissionState;
}

function StateBadge({ state }: StateBadgeProps) {
    return (
        <span className={`pm-state-badge pm-state-badge--${state}`} aria-label={STATE_LABELS[state]}>
      <span aria-hidden="true">{STATE_ICONS[state]}</span>
            {STATE_LABELS[state]}
    </span>
    );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface PermissionMatrixDiffModalProps {
    isOpen: boolean;
    diffs: PermissionDiff[];
    isSaving?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export const PermissionMatrixDiffModal: React.FC<PermissionMatrixDiffModalProps> = ({
                                                                                        isOpen,
                                                                                        diffs,
                                                                                        isSaving = false,
                                                                                        onConfirm,
                                                                                        onCancel,
                                                                                    }) => {
    const modalRef   = useRef<HTMLDivElement>(null);
    const cancelRef  = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const prevFocusRef = useRef<HTMLElement | null>(null);

    /* ── Focus management ───────────────────────────────────────────────── */
    useEffect(() => {
        if (isOpen) {
            prevFocusRef.current = document.activeElement as HTMLElement;
            // Default focus on the safe action (cancel)
            cancelRef.current?.focus();
        } else {
            prevFocusRef.current?.focus();
        }
    }, [isOpen]);

    /* ── Keyboard handling ──────────────────────────────────────────────── */
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
                return;
            }
            // Focus trap
            if (e.key === 'Tab') {
                const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusable || focusable.length === 0) return;
                const first = focusable[0];
                const last  = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const hasDiffs = diffs.length > 0;

    return (
        <div
            className="pm-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pm-diff-title"
            aria-describedby="pm-diff-desc"
            data-testid="pm-diff-modal"
        >
            <div ref={modalRef} className="pm-modal">
                {/* Header */}
                <div className="pm-modal-header">
                    <h2 id="pm-diff-title" className="pm-modal-title">
                        Review permission changes
                    </h2>
                    <button
                        className="pm-modal-close"
                        onClick={onCancel}
                        aria-label="Close review dialog"
                        data-testid="pm-diff-modal-close"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="pm-modal-body">
                    <p id="pm-diff-desc" className="pm-modal-desc">
                        {hasDiffs
                            ? `Review the ${diffs.length} change${diffs.length !== 1 ? 's' : ''} below. Once saved, these permissions take effect immediately.`
                            : 'No changes have been made.'}
                    </p>

                    {hasDiffs ? (
                        <table className="pm-diff-table" role="table" aria-label="Pending permission changes">
                            <thead>
                            <tr>
                                <th scope="col">Role</th>
                                <th scope="col">Issuer</th>
                                <th scope="col">From</th>
                                <th scope="col" aria-label="Direction of change"></th>
                                <th scope="col">To</th>
                            </tr>
                            </thead>
                            <tbody>
                            {diffs.map((diff, idx) => (
                                <tr key={`${diff.roleId}-${diff.issuerId}-${idx}`}>
                                    <td>{diff.roleName}</td>
                                    <td>{diff.issuerName}</td>
                                    <td><StateBadge state={diff.from} /></td>
                                    <td aria-hidden="true">
                                        <span className="pm-diff-arrow">→</span>
                                    </td>
                                    <td><StateBadge state={diff.to} /></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="pm-no-changes" role="status">
                            No permission changes to save.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="pm-modal-footer">
                    <button
                        ref={cancelRef}
                        className="pm-btn-cancel"
                        onClick={onCancel}
                        data-testid="pm-diff-cancel"
                    >
                        Cancel
                    </button>
                    <button
                        ref={confirmRef}
                        className="pm-btn-save"
                        onClick={onConfirm}
                        disabled={isSaving || !hasDiffs}
                        aria-disabled={isSaving || !hasDiffs}
                        data-testid="pm-diff-confirm"
                    >
                        {isSaving ? (
                            'Saving…'
                        ) : (
                            <>
                                <ShieldCheck size={15} aria-hidden="true" />
                                {`Save ${diffs.length} change${diffs.length !== 1 ? 's' : ''}`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
