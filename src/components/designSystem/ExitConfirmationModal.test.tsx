import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExitConfirmationModal } from './ExitConfirmationModal';
import { axe } from 'jest-axe';

describe('ExitConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onStay: vi.fn(),
    onDiscard: vi.fn(),
    onSaveAndExit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<ExitConfirmationModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay on page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save & Exit' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ExitConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onStay when Stay button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExitConfirmationModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Stay on page' }));
    expect(defaultProps.onStay).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExitConfirmationModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(defaultProps.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveAndExit when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExitConfirmationModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Save & Exit' }));
    expect(defaultProps.onSaveAndExit).toHaveBeenCalledTimes(1);
  });

  it('calls onStay when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<ExitConfirmationModal {...defaultProps} />);
    await user.keyboard('{Escape}');
    expect(defaultProps.onStay).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the modal', async () => {
    const user = userEvent.setup();
    render(<ExitConfirmationModal {...defaultProps} />);
    
    // Initial focus should be on the "Stay on page" button (safest action)
    expect(screen.getByRole('button', { name: 'Stay on page' })).toHaveFocus();
    
    // Tab should cycle
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save & Exit' })).toHaveFocus();
    
    await user.tab();
    // After last element, it should loop to the close button (first focusable)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    
    // Shift+Tab should cycle backwards
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Save & Exit' })).toHaveFocus();
  });

  it('passes a11y checks', async () => {
    const { container } = render(<ExitConfirmationModal {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('restores focus when closed', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button data-testid="outside-button">Outside</button>
        <ExitConfirmationModal {...defaultProps} />
      </div>
    );
    
    const outsideButton = screen.getByTestId('outside-button');
    outsideButton.focus();
    expect(outsideButton).toHaveFocus();

    const { rerender } = render(
      <div>
        <button data-testid="outside-button">Outside</button>
        <ExitConfirmationModal {...defaultProps} isOpen={true} />
      </div>
    );

    expect(screen.getByRole('button', { name: 'Stay on page' })).toHaveFocus();

    rerender(
      <div>
        <button data-testid="outside-button">Outside</button>
        <ExitConfirmationModal {...defaultProps} isOpen={false} />
      </div>
    );

    expect(outsideButton).toHaveFocus();
  });
});
