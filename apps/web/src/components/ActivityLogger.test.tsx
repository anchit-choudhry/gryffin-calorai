import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import ActivityLogger from "./ActivityLogger";
import * as appState from "../state/AppState";
import * as activityFormHook from "../hooks/useActivityForm";
import { ActivityLogId, ISODate, UserId } from "@/types";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

vi.mock("sonner");
vi.mock("../state/AppState");
vi.mock("../hooks/useActivityForm");

const userId = UserId("test-user");

const makeFormMock = () => {
  const { result } = renderHook(() =>
    useForm({ defaultValues: { activityType: "", durationMin: undefined as number | undefined } }),
  );
  return result.current;
};

describe("ActivityLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyActivityLogs: [],
      deleteActivityLog: vi.fn(),
      addActivityLog: vi.fn(),
      userId,
    } as unknown as ReturnType<typeof appState.useAppState>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithForm = (
    overrides: Partial<ReturnType<typeof activityFormHook.useActivityForm>> = {},
  ) => {
    const form = makeFormMock();
    vi.mocked(activityFormHook).useActivityForm.mockReturnValue({
      form,
      isLoading: false,
      submitActivityLog: vi.fn(),
      weightKg: 70,
      hasProfile: false,
      ...overrides,
    } as unknown as ReturnType<typeof activityFormHook.useActivityForm>);
    return render(<ActivityLogger />);
  };

  it("renders the form with activity search and duration fields", () => {
    renderWithForm();
    expect(screen.getByPlaceholderText("Search activities...")).toBeTruthy();
    expect(screen.getByPlaceholderText("30")).toBeTruthy();
  });

  it("shows default weight note when hasProfile is false", () => {
    renderWithForm({ hasProfile: false });
    expect(screen.getByText(/Using 70 kg default/)).toBeTruthy();
  });

  it("does not show weight note when hasProfile is true", () => {
    renderWithForm({ hasProfile: true });
    expect(screen.queryByText(/Using 70 kg default/)).toBeNull();
  });

  it("shows 'Logging...' text when isLoading is true", () => {
    renderWithForm({ isLoading: true });
    expect(screen.getByText("Logging...")).toBeTruthy();
  });

  it("shows 'Log Activity' submit button when not loading", () => {
    renderWithForm();
    expect(screen.getByRole("button", { name: /Log Activity/i })).toBeTruthy();
  });

  it("shows activity list when dailyActivityLogs has entries", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyActivityLogs: [
        {
          id: ActivityLogId(1),
          userId,
          activityType: "Running (6 mph)",
          durationMin: 30,
          caloriesBurned: 360,
          dateLogged: ISODate("2026-05-20"),
          loggedAt: new Date().toISOString(),
        },
      ],
      deleteActivityLog: vi.fn(),
      addActivityLog: vi.fn(),
      userId,
    } as unknown as ReturnType<typeof appState.useAppState>);

    renderWithForm();

    expect(screen.getByText("Running (6 mph)")).toBeTruthy();
    expect(screen.getByText("360 kcal")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
  });

  it("does not render list section when dailyActivityLogs is empty", () => {
    renderWithForm();
    expect(screen.queryByText("Today")).toBeNull();
  });

  it("opens dropdown on focus and filters activities", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.click(input);
    });
    const listItems = screen.queryAllByRole("button");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("opens dropdown and filters activities on input change", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "run" } });
    });
    const listItems = screen.queryAllByRole("listitem");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("selects an activity from the dropdown via mousedown", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "run" } });
    });
    const dropdownBtns = screen
      .queryAllByRole("button")
      .filter((btn) => btn.closest("li") !== null);
    expect(dropdownBtns.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.mouseDown(dropdownBtns[0]!);
    });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("duration input onChange fires the field handler", async () => {
    renderWithForm();
    const durationInput = screen.getByPlaceholderText("30");
    await act(async () => {
      fireEvent.change(durationInput, { target: { value: "45" } });
    });
    expect(durationInput).toBeTruthy();
  });

  it("focusing duration input closes the activity dropdown", async () => {
    renderWithForm();
    const searchInput = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "run" } });
    });
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(0);
    const durationInput = screen.getByPlaceholderText("30");
    await act(async () => {
      fireEvent.focus(durationInput);
    });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("calls deleteActivityLog and shows undo toast on delete", async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyActivityLogs: [
        {
          id: ActivityLogId(1),
          userId,
          activityType: "Running (6 mph)",
          durationMin: 30,
          caloriesBurned: 360,
          dateLogged: ISODate("2026-05-20"),
          loggedAt: new Date().toISOString(),
        },
      ],
      deleteActivityLog: mockDelete,
      addActivityLog: vi.fn(),
      userId,
    } as unknown as ReturnType<typeof appState.useAppState>);

    renderWithForm();

    const deleteBtn = screen.getByLabelText("Remove Running (6 mph) entry");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(mockDelete).toHaveBeenCalledWith(ActivityLogId(1));
    expect(toast).toHaveBeenCalled();
  });

  it("undo action in toast calls addActivityLog with original entry values", async () => {
    const mockAdd = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      dailyActivityLogs: [
        {
          id: ActivityLogId(1),
          userId,
          activityType: "Running (6 mph)",
          durationMin: 30,
          caloriesBurned: 360,
          dateLogged: ISODate("2026-05-20"),
          loggedAt: new Date().toISOString(),
        },
      ],
      deleteActivityLog: vi.fn(),
      addActivityLog: mockAdd,
      userId,
    } as unknown as ReturnType<typeof appState.useAppState>);

    renderWithForm();

    const deleteBtn = screen.getByLabelText("Remove Running (6 mph) entry");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    const toastCall = vi.mocked(toast).mock.calls[0]!;
    const options = toastCall[1] as unknown as { action: { onClick: () => void } };
    await act(async () => {
      options.action.onClick();
    });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "Running (6 mph)" }),
    );
  });

  it("focusing search input opens the dropdown", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.focus(input);
    });
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("form submit event calls submitActivityLog", async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithForm({ submitActivityLog: mockSubmit });
    const formEl = document.querySelector("form")!;
    await act(async () => {
      fireEvent.submit(formEl);
    });
    expect(mockSubmit).toHaveBeenCalled();
  });

  it("shows no activities found when query matches nothing", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("Search activities...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "xyznonexistent99" } });
    });
    expect(screen.getByText("No activities found")).toBeTruthy();
  });
});
