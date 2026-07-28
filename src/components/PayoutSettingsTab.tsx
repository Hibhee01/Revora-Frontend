import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Users, Calendar, Clock, CheckCircle } from 'lucide-react';

interface FeeSplit {
  id: string;
  role: string;
  percentage: number;
  isLocked: boolean;
}

export const PayoutSettingsTab: React.FC = () => {
  const [cadence, setCadence] = useState('monthly');
  const [cutoffDay, setCutoffDay] = useState(15);
  
  const [splits, setSplits] = useState<FeeSplit[]>([
    { id: '1', role: 'Investors (Pro-rata)', percentage: 80, isLocked: true },
    { id: '2', role: 'Issuer (Operations)', percentage: 15, isLocked: false },
    { id: '3', role: 'Platform Fee', percentage: 5, isLocked: true },
  ]);

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  const isValid = totalPercentage === 100;

  const handlePercentageChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setSplits(splits.map(split => 
      split.id === id && !split.isLocked 
        ? { ...split, percentage: numValue }
        : split
    ));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Schedule Editor */}
      <section className="glass-card p-6 space-y-6" aria-labelledby="schedule-heading">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
            <Calendar size={24} />
          </div>
          <div className="flex-1">
            <h2 id="schedule-heading" className="text-xl font-bold text-main">Payout Schedule</h2>
            <p className="text-sm text-muted mt-1">Configure when distributions are calculated and sent.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="cadence" className="text-sm font-medium text-main">Distribution Cadence</label>
            <select 
              id="cadence" 
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-main focus-ring"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="cutoff" className="text-sm font-medium text-main">Cutoff Day</label>
            <div className="flex items-center gap-2">
              <select 
                id="cutoff" 
                value={cutoffDay}
                onChange={(e) => setCutoffDay(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-main focus-ring"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-start gap-3">
          <Clock className="text-accent mt-0.5" size={18} />
          <p className="text-sm text-main leading-relaxed">
            <strong>Schedule Summary:</strong> Revenue will be distributed <span className="text-accent font-semibold">{cadence}</span>. The snapshot for pro-rata allocation is taken on the <span className="text-accent font-semibold">{cutoffDay}{[1,21,31].includes(cutoffDay) ? 'st' : [2,22].includes(cutoffDay) ? 'nd' : [3,23].includes(cutoffDay) ? 'rd' : 'th'}</span> of the period at 23:59 UTC.
          </p>
        </div>
      </section>

      {/* Fee Split Editor */}
      <section className="glass-card p-6 space-y-6" aria-labelledby="fees-heading">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h2 id="fees-heading" className="text-xl font-bold text-main">Fee Splits</h2>
            <p className="text-sm text-muted mt-1">Allocate revenue percentages across all participants.</p>
          </div>
        </div>

        {!isValid && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3" role="alert">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Invalid Allocation</p>
              <p className="text-xs mt-1">Total percentages must sum exactly to 100%. Current total is {totalPercentage}%.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {splits.map(split => (
            <div key={split.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3">
                {split.isLocked ? (
                  <div className="text-slate-500" aria-label="Locked role" title="This role's percentage is locked by smart contract">
                    <Lock size={16} />
                  </div>
                ) : (
                  <div className="w-4" />
                )}
                <div>
                  <span className="text-sm font-medium text-main">{split.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={split.percentage}
                  onChange={(e) => handlePercentageChange(split.id, e.target.value)}
                  disabled={split.isLocked}
                  className="w-20 bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 text-right text-sm text-main disabled:opacity-50 focus-ring"
                  aria-label={`${split.role} percentage`}
                />
                <span className="text-slate-400 font-medium">%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <span className="font-medium text-main">Total Allocation</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
              {totalPercentage}%
            </span>
            {isValid && <CheckCircle size={20} className="text-green-400" aria-label="Valid allocation" />}
          </div>
        </div>
      </section>
    </div>
  );
};
