import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { ErrorRateSparklineTile, ErrorRateDataPoint } from "./ErrorRateSparklineTile";

expect.extend(toHaveNoViolations);

const MOCK_DATA: ErrorRateDataPoint[] = [
  { label: "Week 1", value: 3.2 },
  { label: "Week 2", value: 2.8 },
  { label: "Week 3", value: 3.5 },
  { label: "Week 4", value: 2.4 },
];

const defaultProps = {
  id: "test-tile-1",
  title: "ERROR RATE",
  value: "2.4%",
  rate: 2.4,
  delta: -0.8,
  sparklineData: MOCK_DATA,
  groupBy: "issuer" as const,
  filterValue: "Acme Corp",
};

describe("ErrorRateSparklineTile", () => {
  it("renders with test id", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    expect(screen.getByTestId("error-rate-tile-test-tile-1")).toBeInTheDocument();
  });

  it("displays title", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    expect(screen.getByText("ERROR RATE")).toBeInTheDocument();
  });

  it("displays value", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    expect(screen.getByText("2.4%")).toBeInTheDocument();
  });

  it("displays delta with improved label for negative delta", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    const deltaEl = screen.getByLabelText(/Improved by/i);
    expect(deltaEl).toBeInTheDocument();
    expect(deltaEl).toHaveTextContent(/0\.8%/);
  });

  it("displays delta with worsened label for positive delta", () => {
    render(
      <ErrorRateSparklineTile {...defaultProps} delta={1.2} />
    );
    const deltaEl = screen.getByLabelText(/Worsened by/i);
    expect(deltaEl).toBeInTheDocument();
    expect(deltaEl).toHaveTextContent(/1\.2%/);
  });

  it("displays neutral delta for zero change", () => {
    render(
      <ErrorRateSparklineTile {...defaultProps} delta={0} />
    );
    const deltaEl = screen.getByLabelText(/No change/i);
    expect(deltaEl).toBeInTheDocument();
  });

  it("displays group label with filter value", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    expect(screen.getByText(/Issuer: Acme Corp/)).toBeInTheDocument();
  });

  it("displays region group label", () => {
    render(
      <ErrorRateSparklineTile
        {...defaultProps}
        groupBy="region"
        filterValue="North America"
      />
    );
    expect(screen.getByText(/Region: North America/)).toBeInTheDocument();
  });

  it("renders sparkline SVG with trend aria-label", () => {
    render(<ErrorRateSparklineTile {...defaultProps} />);
    // Decreasing trend (2.4 < 3.2) => "decreasing"
    expect(
      screen.getByRole("img", { name: /decreasing/i })
    ).toBeInTheDocument();
  });

  it("renders sparkline with increasing trend when data goes up", () => {
    const rising: ErrorRateDataPoint[] = [
      { label: "W1", value: 1.0 },
      { label: "W2", value: 2.0 },
      { label: "W3", value: 3.0 },
    ];
    render(
      <ErrorRateSparklineTile {...defaultProps} sparklineData={rising} rate={3} />
    );
    expect(
      screen.getByRole("img", { name: /increasing/i })
    ).toBeInTheDocument();
  });

  it("does not render sparkline when data is empty", () => {
    const { container } = render(
      <ErrorRateSparklineTile {...defaultProps} sparklineData={[]} />
    );
    expect(container.querySelector(".error-rate-sparkline-svg")).toBeNull();
  });

  it("renders as link when href is provided", () => {
    render(
      <MemoryRouter>
        <ErrorRateSparklineTile {...defaultProps} href="/startup/distributions?issuer=Acme+Corp" />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/startup/distributions?issuer=Acme+Corp");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ErrorRateSparklineTile {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByTestId("error-rate-tile-test-tile-1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter key when role is button", () => {
    const onClick = vi.fn();
    render(<ErrorRateSparklineTile {...defaultProps} onClick={onClick} />);
    const tile = screen.getByTestId("error-rate-tile-test-tile-1");
    fireEvent.keyDown(tile, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Space key when role is button", () => {
    const onClick = vi.fn();
    render(<ErrorRateSparklineTile {...defaultProps} onClick={onClick} />);
    const tile = screen.getByTestId("error-rate-tile-test-tile-1");
    fireEvent.keyDown(tile, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders single data point without error", () => {
    const single: ErrorRateDataPoint[] = [{ label: "W1", value: 2.5 }];
    const { container } = render(
      <ErrorRateSparklineTile {...defaultProps} sparklineData={single} rate={2.5} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("handles flat data (all same value)", () => {
    const flat: ErrorRateDataPoint[] = [
      { label: "W1", value: 2.0 },
      { label: "W2", value: 2.0 },
    ];
    render(
      <ErrorRateSparklineTile {...defaultProps} sparklineData={flat} rate={2} />
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders with zero rate", () => {
    render(
      <ErrorRateSparklineTile
        {...defaultProps}
        value="0%"
        rate={0}
        delta={0}
        sparklineData={[{ label: "W1", value: 0 }]}
      />
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByLabelText(/No change/i)).toBeInTheDocument();
  });

  it("renders with extreme delta values", () => {
    render(
      <ErrorRateSparklineTile {...defaultProps} delta={-99.9} />
    );
    expect(screen.getByLabelText(/Improved by/i)).toHaveTextContent(/99\.9%/);
  });

  it("renders filterValue fallback when not provided", () => {
    render(
      <ErrorRateSparklineTile
        {...defaultProps}
        filterValue={undefined}
      />
    );
    expect(screen.getByText(/Issuer: —/)).toBeInTheDocument();
  });

  it("does not trigger onClick for non-Enter/Space keys", () => {
    const onClick = vi.fn();
    render(<ErrorRateSparklineTile {...defaultProps} onClick={onClick} />);
    const tile = screen.getByTestId("error-rate-tile-test-tile-1");
    fireEvent.keyDown(tile, { key: "Tab" });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("handles all-zero data with zero rate (range zero)", () => {
    const allZero: ErrorRateDataPoint[] = [
      { label: "W1", value: 0 },
      { label: "W2", value: 0 },
    ];
    const { container } = render(
      <ErrorRateSparklineTile
        {...defaultProps}
        rate={0}
        value="0%"
        delta={0}
        sparklineData={allZero}
      />
    );
    expect(container.querySelector(".error-rate-sparkline-svg")).toBeInTheDocument();
  });

  it("renders with large positive delta (>100%)", () => {
    render(
      <ErrorRateSparklineTile {...defaultProps} delta={150} />
    );
    expect(screen.getByLabelText(/Worsened by/i)).toHaveTextContent(/150\.0%/);
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <MemoryRouter>
        <ErrorRateSparklineTile {...defaultProps} href="/test" />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies interactive class when onClick provided", () => {
    render(<ErrorRateSparklineTile {...defaultProps} onClick={vi.fn()} />);
    const tile = screen.getByTestId("error-rate-tile-test-tile-1");
    expect(tile.className).toContain("error-rate-tile--interactive");
  });

  it("has role button when onClick provided", () => {
    render(<ErrorRateSparklineTile {...defaultProps} onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is tabIndex 0 when onClick provided", () => {
    render(<ErrorRateSparklineTile {...defaultProps} onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "0");
  });
});
