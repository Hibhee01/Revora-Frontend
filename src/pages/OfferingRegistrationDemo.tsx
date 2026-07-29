import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusTimeline } from '../components/StatusTimeline';
import { getOfferingRegistrationMilestones } from '../components/StatusTimeline/presets';
import { DocumentUploader } from '../components/DocumentUploader';
import type { UploadableFile } from '../components/DocumentUploader';
import { SaveAsDraft } from '../components/designSystem/SaveAsDraft';
import { HelpDrawer, HelpTrigger, OFFERING_HELP_CONTENT } from '../components/HelpDrawer';
import type { OfferingStep } from '../components/HelpDrawer';

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

  // Help drawer state
  const [helpStep, setHelpStep] = useState<OfferingStep | null>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 id="kyc-documents-heading" className="text-xl font-semibold" style={{ margin: 0 }}>
            Verification documents
          </h2>
          <HelpTrigger
            ref={helpTriggerRef}
            label="Help: KYC Check step"
            onClick={() => setHelpStep('kyc-check')}
          />
        </div>
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

      {/* Step-level help triggers row (demonstrates all steps) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'rgba(148,163,184,0.04)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148,163,184,0.12)',
        }}
        aria-label="Step help quick links"
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.25rem' }}>
          Step help:
        </span>
        {(['application', 'kyc-check', 'compliance-review', 'listed', 'funding-open'] as OfferingStep[]).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setHelpStep(step)}
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: helpStep === step ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: helpStep === step ? 'var(--primary,#3b82f6)' : 'var(--text-muted,#94a3b8)',
              cursor: 'pointer',
            }}
          >
            {OFFERING_HELP_CONTENT[step].title}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-700">
        <SaveAsDraft onSave={() => new Promise((resolve) => setTimeout(resolve, 800))} />
        <Link to="/" className="btn btn--secondary btn--md">
          Back to Home
        </Link>
      </div>

      {/* Contextual Help Drawer */}
      <HelpDrawer
        isOpen={helpStep !== null}
        onClose={() => setHelpStep(null)}
        content={helpStep ? OFFERING_HELP_CONTENT[helpStep] : OFFERING_HELP_CONTENT['kyc-check']}
        triggerRef={helpTriggerRef}
      />
    </div>
  );
};

export default OfferingRegistrationDemo;
