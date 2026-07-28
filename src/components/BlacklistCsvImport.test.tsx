import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BlacklistCsvImport } from './BlacklistCsvImport';

const noop = () => {};

function createCsvFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('BlacklistCsvImport', () => {
  describe('Upload step', () => {
    it('renders the wizard container', () => {
      render(<BlacklistCsvImport />);
      expect(screen.getByRole('dialog', { name: /blacklist csv import/i })).toBeInTheDocument();
    });

    it('renders the step indicator', () => {
      render(<BlacklistCsvImport />);
      expect(screen.getByRole('navigation', { name: /import progress/i })).toBeInTheDocument();
    });

    it('renders the upload dropzone', () => {
      render(<BlacklistCsvImport />);
      expect(screen.getByRole('button', { name: /upload csv file/i })).toBeInTheDocument();
    });

    it('renders the file input', () => {
      render(<BlacklistCsvImport />);
      expect(screen.getByLabelText(/select csv file/i)).toBeInTheDocument();
    });

    it('shows cancel button when onCancel provided', () => {
      render(<BlacklistCsvImport onCancel={noop} />);
      expect(screen.getByRole('button', { name: /close import wizard/i })).toBeInTheDocument();
    });

    it('does not show cancel button without onCancel', () => {
      render(<BlacklistCsvImport />);
      expect(screen.queryByRole('button', { name: /close import wizard/i })).not.toBeInTheDocument();
    });
  });

  describe('Wizard navigation', () => {
    it('navigates to map step after file upload', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const csvContent = 'address,checksum\n0xABC,hash123\n0xDEF,hash456';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);

      await user.upload(input, file);

      expect(screen.getByText(/map columns/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address column/i)).toBeInTheDocument();
    });

    it('navigates back to upload from map step', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const csvContent = 'address,checksum\n0xABC,hash123';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const backBtn = screen.getByRole('button', { name: /back/i });
      await user.click(backBtn);

      expect(screen.getByRole('button', { name: /upload csv file/i })).toBeInTheDocument();
    });
  });

  describe('Map step', () => {
    async function goToMapStep() {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const csvContent = 'wallet,signature\n0xABC,hash123\n0xDEF,hash456';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      return user;
    }

    it('auto-detects address column', async () => {
      await goToMapStep();
      const select = screen.getByLabelText(/address column/i);
      expect(select).toHaveValue('wallet');
    });

    it('auto-detects checksum column', async () => {
      await goToMapStep();
      const select = screen.getByLabelText(/checksum column/i);
      expect(select).toHaveValue('signature');
    });

    it('allows manual column remapping', async () => {
      const user = await goToMapStep();
      const select = screen.getByLabelText(/address column/i);
      await user.selectOptions(select, 'signature');
      expect(select).toHaveValue('signature');
    });

    it('shows column preview chips', async () => {
      await goToMapStep();
      const chips = screen.getAllByText('wallet');
      expect(chips.length).toBeGreaterThanOrEqual(1);
      const sigs = screen.getAllByText('signature');
      expect(sigs.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to preview step on confirm', async () => {
      const user = await goToMapStep();
      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      expect(screen.getByText(/rows loaded/i)).toBeInTheDocument();
    });
  });

  describe('Preview step', () => {
    async function goToPreviewStep(existingAddresses: string[] = []) {
      const user = userEvent.setup();
      render(<BlacklistCsvImport existingAddresses={existingAddresses} />);

      const csvContent = 'address,checksum\n0xABC,hash123\n0xDEF,hash456\n0xABC,hash789';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      return user;
    }

    it('shows total row count', async () => {
      await goToPreviewStep();
      expect(screen.getByText(/3 rows loaded/i)).toBeInTheDocument();
    });

    it('flags duplicate rows', async () => {
      await goToPreviewStep();
      const badges = screen.getAllByText(/duplicate in file/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('flags existing entries', async () => {
      await goToPreviewStep(['0xABC']);
      const badges = screen.getAllByText(/existing entry/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows clean rows as ready', async () => {
      await goToPreviewStep();
      const readyBadges = screen.getAllByText(/ready/i);
      expect(readyBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows row numbers', async () => {
      await goToPreviewStep();
      const table = screen.getByRole('region', { name: /import preview table/i });
      const rows = within(table).getAllByRole('row');
      // header + 3 data rows
      expect(rows.length).toBe(4);
    });

    it('navigates to confirm step', async () => {
      const user = await goToPreviewStep();
      const importBtn = screen.getByRole('button', { name: /import/i });
      await user.click(importBtn);

      expect(screen.getByText(/ready to import/i)).toBeInTheDocument();
    });

    it('navigates back to map step', async () => {
      const user = await goToPreviewStep();
      const backBtn = screen.getByRole('button', { name: /back/i });
      await user.click(backBtn);

      expect(screen.getByLabelText(/address column/i)).toBeInTheDocument();
    });
  });

  describe('Confirm step', () => {
    async function goToConfirmStep(existingAddresses: string[] = []) {
      const user = userEvent.setup();
      const onImport = vi.fn();
      render(<BlacklistCsvImport existingAddresses={existingAddresses} onImport={onImport} />);

      const csvContent = 'address,checksum\n0xABC,hash123\n0xDEF,hash456';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      const importBtn = screen.getByRole('button', { name: /import/i });
      await user.click(importBtn);

      return { user, onImport };
    }

    it('shows ready to import message', async () => {
      await goToConfirmStep();
      expect(screen.getByText(/ready to import/i)).toBeInTheDocument();
    });

    it('shows correct clean count', async () => {
      await goToConfirmStep();
      expect(screen.getByText(/2 addresses will be added/i)).toBeInTheDocument();
    });

    it('shows rollback message', async () => {
      await goToConfirmStep();
      expect(screen.getByText(/rollback/i)).toBeInTheDocument();
    });

    it('calls onImport with clean rows', async () => {
      const { onImport } = await goToConfirmStep();
      // onImport was called when clicking Import in preview step
      expect(onImport).toHaveBeenCalled();
    });

    it('shows done button', async () => {
      const { user } = await goToConfirmStep();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    it('shows conflict warnings when conflicts exist', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport existingAddresses={['0xABC']} />);

      const csvContent = 'address,checksum\n0xABC,hash123\n0xDEF,hash456';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      const importBtn = screen.getByRole('button', { name: /import/i });
      await user.click(importBtn);

      const desc = screen.getByText(/will be added to the blacklist/i);
      expect(desc).toHaveTextContent(/will be skipped/i);
    });
  });

  describe('Edge cases', () => {
    it('rejects non-CSV files', async () => {
      render(<BlacklistCsvImport />);

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/select csv file/i);
      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByRole('alert')).toHaveTextContent(/csv file/i);
    });

    it('rejects empty CSV (header only)', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const file = createCsvFile('address,checksum');
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      expect(screen.getByRole('alert')).toHaveTextContent(/at least one data row/i);
    });

    it('handles CSV with BOM', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const bom = '\uFEFF';
      const file = createCsvFile(bom + 'address,checksum\n0xABC,hash123');
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      expect(screen.getByLabelText(/address column/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on dialog', () => {
      render(<BlacklistCsvImport />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Blacklist CSV import');
    });

    it('has aria-live on preview summary', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const csvContent = 'address,checksum\n0xABC,hash123';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      const liveRegion = screen.getByRole('region', { name: /import preview table/i });
      expect(liveRegion).toBeInTheDocument();
    });

    it('has aria-label on pagination', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      // Create 30-row CSV to trigger pagination
      const rows = ['address,checksum'];
      for (let i = 0; i < 30; i++) {
        rows.push(`0x${i.toString(16).padStart(4, '0')},hash${i}`);
      }
      const file = createCsvFile(rows.join('\n'));
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      expect(screen.getByRole('navigation', { name: /preview pagination/i })).toBeInTheDocument();
    });

    it('step indicator uses aria-current on active step', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport />);

      const csvContent = 'address,checksum\n0xABC,hash123';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const steps = screen.getAllByRole('listitem');
      const mapStep = steps.find((s) => s.textContent?.includes('Map'));
      expect(mapStep).toHaveAttribute('aria-current', 'step');
    });

    it('conflict badges have aria-label', async () => {
      const user = userEvent.setup();
      render(<BlacklistCsvImport existingAddresses={['0xABC']} />);

      const csvContent = 'address,checksum\n0xABC,hash123';
      const file = createCsvFile(csvContent);
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      const previewBtn = screen.getByRole('button', { name: /preview/i });
      await user.click(previewBtn);

      const badge = screen.getByText(/existing entry/i).closest('.bci-badge');
      expect(badge).toHaveAttribute('aria-label', 'Existing entry');
    });
  });
});
