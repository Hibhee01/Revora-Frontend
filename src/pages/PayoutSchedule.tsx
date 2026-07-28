import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { EmptyState } from '../components/designSystem/EmptyState';
import { CalendarExportDialog } from '../components/CalendarExportDialog';
import { Button } from '../components/Button';

export const PayoutSchedule: React.FC = () => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Schedule</h1>
          <p className="text-muted text-sm mt-1">
            View upcoming and past RevenueShare payout dates.
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setIsExportDialogOpen(true)}
          style={{ width: 'auto' }}
        >
          <Calendar size={18} />
          Subscribe
        </Button>
      </div>

      <EmptyState
        variant="payout-schedule"
        title="No payouts scheduled"
        description="Payouts will appear here once revenue is reported and the distribution cycle begins."
        primaryAction={{
          label: 'Report Revenue',
          href: '/startup/report-revenue',
        }}
        secondaryAction={{
          label: 'Learn How It Works',
          href: '/',
        }}
      />

      <CalendarExportDialog 
        isOpen={isExportDialogOpen} 
        onClose={() => setIsExportDialogOpen(false)} 
      />
    </div>
  );
};
