import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfferingSettingsGeneralTab } from './OfferingSettingsGeneralTab';

describe('OfferingSettingsGeneralTab', () => {
  const initialData = {
    name: 'TechFlow AI',
    description: 'An AI platform.',
    metadata: 'Series A',
  };
  const onSave = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    expect(screen.getByLabelText(/Offering Name/i)).toHaveValue('TechFlow AI');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('An AI platform.');
    expect(screen.getByLabelText(/Public Metadata/i)).toHaveValue('Series A');
  });

  it('shows save bar when dirty', async () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    const nameInput = screen.getByLabelText(/Offering Name/i);
    
    await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        vi.advanceTimersByTime(400);
    });
    
    expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
    expect(screen.getByText(/Discard/i)).toBeInTheDocument();
  });

  it('updates live preview with debounce', async () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    const nameInput = screen.getByLabelText(/Offering Name/i);
    
    // Change value
    await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        vi.advanceTimersByTime(400);
    });
    
    expect(screen.getByRole('heading', { name: /New Name/i })).toBeInTheDocument();
  });

  it('calls onSave when submitted', async () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    const nameInput = screen.getByLabelText(/Offering Name/i);
    
    await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        vi.advanceTimersByTime(400);
    });
    
    // Use submit button in the footer
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    expect(onSave).toHaveBeenCalledWith({
        name: 'New Name',
        description: 'An AI platform.',
        metadata: 'Series A',
      });
  });

  it('discards changes when clicking discard', async () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    const nameInput = screen.getByLabelText(/Offering Name/i);
    
    await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        vi.advanceTimersByTime(400);
    });
    
    expect(nameInput).toHaveValue('New Name');
    
    const discardButton = screen.getByRole('button', { name: /Discard/i });
    await act(async () => {
        fireEvent.click(discardButton);
    });
    
    expect(nameInput).toHaveValue('TechFlow AI');
    expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
  });

  it('shows validation errors', async () => {
    render(<OfferingSettingsGeneralTab initialData={initialData} onSave={onSave} />);
    const nameInput = screen.getByLabelText(/Offering Name/i);
    
    await act(async () => {
        fireEvent.change(nameInput, { target: { value: '' } });
        fireEvent.blur(nameInput);
    });
    
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
  });
});
