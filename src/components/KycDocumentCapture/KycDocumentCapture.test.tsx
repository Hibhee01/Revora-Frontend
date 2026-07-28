/**
 * Tests for KycDocumentCapture (Issue #227).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { KycDocumentCapture, DocumentType } from './KycDocumentCapture';

expect.extend(toHaveNoViolations);

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  configurable: true,
});

describe('KycDocumentCapture', () => {
  beforeEach(() => {
    mockGetUserMedia.mockReset();
  });

  describe('Initial State', () => {
    it('renders with camera permission prompt by default', () => {
      render(<KycDocumentCapture />);

      expect(screen.getByTestId('kyc-document-capture')).toBeInTheDocument();
      expect(screen.getByTestId('camera-prompt')).toBeInTheDocument();
      expect(
        screen.getByText('Camera Access Required'),
      ).toBeInTheDocument();
    });

    it('renders the appropriate document type label', () => {
      render(<KycDocumentCapture documentType="passport" />);

      expect(
        screen.getByText(/photo of your passport photo page/i),
      ).toBeInTheDocument();
    });

    it('renders with document type "id_card" by default', () => {
      render(<KycDocumentCapture />);

      expect(
        screen.getByText(/photo of your government-issued ID card/i),
      ).toBeInTheDocument();
    });

    it('renders driver\'s license label', () => {
      render(<KycDocumentCapture documentType="drivers_license" />);

      expect(
        screen.getByText(/photo of your driver's license/i),
      ).toBeInTheDocument();
    });
  });

  describe('Tip Carousel', () => {
    it('renders tip carousel on the permission prompt', () => {
      render(<KycDocumentCapture />);

      expect(screen.getByTestId('tip-carousel')).toBeInTheDocument();
      expect(screen.getByText('Capture Tips')).toBeInTheDocument();
    });

    it('shows the first tip by default', () => {
      render(<KycDocumentCapture />);

      expect(screen.getByTestId('tip-card-0')).toBeInTheDocument();
      expect(screen.getByText('Good Lighting')).toBeInTheDocument();
    });

    it('navigates tips with next button', () => {
      render(<KycDocumentCapture />);

      const nextBtn = screen.getByLabelText('Next tip');
      fireEvent.click(nextBtn);

      expect(screen.getByTestId('tip-card-1')).toBeInTheDocument();
      expect(screen.getByText('Avoid Glare')).toBeInTheDocument();
    });

    it('navigates tips with previous button', () => {
      render(<KycDocumentCapture />);

      const nextBtn = screen.getByLabelText('Next tip');
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      const prevBtn = screen.getByLabelText('Previous tip');
      fireEvent.click(prevBtn);

      expect(screen.getByTestId('tip-card-1')).toBeInTheDocument();
    });

    it('wraps around from last tip to first', () => {
      render(<KycDocumentCapture />);

      const nextBtn = screen.getByLabelText('Next tip');
      // Click 5 times to go through all 5 tips and wrap
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextBtn);
      }

      expect(screen.getByTestId('tip-card-0')).toBeInTheDocument();
    });

    it('allows jumping to a specific tip via dot buttons', () => {
      render(<KycDocumentCapture />);

      const dot3 = screen.getByLabelText('Tip 3 of 5');
      fireEvent.click(dot3);

      expect(screen.getByTestId('tip-card-2')).toBeInTheDocument();
      expect(screen.getByText('Show All Edges')).toBeInTheDocument();
    });

    it('marks the active dot with aria-current', () => {
      render(<KycDocumentCapture />);

      const firstDot = screen.getByLabelText('Tip 1 of 5');
      expect(firstDot).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Camera Request Flow', () => {
    it('shows requesting state when Enable Camera is clicked', () => {
      mockGetUserMedia.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      expect(screen.getByText('Requesting access…')).toBeInTheDocument();
    });

    it('shows denied state when camera permission is denied', async () => {
      mockGetUserMedia.mockRejectedValue(
        Object.assign(new DOMException('Permission denied'), {
          name: 'NotAllowedError',
        }),
      );

      render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      // Wait for async rejection
      expect(await screen.findByTestId('camera-denied')).toBeInTheDocument();
      expect(screen.getByText('Camera Access Denied')).toBeInTheDocument();
    });

    it('shows denied state for unavailable cameras', async () => {
      mockGetUserMedia.mockRejectedValue(
        Object.assign(new Error('No camera found'), {
          name: 'NotFoundError',
        }),
      );

      render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      expect(await screen.findByTestId('camera-denied')).toBeInTheDocument();
    });
  });

  describe('File Upload Fallback', () => {
    it('shows file upload button on permission prompt', () => {
      render(<KycDocumentCapture />);

      expect(
        screen.getByText('Upload a photo instead'),
      ).toBeInTheDocument();
    });

    it('shows file upload option in denied state', async () => {
      mockGetUserMedia.mockRejectedValue(
        Object.assign(new DOMException('Permission denied'), {
          name: 'NotAllowedError',
        }),
      );

      render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      expect(await screen.findByText(/Select a photo from your device/i)).toBeInTheDocument();
    });

    it('shows retry camera button in denied state', async () => {
      mockGetUserMedia.mockRejectedValue(
        Object.assign(new DOMException('Permission denied'), {
          name: 'NotAllowedError',
        }),
      );

      // Make the retry succeed
      mockGetUserMedia.mockResolvedValueOnce(
        Object.assign(new DOMException('Permission denied'), {
          name: 'NotAllowedError',
        }),
      );

      render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      expect(await screen.findByText(/Try camera again/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no axe violations on permission prompt', async () => {
      const { container } = render(<KycDocumentCapture />);

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no axe violations on denied fallback', async () => {
      mockGetUserMedia.mockRejectedValue(
        Object.assign(new DOMException('Permission denied'), {
          name: 'NotAllowedError',
        }),
      );

      const { container } = render(<KycDocumentCapture />);
      fireEvent.click(screen.getByText('Enable Camera'));

      await screen.findByTestId('camera-denied');
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
