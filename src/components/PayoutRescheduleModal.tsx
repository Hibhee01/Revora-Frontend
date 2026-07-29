import React, { useState } from 'react';
import { AlertTriangle, Clock, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';

export type ConflictType = 'hard' | 'soft';

export interface Conflict {
  id: string;
  type: ConflictType;
  message: string;
}

export interface PayoutRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, note: string) => void;
  initialDate: string;
  conflicts: Conflict[];
}

export const PayoutRescheduleModal: React.FC<PayoutRescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  conflicts,
}) => {
  const [newDate, setNewDate] = useState(initialDate);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const hasHardConflict = conflicts.some((c) => c.type === 'hard');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-4">Reschedule Payout</h2>
        
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium">Select New Date</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg"
          />
          
          {conflicts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Detected Conflicts
              </h3>
              <ul className="space-y-1">
                {conflicts.map((c) => (
                  <li key={c.id} className={`text-xs flex items-center gap-2 ${c.type === 'hard' ? 'text-red-400' : 'text-amber-400'}`}>
                    <Clock size={12} />
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="block text-sm font-medium">Audit Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg"
            rows={3}
            placeholder="Reason for rescheduling..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700">Cancel</button>
          <button 
            onClick={() => onConfirm(newDate, note)}
            disabled={hasHardConflict}
            className={`px-4 py-2 rounded-lg font-medium ${hasHardConflict ? 'bg-slate-700 text-slate-500' : 'bg-primary text-white hover:bg-primary-dark'}`}
          >
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
};
