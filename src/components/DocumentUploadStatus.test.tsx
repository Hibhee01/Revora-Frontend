import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentUploadStatus } from './DocumentUploadStatus';
import { expect, test, describe } from 'vitest';

describe('DocumentUploadStatus', () => {
  test('renders scanning state correctly', () => {
    render(<DocumentUploadStatus fileName="contract.pdf" status="scanning" />);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('Scanning')).toBeInTheDocument();
    expect(screen.getByText('Running virus scan on uploaded document...')).toBeInTheDocument();
  });

  test('renders validating state correctly', () => {
    render(<DocumentUploadStatus fileName="id.jpg" status="validating" />);
    expect(screen.getByText('id.jpg')).toBeInTheDocument();
    expect(screen.getByText('Validating')).toBeInTheDocument();
    expect(screen.getByText('Checking content against compliance rules...')).toBeInTheDocument();
  });

  test('renders clean state correctly', () => {
    render(<DocumentUploadStatus fileName="report.xlsx" status="clean" />);
    expect(screen.getByText('report.xlsx')).toBeInTheDocument();
    expect(screen.getByText('Clean')).toBeInTheDocument();
    expect(screen.getByText('Document passed all security and compliance checks.')).toBeInTheDocument();
  });

  test('renders quarantined state with remediation and audit note', () => {
    render(
      <DocumentUploadStatus
        fileName="suspicious.doc"
        status="quarantined"
        auditNote="Flagged for potential PII exposure in section 3."
        remediationUrl="/remediation/123"
      />
    );
    expect(screen.getByText('suspicious.doc')).toBeInTheDocument();
    expect(screen.getByText('Quarantined')).toBeInTheDocument();
    expect(screen.getByText('Document flagged for review. Action required.')).toBeInTheDocument();
    expect(screen.getByText('Flagged for potential PII exposure in section 3.')).toBeInTheDocument();
    
    const remediationLink = screen.getByRole('link', { name: /view remediation steps/i });
    expect(remediationLink).toBeInTheDocument();
    expect(remediationLink).toHaveAttribute('href', '/remediation/123');
  });

  test('renders rejected state with audit note only', () => {
    render(
      <DocumentUploadStatus
        fileName="virus.exe"
        status="rejected"
        auditNote="Malware signature detected."
      />
    );
    expect(screen.getByText('virus.exe')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Document failed security checks and was blocked.')).toBeInTheDocument();
    expect(screen.getByText('Malware signature detected.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view remediation steps/i })).not.toBeInTheDocument();
  });

  test('has correct accessibility attributes', () => {
    render(<DocumentUploadStatus fileName="test.pdf" status="clean" />);
    const statusContainer = screen.getByRole('status');
    expect(statusContainer).toHaveAttribute('aria-label', 'Document status: Clean');
  });
});
