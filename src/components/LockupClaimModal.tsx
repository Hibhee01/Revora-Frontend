import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Info, Sparkles, X } from 'lucide-react';
import { Button } from './Button';

interface LockupClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedAmount?: string;
  gasEstimate?: number;
  initialAutoClaim?: boolean;
}

export const LockupClaimModal: React.FC<LockupClaimModalProps> = ({
  isOpen,
  onClose,
  unlockedAmount = '$12,480.00',
  gasEstimate = 22,
  initialAutoClaim = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [autoClaim, setAutoClaim] = useState(initialAutoClaim);
  const [claimState, setClaimState] = useState<'idle' | 'success' | 'later' | 'warning' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showAutoClaimInfo, setShowAutoClaimInfo] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAutoClaim(initialAutoClaim);
      setClaimState('idle');
      setStatusMessage('');
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    if (activeElement && activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, [isOpen, initialAutoClaim]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClaimNow = () => {
    if (!unlockedAmount || unlockedAmount === '$0.00') {
      setClaimState('error');
      setStatusMessage('Nothing is currently available to claim.');
      return;
    }

    if (gasEstimate >= 80) {
      setClaimState('warning');
      setStatusMessage('High gas fees may reduce your expected proceeds. Consider waiting or using auto-claim.');
      return;
    }

    setClaimState('success');
    setStatusMessage('Claim request queued. We will keep you updated as it confirms.');
  };

  const handleClaimLater = () => {
    setClaimState('later');
    setStatusMessage('We will remind you again at a better time to claim this unlock.');
  };

  const gasLabel = gasEstimate >= 80 ? 'High' : gasEstimate >= 50 ? 'Moderate' : 'Low';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900"
        dir="auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Unlock available</p>
            <h2 id={titleId} className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Claim your unlocked balance
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Close claim modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p id={descriptionId} className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Your lockup has unlocked partially. Choose how you want to receive the available balance.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Unlocked amount</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{unlockedAmount}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Sparkles size={20} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">Estimated gas</p>
              <p className="text-slate-500 dark:text-slate-400">{gasLabel.toLowerCase()} network fee estimate</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900 dark:text-white">{gasEstimate}%</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">~${Math.max(8, Math.round(gasEstimate * 1.2)).toFixed(0)} fee</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Info size={16} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <label htmlFor="auto-claim-toggle" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    id="auto-claim-toggle"
                    type="checkbox"
                    checked={autoClaim}
                    onChange={(event) => setAutoClaim(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  Auto-claim on next unlock
                </label>
                <button
                  type="button"
                  onClick={() => setShowAutoClaimInfo((value) => !value)}
                  className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  aria-expanded={showAutoClaimInfo}
                  aria-controls="auto-claim-info"
                  aria-label="Learn more about auto-claim"
                >
                  <Info size={16} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                We will claim automatically the next time this lockup unlocks, so you do not need to revisit this screen.
              </p>
              {showAutoClaimInfo && (
                <div id="auto-claim-info" role="tooltip" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                  Auto-claim keeps the process hands-off, but you can still change your preference later from the account settings.
                </div>
              )}
            </div>
          </div>
        </div>

        {claimState === 'warning' && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>High gas fees may reduce your expected proceeds. Review the estimate before continuing.</span>
          </div>
        )}

        {claimState === 'error' && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {statusMessage}
          </div>
        )}

        {claimState !== 'idle' && claimState !== 'warning' && claimState !== 'error' && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClaimLater} className="w-full sm:w-auto">
            Claim later
          </Button>
          <Button type="button" onClick={handleClaimNow} className="w-full sm:w-auto">
            Claim now
            <ChevronRight size={16} className="ml-2 inline" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};
