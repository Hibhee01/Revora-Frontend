import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ScheduledExport, ScheduleFormData } from './types';
import { MOCK_SCHEDULED_EXPORTS } from './types';
import { computeNextRun } from './recurrence';
import { SchedulesTable, type ScheduleAction } from './SchedulesTable';
import { ScheduleFormDialog } from './ScheduleFormDialog';
import './ScheduledExports.css';

export interface ScheduledExportsPanelProps {
  schedules?: ScheduledExport[];
}

function generateId(): string {
  return `se-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ScheduledExportsPanel: React.FC<ScheduledExportsPanelProps> = ({
  schedules: initialSchedules,
}) => {
  const [schedules, setSchedules] = useState<ScheduledExport[]>(
    initialSchedules ?? MOCK_SCHEDULED_EXPORTS
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledExport | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleAction = useCallback((id: string, action: ScheduleAction) => {
    if (action === 'edit') {
      const schedule = schedules.find((s) => s.id === id);
      if (schedule) {
        setEditingSchedule(schedule);
        setDialogOpen(true);
      }
    } else if (action === 'toggle') {
      setSchedules((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const newStatus = s.status === 'active' ? 'paused' : 'active';
          return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
        })
      );
      const sch = schedules.find((s) => s.id === id);
      showToast(
        sch?.status === 'active'
          ? `"${sch.name}" paused`
          : `"${sch?.name}" resumed`
      );
    } else if (action === 'delete') {
      setDeleteConfirmId(id);
    }
  }, [schedules, showToast]);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return;
    const sch = schedules.find((s) => s.id === deleteConfirmId);
    setSchedules((prev) => prev.filter((s) => s.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    showToast(`"${sch?.name}" deleted`);
  }, [deleteConfirmId, schedules, showToast]);

  const handleSave = useCallback(
    (data: ScheduleFormData) => {
      if (editingSchedule) {
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === editingSchedule.id
              ? {
                  ...s,
                  ...data,
                  updatedAt: new Date().toISOString(),
                  nextRunAt: computeNextRun(data.schedule),
                }
              : s
          )
        );
        showToast(`"${data.name}" updated`);
      } else {
        const now = new Date().toISOString();
        const newSchedule: ScheduledExport = {
          id: generateId(),
          ...data,
          status: 'active',
          lastRunAt: null,
          nextRunAt: computeNextRun(data.schedule),
          createdAt: now,
          updatedAt: now,
          entryCount: 0,
        };
        setSchedules((prev) => [newSchedule, ...prev]);
        showToast(`"${data.name}" created`);
      }
      setDialogOpen(false);
      setEditingSchedule(null);
    },
    [editingSchedule, showToast]
  );

  useEffect(() => {
    if (deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [deleteConfirmId]);

  const activeCount = schedules.filter((s) => s.status === 'active').length;
  const pausedCount = schedules.filter((s) => s.status === 'paused').length;
  const errorCount = schedules.filter((s) => s.status === 'error').length;

  return (
    <div className="sep-layout">
      <div className="sep-header">
        <div>
          <h1>Scheduled Exports</h1>
          <p className="sep-header-desc">
            Automate recurring report generation on your schedule.
          </p>
        </div>
        <div className="sep-header-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setEditingSchedule(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            New schedule
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="sep-summary" role="status" aria-live="polite">
        <div className="sep-summary-card sep-summary-card--active glass-card">
          <div className="sep-summary-value">{activeCount}</div>
          <div className="sep-summary-label">Active</div>
        </div>
        <div className="sep-summary-card sep-summary-card--paused glass-card">
          <div className="sep-summary-value">{pausedCount}</div>
          <div className="sep-summary-label">Paused</div>
        </div>
        <div className="sep-summary-card sep-summary-card--error glass-card">
          <div className="sep-summary-value">{errorCount}</div>
          <div className="sep-summary-label">Errors</div>
        </div>
        <div className="sep-summary-card glass-card">
          <div className="sep-summary-value">{schedules.length}</div>
          <div className="sep-summary-label">Total</div>
        </div>
      </div>

      {/* Table */}
      <SchedulesTable schedules={schedules} onAction={handleAction} />

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div
          className="sep-dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
        >
          <div
            className="sep-dialog glass-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title" className="sep-dialog-title">Delete schedule</h2>
            <p className="sep-delete-warning">
              Are you sure you want to delete{' '}
              <span className="sep-delete-name">
                {schedules.find((s) => s.id === deleteConfirmId)?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="sep-dialog-actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                style={{ background: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={confirmDelete}
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div
          className="sep-toast"
          role="status"
          aria-live="polite"
          data-testid="sep-toast"
        >
          {toastMessage}
        </div>
      )}

      {/* Form dialog */}
      <ScheduleFormDialog
        open={dialogOpen}
        initial={
          editingSchedule
            ? {
                name: editingSchedule.name,
                description: editingSchedule.description,
                format: editingSchedule.format,
                schedule: editingSchedule.schedule,
              }
            : undefined
        }
        onSave={handleSave}
        onClose={() => {
          setDialogOpen(false);
          setEditingSchedule(null);
        }}
      />
    </div>
  );
};

export default ScheduledExportsPanel;