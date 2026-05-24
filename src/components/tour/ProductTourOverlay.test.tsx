import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ProductTourOverlay from "./ProductTourOverlay";
import { TOUR_TOTAL_STEPS } from "./tourSteps";
import type { AppState } from "@/state/AppState";

const mockSkipTour = vi.fn().mockResolvedValue(undefined);
const mockEndTour = vi.fn().mockResolvedValue(undefined);
const mockNextTourStep = vi.fn();
const mockPrevTourStep = vi.fn();

vi.mock("@/state/AppState", () => ({
  useAppState: vi.fn((selector: (s: AppState) => unknown) => {
    const state = {
      tourActive: true,
      tourStep: 0,
      tourTotalSteps: TOUR_TOTAL_STEPS,
      nextTourStep: mockNextTourStep,
      prevTourStep: mockPrevTourStep,
      endTour: mockEndTour,
      skipTour: mockSkipTour,
    };
    return selector(state as unknown as AppState);
  }),
}));

vi.mock("./useSpotlightRect", () => ({
  useSpotlightRect: vi.fn(() => ({
    top: 100,
    left: 50,
    width: 400,
    height: 200,
    found: true,
  })),
}));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: vi.fn(() => true),
  };
});

const defaultState = {
  tourActive: true,
  tourStep: 0,
  tourTotalSteps: TOUR_TOTAL_STEPS,
  nextTourStep: mockNextTourStep,
  prevTourStep: mockPrevTourStep,
  endTour: mockEndTour,
  skipTour: mockSkipTour,
};

describe("ProductTourOverlay", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.location.hash = "#dashboard";
    const { useAppState } = await import("@/state/AppState");
    vi.mocked(useAppState).mockImplementation((selector: (s: AppState) => unknown) =>
      selector(defaultState as unknown as AppState),
    );
  });

  it("is a function (component)", () => {
    expect(typeof ProductTourOverlay).toBe("function");
  });

  it("renders Quick tour heading and body on first step", () => {
    render(<ProductTourOverlay />);
    expect(screen.getByText("Quick tour")).toBeDefined();
    expect(screen.getByText(/Take 90 seconds/i)).toBeDefined();
  });

  it("shows step N of M indicator", () => {
    render(<ProductTourOverlay />);
    expect(screen.getByText(`Step 1 of ${TOUR_TOTAL_STEPS}`)).toBeDefined();
  });

  it("clicking Next calls nextTourStep when not on last step", () => {
    render(<ProductTourOverlay />);
    const nextBtn = screen.getByRole("button", { name: /next step/i });
    fireEvent.click(nextBtn);
    expect(mockNextTourStep).toHaveBeenCalledTimes(1);
  });

  it("clicking Skip calls skipTour", async () => {
    render(<ProductTourOverlay />);
    const skipBtns = screen.getAllByText("Skip tour");
    await act(async () => {
      fireEvent.click(skipBtns[0]!);
    });
    expect(mockSkipTour).toHaveBeenCalledTimes(1);
  });

  it("pressing Esc calls skipTour", async () => {
    render(<ProductTourOverlay />);
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(mockSkipTour).toHaveBeenCalledTimes(1);
  });

  it("has a dialog with aria-modal", () => {
    render(<ProductTourOverlay />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("has aria-labelledby and aria-describedby", () => {
    render(<ProductTourOverlay />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("renders Done button on last step", async () => {
    const { useAppState } = await import("@/state/AppState");
    vi.mocked(useAppState).mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        tourActive: true,
        tourStep: TOUR_TOTAL_STEPS - 1,
        tourTotalSteps: TOUR_TOTAL_STEPS,
        nextTourStep: mockNextTourStep,
        prevTourStep: mockPrevTourStep,
        endTour: mockEndTour,
        skipTour: mockSkipTour,
      };
      return selector(state as unknown as AppState);
    });
    render(<ProductTourOverlay />);
    expect(screen.getByRole("button", { name: /finish tour/i })).toBeDefined();
  });

  it("clicking Done on last step calls endTour", async () => {
    const { useAppState } = await import("@/state/AppState");
    vi.mocked(useAppState).mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        tourActive: true,
        tourStep: TOUR_TOTAL_STEPS - 1,
        tourTotalSteps: TOUR_TOTAL_STEPS,
        nextTourStep: mockNextTourStep,
        prevTourStep: mockPrevTourStep,
        endTour: mockEndTour,
        skipTour: mockSkipTour,
      };
      return selector(state as unknown as AppState);
    });
    render(<ProductTourOverlay />);
    const doneBtn = screen.getByRole("button", { name: /finish tour/i });
    await act(async () => {
      fireEvent.click(doneBtn);
    });
    expect(mockEndTour).toHaveBeenCalledTimes(1);
    expect(mockNextTourStep).not.toHaveBeenCalled();
  });

  it("clicking Back calls prevTourStep on a middle step", async () => {
    const { useAppState } = await import("@/state/AppState");
    vi.mocked(useAppState).mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        tourActive: true,
        tourStep: 3,
        tourTotalSteps: TOUR_TOTAL_STEPS,
        nextTourStep: mockNextTourStep,
        prevTourStep: mockPrevTourStep,
        endTour: mockEndTour,
        skipTour: mockSkipTour,
      };
      return selector(state as unknown as AppState);
    });
    render(<ProductTourOverlay />);
    const backBtn = screen.getByRole("button", { name: /previous step/i });
    fireEvent.click(backBtn);
    expect(mockPrevTourStep).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when tourActive is false", async () => {
    const { useAppState } = await import("@/state/AppState");
    vi.mocked(useAppState).mockImplementation((selector: (s: AppState) => unknown) => {
      const state = {
        tourActive: false,
        tourStep: 0,
        tourTotalSteps: TOUR_TOTAL_STEPS,
        nextTourStep: mockNextTourStep,
        prevTourStep: mockPrevTourStep,
        endTour: mockEndTour,
        skipTour: mockSkipTour,
      };
      return selector(state as unknown as AppState);
    });
    const { container } = render(<ProductTourOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("ArrowRight key on card calls nextTourStep", () => {
    render(<ProductTourOverlay />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(mockNextTourStep).toHaveBeenCalledTimes(1);
  });

  it("sets inert on #main while tour is active and removes it on unmount", () => {
    const mainEl = document.createElement("div");
    mainEl.id = "main";
    document.body.appendChild(mainEl);

    try {
      const { unmount } = render(<ProductTourOverlay />);
      expect(mainEl.hasAttribute("inert")).toBe(true);
      unmount();
      expect(mainEl.hasAttribute("inert")).toBe(false);
    } finally {
      document.body.removeChild(mainEl);
    }
  });

  it("renders coachmark on narrow viewport (mobile layout path)", () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });

    try {
      render(<ProductTourOverlay />);
      expect(screen.getByRole("dialog")).toBeTruthy();
    } finally {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    }
  });
});
