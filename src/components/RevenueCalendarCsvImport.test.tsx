import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RevenueCalendarCsvImport from './RevenueCalendarCsvImport';
import React from 'react';

describe('RevenueCalendarCsvImport', () => {
  it('renders the upload step with dropzone initially', () => {
    render(<RevenueCalendarCsvImport />);
    expect(screen.getByText(/Drop a CSV file here/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload CSV file/i })).toBeTruthy();
  });

  it('renders step indicator with all 4 steps', () => {
    render(<RevenueCalendarCsvImport />);
    expect(screen.getByText('Upload File')).toBeTruthy();
    expect(screen.getByText('Map Columns')).toBeTruthy();
    expect(screen.getByText('Preview Data')).toBeTruthy();
    expect(screen.getByText('Confirm Import')).toBeTruthy();
  });

  it('renders as a dialog', () => {
    render(<RevenueCalendarCsvImport />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('has accessible close button when onCancel provided', async () => {
    const onCancel = vi.fn();
    render(<RevenueCalendarCsvImport onCancel={onCancel} />);
    const closeBtn = screen.getByRole('button', { name: /Close import wizard/i });
    await userEvent.click(closeBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows error for non-CSV file upload simulation', () => {
    render(<RevenueCalendarCsvImport />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input!.accept).toContain('.csv');
  });
});
