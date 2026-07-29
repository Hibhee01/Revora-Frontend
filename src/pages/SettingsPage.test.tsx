import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "./SettingsPage";

expect.extend(toHaveNoViolations);

describe("SettingsPage", () => {
  it("renders settings header and default i18n tab", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: /Account & Application Settings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Localization & Formatting/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: /Locale Formatter Preview/i })).toBeInTheDocument();
  });

  it("switches tabs when clicking payout settings tab", () => {
    render(<SettingsPage />);

    const payoutsTab = screen.getByRole("tab", { name: /Payout Settings/i });
    fireEvent.click(payoutsTab);

    expect(payoutsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: /Payout Schedule/i })).toBeInTheDocument();
  });

  it("passes axe accessibility checks", async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
