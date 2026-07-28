/**
 * PermissionMatrix types
 * Issue #233 – Multi-issuer admin permission-matrix editor
 */

/** The four possible states a cell can hold. */
export type PermissionState = 'allow' | 'deny' | 'inherit' | 'mixed';

/** Metadata for a single role (row). */
export interface Role {
    id: string;
    name: string;
    description?: string;
}

/** Metadata for a single issuer (column). */
export interface Issuer {
    id: string;
    name: string;
    /** Short code shown in the column header when space is tight */
    code: string;
}

/** One cell value: which role × which issuer, and its current state. */
export interface PermissionEntry {
    roleId: string;
    issuerId: string;
    state: PermissionState;
}

/** A pending change produced by the editor before the user saves. */
export interface PermissionDiff {
    roleId: string;
    issuerId: string;
    roleName: string;
    issuerName: string;
    from: PermissionState;
    to: PermissionState;
}

/** Bulk-apply target used when the user has selected cells. */
export type BulkApplyTarget = 'selected' | 'row' | 'column' | 'all';

/** Props for the top-level PermissionMatrix component. */
export interface PermissionMatrixProps {
    roles: Role[];
    issuers: Issuer[];
    /** Initial permission grid (sparse – missing entries default to 'inherit'). */
    initialPermissions: PermissionEntry[];
    /** Called when the user confirms the diff and saves. */
    onSave: (updated: PermissionEntry[], diffs: PermissionDiff[]) => void;
    /** Called when the user cancels without saving. */
    onCancel?: () => void;
    /** If true, the component is read-only (no editing). */
    readOnly?: boolean;
}

/** Internal map used to track the working copy: `${roleId}:${issuerId}` → state */
export type PermissionMap = Map<string, PermissionState>;

/** A cell coordinate in the matrix. */
export interface CellCoord {
    roleIndex: number;
    issuerIndex: number;
}
