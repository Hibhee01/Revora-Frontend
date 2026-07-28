import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/Button';

export interface ExitConfirmationModalProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSaveAndExit?: () => void;
  title?: string;
  description?: string;
  saveButtonLabel?: string;
  discardButtonLabel?: string;
  stayButtonLabel?: string;
  isSaving?: boolean;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onStay,
  onDiscard,
  onSaveAndExit,
  title = 'Unsaved changes',
  description = 'You have unsaved changes. Are you sure you want to leave this page?',
  saveButtonLabel = 'Save & Exit',
  discardButtonLabel = 'Discard changes',
  stayButtonLabel = 'Stay on page',
  isSaving = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Default focus on the safest action
      stayButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onStay();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      aria-describedby="exit-modal-desc"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="exit-modal-title" className="text-lg font-semibold text-gray-900 m-0">
            {title}
          </h2>
          <button
            onClick={onStay}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Close dialog"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4" id="exit-modal-desc">
          <p className="text-gray-600 m-0">{description}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            variant="secondary"
            onClick={onDiscard}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 sm:mr-auto"
          >
            {discardButtonLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={onStay}
            ref={stayButtonRef}
          >
            {stayButtonLabel}
          </Button>
          {onSaveAndExit && (
            <Button
              variant="primary"
              onClick={onSaveAndExit}
              loading={isSaving}
            >
              {saveButtonLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
