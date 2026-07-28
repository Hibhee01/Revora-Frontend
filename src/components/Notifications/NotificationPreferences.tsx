import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BellOff, Info, Shield } from 'lucide-react';

type ChannelKey = 'inApp' | 'email' | 'sms';
type CategoryKey = 'distribution' | 'report' | 'compliance' | 'governance';

export type NotificationPreferencesValue = {
  matrix: Record<CategoryKey, Record<ChannelKey, boolean>>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    timeZone: string;
  };
  /** Per-category quiet-hours override: when true, the category always delivers notifications */
  quietHoursOverride: Record<CategoryKey, boolean>;
};

const CATEGORIES: Array<{ key: CategoryKey; label: string; description?: string }> = [
  { key: 'distribution', label: 'Distribution', description: 'Payout and revenue notifications' },
  { key: 'report', label: 'Report', description: 'Scheduled report notifications' },
  { key: 'compliance', label: 'Compliance', description: 'Regulatory and compliance alerts' },
  { key: 'governance', label: 'Governance', description: 'Voting and proposal notifications' },
];

const CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: 'inApp', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
];

function buildDefaultValue(timeZone: string): NotificationPreferencesValue {
  const emptyMatrix = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = {
      inApp: false,
      email: false,
      sms: false,
    };
    return acc;
  }, {} as Record<CategoryKey, Record<ChannelKey, boolean>>);

  const allOverrides = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = false;
    return acc;
  }, {} as Record<CategoryKey, boolean>);

  return {
    matrix: emptyMatrix,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      timeZone,
    },
    quietHoursOverride: allOverrides,
  };
}

function normalizeTimeString(v: string): string {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  return m ? `${m[1]}:${m[2]}` : v;
}

function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function CheckboxCell(props: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  describedBy?: string;
  disabled?: boolean;
}) {
  const { id, checked, onChange, label, describedBy, disabled } = props;

  return (
    <div className="flex items-center justify-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        aria-describedby={describedBy}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-60"
      />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
    </div>
  );
}

function useIndeterminateCheckbox(isAll: boolean, isNone: boolean) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = !isAll && !isNone;
  }, [isAll, isNone]);

  return ref;
}

