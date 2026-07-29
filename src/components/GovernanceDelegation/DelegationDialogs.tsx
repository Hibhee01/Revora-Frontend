import React, { useEffect, useRef } from 'react';
import { Button } from '../Button';
import './GovernanceDelegation.css';

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant: 'primary' | 'danger';
}

const Dialog: React.FC<BaseDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmVariant
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="delegation-dialog"
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
    >
      <div className="dialog-content glass-card">
        <h3 id="dialog-title" className="text-xl font-bold mb-2">{title}</h3>
        <p id="dialog-desc" className="text-muted mb-6">{description}</p>
        <div className="dialog-actions flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export const DelegationConfirmDialog: React.FC<Omit<BaseDialogProps, 'title' | 'description' | 'confirmText' | 'confirmVariant'> & { delegateName: string }> = ({
  isOpen,
  onClose,
  onConfirm,
  delegateName,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Confirm Delegation"
    description={`Are you sure you want to delegate your voting power to ${delegateName}? This will allow them to vote on your behalf.`}
    confirmText="Confirm Delegate"
    confirmVariant="primary"
  />
);

export const RevokeConfirmDialog: React.FC<Omit<BaseDialogProps, 'title' | 'description' | 'confirmText' | 'confirmVariant'>> = ({
  isOpen,
  onClose,
  onConfirm,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Revoke Delegation"
    description="Are you sure you want to revoke your delegation? You will regain your voting power immediately."
    confirmText="Revoke"
    confirmVariant="danger"
  />
);
