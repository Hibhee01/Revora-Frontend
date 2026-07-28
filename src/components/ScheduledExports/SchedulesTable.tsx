import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  MoreVertical,
  Play,
  Pause,
  Edit3,
  Trash2,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import type { ScheduledExport } from './types';
import { FORMAT_LABELS } from './types';
import { describeSchedule } from './recurrence';

export type ScheduleAction = 'edit' | 'toggle' | 'delete';

export interface SchedulesTableProps {
  schedules: ScheduledExport[];
  onAction: (id: string, action: ScheduleAction) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface ActionMenuProps {
  schedule: ScheduledExport;
  onAction: (id: string, action: ScheduleAction) => void;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ schedule, onAction, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="sep-action-menu" ref={menuRef} role="menu" aria-label="Schedule actions">
      <button
        className="sep-action-menu-item"
        role="menuitem"
        onClick={() => { onAction(schedule.id, 'edit'); onClose(); }}
      >
        <Edit3 size={14} aria-hidden="true" />
        Edit
      </button>
      <button
        className="sep-action-menu-item"
        role="menuitem"
        onClick={() => { onAction(schedule.id, 'toggle'); onClose(); }}
      >
        {schedule.status === 'active' ? (
          <><Pause size={14} aria-hidden="true" /> Pause</>
        ) : (
          <><Play size={14} aria-hidden="true" /> Resume</>
        )}
      </button>
      <button
        className="sep-action-menu-item sep-action-menu-item--danger"
        role="menuitem"
        onClick={() => { onAction(schedule.id, 'delete'); onClose(); }}
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
};

export const SchedulesTable: React.FC<SchedulesTableProps> = ({
  schedules,
  onAction,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  if (schedules.length === 0) {
    return (
      <div className="sep-empty glass-card">
        <Calendar className="sep-empty-icon" size={48} aria-hidden="true" />
        <h3 className="sep-empty-title">No scheduled exports</h3>
        <p className="sep-empty-desc">
          Create your first scheduled export to automatically generate reports
          on a recurring basis.
        </p>
      </div>
    );
  }

  return (
    <div className="sep-table-wrapper glass-card">
      <table className="sep-table" role="table">
        <caption className="sr-only">Scheduled exports list</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Schedule</th>
            <th scope="col">Format</th>
            <th scope="col">Next run</th>
            <th scope="col">Last run</th>
            <th scope="col" className="sep-table-entries">Entries</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>
                <div className="sep-table-name">{schedule.name}</div>
                {schedule.description && (
                  <div className="sep-table-desc" title={schedule.description}>
                    {schedule.description}
                  </div>
                )}
              </td>
              <td>
                <span className={`sep-status-badge sep-status-badge--${schedule.status}`}>
                  <span className="sep-status-dot" aria-hidden="true" />
                  {getStatusLabel(schedule.status)}
                  {schedule.status === 'error' && schedule.errorMessage && (
                    <span className="sep-error-tooltip" tabIndex={0} role="tooltip">
                      <AlertCircle size={12} aria-hidden="true" />
                      <span className="sep-error-tooltip-content">
                        {schedule.errorMessage}
                      </span>
                    </span>
                  )}
                </span>
              </td>
              <td>
                <span title={describeSchedule(schedule.schedule)}>
                  <FileText size={12} aria-hidden="true" />
                  {' '}{schedule.schedule.frequency}
                </span>
              </td>
              <td>
                <span className="sep-table-format">
                  {FORMAT_LABELS[schedule.format]}
                </span>
              </td>
              <td className="sep-table-next-run">
                {formatDate(schedule.nextRunAt)}
              </td>
              <td className="sep-table-next-run">
                {formatDate(schedule.lastRunAt)}
              </td>
              <td className="sep-table-entries">
                {schedule.entryCount.toLocaleString()}
              </td>
              <td>
                <div style={{ position: 'relative' }}>
                  <button
                    className="sep-action-btn"
                    onClick={() => toggleMenu(schedule.id)}
                    aria-label={`Actions for ${schedule.name}`}
                    aria-expanded={openMenuId === schedule.id}
                    aria-haspopup="true"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === schedule.id && (
                    <ActionMenu
                      schedule={schedule}
                      onAction={onAction}
                      onClose={() => setOpenMenuId(null)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchedulesTable;