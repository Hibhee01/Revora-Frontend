import React, { useId, useCallback } from 'react';
import { Clock, Calendar } from 'lucide-react';
import type { RecurrenceRule, RecurrenceFrequency } from './types';
import { FREQUENCY_LABELS, COMMON_TIMEZONES, DAY_LABELS } from './types';
import { describeSchedule } from './recurrence';

export interface RecurrenceEditorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  errors?: string[];
}

const FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly'];

function updateRule(
  prev: RecurrenceRule,
  patch: Partial<RecurrenceRule>
): RecurrenceRule {
  return { ...prev, ...patch };
}

export const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({
  value,
  onChange,
  errors = [],
}) => {
  const freqId = useId();
  const timeId = useId();
  const tzId = useId();
  const dayId = useId();
  const monthDayId = useId();
  const summaryId = useId();

  const handleFrequency = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(updateRule(value, { frequency: e.target.value as RecurrenceFrequency }));
    },
    [value, onChange]
  );

  const handleTime = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(updateRule(value, { time: e.target.value }));
    },
    [value, onChange]
  );

  const handleTimezone = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(updateRule(value, { timezone: e.target.value }));
    },
    [value, onChange]
  );

  const handleDayOfWeek = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(updateRule(value, { dayOfWeek: Number(e.target.value) }));
    },
    [value, onChange]
  );

  const handleDayOfMonth = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(updateRule(value, { dayOfMonth: Number(e.target.value) }));
    },
    [value, onChange]
  );

  const summary = describeSchedule(value);

  return (
    <div className="sep-recurrence-editor" role="group" aria-labelledby={summaryId}>
      <div className="sep-recurrence-row">
        <div className="input-group sep-recurrence-field">
          <label className="input-label" htmlFor={freqId}>
            Frequency
          </label>
          <select
            id={freqId}
            className="input-field"
            value={value.frequency}
            onChange={handleFrequency}
            aria-describedby={errors.length > 0 ? undefined : summaryId}
          >
            {FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {FREQUENCY_LABELS[freq]}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group sep-recurrence-field">
          <label className="input-label" htmlFor={timeId}>
            Time
          </label>
          <input
            id={timeId}
            className="input-field"
            type="time"
            value={value.time}
            onChange={handleTime}
          />
        </div>

        {value.frequency === 'weekly' && (
          <div className="input-group sep-recurrence-field">
            <label className="input-label" htmlFor={dayId}>
              Day of week
            </label>
            <select
              id={dayId}
              className="input-field"
              value={value.dayOfWeek}
              onChange={handleDayOfWeek}
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {value.frequency === 'monthly' && (
          <div className="input-group sep-recurrence-field">
            <label className="input-label" htmlFor={monthDayId}>
              Day of month
            </label>
            <select
              id={monthDayId}
              className="input-field"
              value={value.dayOfMonth}
              onChange={handleDayOfMonth}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="input-group sep-recurrence-field">
          <label className="input-label" htmlFor={tzId}>
            Timezone
          </label>
          <select
            id={tzId}
            className="input-field"
            value={value.timezone}
            onChange={handleTimezone}
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plain-language summary */}
      <div
        id={summaryId}
        className="sep-recurrence-summary"
        aria-live="polite"
        role="status"
      >
        <Calendar className="sep-recurrence-summary-icon" size={16} aria-hidden="true" />
        <span>{summary}</span>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="sep-error-banner" role="alert">
          <Clock size={14} aria-hidden="true" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
};

export default RecurrenceEditor;