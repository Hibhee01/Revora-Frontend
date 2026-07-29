/**
 * AllocationWidget.test.tsx
 * Issue #163 – Investor Portfolio Summary: allocation widget
 * Coverage target ≥95% on AllocationWidget.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllocationWidget, AllocationSlice } from "./AllocationWidget";

const SLICES: AllocationSlice[] = [
  { id: "1", label: "TechFlow AI", value: 45000, percentage: 45 },
  { id: "2", label: "Quantum Ledger", value: 30000, percentage: 30 },
  { id: "3", label: "Nexus Pay", value: 25000, percentage: 25 },
];

describe("AllocationWidget – empty state", () => {
  it("renders allocation-widget testid", () => { 
    render(<AllocationWidget slices={[]} />);
    expect(screen.getByTestId("allocation-widget")).toBeInTheDocument();
  });

  it("shows 'No holdings to display' when slices is empty", () => {
    render(<AllocationWidget slices={[]} />);
    expect(screen.getByText(/No holdings to display/i)).toBeInTheDocument();
  });

  it("does not render toggle buttons when empty", () => {
    render(<AllocationWidget slices={[]} />);
    expect(screen.queryByTestId("donut-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bar-toggle")).not.toBeInTheDocument();
  });
});

describe("AllocationWidget – donut view (default)", () => {
  it("renders toggle group with accessible label", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByRole("group", { name: /Chart view toggle/i })).toBeInTheDocument();
  });

  it("donut toggle is initially aria-pressed=true", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByTestId("donut-toggle")).toHaveAttribute("aria-pressed", "true");
  });

  it("bar toggle is initially aria-pressed=false", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByTestId("bar-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  it("renders svg with accessible label in donut view", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByRole("img", { name: /Donut chart showing portfolio allocation/i })).toBeInTheDocument();
  });

  it("renders legend list", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByRole("list", { name: /Allocation legend/i })).toBeInTheDocument();
  });

  it("legend shows all slice labels", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByText("TechFlow AI")).toBeInTheDocument();
    expect(screen.getByText("Quantum Ledger")).toBeInTheDocument();
    expect(screen.getByText("Nexus Pay")).toBeInTheDocument();
  });

  it("legend shows percentages", () => {
    render(<AllocationWidget slices={SLICES} />);
    expect(screen.getByText("45.0%")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });
});

describe("AllocationWidget – bar view toggle", () => {
  it("switches to bar view on click", async () => {
    render(<AllocationWidget slices={SLICES} />);
    await userEvent.click(screen.getByTestId("bar-toggle"));
    expect(screen.getByTestId("bar-toggle")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("donut-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  it("bar view shows progressbars for each slice", async () => {
    render(<AllocationWidget slices={SLICES} />);
    await userEvent.click(screen.getByTestId("bar-toggle"));
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(SLICES.length);
  });

  it("bar progressbar has correct aria-valuenow", async () => {
    render(<AllocationWidget slices={SLICES} />);
    await userEvent.click(screen.getByTestId("bar-toggle"));
    const first = screen.getAllByRole("progressbar")[0];
    expect(first).toHaveAttribute("aria-valuenow", "45");
  });

  it("bar view shows all slice labels", async () => {
    render(<AllocationWidget slices={SLICES} />);
    await userEvent.click(screen.getByTestId("bar-toggle"));
    expect(screen.getByText("TechFlow AI")).toBeInTheDocument();
  });

  it("can toggle back to donut from bar", async () => {
    render(<AllocationWidget slices={SLICES} />);
    await userEvent.click(screen.getByTestId("bar-toggle"));
    await userEvent.click(screen.getByTestId("donut-toggle"));
    expect(screen.getByRole("img", { name: /Donut chart/i })).toBeInTheDocument();
  });

  it("__initialView='bar' starts in bar view", () => {
    render(<AllocationWidget slices={SLICES} __initialView="bar" />);
    expect(screen.getByTestId("bar-toggle")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("AllocationWidget – single holding", () => {
  it("renders without error with a single slice", () => {
    render(
      <AllocationWidget
        slices={[{ id: "1", label: "Solo Fund", value: 10000, percentage: 100 }]}
      />
    );
    expect(screen.getByText("Solo Fund")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });
});

describe("AllocationWidget – many holdings (overflow colours)", () => {
  const many: AllocationSlice[] = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    label: `Fund ${i + 1}`,
    value: 1000,
    percentage: 10,
  }));

  it("renders all 10 slices without error", () => {
    render(<AllocationWidget slices={many} />);
    expect(screen.getByText("Fund 10")).toBeInTheDocument();
  });
});
