import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DAILY_STEP_GOAL } from "@/types";
import { DailyVitalsStrip } from "./DailyVitalsStrip";

vi.mock("lucide-react", () => ({
  Droplets: () => <svg data-testid="icon-droplets" />,
  Footprints: () => <svg data-testid="icon-footprints" />,
  Flame: () => <svg data-testid="icon-flame" />,
  Timer: () => <svg data-testid="icon-timer" />,
}));

const defaultProps = {
  totalWaterMl: 1000,
  waterGoalMl: 2000,
  totalSteps: 5000,
  totalBurned: 0,
};

describe("DailyVitalsStrip", () => {
  it("renders the water chip with correct value", () => {
    render(<DailyVitalsStrip {...defaultProps} />);
    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("1,000 / 2,000 ml")).toBeInTheDocument();
  });

  it("renders the steps chip with correct value and goal", () => {
    render(<DailyVitalsStrip {...defaultProps} />);
    expect(screen.getByText("Steps")).toBeInTheDocument();
    expect(screen.getByText(`5,000 / ${DAILY_STEP_GOAL.toLocaleString()}`)).toBeInTheDocument();
  });

  it("does not render the Burned chip when totalBurned is 0", () => {
    render(<DailyVitalsStrip {...defaultProps} totalBurned={0} />);
    expect(screen.queryByText("Burned")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-flame")).not.toBeInTheDocument();
  });

  it("renders the Burned chip when totalBurned is positive", () => {
    render(<DailyVitalsStrip {...defaultProps} totalBurned={250} />);
    expect(screen.getByText("Burned")).toBeInTheDocument();
    expect(screen.getByText("250 kcal")).toBeInTheDocument();
  });

  it("does not render the Fasting chip when fastingTargetHours is undefined", () => {
    render(<DailyVitalsStrip {...defaultProps} />);
    expect(screen.queryByText(/h fast/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-timer")).not.toBeInTheDocument();
  });

  it("renders the Fasting chip with remaining time when a session is active", () => {
    render(
      <DailyVitalsStrip
        {...defaultProps}
        fastingTargetHours={16}
        fastingRemaining="6h 30m"
        fastingComplete={false}
      />,
    );
    expect(screen.getByText("16h fast")).toBeInTheDocument();
    expect(screen.getByText("6h 30m")).toBeInTheDocument();
  });

  it("renders 'Complete!' when fastingComplete is true", () => {
    render(
      <DailyVitalsStrip
        {...defaultProps}
        fastingTargetHours={16}
        fastingRemaining="0h 00m"
        fastingComplete={true}
      />,
    );
    expect(screen.getByText("16h fast")).toBeInTheDocument();
    expect(screen.getByText("Complete!")).toBeInTheDocument();
  });

  it("does not render Fasting chip when fastingRemaining is undefined even if targetHours is set", () => {
    render(
      <DailyVitalsStrip {...defaultProps} fastingTargetHours={16} fastingRemaining={undefined} />,
    );
    expect(screen.queryByText(/h fast/)).not.toBeInTheDocument();
  });

  it("has the correct aria-label on the container", () => {
    render(<DailyVitalsStrip {...defaultProps} />);
    expect(screen.getByRole("list", { name: /daily vitals/i })).toBeInTheDocument();
  });

  it("renders water and steps chips as list items", () => {
    render(<DailyVitalsStrip {...defaultProps} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});
