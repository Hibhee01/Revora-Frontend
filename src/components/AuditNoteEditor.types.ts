/**
 * Audit Note Editor — Issue #209
 *
 * Types for the compact markdown note editor with
 * write/preview modes and pre-filled templates.
 */

export interface NoteTemplate {
  id: string;
  label: string;
  content: string;
}

export const DEFAULT_TEMPLATES: NoteTemplate[] = [
  {
    id: 'sanctions',
    label: 'Sanctions list',
    content: 'Address added to blacklist due to sanctions screening. Source: ',
  },
  {
    id: 'fraud',
    label: 'Fraud investigation',
    content: 'Address flagged during fraud investigation. Case reference: ',
  },
  {
    id: 'compliance',
    label: 'Compliance review',
    content: 'Blacklisted as part of routine compliance review. Reason: ',
  },
  {
    id: 'admin',
    label: 'Manual administrative action',
    content: 'Manually blacklisted by administrator. Note: ',
  },
];

export interface AuditNoteEditorProps {
  value?: string;
  onChange?: (note: string) => void;
  minChars?: number;
  maxChars?: number;
  templates?: NoteTemplate[];
  className?: string;
}
