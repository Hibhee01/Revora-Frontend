import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  WizardStepper,
  getStepState,
  getWizardProgressPercent,
  type WizardStep,
} from './WizardStepper';

expect.extend(toHaveNoViolations);

const STEPS: WizardStep[] = [
  { id: 'a', label: 'Choose method', number: 1 },
  { id: 'b', label: 'Verify', number: 2 },
  { id: 'c', label: 'Done', number: 3 },
];

const MIXED: WizardStep[] = [
  { id: '1', label: 'Start إعداد', number: 1 },
  { id: '2', label: 'التحقق Verify', number: 2 },
  { id: '3', label: 'تم', number: 3 },
];

function renderStepper(
  props: Partial<React.ComponentProps<typeof WizardStepper>> = {},
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  return render(
    <div dir={dir}>
      <WizardStepper steps={STEPS} currentIndex={1} {...props} />
    </div>,
  );
}

describe('getStepState / getWizardProgressPercent', () => {
  it('maps indices to completed / active / pending', () => {
    expect(getStepState(0, 2)).toBe('completed');
    expect(getStepState(2, 2)).toBe('active');
    expect(getStepState(3, 2)).toBe('pending');
  });

  it('computes progress across the track', () => {
    expect(getWizardProgressPercent(0, 3)).toBe(0);
    expect(getWizardProgressPercent(1, 3)).toBe(50);
    expect(getWizardProgressPercent(2, 3)).toBe(100);
    expect(getWizardProgressPercent(0, 1)).toBe(100);
    expect(getWizardProgressPercent(-1, 1)).toBe(0);
    expect(getWizardProgressPercent(5, 3)).toBe(100); // clamps via caller; helper uses min with total-1 only when total>1
    expect(getWizardProgressPercent(99, 4)).toBe(100);
  });
});

describe('WizardStepper', () => {
  it('renders an accessible progress navigation', () => {
    renderStepper();
    expect(screen.getByRole('navigation', { name: /wizard progress/i })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('applies optional className and defaults numbers when omitted', () => {
    const bare: WizardStep[] = [
      { id: 'x', label: 'One' },
      { id: 'y', label: 'Two' },
    ];
    const { container } = render(
      <WizardStepper steps={bare} currentIndex={0} className="extra-ws" />,
    );
    expect(container.querySelector('.wizard-stepper.extra-ws')).toBeTruthy();
    const nums = container.querySelectorAll('.wizard-stepper__marker .wizard-stepper__num');
    expect(nums[0]).toHaveTextContent('1');
    expect(nums[1]).toHaveTextContent('2');
  });

  it('renders nothing in the status region when steps are empty', () => {
    const { container } = render(<WizardStepper steps={[]} currentIndex={0} />);
    expect(container.querySelector('.wizard-stepper__status')).toBeNull();
    expect(container.querySelector('.wizard-stepper__track')).toBeNull();
  });

  it('marks completed connectors and pending steps', () => {
    const { container } = renderStepper({ currentIndex: 0 });
    expect(container.querySelector('.wizard-stepper__item--pending')).toBeTruthy();
    expect(container.querySelector('.wizard-stepper__connector--pending')).toBeTruthy();
  });

  it('marks the active step with aria-current="step"', () => {
    renderStepper({ currentIndex: 1 });
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('keeps document order of steps (mirroring is CSS-only)', () => {
    const { container } = renderStepper({}, 'rtl');
    const labels = Array.from(
      container.querySelectorAll('.wizard-stepper__label'),
    ).map((n) => n.textContent);
    expect(labels).toEqual(['Choose method', 'Verify', 'Done']);
  });

  it('isolates numeric badges as LTR', () => {
    renderStepper({ currentIndex: 0 });
    const nums = document.querySelectorAll('.wizard-stepper__num');
    expect(nums.length).toBeGreaterThan(0);
    nums.forEach((node) => {
      expect(node).toHaveAttribute('dir', 'ltr');
    });
  });

  it('exposes a progressbar fill that grows with currentIndex', () => {
    const { rerender } = render(
      <div dir="ltr">
        <WizardStepper steps={STEPS} currentIndex={0} />
      </div>,
    );
    const fill = screen.getByTestId('wizard-stepper-fill');
    expect(fill).toHaveStyle({ '--ws-progress': '0%' });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    rerender(
      <div dir="rtl">
        <WizardStepper steps={STEPS} currentIndex={2} />
      </div>,
    );
    expect(screen.getByTestId('wizard-stepper-fill')).toHaveStyle({ '--ws-progress': '100%' });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('supports mixed-direction step titles without reversing numbers', () => {
    render(
      <div dir="rtl">
        <WizardStepper steps={MIXED} currentIndex={1} ariaLabel="RTL wizard" />
      </div>,
    );
    expect(screen.getByRole('navigation', { name: /rtl wizard/i })).toBeInTheDocument();
    expect(screen.getByText('التحقق Verify')).toBeInTheDocument();
    const status = screen.getByText(/step/i, { selector: '.wizard-stepper__status' });
    expect(status.querySelectorAll('[dir="ltr"]').length).toBeGreaterThanOrEqual(2);
  });

  it('announces current step via polite live region', () => {
    renderStepper({ currentIndex: 0 });
    const status = document.querySelector('.wizard-stepper__status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(/Step/);
  });

  it('can hide the continuous progress track', () => {
    renderStepper({ showProgressTrack: false });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('has no axe accessibility violations (LTR)', async () => {
    const { container } = renderStepper({ currentIndex: 1 }, 'ltr');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe accessibility violations (RTL)', async () => {
    const { container } = renderStepper({ currentIndex: 1 }, 'rtl');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('side-by-side LTR/RTL smoke: both steppers mount with mirrored dir ancestors', () => {
    render(
      <div style={{ display: 'flex', gap: 16 }}>
        <div dir="ltr" data-testid="ltr-panel">
          <WizardStepper steps={STEPS} currentIndex={1} ariaLabel="LTR progress" />
        </div>
        <div dir="rtl" data-testid="rtl-panel">
          <WizardStepper steps={STEPS} currentIndex={1} ariaLabel="RTL progress" />
        </div>
      </div>,
    );
    expect(screen.getByTestId('ltr-panel')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByTestId('rtl-panel')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('navigation', { name: /ltr progress/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /rtl progress/i })).toBeInTheDocument();
  });
});
