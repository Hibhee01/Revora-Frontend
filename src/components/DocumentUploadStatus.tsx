import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, FileSearch, XCircle, ChevronRight, FileText } from 'lucide-react';

export type UploadStatus = 'scanning' | 'validating' | 'clean' | 'quarantined' | 'rejected';

export interface DocumentUploadStatusProps {
  fileName: string;
  status: UploadStatus;

  remediationUrl?: string;
  auditNote?: string;

  uploadProgress?: number;
  fileSize?: string;
  onReplace?: () => void;
  onRemove?: () => void;
  isUploading?: boolean;
  errorMessage?: string;
}

export const DocumentUploadStatus: React.FC<DocumentUploadStatusProps> = ({
  fileName,
  status,
  remediationUrl,
  auditNote,
}) => {
  const config = {
    scanning: {
      icon: FileSearch,
      iconClass: 'text-blue-500 animate-pulse dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      label: 'Scanning',
      description: 'Running virus scan on uploaded document...',
    },
    validating: {
      icon: Shield,
      iconClass: 'text-indigo-500 animate-pulse dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
      label: 'Validating',
      description: 'Checking content against compliance rules...',
    },
    clean: {
      icon: ShieldCheck,
      iconClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      label: 'Clean',
      description: 'Document passed all security and compliance checks.',
    },
    quarantined: {
      icon: ShieldAlert,
      iconClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      label: 'Quarantined',
      description: 'Document flagged for review. Action required.',
    },
    rejected: {
      icon: XCircle,
      iconClass: 'text-red-500 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      label: 'Rejected',
      description: 'Document failed security checks and was blocked.',
    },
  }[status];

  const Icon = config.icon;
  const isTerminalError = status === 'quarantined' || status === 'rejected';

  return (
    <div 
      className={`rounded-lg border p-4 ${config.bgClass} transition-colors border-gray-200 dark:border-gray-800`}
      role="status"
      aria-label={`Document status: ${config.label}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconClass}`} aria-hidden="true">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {fileName}
            </h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.iconClass} bg-white dark:bg-gray-900 border border-current opacity-90`}>
              {config.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {config.description}
          </p>
          
          {isTerminalError && (
            <div className="mt-3 space-y-3">
              {auditNote && (
                <div className="rounded-md bg-white dark:bg-gray-900 p-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-gray-400" />
                    <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">Audit Note</span>
                  </div>
                  <p>{auditNote}</p>
                </div>
              )}
              {remediationUrl && (
                <a
                  href={remediationUrl}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                >
                  View remediation steps
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