function AccordionItem(props: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  headerId: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const { title, isOpen, onToggle, headerId, children, rightSlot } = props;

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex-1 px-4 py-3 flex items-center gap-3"
          onClick={onToggle}
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls={`${headerId}-region`}
        >
          <span className="text-sm font-semibold text-text-main">{title}</span>
        </button>
        {rightSlot && <span className="flex items-center pr-4">{rightSlot}</span>}
      </div>
      {isOpen && (
        <div
          id={`${headerId}-region`}
          role="region"
          aria-labelledby={headerId}
          className="px-4 pb-4 pt-1"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Quiet Hours Timeline Preview ───────────────────────────────────── */

type TimelineSegment = {
  label: string;
  isQuiet: boolean;
  startHour: number;
  endHour: number;
};

function useQuietHoursTimeline(
  startTime: string,
  endTime: string,
  enabled: boolean,
): TimelineSegment[] {
  return useMemo(() => {
    const segments: TimelineSegment[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
    const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);
    const crossesMidnight = endMinutes <= startMinutes;

    for (let offset = 0; offset < 24; offset += 1) {
      const hour = (currentHour + offset) % 24;
      const hourMinutes = hour * 60;
      const isQuiet = enabled && (
        crossesMidnight
          ? hourMinutes >= startMinutes || hourMinutes < endMinutes
          : hourMinutes >= startMinutes && hourMinutes < endMinutes
      );
      const label = `${hour.toString().padStart(2, '0')}:00`;
      segments.push({
        label,
        isQuiet,
        startHour: hour,
        endHour: hour + 1,
      });
    }

    return segments;
  }, [startTime, endTime, enabled]);
}

function QuietHoursTimeline(props: {
  startTime: string;
  endTime: string;
  enabled: boolean;
  timeZone: string;
  overriddenCategories: CategoryKey[];
}) {
  const { startTime, endTime, enabled, timeZone, overriddenCategories } = props;
  const segments = useQuietHoursTimeline(startTime, endTime, enabled);

  const [infoOpen, setInfoOpen] = useState(false);
  const infoId = 'qh-preview-info';

  if (!enabled) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.2)] p-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <BellOff size={14} aria-hidden="true" />
          <span>Enable quiet hours to see a 24-hour delivery preview.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4" aria-label="Quiet hours delivery preview for the next 24 hours">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">
          Delivery Preview — Next 24 Hours
        </h4>
        <div className="relative">
          <button
            type="button"
            className="p-1 rounded hover:bg-[rgba(148,163,184,0.1)] focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="About override categories"
            aria-expanded={infoOpen}
            aria-controls={infoId}
            onClick={() => setInfoOpen(!infoOpen)}
          >
            <Info size={14} className="text-muted" aria-hidden="true" />
          </button>
          {infoOpen && (
            <div
              id={infoId}
              role="tooltip"
              className="absolute right-0 top-full mt-1 z-10 w-64 p-2 rounded-lg bg-[#0f172a] border border-[rgba(148,163,184,0.15)] text-xs text-text-main shadow-xl"
            >
              <p className="mb-1">
                <strong>Quiet hours</strong> suppress non-critical notifications.
              </p>
              <p className="mb-1">
                <Shield size={12} className="inline mr-1 text-primary" aria-hidden="true" />
                <strong>Override categories</strong> are always delivered regardless of quiet hours.
              </p>
              <p>
                Use overrides for time-sensitive alerts like compliance deadlines or critical governance votes.
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className="relative h-8 rounded-lg overflow-hidden bg-[rgba(2,6,23,0.6)] border border-[rgba(148,163,184,0.1)]"
        role="img"
        aria-label={`24-hour timeline: ${segments.filter((s) => s.isQuiet).length} quiet hours from ${startTime} to ${endTime} in ${timeZone}. Override categories: ${overriddenCategories.length > 0 ? overriddenCategories.join(', ') : 'none'}.`}
      >
        <div className="flex h-full">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={`flex-1 relative transition-colors duration-200 ${
                seg.isQuiet
                  ? 'bg-[rgba(59,130,246,0.12)] border-r border-[rgba(59,130,246,0.08)]'
                  : 'bg-transparent border-r border-[rgba(148,163,184,0.04)]'
              }`}
              title={`${seg.label}${seg.isQuiet ? ' — Quiet hours' : ''}`}
            >
              {/* Hour tick */}
              {i % 3 === 0 && (
                <span className="absolute bottom-0.5 left-0.5 text-[8px] text-muted leading-none pointer-events-none">
                  {seg.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Quiet hours span indicator */}
        <div
          className="absolute top-0 h-full bg-[rgba(59,130,246,0.08)] border-l-2 border-r-2 border-primary/30 pointer-events-none"
          style={{
            left: `${(segments.findIndex((s) => s.isQuiet) / 24) * 100}%`,
            width: `${(segments.filter((s) => s.isQuiet).length / 24) * 100}%`,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
        <span>Now ({segments[0]?.label ?? '--:00'})</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-[rgba(59,130,246,0.2)] border border-primary/30" />
            Quiet hours ({startTime}–{endTime})
          </span>
          {overriddenCategories.length > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <Shield size={10} aria-hidden="true" />
              {overriddenCategories.length} override{overriddenCategories.length !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <span>+24h</span>
      </div>
    </div>
  );
}

/* ─── Override Info Popover ──────────────────────────────────────────── */

function OverridePopover(props: { categoryLabel: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = `override-info-${props.categoryLabel.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="p-0.5 rounded hover:bg-[rgba(148,163,184,0.1)] focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`About override for ${props.categoryLabel}`}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AlertTriangle size={12} className="text-muted" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full mt-1 z-10 w-56 p-2 rounded-lg bg-[#0f172a] border border-[rgba(148,163,184,0.15)] text-xs text-text-main shadow-xl"
        >
          <p>
            Override quiet hours for <strong>{props.categoryLabel}</strong>.
            Notifications in this category will always be delivered,
            even during quiet hours. Recommended for time-sensitive alerts.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export type NotificationPreferencesProps = {
  value?: NotificationPreferencesValue;
  onChange?: (next: NotificationPreferencesValue) => void;
  /** Optional heading shown above both matrix and quiet hours sections. */
  title?: string;
};

export default function NotificationPreferences(props: NotificationPreferencesProps) {
  const { value, onChange, title = 'Notification Preferences' } = props;

  const [internalTZ] = useState(() => getLocalTimeZone());
  const [internalValue, setInternalValue] = useState<NotificationPreferencesValue>(() =>
    buildDefaultValue(internalTZ),
  );

  // Keep internal state in sync if controlled value changes.
  useEffect(() => {
    if (!value) return;
    setInternalValue(value);
  }, [value]);

  const mergedValue = value ?? internalValue;

  const setNextValue = (next: NotificationPreferencesValue) => {
    if (onChange) onChange(next);
    else setInternalValue(next);
  };

  const tzLabel = mergedValue?.quietHours?.timeZone || internalTZ;

  const isControlled = !!value;
  void isControlled;

  // Track accordion open state for mobile usability.
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>('distribution');

  const matrix = mergedValue.matrix;

  const allSelectedByChannel = useMemo(() => {
    const res: Record<ChannelKey, { isAll: boolean; isNone: boolean }> = {
      inApp: { isAll: true, isNone: true },
      email: { isAll: true, isNone: true },
      sms: { isAll: true, isNone: true },
    };

    for (const ch of CHANNELS) {
      let any = false;
      let all = true;
      for (const cat of CATEGORIES) {
        const v = matrix[cat.key]?.[ch.key] ?? false;
        any = any || v;
        all = all && v;
      }
      res[ch.key] = { isAll: all, isNone: !any };
    }
    return res;
  }, [matrix]);

  const setChannelForAllCategories = (channel: ChannelKey, enabled: boolean) => {
    const nextMatrix = { ...matrix };
    for (const cat of CATEGORIES) {
      nextMatrix[cat.key] = { ...nextMatrix[cat.key], [channel]: enabled };
    }
    setNextValue({ ...mergedValue, matrix: nextMatrix });
  };

  const setCategoryForAllChannels = (category: CategoryKey, enabled: boolean) => {
    const nextMatrix = { ...matrix };
    const catRow = nextMatrix[category];
    nextMatrix[category] = {
      ...catRow,
      inApp: enabled,
      email: enabled,
      sms: enabled,
    };
    setNextValue({ ...mergedValue, matrix: nextMatrix });
  };

  const setCell = (category: CategoryKey, channel: ChannelKey, enabled: boolean) => {
    const nextMatrix = { ...matrix };
    nextMatrix[category] = { ...nextMatrix[category], [channel]: enabled };
    setNextValue({ ...mergedValue, matrix: nextMatrix });
  };

  const quietEnabled = mergedValue.quietHours.enabled;
  const overrides = mergedValue.quietHoursOverride ?? {} as Record<CategoryKey, boolean>;

  const setQuiet = (patch: Partial<NotificationPreferencesValue['quietHours']>) => {
    setNextValue({
      ...mergedValue,
      quietHours: {
        ...mergedValue.quietHours,
        ...patch,
        startTime:
          patch.startTime !== undefined ? normalizeTimeString(patch.startTime) : mergedValue.quietHours.startTime,
        endTime:
          patch.endTime !== undefined ? normalizeTimeString(patch.endTime) : mergedValue.quietHours.endTime,
      },
    });
  };

  const setOverride = (category: CategoryKey, value: boolean) => {
    setNextValue({
      ...mergedValue,
      quietHoursOverride: { ...overrides, [category]: value },
    });
  };

  const overriddenCategories = CATEGORIES.filter((c) => overrides[c.key]).map((c) => c.key);

  return (
    <section className="w-full" aria-label="Notification Preferences">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-main">{title}</h2>
        <p className="text-sm text-muted mt-1">
          Choose how you receive updates and configure quiet hours for reduced notifications.
        </p>
      </div>

      {/* Matrix - Desktop */}
      <div className="hidden md:block" aria-label="Notification Preferences Matrix">
        <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] p-4">
          <div className="grid" style={{ gridTemplateColumns: 'minmax(10rem, 1.4fr) repeat(3, minmax(6rem, 1fr)) 5rem' }}>
            {/* Column headers */}
            <div className="text-sm font-semibold text-text-main" aria-hidden="true" />
            {CHANNELS.map((ch) => {
              const id = `np-col-${ch.key}`;
              const { isAll, isNone } = allSelectedByChannel[ch.key];
              const indRef = useIndeterminateCheckbox(isAll, isNone);
              return (
                <div key={ch.key} className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <input
                      ref={indRef}
                      id={id}
                      type="checkbox"
                      checked={isAll}
                      onChange={(e) => setChannelForAllCategories(ch.key, e.target.checked)}
                      aria-label={`Toggle ${ch.label} notifications for all categories`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={id} className="text-sm font-medium text-text-main cursor-pointer">
                      {ch.label}
                    </label>
                  </div>
                </div>
              );
            })}
            {/* Override column header */}
            <div className="flex items-center justify-center">
              <span className="text-xs font-medium text-muted flex items-center gap-1">
                <Shield size={12} aria-hidden="true" />
                Override
              </span>
            </div>

            {/* Rows */}
            {CATEGORIES.map((cat) => {
              const rowCells = matrix[cat.key];
              const rowAny = Object.values(rowCells ?? {}).some(Boolean);
              const rowAll = Object.values(rowCells ?? {}).every(Boolean);
              const rowIndRef = useIndeterminateCheckbox(rowAll, !rowAny);
              const isOverridden = !!overrides[cat.key];

              const rowToggleLabel = `Toggle all channels for ${cat.label}`;

              return (
                <React.Fragment key={cat.key}>
                  <div className="flex items-center justify-between gap-3 pr-2">
                    <span className="text-sm font-semibold text-text-main">{cat.label}</span>
                    <input
                      ref={rowIndRef}
                      type="checkbox"
                      checked={rowAll}
                      onChange={(e) => setCategoryForAllChannels(cat.key, e.target.checked)}
                      aria-label={rowToggleLabel}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {CHANNELS.map((ch) => {
                    const cellChecked = !!matrix[cat.key]?.[ch.key];
                    const cellId = `np-${cat.key}-${ch.key}`;
                    return (
                      <CheckboxCell
                        key={ch.key}
                        id={cellId}
                        checked={cellChecked}
                        onChange={(next) => setCell(cat.key, ch.key, next)}
                        label={`${cat.label}: ${ch.label}`}
                        disabled={false}
                      />
                    );
                  })}

                  {/* Per-category override toggle */}
                  <div className="flex items-center justify-center gap-1">
                    <input
                      id={`np-override-${cat.key}`}
                      type="checkbox"
                      checked={isOverridden}
                      onChange={(e) => setOverride(cat.key, e.target.checked)}
                      aria-label={`Override quiet hours for ${cat.label}`}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`np-override-${cat.key}`} className="sr-only">
                      Override quiet hours for {cat.label}
                    </label>
                    <OverridePopover categoryLabel={cat.label} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matrix - Mobile (Accordion per category) */}
      <div className="md:hidden" aria-label="Notification Preferences Matrix (mobile)">
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const rowCells = matrix[cat.key];
            const rowAny = Object.values(rowCells ?? {}).some(Boolean);
            const rowAll = Object.values(rowCells ?? {}).every(Boolean);
            const rowIndRef = useIndeterminateCheckbox(rowAll, !rowAny);
            const isOverridden = !!overrides[cat.key];

            const rowToggleLabel = `Toggle all channels for ${cat.label}`;

            return (
              <AccordionItem
                key={cat.key}
                title={cat.label}
                isOpen={openCategory === cat.key}
                onToggle={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
                headerId={`np-acc-${cat.key}`}
                rightSlot={
                  <input
                    ref={rowIndRef}
                    type="checkbox"
                    checked={rowAll}
                    onChange={(e) => setCategoryForAllChannels(cat.key, e.target.checked)}
                    aria-label={rowToggleLabel}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                }
              >
                <div className="grid grid-cols-1 gap-2" role="group" aria-label={`${cat.label} channel preferences`}>
                  {CHANNELS.map((ch) => {
                    const cellChecked = !!matrix[cat.key]?.[ch.key];
                    const cellId = `np-m-${cat.key}-${ch.key}`;
                    return (
                      <div key={ch.key} className="flex items-center justify-between gap-3">
                        <label htmlFor={cellId} className="text-sm font-medium text-text-main">
                          {ch.label}
                        </label>
                        <input
                          id={cellId}
                          type="checkbox"
                          checked={cellChecked}
                          onChange={(e) => setCell(cat.key, ch.key, e.target.checked)}
                          aria-label={`${cat.label}: ${ch.label}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    );
                  })}

                  {/* Per-category override toggle on mobile */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-muted" aria-hidden="true" />
                      <span className="text-xs text-muted">Override quiet hours</span>
                      <OverridePopover categoryLabel={cat.label} />
                    </div>
                    <input
                      id={`np-m-override-${cat.key}`}
                      type="checkbox"
                      checked={isOverridden}
                      onChange={(e) => setOverride(cat.key, e.target.checked)}
                      aria-label={`Override quiet hours for ${cat.label}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </AccordionItem>
            );
          })}

          {/* Column bulk toggles on mobile */}
          <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] p-4" aria-label="Bulk channel toggles">
            <div className="text-sm font-semibold text-text-main mb-3">Bulk toggles</div>
            <div className="grid grid-cols-1 gap-2">
              {CHANNELS.map((ch) => {
                const id = `np-m-col-${ch.key}`;
                const { isAll, isNone } = allSelectedByChannel[ch.key];
                const indRef = useIndeterminateCheckbox(isAll, isNone);
                return (
                  <div key={ch.key} className="flex items-center justify-between gap-3">
                    <label htmlFor={id} className="text-sm font-medium text-text-main">
                      {ch.label}
                    </label>
                    <input
                      ref={indRef}
                      id={id}
                      type="checkbox"
                      checked={isAll}
                      onChange={(e) => setChannelForAllCategories(ch.key, e.target.checked)}
                      aria-label={`Toggle ${ch.label} notifications for all categories`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mt-5 rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] p-4" aria-label="Quiet Hours Scheduler">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-main">Quiet Hours</h3>
            <p className="text-sm text-muted mt-1">
              When enabled, notifications can be reduced during your selected time range.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="np-quiet-enabled"
              type="checkbox"
              checked={quietEnabled}
              onChange={(e) => setQuiet({ enabled: e.target.checked })}
              aria-label="Enable quiet hours"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="np-quiet-enabled" className="text-sm font-medium text-text-main cursor-pointer">
              Enable quiet hours
            </label>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="np-quiet-start" className="text-sm font-medium text-text-muted">
              Start Time
            </label>
            <input
              id="np-quiet-start"
              type="time"
              value={mergedValue.quietHours.startTime}
              onChange={(e) => setQuiet({ startTime: e.target.value })}
              disabled={!quietEnabled}
              aria-label="Quiet hours start time"
              className="mt-2 w-full rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(2,6,23,0.6)] px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="np-quiet-end" className="text-sm font-medium text-text-muted">
              End Time
            </label>
            <input
              id="np-quiet-end"
              type="time"
              value={mergedValue.quietHours.endTime}
              onChange={(e) => setQuiet({ endTime: e.target.value })}
              disabled={!quietEnabled}
              aria-label="Quiet hours end time"
              className="mt-2 w-full rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(2,6,23,0.6)] px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-muted">
          Time zone: <span className="text-text-main font-medium">{tzLabel}</span>
        </div>

        {/* Quiet Hours Preview Timeline */}
        <QuietHoursTimeline
          startTime={mergedValue.quietHours.startTime}
          endTime={mergedValue.quietHours.endTime}
          enabled={quietEnabled}
          timeZone={tzLabel}
          overriddenCategories={overriddenCategories}
        />
      </div>
    </section>
  );
}
