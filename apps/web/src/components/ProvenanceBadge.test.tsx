import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProvenanceBadge } from "./ProvenanceBadge";

describe("ProvenanceBadge", () => {
  it("renders nothing for manual", () => {
    const { container } = render(<ProvenanceBadge method="manual" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders badge with aria-label for photo", () => {
    render(<ProvenanceBadge method="photo" />);
    expect(screen.getByLabelText("Logged via Photo")).toBeInTheDocument();
  });

  it("renders badge with aria-label for voice", () => {
    render(<ProvenanceBadge method="voice" />);
    expect(screen.getByLabelText("Logged via Voice")).toBeInTheDocument();
  });

  it("renders badge with aria-label for barcode (label: Scan)", () => {
    render(<ProvenanceBadge method="barcode" />);
    expect(screen.getByLabelText("Logged via Scan")).toBeInTheDocument();
  });

  it("renders badge with aria-label for recurring", () => {
    render(<ProvenanceBadge method="recurring" />);
    expect(screen.getByLabelText("Logged via Recurring")).toBeInTheDocument();
  });

  it("renders badge with aria-label for template", () => {
    render(<ProvenanceBadge method="template" />);
    expect(screen.getByLabelText("Logged via Template")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ProvenanceBadge method="photo" className="my-class" />);
    expect(screen.getByLabelText("Logged via Photo")).toHaveClass("my-class");
  });
});
