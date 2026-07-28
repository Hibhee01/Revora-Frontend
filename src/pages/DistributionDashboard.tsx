import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import {
  DocumentReplacementFlow,
  DocumentVersion,
} from '../components/DocumentReplacementFlow';

const DEMO_OLD_VERSION: DocumentVersion = {
  id: 'ver-dist-q1-2025-v1',
  versionLabel: 'v1 (Q1 2025)',
  fileName: 'Q1-2025-Distribution-Report.pdf',
  fileType: 'PDF',
  fileSizeBytes: 1_284_500,
  uploadedBy: {
    id: 'usr-42',
    name: 'Ava Chen',
    email: 'ava@revora.example',
  },
  uploadedAt: '2025-04-05T09:14:00Z',
  pageCount: 18,
  sha256:
    'a7b3c9d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
  notes: 'Original distribution filed before the revised LP allocations.',
};

const DEMO_NEW_VERSION: DocumentVersion = {
  id: 'ver-dist-q1-2025-v2',
  versionLabel: 'v2 (Revised)',
  fileName: 'Q1-2025-Distribution-Report-Revised.pdf',
  fileType: 'PDF',
  fileSizeBytes: 1_361_200,
  uploadedBy: {
    id: 'usr-42',
    name: 'Ava Chen',
    email: 'ava@revora.example',
  },
  uploadedAt: new Date().toISOString(),
  pageCount: 20,
  sha256:
    'b1b3c9d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f91234',
  notes: 'Updated LP allocations for ACME Holdings and added footnote 12.',
};

export const DistributionDashboard: React.FC = () => {
  const [showReplacementFlow, setShowReplacementFlow] = useState(false);

  const demoDiff = useMemo(
    () => ({
      bytesAdded: Math.max(
        DEMO_NEW_VERSION.fileSizeBytes - DEMO_OLD_VERSION.fileSizeBytes,
        0,
      ),
      bytesRemoved: Math.max(
        DEMO_OLD_VERSION.fileSizeBytes - DEMO_NEW_VERSION.fileSizeBytes,
        0,
      ),
      pagesAdded: Math.max(
        (DEMO_NEW_VERSION.pageCount ?? 0) - (DEMO_OLD_VERSION.pageCount ?? 0),
        0,
      ),
      pagesRemoved: Math.max(
        (DEMO_OLD_VERSION.pageCount ?? 0) - (DEMO_NEW_VERSION.pageCount ?? 0),
        0,
      ),
      highConfidenceMatch: true,
      summaryText:
        '2 pages added, 75 KB added · LP allocations updated, new footnote added.',
      fieldsChanged: [
        {
          name: 'Pages',
          oldValue: String(DEMO_OLD_VERSION.pageCount),
          newValue: String(DEMO_NEW_VERSION.pageCount),
        },
        {
          name: 'Size',
          oldValue: `${(DEMO_OLD_VERSION.fileSizeBytes / 1024).toFixed(1)} KB`,
          newValue: `${(DEMO_NEW_VERSION.fileSizeBytes / 1024).toFixed(1)} KB`,
        },
        {
          name: 'File name',
          oldValue: DEMO_OLD_VERSION.fileName,
          newValue: DEMO_NEW_VERSION.fileName,
        },
      ],
    }),
    [],
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Distribution Dashboard
        </h1>
        <p className="text-muted text-sm mt-1">
          Track RevenueShare distributions across your portfolio.
        </p>
      </div>

      <GovernanceResults
        results={{ for: 2500000, against: 450000, abstain: 50000 }}
        participation={{ turnout: 68.4, uniqueVoters: 142, delegates: 12 }}
        status="passed"
      />

      <EmptyState
        variant="distribution-dashboard"
        title="No distributions yet"
        description="When revenue is reported and payouts are processed, your distribution history will appear here."
        primaryAction={{
          label: 'Report Revenue',
          href: '/startup/report-revenue',
        }}
        secondaryAction={
          showReplacementFlow
            ? {
                label: 'Hide replacement demo',
                onClick: () => setShowReplacementFlow(false),
              }
            : {
                label: 'Try document replacement demo',
                onClick: () => setShowReplacementFlow(true),
              }
        }
      />

      {showReplacementFlow && (
        <section
          aria-label="Document replacement flow demo"
          className="mt-6"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Document replacement demo
            </h2>
            <p className="text-muted text-sm mt-1">
              Replacing <em>{DEMO_OLD_VERSION.fileName}</em> with a revised
              version. Both versions can be kept, with the active one clearly
              labeled.
            </p>
          </div>
          <DocumentReplacementFlow
            oldVersion={DEMO_OLD_VERSION}
            initialNewVersion={DEMO_NEW_VERSION}
            initialDiff={demoDiff}
            documentName="Q1 2025 Distribution Report"
            locale="en-US"
            onCancel={() => setShowReplacementFlow(false)}
            onConfirm={(result) => {
              // Demo only: in a real integration this dispatches the
              // replacement to the backend/API layer.
              // eslint-disable-next-line no-console
              console.info('[DocumentReplacementFlow] confirm', result);
            }}
          />
        </section>
      )}
    </div>
  );
};

