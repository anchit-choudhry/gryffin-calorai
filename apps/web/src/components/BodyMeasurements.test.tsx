import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BodyMeasurements from "./BodyMeasurements";
import * as appState from "../state/AppState";
import * as bodyFormHook from "../hooks/useBodyForm";
import type { BodyMeasurement } from "../db/dbService";
import { BodyMeasurementId, ISODate, UserId } from "@/types";

vi.mock("../state/AppState");
vi.mock("../hooks/useBodyForm");
vi.mock("sonner");
vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({ render }: { render: (p: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({ field: { value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() } }),
  FormItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));
vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
}));

const makeMeasurement = (overrides: Partial<BodyMeasurement> = {}): BodyMeasurement => ({
  id: BodyMeasurementId(1),
  userId: UserId("test-user"),
  measuredAt: ISODate("2026-05-01"),
  weight: 70,
  ...overrides,
});

const defaultFormReturn = () => ({
  form: {
    register: vi.fn(() => ({})),
    getValues: vi.fn(),
    setValue: vi.fn(),
    handleSubmit: vi.fn(),
    control: {},
    formState: { errors: {}, isSubmitting: false },
    reset: vi.fn(),
    clearErrors: vi.fn(),
  } as unknown as ReturnType<typeof bodyFormHook.useBodyForm>["form"],
  weightUnit: "kg" as const,
  setWeightUnit: vi.fn(),
  lengthUnit: "cm" as const,
  setLengthUnit: vi.fn(),
  isLoading: false,
  submitMeasurement: vi.fn().mockResolvedValue(true),
});

describe("BodyMeasurements component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [],
      deleteBodyMeasurement: vi.fn().mockResolvedValue(undefined),
      updateBodyMeasurement: vi.fn(),
      addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    vi.mocked(bodyFormHook).useBodyForm.mockReturnValue(defaultFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports BodyMeasurements as a function component", async () => {
    const { default: BodyMeasurementsModule } = await import("./BodyMeasurements");
    expect(typeof BodyMeasurementsModule).toBe("function");
  });

  it("renders empty state when no measurements logged", () => {
    render(<BodyMeasurements />);
    expect(screen.getByText(/No measurements logged yet/i)).toBeTruthy();
  });

  it("renders unit toggle tabs", () => {
    render(<BodyMeasurements />);
    expect(screen.getByText("kg")).toBeTruthy();
    expect(screen.getByText("lb")).toBeTruthy();
    expect(screen.getByText("cm")).toBeTruthy();
    expect(screen.getByText("in")).toBeTruthy();
  });

  it("renders Log Measurement button", () => {
    render(<BodyMeasurements />);
    expect(screen.getByText(/Log Measurement/i)).toBeTruthy();
  });

  it("renders measurement table headers when measurements exist", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement()],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText("Date")).toBeTruthy();
    expect(screen.getByText("Body Fat")).toBeTruthy();
    expect(screen.getByText("Waist")).toBeTruthy();
  });

  it("renders measurement rows in the table", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 72, bodyFat: 18 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText("2026-05-01")).toBeTruthy();
    expect(screen.getByText("18%")).toBeTruthy();
  });

  it("shows weight in kg by default", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 72 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText("72 kg")).toBeTruthy();
  });

  it("shows '-' for missing optional fields", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 70, bodyFat: undefined })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows edit button for each measurement row", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [
        makeMeasurement(),
        makeMeasurement({ id: BodyMeasurementId(2), measuredAt: ISODate("2026-05-02") }),
      ],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    const editButtons = screen.getAllByLabelText(/Edit measurement/i);
    expect(editButtons).toHaveLength(2);
  });

  it("calls deleteBodyMeasurement immediately when delete button is clicked", () => {
    const deleteMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement()],
      deleteBodyMeasurement: deleteMock,
      updateBodyMeasurement: vi.fn(),
      addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    fireEvent.click(screen.getByLabelText(/Delete measurement/i));
    expect(deleteMock).toHaveBeenCalledWith(BodyMeasurementId(1));
  });

  it("shows a toast after deleting a measurement", async () => {
    const { toast } = await import("sonner");
    const deleteMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement()],
      deleteBodyMeasurement: deleteMock,
      updateBodyMeasurement: vi.fn(),
      addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    fireEvent.click(screen.getByLabelText(/Delete measurement/i));
    expect(vi.mocked(toast)).toHaveBeenCalled();
  });

  it("renders weight chart when 2 or more weight measurements exist", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [
        makeMeasurement({
          id: BodyMeasurementId(1),
          measuredAt: ISODate("2026-04-01"),
          weight: 70,
        }),
        makeMeasurement({
          id: BodyMeasurementId(2),
          measuredAt: ISODate("2026-05-01"),
          weight: 71,
        }),
      ],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText(/Weight Trend/i)).toBeTruthy();
  });

  it("does not render weight chart with fewer than 2 weight entries", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 70 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.queryByText(/Weight Trend/i)).toBeNull();
  });

  it("renders body fat chart when 2 or more body fat measurements exist", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [
        makeMeasurement({
          id: BodyMeasurementId(1),
          measuredAt: ISODate("2026-04-01"),
          weight: 70,
          bodyFat: 18,
        }),
        makeMeasurement({
          id: BodyMeasurementId(2),
          measuredAt: ISODate("2026-05-01"),
          weight: 71,
          bodyFat: 17,
        }),
      ],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText(/Body Fat Trend/i)).toBeTruthy();
  });

  it("does not render body fat chart with fewer than 2 body fat entries", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ bodyFat: 18 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.queryByText(/Body Fat Trend/i)).toBeNull();
  });

  it("delete button does not show a Cancel confirmation button", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement()],
      deleteBodyMeasurement: vi.fn().mockResolvedValue(undefined),
      updateBodyMeasurement: vi.fn(),
      addBodyMeasurement: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    // New pattern: no confirmation step - no Cancel button in the UI
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("opens edit dialog when edit button is clicked", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 70, bodyFat: 18 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    const editBtn = screen.getByLabelText(/Edit measurement/i);
    fireEvent.click(editBtn);
    expect(screen.getByText(/Edit Measurement/i)).toBeTruthy();
  });

  it("shows waist value in cm for a measurement", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [makeMeasurement({ weight: 70, waist: 82, chest: 98, hips: 92 })],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText("82 cm")).toBeTruthy();
    expect(screen.getByText("98 cm")).toBeTruthy();
    expect(screen.getByText("92 cm")).toBeTruthy();
  });

  it("renders multiple measurement rows when multiple measurements exist", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      bodyMeasurements: [
        makeMeasurement({
          id: BodyMeasurementId(1),
          measuredAt: ISODate("2026-04-01"),
          weight: 70,
        }),
        makeMeasurement({
          id: BodyMeasurementId(2),
          measuredAt: ISODate("2026-05-01"),
          weight: 71,
        }),
        makeMeasurement({
          id: BodyMeasurementId(3),
          measuredAt: ISODate("2026-05-15"),
          weight: 72,
        }),
      ],
      deleteBodyMeasurement: vi.fn(),
      updateBodyMeasurement: vi.fn(),
    } as unknown as ReturnType<typeof appState.useAppState>);

    render(<BodyMeasurements />);
    expect(screen.getByText("72 kg")).toBeTruthy();
    expect(screen.getByText("71 kg")).toBeTruthy();
    expect(screen.getByText("70 kg")).toBeTruthy();
  });
});
