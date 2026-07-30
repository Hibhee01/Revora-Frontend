import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuditNoteEditor } from './AuditNoteEditor';
import { DEFAULT_TEMPLATES } from './AuditNoteEditor.types';

const noop = () => {};

describe('AuditNoteEditor', () => {
  describe('Rendering', () => {
    it('renders the editor container', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('group', { name: /audit note editor/i })).toBeInTheDocument();
    });

    it('renders the label', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByText('Audit Note')).toBeInTheDocument();
    });

    it('renders the textarea', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders toolbar with 4 format buttons', () => {
      render(<AuditNoteEditor />);
      const toolbar = screen.getByRole('toolbar', { name: /formatting controls/i });
      const buttons = within(toolbar).getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('renders write/preview toggle', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('tab', { name: /write/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
    });

    it('renders templates button when templates provided', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('button', { name: /templates/i })).toBeInTheDocument();
    });

    it('hides templates button when empty array', () => {
      render(<AuditNoteEditor templates={[]} />);
      expect(screen.queryByRole('button', { name: /templates/i })).not.toBeInTheDocument();
    });
  });

  describe('Character count', () => {
    it('shows character count at zero', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByText('0 characters')).toBeInTheDocument();
    });

    it('updates character count on input', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.type(screen.getByRole('textbox'), 'hello');
      expect(screen.getByText('5 characters')).toBeInTheDocument();
    });

    it('shows max characters when provided', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor maxChars={500} />);
      await user.type(screen.getByRole('textbox'), 'hi');
      expect(screen.getByText('2 / 500 characters')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows min length error when below minimum', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor minChars={10} />);
      await user.type(screen.getByRole('textbox'), 'short');
      expect(screen.getByRole('alert')).toHaveTextContent(/minimum 10 characters/i);
    });

    it('hides min length error when at minimum', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor minChars={10} />);
      await user.type(screen.getByRole('textbox'), '1234567890');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows max length error when over limit', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor minChars={3} maxChars={5} />);
      await user.type(screen.getByRole('textbox'), 'toolong');
      expect(screen.getByText(/maximum 5 characters/i)).toBeInTheDocument();
    });

    it('sets aria-invalid on textarea when error', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor minChars={10} />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'short');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Write/Preview toggle', () => {
    it('starts in write mode', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('tab', { name: /write/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('switches to preview mode on click', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      expect(screen.getByRole('tab', { name: /preview/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows empty preview message when no content', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      expect(screen.getByText(/nothing to preview/i)).toBeInTheDocument();
    });

    it('shows content in preview mode', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.type(screen.getByRole('textbox'), 'test note');
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      expect(screen.getByText('test note')).toBeInTheDocument();
    });

    it('switches back to write mode', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      await user.click(screen.getByRole('tab', { name: /write/i }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('applies bold formatting with Ctrl+B', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'bold text');
      textarea.setSelectionRange(0, 9);
      fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });
      expect(textarea).toHaveValue('**bold text**');
    });

    it('applies italic formatting with Ctrl+I', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'italic');
      textarea.setSelectionRange(0, 6);
      fireEvent.keyDown(textarea, { key: 'i', ctrlKey: true });
      expect(textarea).toHaveValue('_italic_');
    });
  });

  describe('Templates', () => {
    it('opens template dropdown on click', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      expect(screen.getByRole('listbox', { name: /note templates/i })).toBeInTheDocument();
    });

    it('lists all default templates', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      const listbox = screen.getByRole('listbox', { name: /note templates/i });
      const options = within(listbox).getAllByRole('option');
      expect(options.length).toBe(DEFAULT_TEMPLATES.length);
    });

    it('inserts template content on select', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      await user.click(screen.getByRole('option', { name: /sanctions list/i }));
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(DEFAULT_TEMPLATES[0].content);
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      await user.click(screen.getByRole('option', { name: /sanctions list/i }));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on click outside', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      await user.click(screen.getByRole('button', { name: /templates/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // Click outside the dropdown
      await user.click(screen.getByRole('tab', { name: /write/i }));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Format toolbar', () => {
    it('bold wraps selected text with **', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'selected');
      textarea.setSelectionRange(0, 8);
      const boldBtn = screen.getByRole('button', { name: /bold/i });
      await user.click(boldBtn);
      expect(textarea).toHaveValue('**selected**');
    });

    it('italic wraps selected text with _', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'text');
      textarea.setSelectionRange(0, 4);
      const italicBtn = screen.getByRole('button', { name: /italic/i });
      await user.click(italicBtn);
      expect(textarea).toHaveValue('_text_');
    });

    it('list inserts - prefix at cursor', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'item');
      textarea.setSelectionRange(0, 0);
      const listBtn = screen.getByRole('button', { name: /bullet list/i });
      await user.click(listBtn);
      expect(textarea.value).toContain('- ');
    });

    it('link wraps selected text with []()', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'click here');
      textarea.setSelectionRange(0, 10);
      const linkBtn = screen.getByRole('button', { name: /link/i });
      await user.click(linkBtn);
      expect(textarea).toHaveValue('[click here](url)');
    });
  });

  describe('XSS prevention', () => {
    it('renders HTML characters as literal text in preview', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '<script>alert(\'xss\')</script>');
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      const preview = screen.getByTestId('ane-preview-content');
      // React's textContent renders HTML tags as literal text (safe)
      expect(preview.textContent).toContain('<script>');
      expect(preview.textContent).toContain('alert(\'xss\')');
      expect(preview.textContent).toContain('</script>');
      // Ensure no script actually executes (the outer HTML should have the text escaped)
      expect(preview.innerHTML).toContain('&lt;script&gt;');
    });

    it('renders angle brackets as literal text', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '<b>bold?</b>');
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      const preview = screen.getByTestId('ane-preview-content');
      // textContent shows the literal characters
      expect(preview.textContent).toContain('<b>');
      expect(preview.textContent).toContain('</b>');
      // innerHTML confirms React escaped them
      expect(preview.innerHTML).toContain('&lt;b&gt;');
    });
  });

  describe('Accessibility', () => {
    it('toolbar has correct role', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByRole('toolbar', { name: /formatting controls/i })).toBeInTheDocument();
    });

    it('mode toggle uses tab roles', () => {
      render(<AuditNoteEditor />);
      const tablist = screen.getByRole('tablist', { name: /editor mode/i });
      expect(tablist).toBeInTheDocument();
      expect(within(tablist).getAllByRole('tab').length).toBe(2);
    });

    it('textarea has aria-describedby pointing to char count', () => {
      render(<AuditNoteEditor />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'ane-char-count');
    });

    it('char count has aria-live', () => {
      render(<AuditNoteEditor />);
      expect(screen.getByText('0 characters')).toHaveAttribute('aria-live', 'polite');
    });

    it('validation error uses role="alert"', async () => {
      const user = userEvent.setup();
      render(<AuditNoteEditor minChars={10} />);
      await user.type(screen.getByRole('textbox'), 'x');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Controlled mode', () => {
    it('uses controlled value', () => {
      render(<AuditNoteEditor value="controlled" onChange={noop} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('calls onChange with new value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<AuditNoteEditor value="" onChange={onChange} />);
      await user.type(screen.getByRole('textbox'), 'new text');
      expect(onChange).toHaveBeenCalledTimes(8);
      expect(onChange).toHaveBeenLastCalledWith('t');
    });
  });
});
