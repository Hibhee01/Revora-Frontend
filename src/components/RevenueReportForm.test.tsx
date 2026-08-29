/**
 * RevenueReportForm.test.tsx
 * Issue #627 – exportable report UX: format picker, scope selector,
 * async progress, failure recovery, and concurrency guard.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RevenueReportForm } from "./RevenueReportForm";

function setup() {
  const user = userEvent.setup();
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
  const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
  render(
    <MemoryRouter>
      <RevenueReportForm />
    </MemoryRouter>
  );
  return { user, clickSpy, revokeSpy };
}

beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-report");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RevenueReportForm – export affordance", () => {
  it("renders the export section with scope and format pickers", () => {
    setup();
    expect(screen.getByRole("heading", { name: /Export report/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Current view/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Filtered set/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /PDF/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /CSV/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /XLSX/i })).toBeInTheDocument();
  });

  it("keeps export disabled until gross revenue is valid", () => {
    setup();
    const exportButton = screen.getByRole("button", { name: /Export CSV/i });
    expect(exportButton).toBeDisabled();
    expect(screen.getByText(/Enter a valid gross revenue amount greater than zero to enable export/i)).toBeInTheDocument();
  });

  it("exports CSV for the current view with async progress feedback", async () => {
    const { user, clickSpy } = setup();
    await user.type(screen.getByRole("textbox", { name: /Gross revenue/i }), "125000");

    await user.click(screen.getByRole("button", { name: /Export CSV/i }));
    expect(screen.getByRole("progressbar", { name: /Export progress/i })).toBeInTheDocument();
    expect(screen.getByText(/Preparing CSV/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Download started/i)).toBeInTheDocument();
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const link = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(link.download).toBe("revenue-report-2026-05.csv");
    expect(link.href).toBe("blob:mock-report");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("switches format to XLSX and scope to filtered set", async () => {
    const { user, clickSpy } = setup();
    await user.type(screen.getByRole("textbox", { name: /Gross revenue/i }), "125000");
    await user.click(screen.getByRole("radio", { name: /XLSX/i }));
    await user.click(screen.getByRole("radio", { name: /Filtered set/i }));

    await user.click(screen.getByRole("button", { name: /Export XLSX/i }));
    await waitFor(() => {
      expect(screen.getByText(/Download started/i)).toBeInTheDocument();
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const link = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(link.download).toBe("revenue-report-2026-05-filtered.xlsx");
  });

  it("surfaces export failures and offers a retry that succeeds", async () => {
    const { user, clickSpy } = setup();
    await user.type(screen.getByRole("textbox", { name: /Gross revenue/i }), "5000");

    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => {
      throw new Error("Blob store unavailable");
    });

    await user.click(screen.getByRole("button", { name: /Export CSV/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Blob store unavailable/i);
    });
    expect(screen.getByRole("button", { name: /Retry export/i })).toBeInTheDocument();
    expect(clickSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Retry export/i }));
    await waitFor(() => {
      expect(screen.getByText(/Download started/i)).toBeInTheDocument();
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("guards against concurrent exports", async () => {
    const { user, clickSpy } = setup();
    await user.type(screen.getByRole("textbox", { name: /Gross revenue/i }), "125000");

    await user.click(screen.getByRole("button", { name: /Export CSV/i }));
    const progress = screen.getByRole("progressbar", { name: /Export progress/i });
    expect(progress).toBeInTheDocument();

    // While exporting, the button is disabled, so a second click cannot start
    // a second export.
    expect(screen.getByRole("button", { name: /Exporting/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/Download started/i)).toBeInTheDocument();
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
