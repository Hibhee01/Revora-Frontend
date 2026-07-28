import React, { useCallback } from 'react';
import { EmptyState } from '../components/designSystem/EmptyState';
import { RedemptionBanner } from '../components/RedemptionBanner';

export const DistributionDashboard: React.FC = () => {
  const {
    queue,
    addFiles,
    removeFile,
    retryFile,
    uploadFiles,
    clearComplete,
    totalCount,
    successCount,
    errorCount,
    uploadingCount,
    overallProgress,
  } = useUploadQueue();

  const handleUploadAll = useCallback(() => {
    uploadFiles(mockUploader);
  }, [uploadFiles]);

  const handleRetry = useCallback(
    (id: string, uploader: Uploader) => {
      retryFile(id, uploader);
    },
    [retryFile],
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distribution Dashboard</h1>
        <p className="text-muted text-sm mt-1 mb-8">
          Track RevenueShare distributions across your portfolio.
        </p>
        <RedemptionBanner totalCapacity={10000} currentSubscription={12500} />
      </div>

      {/* Document upload queue */}
      <section aria-labelledby="upload-section-heading">
        <h2
          id="upload-section-heading"
          className="text-xl font-semibold mb-4"
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-md)' }}
        >
          Upload Documents
        </h2>
        <UploadQueue
          queue={queue}
          onAddFiles={addFiles}
          onRemove={removeFile}
          onRetry={handleRetry}
          onUploadAll={handleUploadAll}
          onClearComplete={clearComplete}
          totalCount={totalCount}
          successCount={successCount}
          errorCount={errorCount}
          uploadingCount={uploadingCount}
          overallProgress={overallProgress}
          uploader={mockUploader}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
        />
      </section>

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

