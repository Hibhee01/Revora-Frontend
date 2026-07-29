import React, { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { PayoutEvent } from './PayoutTimeline';
import { analyzeConflicts, Conflict } from './conflictAnalysis';

interface RescheduleModalProps {
  payout: PayoutEvent;
  allPayouts: PayoutEvent[];
  onClose: () => void;
  onConfirm: (newDate: string, note: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  payout,
  allPayouts,
  onClose,
  onConfirm,
}) => {
  const [newDate, setNewDate] = useState(payout.date);
  const [note, setNote] = useState('');

  const conflicts = useMemo(
    () => analyzeConflicts(payout.id, newDate, allPayouts),
    [payout.id, newDate, allPayouts],
  );

  const hasHardConflict = conflicts.some((c) => c.severity === 'hard');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Reschedule Payout</h2>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="modal-body">
          <label>
            New Date:
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </label>

          {conflicts.length > 0 && (
            <div className="conflicts">
              {conflicts.map((c) => (
                <div key={c.id} className={`conflict ${c.severity}`}>
                  {c.severity === 'hard' ? <AlertCircle /> : <AlertTriangle />}
                  <p>{c.message}</p>
                </div>
              ))}
            </div>
          )}

          <label>
            Audit Note:
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={hasHardConflict}
            onClick={() => onConfirm(newDate, note)}
          >
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
};
