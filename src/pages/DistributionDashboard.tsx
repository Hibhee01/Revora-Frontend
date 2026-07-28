import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { EmptyState } from '../components/designSystem/EmptyState';
import { BlacklistCsvImport } from '../components/BlacklistCsvImport';

export const DistributionDashboard: React.FC = () => {
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distribution Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Track RevenueShare distributions across your portfolio.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowImport((prev) => !prev)}
          aria-expanded={showImport}
          aria-controls="bci-import-panel"
        >
          <Upload size={16} aria-hidden="true" />
          {showImport ? 'Close Import' : 'Import Blacklist'}
        </button>
      </div>

      {showImport && (
        <div id="bci-import-panel">
          <BlacklistCsvImport
            onCancel={() => setShowImport(false)}
            onImport={(rows) => {
              // Import handled by parent in production
              setShowImport(false);
            }}
          />
        </div>
      )}

      <EmptyState
        variant="distribution-dashboard"
        title="No other distributions yet"
        description="When more revenue is reported and payouts are processed, your distribution history will appear here."
        primaryAction={{
          label: 'Report Revenue',
          href: '/startup/report-revenue',
        }}
        secondaryAction={{
          label: 'Back to Discovery',
          href: '/investor/portal',
        }}
      />

      <ExitConfirmationModal
        isOpen={blocker.state === 'blocked'}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSaveAndExit={handleSaveAndExit}
      />
    </div>
  );
};

