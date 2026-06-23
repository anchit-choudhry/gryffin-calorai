import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabHeadline } from "./TabHeadline";

describe("TabHeadline - Nutrition", () => {
  it("shows avg vs goal when calories are logged", () => {
    render(
      <TabHeadline
        tab="nutrition"
        avgCalories={1840}
        calorieGoal={2000}
        proteinDaysLogged={5}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={3}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/1,840 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/160 under goal/)).toBeInTheDocument();
    expect(screen.getByText(/5\/7 days logging protein/)).toBeInTheDocument();
  });

  it("shows 'over goal' when avgCalories exceeds calorieGoal", () => {
    render(
      <TabHeadline
        tab="nutrition"
        avgCalories={2300}
        calorieGoal={2000}
        proteinDaysLogged={6}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/300 over goal/)).toBeInTheDocument();
  });

  it("shows empty state when no calories logged", () => {
    render(
      <TabHeadline
        tab="nutrition"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/No food logged in this window/)).toBeInTheDocument();
  });

  it("shows 30-day window reference", () => {
    render(
      <TabHeadline
        tab="nutrition"
        avgCalories={1900}
        calorieGoal={2000}
        proteinDaysLogged={22}
        windowDays={30}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/22\/30 days logging protein/)).toBeInTheDocument();
  });
});

describe("TabHeadline - Body", () => {
  it("shows weight and delta when measurements exist", () => {
    render(
      <TabHeadline
        tab="body"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={72.3}
        weightDeltaKg={-2.1}
        measurementCount={5}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/72.3 kg/)).toBeInTheDocument();
    expect(screen.getByText(/2.1 kg/)).toBeInTheDocument();
    expect(screen.getByText(/down/)).toBeInTheDocument();
  });

  it("shows 'up' for positive weight delta", () => {
    render(
      <TabHeadline
        tab="body"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={80}
        weightDeltaKg={3.5}
        measurementCount={3}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/up/)).toBeInTheDocument();
    expect(screen.getByText(/3.5 kg/)).toBeInTheDocument();
  });

  it("shows empty state when no measurements", () => {
    render(
      <TabHeadline
        tab="body"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/Log your first body measurement/)).toBeInTheDocument();
  });

  it("prompts to log a second measurement when only one exists", () => {
    render(
      <TabHeadline
        tab="body"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={70.5}
        weightDeltaKg={null}
        measurementCount={1}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/70.5 kg/)).toBeInTheDocument();
    expect(screen.getByText(/log a second measurement/)).toBeInTheDocument();
  });

  it("shows 'unchanged' when weight delta is zero", () => {
    render(
      <TabHeadline
        tab="body"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={68}
        weightDeltaKg={0}
        measurementCount={2}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/68 kg/)).toBeInTheDocument();
    expect(screen.getByText(/unchanged from first measurement/)).toBeInTheDocument();
  });
});

describe("TabHeadline - Activity", () => {
  it("shows burned kcal and activity count", () => {
    render(
      <TabHeadline
        tab="activity"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={2450}
        activityCount={6}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/2,450 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/6 activities/)).toBeInTheDocument();
  });

  it("uses singular 'activity' for count of 1", () => {
    render(
      <TabHeadline
        tab="activity"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={350}
        activityCount={1}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/1 activity/)).toBeInTheDocument();
    expect(screen.queryByText(/1 activities/)).not.toBeInTheDocument();
  });

  it("shows empty state when no activities", () => {
    render(
      <TabHeadline
        tab="activity"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/Log activities on the Dashboard/)).toBeInTheDocument();
  });
});

describe("TabHeadline - Plates", () => {
  it("shows collected and remaining counts", () => {
    render(
      <TabHeadline
        tab="plates"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={12}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/12 of 24/)).toBeInTheDocument();
    expect(screen.getByText(/12 still in the field/)).toBeInTheDocument();
  });

  it("shows completion message when all plates earned", () => {
    render(
      <TabHeadline
        tab="plates"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={24}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/All 24 specimens collected/)).toBeInTheDocument();
  });

  it("shows 0 earned gracefully", () => {
    render(
      <TabHeadline
        tab="plates"
        avgCalories={0}
        calorieGoal={2000}
        proteinDaysLogged={0}
        windowDays={7}
        latestWeightKg={null}
        weightDeltaKg={null}
        measurementCount={0}
        totalBurnedKcal={0}
        activityCount={0}
        platesEarned={0}
        platesTotal={24}
      />,
    );
    expect(screen.getByText(/0 of 24/)).toBeInTheDocument();
    expect(screen.getByText(/24 still in the field/)).toBeInTheDocument();
  });
});
