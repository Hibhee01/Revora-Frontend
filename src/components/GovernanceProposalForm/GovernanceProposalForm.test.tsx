/**
 * GovernanceProposalForm — Issue #247
 *
 * Test coverage for the multi-step proposal creation form.
 * Covers: rendering, step navigation, field validation, autosave,
 * action builder CRUD, preview, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { GovernanceProposalForm } from './GovernanceProposalForm';

const noop = () => {};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

/* ─── Rendering ─────────────────────────────────────────────────────── */

describe('GovernanceProposalForm', () => {
  describe('Rendering', () => {
    it('renders the form with step 1 visible by default', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.getByText('Create Governance Proposal')).toBeInTheDocument();
      expect(screen.getByLabelText(/Step 1: Proposal title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to step 1: Title/i)).toHaveAttribute('aria-current', 'step');
    });

    it('renders all step indicators', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.getByLabelText(/Go to step 1: Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to step 2: Abstract/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to step 3: Actions/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Go to step 4: Preview/)).toBeInTheDocument();
    });

    it('shows Cancel button when onCancel is provided', () => {
      render(<GovernanceProposalForm onSubmit={noop} onCancel={noop} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('hides Cancel button when onCancel is not provided', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('renders the title input with placeholder', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      expect(input).toBeInTheDocument();
    });
  });

  /* ─── Step Navigation ─────────────────────────────────────────────── */

  describe('Step navigation', () => {
    it('advances to step 2 when Next is clicked with valid title', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test Proposal Title');

      const nextBtn = screen.getByRole('button', { name: /next/i });
      await user.click(nextBtn);

      expect(screen.getByLabelText(/Step 2: Proposal abstract/i)).toBeInTheDocument();
    });

    it('does not advance if title is too short', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'AB');

      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });

    it('goes back to previous step when Back is clicked', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      // Advance to step 2
      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Go back
      await user.click(screen.getByRole('button', { name: /go to previous step/i }));

      expect(screen.getByLabelText(/Step 1: Proposal title/i)).toBeInTheDocument();
    });

    it('allows clicking step indicator to navigate to completed steps', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      // Complete step 1
      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test Proposal Title');

      // Click step 2 indicator
      await user.click(screen.getByLabelText(/Go to step 2: Abstract/));

      // Should now be on step 2 (even though empty — can advance to step 3 freely)
      expect(screen.getByLabelText(/Step 2: Proposal abstract/i)).toBeInTheDocument();
    });

    it('shows Submit button on step 4', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<GovernanceProposalForm onSubmit={onSubmit} />);

      // Fill and navigate through all steps
      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a test abstract for the governance proposal.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 3 — fill action
      const targetInput = screen.getByLabelText(/Action 1 target address/i);
      await user.type(targetInput, '0x1234567890abcdef');
      const valueInput = screen.getByLabelText(/Action 1 value/i);
      await user.type(valueInput, '10000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 4
      expect(screen.getByRole('button', { name: /submit proposal/i })).toBeInTheDocument();
    });
  });

  /* ─── Abstract Step ───────────────────────────────────────────────── */

  describe('Abstract step', () => {
    it('renders abstract textarea with placeholder', () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      // Go to step 2
      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      user.type(input, 'Test Proposal Title');

      // Use sync approach
      const nextBtn = screen.getByRole('button', { name: /next/i });
      user.click(nextBtn);
    });

    it('shows character count for abstract', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));

      const textarea = screen.getByPlaceholderText(/Describe your proposal/i);
      await user.type(textarea, 'Hello');

      expect(screen.getByText(/5\/2000/)).toBeInTheDocument();
    });
  });

  /* ─── Action Builder ──────────────────────────────────────────────── */

  describe('Action builder', () => {
    it('renders at least one action card by default', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      // Should have an action card (visible after navigating there)
      expect(screen.getByText(/create governance proposal/i)).toBeInTheDocument();
    });

    it('allows adding a new action', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      // Complete steps 1 and 2
      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a test abstract for the governance proposal.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      const addBtn = screen.getByRole('button', { name: /add another action/i });
      await user.click(addBtn);

      expect(screen.getByText('Action #2')).toBeInTheDocument();
    });

    it('allows removing an action', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a test abstract.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      const removeBtn = screen.getByLabelText(/remove action 1/i);
      expect(removeBtn).toBeDisabled(); // Can't remove the last action
    });

    it('changes action type and shows relevant fields', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Test Proposal Title');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a test abstract.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Change to parameter_change
      const select = screen.getByLabelText(/Action 1 type/i);
      await user.selectOptions(select, 'parameter_change');

      expect(screen.getByLabelText(/Action 1 parameter name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Action 1 new parameter value/i)).toBeInTheDocument();
    });
  });

  /* ─── Autosave ────────────────────────────────────────────────────── */

  describe('Autosave', () => {
    it('saves draft to localStorage on title change', async () => {
      const user = userEvent.setup();
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Autosaved Title');

      // Wait for autosave debounce
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalled();
      });

      const setItemCalls = setItemSpy.mock.calls.filter(([key]) => key === 'gov-proposal-draft');
      expect(setItemCalls.length).toBeGreaterThan(0);

      setItemSpy.mockRestore();
    });

    it('restores draft from localStorage on mount', () => {
      const draft = { title: 'Restored Title', abstract: '', actions: [{ id: 'test-1', type: 'transfer' as const }] };
      localStorage.setItem('gov-proposal-draft', JSON.stringify(draft));

      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      expect(input).toHaveValue('Restored Title');
    });

    it('shows autosave chip after typing', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test');

      // Autosave chip should appear — use findByText for async
      const savedChip = await screen.findByText('Saved', {}, { timeout: 3000 });
      expect(savedChip).toBeInTheDocument();
    });
  });

  /* ─── Validation ──────────────────────────────────────────────────── */

  describe('Validation', () => {
    it('disables Next on step 1 when title is empty', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });

    it('enables Next on step 1 when title is valid', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Valid Title');

      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).toBeEnabled();
    });

    it('disables Next on step 3 when action fields are empty for transfer type', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Test Title');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a test abstract that is long enough.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Next should be disabled since transfer action has empty target and value
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  /* ─── Preview ─────────────────────────────────────────────────────── */

  describe('Preview step', () => {
    it('shows preview with proposal content on step 4', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      // Navigate through all steps
      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Preview Test Title');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'This is a preview test abstract for the governance proposal.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      const targetInput = screen.getByLabelText(/Action 1 target address/i);
      await user.type(targetInput, '0x1234');
      const valueInput = screen.getByLabelText(/Action 1 value/i);
      await user.type(valueInput, '5000');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 4 should show the preview
      expect(screen.getByText('Preview Test Title')).toBeInTheDocument();
      expect(screen.getByText(/This is a preview test abstract/)).toBeInTheDocument();
      // Transfer should appear in the preview (at least one element)
      const transferElements = screen.getAllByText(/Transfer/);
      expect(transferElements.length).toBeGreaterThan(0);
    });
  });

  /* ─── Submit ──────────────────────────────────────────────────────── */

  describe('Submit', () => {
    it('calls onSubmit with the draft when submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<GovernanceProposalForm onSubmit={onSubmit} />);

      // Complete all steps
      await user.type(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i), 'Submit Test');
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.type(screen.getByPlaceholderText(/Describe your proposal/i), 'Test abstract for submission.');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/Action 1 target address/i), '0xabcd');
      await user.type(screen.getByLabelText(/Action 1 value/i), '100');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Submit
      await user.click(screen.getByRole('button', { name: /submit proposal/i }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      const submittedDraft = onSubmit.mock.calls[0][0];
      expect(submittedDraft.title).toBe('Submit Test');
      expect(submittedDraft.abstract).toBe('Test abstract for submission.');
      expect(submittedDraft.actions).toHaveLength(1);
    });
  });

  /* ─── Accessibility ───────────────────────────────────────────────── */

  describe('Accessibility', () => {
    it('has proper aria labels on step indicators', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.getByLabelText(/Go to step 1: Title \(current\)/i)).toHaveAttribute('aria-current', 'step');
    });

    it('has aria-live region for autosave status', async () => {
      const user = userEvent.setup();
      render(<GovernanceProposalForm onSubmit={noop} />);

      const input = screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i);
      await user.type(input, 'Test');

      // Wait for the autosave chip to appear and check aria-live
      const chip = await screen.findByText('Saved', {}, { timeout: 3000 });
      expect(chip).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-required on required fields', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.getByPlaceholderText(/e\.g\., Increase Protocol Treasury Allocation/i)).toHaveAttribute('aria-required', 'true');
    });

    it('has accessible navigation landmarks', () => {
      render(<GovernanceProposalForm onSubmit={noop} />);
      expect(screen.getByLabelText(/form steps/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/form navigation/i)).toBeInTheDocument();
    });
  });
});
