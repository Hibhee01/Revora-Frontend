/**
 * StatusTimeline — Canonical status-timeline pattern (Issue #153)
 *
 * A reusable timeline component for displaying milestone-based
 * progress across the application (revenue report lifecycle,
 * offering registration, KYC verification, etc.).
 *
 * Features:
 * - Horizontal & vertical layouts (auto-reflows on mobile)
 * - Milestone states: completed, in-progress, blocked, pending, skipped
 * - Optional sub-steps with disclosure toggle
 * - Timestamp tooltips on markers
 * - Blocked-with-action badges
 * - WCAG 2.1 AA accessible (keyboard nav, ARIA, reduced motion)
 */

import React, { useState, useId } from 'react';
import {
  Check,
  Circle,
  AlertTriangle,
  ChevronDown,
  Clock,
  Minus,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import './StatusTimeline.css';

/* ─── Types ─────────────────────────────────────────────────── */

export type MilestoneStatus =
  | 'completed'
  | 'in-progress'
  | 'blocked'
  | 'pending'
  | 'skipped';

export interface SubStep {
  /** Unique identifier for the sub-step */
  id: string;
  /** Display label */
  label: string;
  /** Sub-step completion status */
  status: 'completed' | 'pending' | 'blocked';
}

export interface BlockedAction {
  /** Label for the action button */
  label: string;
  /** Callback when the action button is clicked */
  onClick: () => void;
}

export interface Milestone {
  /** Unique identifier for the milestone */
  id: string;
  /** Display label */
  label: string;
  /** Optional longer description */
  description?: string;
  /** Current status of this milestone */
  status: MilestoneStatus;
  /** Optional icon override (defaults to state-specific icon) */
  icon?: React.ReactNode;
  /** ISO timestamp for tooltip display */
  timestamp?: string;
  /** Optional sub-steps (collapsible) */
  subSteps?: SubStep[];
  /** Optional blocked action badge (shown when status is 'blocked') */
  blockedAction?: BlockedAction;
}

export interface StatusTimelineProps {
  /** Array of milestones to render in order */
  milestones: Milestone[];
  /** Layout direction. Horizontal auto-reflows to vertical on mobile. */
  orientation?: 'horizontal' | 'vertical';
  /** Accessible label for the timeline region */
  ariaLabel?: string;
}

/* ─── Helpers ───────────────────────────────────────────────── */

function getDefaultIcon(status: MilestoneStatus): React.ReactNode {
  switch (status) {
    case 'completed':
      return <Check size={16} aria-hidden="true" />;
    case 'in-progress':
      return <LoadingSpinner size={16} aria-hidden="true" />;
    case 'blocked':
      return <AlertTriangle size={14} aria-hidden="true" />;
    case 'skipped':
      return <Minus size={14} aria-hidden="true" />;
    case 'pending':
    default:
      return <Circle size={12} aria-hidden="true" />;
  }
}


function getConnectorState(
  currentStatus: MilestoneStatus,
  nextStatus: MilestoneStatus,
): string {
  if (currentStatus === 'completed' && nextStatus === 'completed') {
    return 'st-connector--completed';
  }
  if (currentStatus === 'completed' && nextStatus === 'in-progress') {
    return 'st-connector--in-progress';
  }
  if (currentStatus === 'blocked' || nextStatus === 'blocked') {
    return 'st-connector--blocked';
  }
  return 'st-connector--pending';
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in-progress':
      return 'In progress';
    case 'blocked':
      return 'Blocked';
    case 'skipped':
      return 'Skipped';
    case 'pending':
    default:
      return 'Pending';
  }
}

/* ─── Sub-components ────────────────────────────────────────── */

interface SubStepsDisclosureProps {
  subSteps: SubStep[];
  milestoneId: string;
}

