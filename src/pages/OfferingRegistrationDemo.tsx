import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusTimeline } from '../components/StatusTimeline';
import { getOfferingRegistrationMilestones } from '../components/StatusTimeline/presets';
import { DocumentUploader } from '../components/DocumentUploader';
import type { UploadableFile } from '../components/DocumentUploader';
import { SaveAsDraft } from '../components/designSystem/SaveAsDraft';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = '.pdf,.png,.jpg,.jpeg';
const SIMULATED_TICK_MS = 250;
const SIMULATED_STEP = 20;

/**
 * OfferingRegistrationDemo — demonstrates the inline document uploader
 * (Issue #199) slotted into the KYC step of the Offering Registration
 * wizard's status timeline (Issue #153).
 *
 * Uploads here are simulated client-side (no network) so the page can
 * demonstrate the uploading / completed / error states without a backend.
 */
export const OfferingRegistrationDemo: React.FC = () => {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const nextId = useRef(0);
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const simulateUpload = useCallback((id: string, name: string, shouldFail: boolean) => {
    const timer = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id !== id || file.status !== 'uploading') return file;
          const nextProgress = (file.progress ?? 0) + SIMULATED_STEP;

          if (nextProgress >= 100) {
            clearInterval(timer);
            timers.current.delete(id);
            return shouldFail
              ? {
                  ...file,
                  status: 'error',
                  progress: undefined,
                  errorMessage: `We couldn't upload "${name}". Check your connection and try again.`,
                }
              : { ...file, status: 'completed', progress: undefined };
          }
          return { ...file, progress: nextProgress };
        }),
      );
    }, SIMULATED_TICK_MS);
    timers.current.set(id, timer);
  }, []);

  const handleFilesAdded = useCallback(
    (added: File[]) => {
      const newEntries: UploadableFile[] = added.map((file) => {
        const id = `doc-${nextId.current++}`;
        // Demo-only: files over 8 MB simulate a network failure so the
        // error/retry state is reachable without a real backend.
        const shouldFail = file.size > 8 * 1024 * 1024;
        simulateUpload(id, file.name, shouldFail);
        return { id, name: file.name, size: file.size, status: 'uploading', progress: 0 };
      });
      setFiles((prev) => [...prev, ...newEntries]);
    },
    [simulateUpload],
  );

  const handleRemove = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearInterval(timer);
      timers.current.delete(id);
    }
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const handleRetry = useCallback(
    (id: string) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === id ? { ...file, status: 'uploading', progress: 0, errorMessage: undefined } : file,
        ),
      );
      const file = files.find((f) => f.id === id);
      if (file) simulateUpload(id, file.name, false);
    },
    [files, simulateUpload],
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offering Registration</h1>
        <p className="text-muted text-sm mt-1">
          Complete each step to list your RevenueShare offering.
        </p>
      </div>

      <StatusTimeline
        milestones={getOfferingRegistrationMilestones('kyc-check')}
        ariaLabel="Offering registration progress"
      />

      <section aria-labelledby="kyc-documents-heading" className="space-y-3">
        <h2 id="kyc-documents-heading" className="text-xl font-semibold">
          Verification documents
        </h2>
        <p className="text-muted text-sm">
          Attach the legal and financial documents required for KYC review. You can keep working on
          this step without losing your place in the wizard.
        </p>
        <DocumentUploader
          files={files}
          onFilesAdded={handleFilesAdded}
          onRemove={handleRemove}
          onRetry={handleRetry}
          label="Upload KYC documents"
          description="Government ID, proof of address, and articles of incorporation."
          accept={ACCEPT}
          maxSizeBytes={MAX_SIZE_BYTES}
        />
      </section>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-700">
        <SaveAsDraft onSave={() => new Promise((resolve) => setTimeout(resolve, 800))} />
        <Link to="/" className="btn btn--secondary btn--md">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OfferingRegistrationDemo;
