/**
 * KycSelfieCapture — Selfie capture with permission primer, face-alignment
 * oval overlay, and review/retake screen (Issue #228).
 *
 * Flow:
 *   1. Permission primer — explains why camera is needed with privacy copy.
 *   2. Camera viewport — full-screen-like with face-alignment oval overlay.
 *   3. Preview & retake — captured image shown with confirm/retake actions.
 *
 * Features:
 * - Permission denied → file upload fallback
 * - Camera unavailable → informative error with troubleshooting tips
 * - WCAG 2.1 AA: aria-live regions, keyboard navigation, focus management
 * - Responsive: 3:4 viewport on desktop, 4:5 on mobile
 * - Design-token theming for light/dark mode
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Eye,
  X,
} from 'lucide-react';
import './KycSelfieCapture.css';

/* ─── Types ────────────────────────────────────────────────────────── */

export type SelfieCameraState =
  | 'primer'       // Permission primer screen
  | 'requesting'   // Browser is prompting for permission
  | 'active'       // Camera is live
  | 'denied'       // User denied camera permission
  | 'error'        // Camera hardware error
  | 'unavailable'; // No camera found

export interface KycSelfieCaptureProps {
  /** Called when a selfie photo is captured */
  onCapture?: (file: File) => void;
  /** Called when the user opts for file upload instead */
  onUseFileUpload?: () => void;
  onClose?: () => void;
  className?: string;
}

/* ─── Component ────────────────────────────────────────────────────── */

export default function KycSelfieCapture({
  onCapture,
  onUseFileUpload,
  onClose,
  className,
}: KycSelfieCaptureProps) {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<SelfieCameraState>('primer');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState('active');
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else if (err.name === 'NotFoundError') {
          setCameraState('unavailable');
        } else {
          setCameraState('error');
        }
      } else {
        setCameraState('error');
      }
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsCapturing(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Mirror the image horizontally for selfie (front camera)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.png', { type: 'image/png' });
        setCapturedFile(file);
        setCapturedImage(URL.createObjectURL(blob));
      }
      setIsCapturing(false);
      stopStream();
    }, 'image/png');
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  }, [capturedImage, startCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedFile && onCapture) {
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  const handleFallbackUpload = useCallback(() => {
    onUseFileUpload?.();
  }, [onUseFileUpload]);

  // ── Render: Permission Primer ────────────────────────────────────────

  if (cameraState === 'primer') {
    return (
      <div className={`ksc-container${className ? ` ${className}` : ''}`}>
        <div className="ksc-header">
          <h2 id={titleId} className="ksc-title">Verify Your Identity</h2>
          <p className="ksc-subtitle">Take a selfie to complete verification</p>
          {onClose && (
            <button
              type="button"
              className="ksc-close-btn"
              onClick={onClose}
              aria-label="Close selfie capture"
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="ksc-permission-primer" role="region" aria-labelledby={titleId}>
          <Camera className="ksc-permission-primer__icon" aria-hidden="true" />
          <h3 className="ksc-permission-primer__heading">Camera access needed</h3>
          <ul className="ksc-permission-primer__reason-list">
            <li className="ksc-permission-primer__reason">
              <Shield className="ksc-permission-primer__reason-icon" size={16} aria-hidden="true" />
              <span>Match your face to the ID document you provided</span>
            </li>
            <li className="ksc-permission-primer__reason">
              <Eye className="ksc-permission-primer__reason-icon" size={16} aria-hidden="true" />
              <span>Prevent unauthorised account access or fraud</span>
            </li>
            <li className="ksc-permission-primer__reason">
              <Camera className="ksc-permission-primer__reason-icon" size={16} aria-hidden="true" />
              <span>Real-time liveness check for security</span>
            </li>
          </ul>
          <p className="ksc-permission-primer__privacy-note">
            Your photo is encrypted in transit and at rest. It is used solely for
            identity verification and retained only for the duration required by
            our <a href="/privacy" target="_blank" rel="noopener noreferrer">data-retention policy</a>.
            You can request deletion at any time.
          </p>
          <div className="ksc-permission-primer__actions">
            <button
              type="button"
              className="ksc-btn ksc-btn--primary"
              onClick={startCamera}
              aria-label="Allow camera access"
            >
              <Camera size={16} aria-hidden="true" />
              Continue with camera
            </button>
            <button
              type="button"
              className="ksc-btn ksc-btn--secondary"
              onClick={handleFallbackUpload}
            >
              <Upload size={16} aria-hidden="true" />
              Upload a photo instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Camera Requesting ────────────────────────────────────────

  if (cameraState === 'requesting') {
    return (
      <div className={`ksc-container${className ? ` ${className}` : ''}`}>
        <div className="ksc-header">
          <h2 id={titleId} className="ksc-title">Starting camera…</h2>
          <p className="ksc-subtitle">Please allow camera access when prompted<