const SubStepsDisclosure: React.FC<SubStepsDisclosureProps> = ({
  subSteps,
  milestoneId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = `st-substeps-${milestoneId}`;

  return (
    <div>
      <button
        type="button"
        className="st-substeps-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span
          className={`st-substeps-toggle-icon ${expanded ? 'st-substeps-toggle-icon--expanded' : ''}`}
        >
          <ChevronDown size={12} aria-hidden="true" />
        </span>
        {expanded ? 'Hide' : 'Show'} {subSteps.length} sub-step
        {subSteps.length !== 1 ? 's' : ''}
      </button>

      {expanded && (
        <ul
          id={panelId}
          className="st-substeps"
          role="list"
          aria-label={`Sub-steps for milestone`}
        >
          {subSteps.map((step) => (
            <li key={step.id} className="st-substep">
              <span
                className={`st-substep-indicator st-substep-indicator--${step.status}`}
                aria-hidden="true"
              />
              <span
                className={
                  step.status === 'completed'
                    ? 'st-substep-label--completed'
                    : ''
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface TimestampMarkerProps {
  timestamp: string;
  children: React.ReactNode;
  tooltipId: string;
}

const TimestampMarker: React.FC<TimestampMarkerProps> = ({
  timestamp,
  children,
  tooltipId,
}) => {
  return (
    <div
      className="st-timestamp-trigger"
      aria-describedby={tooltipId}
    >
      {children}
      <span
        id={tooltipId}
        className="st-timestamp-tooltip"
        role="tooltip"
      >
        <Clock size={10} aria-hidden="true" style={{ marginInlineEnd: 4, display: 'inline' }} />
        {formatTimestamp(timestamp)}
      </span>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────── */

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  milestones,
  orientation = 'horizontal',
  ariaLabel = 'Status timeline',
}) => {
  const baseId = useId();

  return (
    <nav
      className={`status-timeline status-timeline--${orientation}`}
      aria-label={ariaLabel}
      role="navigation"
    >
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const milestoneAriaLabel = `${milestone.label}: ${getStatusLabel(milestone.status)}`;
        const tooltipId = `${baseId}-tooltip-${milestone.id}`;

        const markerContent = (
          <div
            className={`st-marker st-marker--${milestone.status}`}
            aria-label={milestoneAriaLabel}
            role="img"
          >
            {milestone.icon ?? getDefaultIcon(milestone.status)}
          </div>
        );

        return (
          <div
            key={milestone.id}
            className="st-milestone"
            data-testid={`st-milestone-${milestone.id}`}
          >
            {/* Marker with optional timestamp tooltip */}
            {milestone.timestamp ? (
              <TimestampMarker
                timestamp={milestone.timestamp}
                tooltipId={tooltipId}
              >
                {markerContent}
              </TimestampMarker>
            ) : (
              markerContent
            )}

            {/* Connector line (not on last milestone) */}
            {!isLast && (
              <div
                className={`st-connector ${getConnectorState(
                  milestone.status,
                  milestones[index + 1].status,
                )}`}
                aria-hidden="true"
              />
            )}

            {/* Content: label, description, sub-steps, blocked action */}
            <div className="st-content">
              <span
                className={`st-label ${
                  milestone.status === 'pending'
                    ? 'st-label--pending'
                    : milestone.status === 'skipped'
                      ? 'st-label--skipped'
                      : ''
                }`}
              >
                {milestone.label}
              </span>

              {milestone.description && (
                <span className="st-description">
                  {milestone.description}
                </span>
              )}

              {/* Sub-steps disclosure */}
              {milestone.subSteps && milestone.subSteps.length > 0 && (
                <SubStepsDisclosure
                  subSteps={milestone.subSteps}
                  milestoneId={milestone.id}
                />
              )}

              {/* Blocked-with-action badge */}
              {milestone.status === 'blocked' && milestone.blockedAction && (
                <button
                  type="button"
                  className="st-blocked-action"
                  onClick={milestone.blockedAction.onClick}
                  aria-label={`Action required: ${milestone.blockedAction.label}`}
                >
                  <AlertTriangle size={12} aria-hidden="true" />
                  {milestone.blockedAction.label}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default StatusTimeline;
