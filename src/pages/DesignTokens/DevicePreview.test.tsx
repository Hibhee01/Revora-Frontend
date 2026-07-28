import { render, screen } from "@testing-library/react";
import { DevicePreview } from "./DevicePreview";

describe("DevicePreview", () => {
  it("renders mobile, tablet, and desktop frames", () => {
    render(<DevicePreview surface="dark" />);
    
    expect(screen.getByLabelText("Mobile Preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Tablet Preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Desktop Preview")).toBeInTheDocument();
  });

  it("renders sample page content", () => {
    render(<DevicePreview surface="dark" />);
    const titles = screen.getAllByText("Sample App");
    expect(titles.length).toBe(3); // One for each device
  });
});
