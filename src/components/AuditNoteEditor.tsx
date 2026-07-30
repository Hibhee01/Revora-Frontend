/**
 * Audit Note Editor — Issue #209
 *
 * Compact editor with write/preview modes, safe formatting controls,
 * pre-filled templates, and character count validation.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  Link,
  Eye,
  Pencil,
  ChevronDown,
} from 'lucide-react';
import {
  AuditNoteEditorProps,
  DEFAULT_TEMPLATES,
} from './AuditNoteEditor.types';
import './AuditNoteEditor.css';

/* ─── Toolbar Actions ────────────────────────────────────────────── */

type FormatAction = 'bold' | 'italic' | 'list' | 'link';

const FORMAT_CONFIG: Record<FormatAction, { label: string; icon: React.ReactNode; prefix: string; suffix: string }> = {
  bold: { label: 'Bold', icon: <Bold size={14} aria-hidden="true" />, prefix: '**', suffix: '**' },
  italic: { label: 'Italic', icon: <Italic size={14} aria-hidden="true" />, prefix: '_', suffix: '_' },
  list: { label: 'Bullet list', icon: <List size={14} aria-hidden="true" />, prefix: '\n- ', suffix: '' },
  link: { label: 'Link', icon: <Link size={14} aria-hidden="true" />, prefix: '[', suffix: '](url)' },
};

/* ─── Component ──────────────────────────────────────────────────── */

export const AuditNoteEditor: React.FC<AuditNoteEditorProps> = ({
  value: controlledValue,
  onChange,
  minChars = 10,
  maxChars,
  templates = DEFAULT_TEMPLATES,
  className = '',
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const value = isControlled ? controlledValue : internalValue;
  const charCount = value.length;
  const isBelowMin = charCount > 0 && charCount < minChars;
  const isOverMax = maxChars !== undefined && charCount > maxChars;
  const hasError = isBelowMin || isOverMax;

  const updateValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const insertAtCursor = useCallback((prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const next = value.substring(0, start) + replacement + value.substring(end);

    updateValue(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = start + prefix.length + (selected || 'text').length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  }, [value, updateValue]);

  const handleFormat = useCallback((action: FormatAction) => {
    const config = FORMAT_CONFIG[action];
    insertAtCursor(config.prefix, config.suffix);
  }, [insertAtCursor]);

  const handleTemplateSelect = useCallback((content: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const next = value.substring(0, start) + content + value.substring(start);
      updateValue(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + content.length, start + content.length);
      });
    } else {
      updateValue(value ? `${value}\n${content}` : content);
    }
    setShowTemplates(false);
  }, [value, updateValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); handleFormat('bold'); }
      if (e.key === 'i') { e.preventDefault(); handleFormat('italic'); }
    }
  }, [handleFormat]);

  // Close template dropdown on Escape key
  const handleTemplateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowTemplates(false);
      // Focus back on the template button
      const btn = dropdownRef.current?.querySelector('.ane-template-btn') as HTMLButtonElement | null;
      btn?.focus();
    }
  }, []);

  // Close template dropdown on click outside
  useEffect(() => {
    if (!showTemplates) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplates]);

  return (
    <div className={`ane-container ${className}`} role="group" aria-label="Audit note editor">
      {/* Header row: label + template dropdown */}
      <div className="ane-header">
        <label htmlFor="ane-textarea" className="ane-label">
          Audit Note
        </label>
        {templates.length > 0 && (
          <div className="ane-template-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="ane-template-btn"
              onClick={() => setShowTemplates((prev) => !prev)}
              aria-expanded={showTemplates}
              aria-haspopup="listbox"
            >
              Templates
              <ChevronDown size={12} aria-hidden="true" />
            </button>
            {showTemplates && (
              <ul className="ane-template-list" role="listbox" aria-label="Note templates" onKeyDown={handleTemplateKeyDown}>
                {templates.map((t) => (
                  <li
                    key={t.id}
                    role="option"
                    tabIndex={0}
                    className="ane-template-item"
                    onClick={() => handleTemplateSelect(t.content)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTemplateSelect(t.content);
                      }
                    }}
                  >
                    {t.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="ane-toolbar" role="toolbar" aria-label="Formatting controls">
        <div className="ane-toolbar-group">
          {(Object.keys(FORMAT_CONFIG) as FormatAction[]).map((action) => (
            <button
              key={action}
              type="button"
              className="ane-toolbar-btn"
              onClick={() => handleFormat(action)}
              aria-label={FORMAT_CONFIG[action].label}
              tabIndex={0}
            >
              {FORMAT_CONFIG[action].icon}
            </button>
          ))}
        </div>

        <div className="ane-toolbar-group" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            className={`ane-mode-btn ${mode === 'write' ? 'ane-mode-btn--active' : ''}`}
            onClick={() => setMode('write')}
            role="tab"
            aria-selected={mode === 'write'}
            aria-controls="ane-write-panel"
            id="ane-write-tab"
          >
            <Pencil size={12} aria-hidden="true" />
            Write
          </button>
          <button
            type="button"
            className={`ane-mode-btn ${mode === 'preview' ? 'ane-mode-btn--active' : ''}`}
            onClick={() => setMode('preview')}
            role="tab"
            aria-selected={mode === 'preview'}
            aria-controls="ane-preview-panel"
            id="ane-preview-tab"
          >
            <Eye size={12} aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor area */}
      {mode === 'write' ? (
        <div
          id="ane-write-panel"
          role="tabpanel"
          aria-labelledby="ane-write-tab"
        >
          <textarea
            ref={textareaRef}
            id="ane-textarea"
            className={`ane-textarea ${hasError ? 'ane-textarea--error' : ''}`}
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your audit note here..."
            aria-describedby="ane-char-count"
            aria-invalid={hasError ? true : undefined}
            rows={5}
          />
        </div>
      ) : (
        <div
          id="ane-preview-panel"
          role="tabpanel"
          aria-labelledby="ane-preview-tab"
          className="ane-preview"
        >
          {value ? (
            <pre className="ane-preview-content" data-testid="ane-preview-content">
              {/*
                XSS is prevented by React's JSX text interpolation, which
                always uses textContent (not innerHTML). Even if value
                contains <script> tags they render as literal text.
              */}
              {value}
            </pre>
          ) : (
            <p className="ane-preview-empty">Nothing to preview.</p>
          )}
        </div>
      )}

      {/* Footer: char count + validation */}
      <div className="ane-footer">
        <span
          id="ane-char-count"
          className={`ane-char-count ${hasError ? 'ane-char-count--error' : ''}`}
          aria-live="polite"
        >
          {charCount}{maxChars !== undefined ? ` / ${maxChars}` : ''} characters
        </span>
        {isBelowMin && (
          <span className="ane-validation" role="alert">
            Minimum {minChars} characters required
          </span>
        )}
        {isOverMax && (
          <span className="ane-validation" role="alert">
            Maximum {maxChars} characters allowed
          </span>
        )}
      </div>
    </div>
  );
};

export default AuditNoteEditor;
