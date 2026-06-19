import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AlmanacPanel } from "./AlmanacPanel";
import * as appState from "@/state/AppState";
import type { AlmanacLocation } from "@/state/slices/uiSlice";

vi.mock("@/state/AppState");

vi.mock("@/lib/solar", () => ({
  getDayOfYear: () => 169,
  getSeason: () => "Summer",
  getMoonPhase: () => ({ phase: 0.4, label: "Waxing Gibbous", emoji: "🌔" }),
  getSunTimes: (
    _date: Date,
    lat?: number,
    lng?: number,
  ): { sunrise: string; sunset: string } | null =>
    lat !== undefined && lng !== undefined ? { sunrise: "04:43", sunset: "21:21" } : null,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

const mockSetAlmanacLocation = vi.fn();

function makeState(almanacLocation: AlmanacLocation | null = null) {
  return {
    selectedDate: "2026-06-18",
    almanacLocation,
    setAlmanacLocation: mockSetAlmanacLocation,
  } as unknown as ReturnType<typeof appState.useAppState>;
}

describe("AlmanacPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(makeState());
  });

  it("renders without error", () => {
    render(<AlmanacPanel />);
    expect(document.body).toBeTruthy();
  });

  it("renders day-of-year number", () => {
    render(<AlmanacPanel />);
    expect(screen.getByText("169")).toBeTruthy();
  });

  it("renders season label", () => {
    render(<AlmanacPanel />);
    expect(screen.getByText("Summer")).toBeTruthy();
  });

  it("renders moon phase emoji and label", () => {
    render(<AlmanacPanel />);
    expect(screen.getByText("🌔")).toBeTruthy();
    expect(screen.getByText("Waxing Gibbous")).toBeTruthy();
  });

  it("shows placeholder dashes when almanacLocation is null", () => {
    render(<AlmanacPanel />);
    expect(screen.getAllByText("--:--").length).toBeGreaterThanOrEqual(2);
  });

  it("shows sunrise and sunset times when almanacLocation is set", () => {
    vi.mocked(appState).useAppState.mockReturnValue(
      makeState({ lat: 51.5, lng: -0.1, label: "London" }),
    );
    render(<AlmanacPanel />);
    expect(screen.getByText("04:43")).toBeTruthy();
    expect(screen.getByText("21:21")).toBeTruthy();
  });

  it("includes Set location summary in the document", () => {
    render(<AlmanacPanel />);
    expect(screen.getByText("Set location")).toBeTruthy();
  });

  it("submitting form with valid data calls setAlmanacLocation", () => {
    render(<AlmanacPanel />);
    // Open the details element
    fireEvent.click(screen.getByText("Set location"));

    const labelInput = screen.getByPlaceholderText("City or place name");
    const coordInput = screen.getByPlaceholderText("51.5, -0.1");
    fireEvent.change(labelInput, { target: { value: "London" } });
    fireEvent.change(coordInput, { target: { value: "51.5, -0.1" } });
    fireEvent.click(screen.getByRole("button", { name: /save location/i }));

    expect(mockSetAlmanacLocation).toHaveBeenCalledWith({
      lat: 51.5,
      lng: -0.1,
      label: "London",
    });
  });

  it("shows validation error for invalid latitude", () => {
    render(<AlmanacPanel />);
    fireEvent.click(screen.getByText("Set location"));

    const coordInput = screen.getByPlaceholderText("51.5, -0.1");
    fireEvent.change(coordInput, { target: { value: "999, 0" } });
    fireEvent.click(screen.getByRole("button", { name: /save location/i }));

    expect(screen.getByText(/latitude must be between/i)).toBeTruthy();
    expect(mockSetAlmanacLocation).not.toHaveBeenCalled();
  });

  it("shows privacy note", () => {
    render(<AlmanacPanel />);
    expect(screen.getByText(/your location stays on this device/i)).toBeTruthy();
  });
});
