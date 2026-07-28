import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OnchainBadge, type OnchainBadgeVariant } from "./OnchainBadge";

describe("OnchainBadge", () => {
  const variants: OnchainBadgeVariant[] = [
    "pending",
    "retrying",
    "confirming",
    "confirmed",
  ];

  it.each(variants)("renders the %s variant with correct role and testid", (variant) => {
    render(<OnchainBadge variant={variant} />);
    const badge = screen.getByTestId(`onchain-badge-${variant}`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
  });

  it("renders pending with Clock icon and Pending label", () => {
    render(<OnchainBadge variant="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByTestId("onchain-badge-pending").querySelector("svg")).toBeInTheDocument();
  });

  it("renders retrying with RefreshCw icon and Retrying label", () => {
    render(<OnchainBadge variant="retrying" />);
    expect(screen.getByText("Retrying")).toBeInTheDocument();
    expect(screen.getByTestId("onchain-badge-retrying").querySelector("svg")).toBeInTheDocument();
  });

  it("renders confirming with ArrowUpCircle icon and Confirming label", () => {
    render(<OnchainBadge variant="confirming" currentConfirmations={3} targetConfirmations={12} />);
    expect(screen.getByText("Confirming")).toBeInTheDocument();
    const badge = screen.getByTestId("onchain-badge-confirming");
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });

  it("renders confirmed with CheckCircle2 icon and Confirmed label", () => {
    render(<OnchainBadge variant="confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByTestId("onchain-badge-confirmed").querySelector("svg")).toBeInTheDocument();
  });

  it("shows confirmation counter for confirming variant", () => {
    render(<OnchainBadge variant="confirming" currentConfirmations={5} targetConfirmations={12} />);
    expect(screen.getByText("/12")).toBeInTheDocument();
  });

  it("shows confirmation counter for confirmed variant", () => {
    render(<OnchainBadge variant="confirmed" currentConfirmations={12} targetConfirmations={12} />);
    expect(screen.getByText("/12")).toBeInTheDocument();
  });

  it("does not show confirmation counter for pending variant", () => {
    render(<OnchainBadge variant="pending" currentConfirmations={0} targetConfirmations={12} />);
    expect(screen.queryByText("/12")).not.toBeInTheDocument();
  });

  it("does not show confirmation counter for retrying variant", () => {
    render(<OnchainBadge variant="retrying" currentConfirmations={0} targetConfirmations={12} />);
    expect(screen.queryByText("/12")).not.toBeInTheDocument();
  });

  describe("aria-labels", () => {
    it("uses plain-language description for pending", () => {
      render(<OnchainBadge variant="pending" />);
      const badge = screen.getByTestId("onchain-badge-pending");
      expect(badge).toHaveAttribute(
        "aria-label",
        "Transaction pending - waiting for network confirmation",
      );
    });

    it("uses plain-language description for retrying", () => {
      render(<OnchainBadge variant="retrying" />);
      const badge = screen.getByTestId("onchain-badge-retrying");
      expect(badge).toHaveAttribute(
        "aria-label",
        "Transaction retrying - attempting to resubmit to the network",
      );
    });

    it("includes confirmation count in aria-label for confirming", () => {
      render(<OnchainBadge variant="confirming" currentConfirmations={3} targetConfirmations={12} />);
      const badge = screen.getByTestId("onchain-badge-confirming");
      expect(badge).toHaveAttribute(
        "aria-label",
        "Transaction confirming - 3 of 12 confirmations received",
      );
    });

    it("includes confirmation count in aria-label for confirmed", () => {
      render(<OnchainBadge variant="confirmed" currentConfirmations={12} targetConfirmations={12} />);
      const badge = screen.getByTestId("onchain-badge-confirmed");
      expect(badge).toHaveAttribute(
        "aria-label",
        "Transaction confirmed with 12 of 12 confirmations",
      );
    });

    it("handles zero confirmations gracefully in aria-label", () => {
      render(<OnchainBadge variant="confirming" currentConfirmations={0} targetConfirmations={0} />);
      const badge = screen.getByTestId("onchain-badge-confirming");
      expect(badge).toHaveAttribute(
        "aria-label",
        "Transaction confirming - 0 of 0 confirmations received",
      );
    });
  });

  describe("sizes", () => {
    it.each(["sm", "md", "lg"] as const)("applies size class for %s", (size) => {
      const { container } = render(<OnchainBadge variant="confirmed" size={size} />);
      expect(container.firstChild).toHaveClass(`onchain-badge--${size}`);
    });
  });

  describe("className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <OnchainBadge variant="confirmed" className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("icons", () => {
    it("renders icons with aria-hidden", () => {
      const { container } = render(<OnchainBadge variant="pending" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("edge cases", () => {
    it("renders confirming with zero confirmations", () => {
      render(<OnchainBadge variant="confirming" currentConfirmations={0} targetConfirmations={12} />);
      expect(screen.getByText("Confirming")).toBeInTheDocument();
      expect(screen.getByText("/12")).toBeInTheDocument();
    });

    it("renders confirming when current equals target", () => {
      render(<OnchainBadge variant="confirming" currentConfirmations={12} targetConfirmations={12} />);
      expect(screen.getByText("Confirming")).toBeInTheDocument();
    });

    it("renders confirmed with zero confirmations", () => {
      render(<OnchainBadge variant="confirmed" />);
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
      expect(screen.getByText("/0")).toBeInTheDocument();
    });

    it("applies variant CSS class", () => {
      const { container } = render(<OnchainBadge variant="confirming" />);
      expect(container.firstChild).toHaveClass("onchain-badge--confirming");
    });
  });
});
