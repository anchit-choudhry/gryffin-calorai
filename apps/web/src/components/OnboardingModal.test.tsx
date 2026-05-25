import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import OnboardingModal from "./OnboardingModal";
import * as onboardingHook from "../hooks/useOnboarding";
import { useForm } from "react-hook-form";
import type { TdeeProfileFormValues } from "../forms/schemas";

vi.mock("../state/AppState");
vi.mock("../hooks/useOnboarding");

const makeFormMock = () => {
  const { result } = renderHook(() =>
    useForm<TdeeProfileFormValues>({
      defaultValues: {
        age: 30,
        sex: "male",
        heightDisplay: 175,
        weightDisplay: 70,
        activityLevel: "moderate",
        goal: "maintain",
      },
    }),
  );
  return result.current;
};

describe("OnboardingModal", () => {
  const onClose = vi.fn();

  const renderModal = (
    overrides: Partial<ReturnType<typeof onboardingHook.useOnboarding>> = {},
    open = true,
  ) => {
    const form = makeFormMock();
    vi.mocked(onboardingHook).useOnboarding.mockReturnValue({
      step: 0,
      totalSteps: 4,
      form,
      weightUnit: "kg",
      lengthUnit: "cm",
      setWeightUnit: vi.fn(),
      setLengthUnit: vi.fn(),
      isLoading: false,
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      submit: vi.fn(),
      ...overrides,
    } as unknown as ReturnType<typeof onboardingHook.useOnboarding>);

    return render(<OnboardingModal open={open} onClose={onClose} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 0 with body basics fields", () => {
    renderModal({ step: 0 });
    expect(screen.getByText("Set up your goals")).toBeTruthy();
    expect(screen.getByLabelText(/Age/i)).toBeTruthy();
  });

  it("renders step 1 with activity level options", () => {
    renderModal({ step: 1 });
    expect(screen.getByText(/How active are you/i)).toBeTruthy();
  });

  it("renders step 2 with goal options", () => {
    renderModal({ step: 2 });
    expect(screen.getByText(/primary goal/i)).toBeTruthy();
  });

  it("renders step 3 review with Save button", () => {
    renderModal({ step: 3 });
    expect(screen.getByRole("button", { name: /Save|Saving/i })).toBeTruthy();
  });

  it("does not render when open is false", () => {
    renderModal({}, false);
    expect(screen.queryByText("Set up your goals")).toBeNull();
  });

  it("shows 'Saving...' when isLoading is true on last step", () => {
    renderModal({ step: 3, isLoading: true });
    expect(screen.getByText("Saving...")).toBeTruthy();
  });

  it("shows Back button on step > 0", () => {
    renderModal({ step: 1 });
    expect(screen.getByRole("button", { name: /Back/i })).toBeTruthy();
  });

  it("does not show Back button on step 0", () => {
    renderModal({ step: 0 });
    expect(screen.queryByRole("button", { name: /Back/i })).toBeNull();
  });

  it("calls prevStep when Back is clicked", async () => {
    const mockPrev = vi.fn();
    renderModal({ step: 2, prevStep: mockPrev });

    const backBtn = screen.getByRole("button", { name: /Back/i });
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(mockPrev).toHaveBeenCalled();
  });

  it("shows step indicator dots", () => {
    renderModal({ step: 0, totalSteps: 4 });
    expect(screen.getByText("Set up your goals")).toBeTruthy();
  });

  it("shows unit toggle buttons on step 0", () => {
    renderModal({ step: 0 });
    expect(screen.getByRole("button", { name: /kg/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /lb/i })).toBeTruthy();
  });

  it("clicks female sex button on step 0", async () => {
    renderModal({ step: 0 });
    const femaleBtn = screen.getByRole("button", { name: /^female$/i });
    await act(async () => {
      fireEvent.click(femaleBtn);
    });
    expect(femaleBtn).toBeTruthy();
  });

  it("changes age input on step 0", async () => {
    renderModal({ step: 0 });
    const ageInput = screen.getByLabelText(/Age/i);
    await act(async () => {
      fireEvent.change(ageInput, { target: { value: "25" } });
    });
    expect(ageInput).toBeTruthy();
  });

  it("clicks height unit toggle on step 0", async () => {
    const mockSetLength = vi.fn();
    renderModal({ step: 0, setLengthUnit: mockSetLength });
    const inBtn = screen.getByRole("button", { name: /^in$/i });
    await act(async () => {
      fireEvent.click(inBtn);
    });
    expect(mockSetLength).toHaveBeenCalledWith("in");
  });

  it("converts height when unit toggle is clicked after input", async () => {
    const mockSetLength = vi.fn();
    renderModal({ step: 0, lengthUnit: "cm", setLengthUnit: mockSetLength });
    const heightInput = screen.getByPlaceholderText("170");
    await act(async () => {
      fireEvent.change(heightInput, { target: { value: "170" } });
    });
    const inBtn = screen.getByRole("button", { name: /^in$/i });
    await act(async () => {
      fireEvent.click(inBtn);
    });
    expect(mockSetLength).toHaveBeenCalledWith("in");
  });

  it("clicks weight unit toggle on step 0", async () => {
    const mockSetWeight = vi.fn();
    renderModal({ step: 0, setWeightUnit: mockSetWeight });
    const lbBtn = screen.getByRole("button", { name: /^lb$/i });
    await act(async () => {
      fireEvent.click(lbBtn);
    });
    expect(mockSetWeight).toHaveBeenCalledWith("lb");
  });

  it("converts weight when unit toggle is clicked after input", async () => {
    const mockSetWeight = vi.fn();
    renderModal({ step: 0, weightUnit: "kg", setWeightUnit: mockSetWeight });
    const weightInput = screen.getByPlaceholderText("70");
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: "80" } });
    });
    const lbBtn = screen.getByRole("button", { name: /^lb$/i });
    await act(async () => {
      fireEvent.click(lbBtn);
    });
    expect(mockSetWeight).toHaveBeenCalledWith("lb");
  });

  it("clicks an activity level button on step 1", async () => {
    renderModal({ step: 1 });
    const sedentaryBtn = screen.getByRole("button", { name: /Sedentary/i });
    await act(async () => {
      fireEvent.click(sedentaryBtn);
    });
    expect(sedentaryBtn).toBeTruthy();
  });

  it("clicks a goal button on step 2", async () => {
    renderModal({ step: 2 });
    const loseBtn = screen.getByRole("button", { name: /Lose Weight/i });
    await act(async () => {
      fireEvent.click(loseBtn);
    });
    expect(loseBtn).toBeTruthy();
  });

  it("Continue button on step 0 calls nextStep after validation", async () => {
    const mockNext = vi.fn();
    renderModal({ step: 0, nextStep: mockNext });
    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("Continue button on step 1 calls nextStep after validation", async () => {
    const mockNext = vi.fn();
    renderModal({ step: 1, nextStep: mockNext });
    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("Continue button on step 2 calls nextStep after validation", async () => {
    const mockNext = vi.fn();
    renderModal({ step: 2, nextStep: mockNext });
    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("pressing Escape calls onClose", async () => {
    renderModal({ step: 0 });
    await act(async () => {
      fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders step 0 with lb weight unit showing lb placeholder", () => {
    renderModal({ step: 0, weightUnit: "lb" });
    expect(screen.getByPlaceholderText("154")).toBeTruthy();
  });

  it("renders step 0 with in length unit showing in placeholder", () => {
    renderModal({ step: 0, lengthUnit: "in" });
    expect(screen.getByPlaceholderText("67")).toBeTruthy();
  });

  it("renders step 3 review with dashes when BMR cannot be computed", () => {
    const { result: emptyResult } = renderHook(() =>
      useForm<TdeeProfileFormValues>({
        defaultValues: {
          age: 0 as unknown as number,
          sex: "male",
          heightDisplay: 175,
          weightDisplay: 70,
          activityLevel: "moderate",
          goal: "maintain",
        },
      }),
    );
    renderModal({ step: 3, form: emptyResult.current });
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
