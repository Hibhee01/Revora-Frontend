import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThumbnailGrid, ThumbnailFile } from './ThumbnailGrid';

expect.extend(toHaveNoViolations);

function makeFile(overrides: Partial<ThumbnailFile> = {}): ThumbnailFile {
  return {
    id: `file-${Math.random()}`,
    name: 'document.pdf',
    size: 1024,
    type: 'application/pdf',
    ...overrides,
  };
}

const defaultProps = {
  files: [] as ThumbnailFile[],
  onView: vi.fn(),
  onReplace: vi.fn(),
  onRemove: vi.fn(),
};

function renderGrid(props: Partial<typeof defaultProps & { onReorder?: (ids: string[]) => void; className?: string; dir?: 'ltr' | 'rtl' }> = {}) {
  return render(<ThumbnailGrid {...defaultProps} {...props} />);
}

describe('ThumbnailGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ─── Empty state ─────────────────────────────────────────── */

  describe('empty state', () => {
    it('renders empty state when no files provided', () => {
      renderGrid();
      expect(screen.getByText('No uploaded documents yet.')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-grid')).toBeInTheDocument();
    });

    it('empty state has correct aria-label', () => {
      renderGrid();
      expect(screen.getByRole('region', { name: /empty/i })).toBeInTheDocument();
    });

    it('passes axe accessibility checks in empty state', async () => {
      const { container } = renderGrid();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  /* ─── File listing ────────────────────────────────────────── */

  describe('file listing', () => {
    it('renders tiles for each file', () => {
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b', name: 'image.png', type: 'image/png' })];
      renderGrid({ files });
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('displays filename and size for each tile', () => {
      const files = [makeFile({ name: 'report.pdf', size: 2048 })];
      renderGrid({ files });
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('formats bytes less than 1024 as B', () => {
      const files = [makeFile({ name: 'small.txt', size: 500 })];
      renderGrid({ files });
      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('formats bytes >= 1MB as MB', () => {
      const files = [makeFile({ name: 'large.mp4', size: 2 * 1024 * 1024 })];
      renderGrid({ files });
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('renders grid with file list role and correct aria-label', () => {
      const files = [makeFile()];
      renderGrid({ files });
      expect(screen.getByRole('list', { name: /1 file$/i })).toBeInTheDocument();
    });

    it('uses plural files in aria-label when multiple', () => {
      const files = [makeFile(), makeFile()];
      renderGrid({ files });
      expect(screen.getByRole('list', { name: /2 files/i })).toBeInTheDocument();
    });

    it('displays filename with title attribute for long names', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const files = [makeFile({ name: longName })];
      renderGrid({ files });
      const el = screen.getByText(longName);
      expect(el).toHaveAttribute('title', longName);
    });
  });

  /* ─── File-type iconography ───────────────────────────────── */

  describe('file-type iconography', () => {
    it('renders image preview for image files', () => {
      const files = [makeFile({ name: 'photo.jpg', type: 'image/jpeg', previewUrl: '/thumb.jpg' })];
      renderGrid({ files });
      const img = screen.getByRole('listitem').querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/thumb.jpg');
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('renders icon for non-previewable pdf file', () => {
      const files = [makeFile({ name: 'doc.pdf', type: 'application/pdf' })];
      renderGrid({ files });
      // Should not have an img element
      expect(screen.getByRole('listitem').querySelector('img')).not.toBeInTheDocument();
    });
  });

  /* ─── Quick actions ───────────────────────────────────────── */

  describe('quick actions', () => {
    it('calls onView when view button clicked', () => {
      const onView = vi.fn();
      const file = makeFile({ id: 'v1' });
      renderGrid({ files: [file], onView });
      fireEvent.click(screen.getByTestId('view-btn-v1'));
      expect(onView).toHaveBeenCalledWith(file);
    });

    it('calls onReplace when replace button clicked', () => {
      const onReplace = vi.fn();
      const file = makeFile({ id: 'r1' });
      renderGrid({ files: [file], onReplace });
      fireEvent.click(screen.getByTestId('replace-btn-r1'));
      expect(onReplace).toHaveBeenCalledWith(file);
    });

    it('calls onRemove when remove button clicked', () => {
      const onRemove = vi.fn();
      const file = makeFile({ id: 'x1' });
      renderGrid({ files: [file], onRemove });
      fireEvent.click(screen.getByTestId('remove-btn-x1'));
      expect(onRemove).toHaveBeenCalledWith('x1');
    });

    it('view button has accessible label', () => {
      const file = makeFile({ name: 'myfile.pdf' });
      renderGrid({ files: [file] });
      expect(screen.getByRole('button', { name: /view myfile\.pdf/i })).toBeInTheDocument();
    });

    it('replace button has accessible label', () => {
      const file = makeFile({ name: 'myfile.pdf' });
      renderGrid({ files: [file] });
      expect(screen.getByRole('button', { name: /replace myfile\.pdf/i })).toBeInTheDocument();
    });

    it('remove button has accessible label', () => {
      const file = makeFile({ name: 'myfile.pdf' });
      renderGrid({ files: [file] });
      expect(screen.getByRole('button', { name: /remove myfile\.pdf/i })).toBeInTheDocument();
    });
  });

  /* ─── Keyboard reordering ─────────────────────────────────── */

  describe('keyboard reordering', () => {
    it('calls onReorder with updated order when move up clicked', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a', name: 'a.pdf' }), makeFile({ id: 'b', name: 'b.pdf' })];
      renderGrid({ files, onReorder });
      // Move second file up
      fireEvent.click(screen.getByTestId('move-up-btn-b'));
      expect(onReorder).toHaveBeenCalledWith(['b', 'a']);
    });

    it('calls onReorder with updated order when move down clicked', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a', name: 'a.pdf' }), makeFile({ id: 'b', name: 'b.pdf' })];
      renderGrid({ files, onReorder });
      fireEvent.click(screen.getByTestId('move-down-btn-a'));
      expect(onReorder).toHaveBeenCalledWith(['b', 'a']);
    });

    it('disables move up button on first item', () => {
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b' })];
      renderGrid({ files });
      expect(screen.getByTestId('move-up-btn-a')).toBeDisabled();
    });

    it('disables move down button on last item', () => {
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b' })];
      renderGrid({ files });
      expect(screen.getByTestId('move-down-btn-b')).toBeDisabled();
    });

    it('move up button has accessible label', () => {
      const files = [makeFile({ id: 'a', name: 'up.pdf' }), makeFile({ id: 'b' })];
      renderGrid({ files });
      expect(screen.getByRole('button', { name: /move up\.pdf up/i })).toBeInTheDocument();
    });

    it('move down button has accessible label', () => {
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b', name: 'down.pdf' })];
      renderGrid({ files });
      expect(screen.getByRole('button', { name: /move down\.pdf down/i })).toBeInTheDocument();
    });

    it('reorder buttons have tabIndex={-1}', () => {
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b' })];
      renderGrid({ files });
      expect(screen.getByTestId('move-up-btn-a')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByTestId('move-down-btn-a')).toHaveAttribute('tabindex', '-1');
    });

    it('announces reorder via live region on move up', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a', name: 'alpha.pdf' }), makeFile({ id: 'b', name: 'beta.pdf' })];
      renderGrid({ files, onReorder });
      fireEvent.click(screen.getByTestId('move-down-btn-a'));
      expect(screen.getByTestId('thumbnail-live-region').textContent).toContain('Moved alpha.pdf to position 2');
    });

    it('announces reorder via live region on move down', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a', name: 'alpha.pdf' }), makeFile({ id: 'b', name: 'beta.pdf' })];
      renderGrid({ files, onReorder });
      fireEvent.click(screen.getByTestId('move-up-btn-b'));
      expect(screen.getByTestId('thumbnail-live-region').textContent).toContain('Moved beta.pdf to position 1');
    });

    it('does not call onReorder when moving first item up', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b' })];
      renderGrid({ files, onReorder });
      fireEvent.click(screen.getByTestId('move-up-btn-a'));
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder when moving last item down', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a' }), makeFile({ id: 'b' })];
      renderGrid({ files, onReorder });
      fireEvent.click(screen.getByTestId('move-down-btn-b'));
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('supports ArrowUp and ArrowDown keys on tile', () => {
      const onReorder = vi.fn();
      const files = [makeFile({ id: 'a', name: 'first.pdf' }), makeFile({ id: 'b', name: 'second.pdf' })];
      renderGrid({ files, onReorder });
      const secondTile = screen.getByTestId('thumbnail-tile-b');
      fireEvent.keyDown(secondTile, { key: 'ArrowUp' });
      expect(onReorder).toHaveBeenCalledWith(['b', 'a']);
    });
  });

  /* ─── Live region ─────────────────────────────────────────── */

  describe('live region', () => {
    it('renders a polite live region', () => {
      renderGrid({ files: [makeFile()] });
      const region = screen.getByTestId('thumbnail-live-region');
      expect(region).toHaveAttribute('role', 'status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
    });

    it('live region is empty on initial render', () => {
      renderGrid({ files: [makeFile()] });
      expect(screen.getByTestId('thumbnail-live-region').textContent).toBe('');
    });
  });

  /* ─── RTL support ─────────────────────────────────────────── */

  describe('RTL layout', () => {
    it('sets dir="rtl" when dir prop is rtl', () => {
      const files = [makeFile()];
      renderGrid({ files, dir: 'rtl' });
      expect(screen.getByTestId('thumbnail-grid')).toHaveAttribute('dir', 'rtl');
    });

    it('defaults to dir="ltr"', () => {
      const files = [makeFile()];
      renderGrid({ files });
      expect(screen.getByTestId('thumbnail-grid')).toHaveAttribute('dir', 'ltr');
    });
  });

  /* ─── Accessibility ───────────────────────────────────────── */

  describe('accessibility', () => {
    it('has no axe violations with multiple files', async () => {
      const files = [
        makeFile({ name: 'doc1.pdf', type: 'application/pdf' }),
        makeFile({ name: 'img1.png', type: 'image/png', previewUrl: '/thumb.png' }),
        makeFile({ name: 'sheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      ];
      const { container } = renderGrid({ files });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('tiles have role listitem and are focusable', () => {
      const files = [makeFile({ id: 'f1' })];
      renderGrid({ files });
      const tile = screen.getByTestId('thumbnail-tile-f1');
      expect(tile).toHaveAttribute('role', 'listitem');
      expect(tile).toHaveAttribute('tabindex', '0');
    });

    it('tile has aria-labelledby pointing to filename', () => {
      const files = [makeFile({ id: 'f1' })];
      renderGrid({ files });
      const tile = screen.getByTestId('thumbnail-tile-f1');
      const labelledby = tile.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();
      const labelEl = document.getElementById(labelledby!);
      expect(labelEl).toHaveTextContent('document.pdf');
    });

    it('custom className is applied', () => {
      renderGrid({ files: [makeFile()], className: 'my-grid' });
      expect(screen.getByTestId('thumbnail-grid').className).toContain('my-grid');
    });
  });

  /* ─── Edge cases ──────────────────────────────────────────── */

  describe('edge cases', () => {
    it('renders 20 tiles without crashing', () => {
      const files = Array.from({ length: 20 }, (_, i) =>
        makeFile({ id: `e${i}`, name: `file-${i}.pdf` })
      );
      renderGrid({ files });
      expect(screen.getAllByRole('listitem')).toHaveLength(20);
    });

    it('handles file with very long name via text overflow', () => {
      const longName = 'x'.repeat(200) + '.pdf';
      const files = [makeFile({ name: longName })];
      renderGrid({ files });
      const filenameEl = screen.getByText(longName);
      expect(filenameEl).toBeInTheDocument();
    });

    it('handles non-standard mime type gracefully', () => {
      const files = [makeFile({ name: 'weird.xyz', type: 'application/x-weird' })];
      renderGrid({ files });
      expect(screen.getByText('weird.xyz')).toBeInTheDocument();
    });

    it('handles file with no extension', () => {
      const files = [makeFile({ name: 'NOEXT', type: '' })];
      renderGrid({ files });
      expect(screen.getByText('NOEXT')).toBeInTheDocument();
    });
  });
});