// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import KycSelfieCapture from "./KycSelfieCapture";

afterEach(cleanup);

describe("KycSelfieCapture", () => {
  it("renders the permission primer by default", () => {
    render(<KycSelfieCapture />);
    expect(screen.getByText("Verify Your Identity")).toBeTruthy();
    expect(screen.getByText("Camera access needed")).toBeTruthy();
    expect(screen.getByRole("button", { name: /allow camera access/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /upload a photo instead/i })).toBeTruthy();
  });

  it("lists three privacy reasons in the primer", () => {
    render(<KycSelfieCapture />);
    const listItems = document.querySelectorAll(".ksc-permission-primer__reason");
    expect(listItems.length).toBe(3);
  });

  it("shows a privacy policy link in the primer", () => {
    render(<KycSelfieCapture />);
    const link = screen.getByText(/data-retention policy/i);
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/privacy");
  });

  it("calls onUseFileUpload when upload fallback is clicked", () => {
    const onUpload = vi.fn();
    render(<KycSelfieCapture onUseFileUpload={onUpload} />);
    fireEvent.click(screen.getByRole("button", { name: /upload a photo instead/i }));
    expect(onUpload).toHaveBeenCalledOnce();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<KycSelfieCapture onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close selfie capture/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows requesting state when camera access is clicked", () => {
    render(<KycSelfieCapture />);
    fireEvent.click(screen.getByRole("button", { name: /allow camera access/i }));
    expect(screen.getByText("Waiting for camera permission…")).toBeTruthy();
  });

  it("shows denied state when camera permission is not granted", async () => {
    // Mock getUserMedia to reject with NotAllowedError
    const mockGetUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new DOMException("Permission denied"), { name: "NotAllowedError" })
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    render(<KycSelfieCapture />);
    fireEvent.click(screen.getByRole("button", { name: /allow camera access/i }));

    await waitFor(() => {
      expect(screen.getByText("Camera access denied")).toBeTruthy();
    });
  });

  it("shows unavailable state when no camera hardware", async () => {
    const mockGetUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new DOMException("Not found"), { name: "NotFoundError" })
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    render(<KycSelfieCapture />);
    fireEvent.click(screen.getByRole("button", { name: /allow camera access/i }));

    await waitFor(() => {
      expect(screen.getByText("No camera found")).toBeTruthy();
    });
  });

  it("shows error state on generic camera error", async () => {
    const mockGetUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new DOMException("Unknown error"), { name: "NotReadableError" })
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    render(<KycSelfieCapture />);
    fireEvent.click(screen.getByRole("button", { name: /allow camera access/i }));

    await waitFor(() => {
      expect(screen.getByText("Camera error")).toBeTruthy();
    });
  });

  it("shows retry and upload buttons in denied state", async () => {
    const mockGetUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new DOMException("Permission denied"), { name: "NotAllowedError" })
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    render(<KycSelfieCapture />);
    fireEvent.click(screen.getByRole("button", { name: /allow camera access/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /upload a photo/i })).toBeTruthy();
    });
  });

  it("forwards className to the container", () => {
    const { container } = render(<KycSelfieCapture className="custom-class" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("custom-class");
  });

  it("renders with accessible heading hierarchy", () => {
    render(<KycSelfieCapture />);
    const heading = screen.getByRole("heading", { level: 2, name: "Verify Your Identity" });
    expect(heading).toBeTruthy();
  });
});
