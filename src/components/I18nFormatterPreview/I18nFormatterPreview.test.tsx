import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { I18nFormatterPreview } from "./I18nFormatterPreview";

expect.extend(toHaveNoViolations);

describe("I18nFormatterPreview", () => {
  it("renders the component title, status bar, and comparison table", () => {
    render(<I18nFormatterPreview />);

    expect(screen.getByRole("heading", { name: /Locale Formatter Preview/i })).toBeInTheDocument();
    expect(screen.getByText(/System Default Active/i)).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Standard Number")).toBeInTheDocument();
    expect(screen.getByText("Compact / Abbreviated")).toBeInTheDocument();
    expect(screen.getByText("Default Currency")).toBeInTheDocument();
  });

  it("filters locale dropdown search results", async () => {
    render(<I18nFormatterPreview />);

    const input = screen.getByLabelText(/Select or search locale/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "German" } });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText(/German \(Germany\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Japanese/i)).not.toBeInTheDocument();
  });

  it("selects a new locale and updates preview values immediately", async () => {
    const onLocaleChange = vi.fn();
    render(<I18nFormatterPreview onLocaleChange={onLocaleChange} />);

    const input = screen.getByLabelText(/Select or search locale/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Deutsch" } });

    const option = screen.getByText(/German \(Germany\)/i);
    fireEvent.click(option);

    expect(onLocaleChange).toHaveBeenCalledWith("de-DE");
    expect(screen.getByText(/Custom Override Active/i)).toBeInTheDocument();

    // Verification of formatted currency for German (€)
    expect(screen.getAllByText(/€/i).length).toBeGreaterThan(0);
  });

  it("reverts back to system default locale when clicking Revert button", async () => {
    render(<I18nFormatterPreview initialLocale="de-DE" systemDefaultLocale="en-US" />);

    expect(screen.getByText(/Custom Override Active/i)).toBeInTheDocument();
    const revertBtn = screen.getByRole("button", { name: /Revert to Default/i });
    expect(revertBtn).not.toBeDisabled();

    fireEvent.click(revertBtn);

    expect(screen.getByText(/System Default Active/i)).toBeInTheDocument();
    expect(revertBtn).toBeDisabled();
  });

  it("displays RTL badge and dir attributes when selecting an RTL locale like Arabic", async () => {
    render(<I18nFormatterPreview initialLocale="ar-SA" />);

    expect(screen.getByText(/RTL Text Direction/i)).toBeInTheDocument();
    const rtlElements = document.querySelectorAll('[dir="rtl"]');
    expect(rtlElements.length).toBeGreaterThan(0);
  });

  it("supports keyboard navigation in search combobox", async () => {
    render(<I18nFormatterPreview />);

    const input = screen.getByLabelText(/Select or search locale/i);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears search input when clear button is clicked", () => {
    render(<I18nFormatterPreview />);

    const input = screen.getByLabelText(/Select or search locale/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Arabic" } });

    const clearBtn = screen.getByLabelText(/Clear search input/i);
    fireEvent.click(clearBtn);

    expect(input).toHaveValue("");
  });

  it("handles empty search results", () => {
    render(<I18nFormatterPreview />);

    const input = screen.getByLabelText(/Select or search locale/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "nonexistentlocale123" } });

    expect(screen.getByText(/No matching locales found/i)).toBeInTheDocument();
  });

  it("passes accessibility checks with zero axe violations", async () => {
    const { container } = render(<I18nFormatterPreview initialLocale="en-US" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes accessibility checks for RTL mode with zero axe violations", async () => {
    const { container } = render(<I18nFormatterPreview initialLocale="ar-SA" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
