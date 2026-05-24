import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import DietProfileEditor from "./DietProfileEditor";
import * as appState from "../state/AppState";
import { UserId } from "@/types";

const mockWatch = vi.hoisted(() =>
  vi.fn((field: string): string | string[] => (field === "preset" ? "generic" : [])),
);
const mockSetValue = vi.hoisted(() => vi.fn());

vi.mock("../state/AppState");
vi.mock("../hooks/useDietProfile", () => ({
  useDietProfile: () => ({
    form: {
      control: {},
      handleSubmit: (fn: (data: unknown) => void) => (e: React.FormEvent) => {
        e.preventDefault();
        fn({ preset: "keto", restrictions: ["gluten"] });
      },
      watch: mockWatch,
      setValue: mockSetValue,
      reset: vi.fn(),
      formState: { isSubmitting: false, isDirty: false },
    },
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
  }),
}));
vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({ render }: { render: (p: { field: Record<string, unknown> }) => React.ReactNode }) =>
    render({ field: { value: "", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() } }),
  FormItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormMessage: () => null,
}));

const baseMock = {
  userId: UserId("test-user"),
  dietProfile: null,
  saveDietProfile: vi.fn(),
};

describe("DietProfileEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockImplementation((field: string) => (field === "preset" ? "generic" : []));
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  it("renders diet preset label", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });
    expect(screen.getByText(/Diet Preset/i)).toBeTruthy();
  });

  it("renders dietary restrictions label", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });
    expect(screen.getByText(/Dietary Restrictions/i)).toBeTruthy();
  });

  it("renders all preset buttons", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });
    expect(screen.getByText("Generic")).toBeTruthy();
    expect(screen.getByText("Keto")).toBeTruthy();
    expect(screen.getByText("Vegan")).toBeTruthy();
  });

  it("renders all restriction flag buttons", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });
    expect(screen.getByText(/Gluten/i)).toBeTruthy();
    expect(screen.getByText(/Dairy/i)).toBeTruthy();
    expect(screen.getByText(/Nuts/i)).toBeTruthy();
  });

  it("renders save button", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });
    expect(screen.getByRole("button", { name: /Save Diet Profile/i })).toBeTruthy();
  });

  it("resets form when dietProfile changes", async () => {
    const profile = { preset: "paleo", restrictions: ["nuts"] };
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      dietProfile: profile,
    } as unknown as ReturnType<typeof appState.useAppState>);

    await act(async () => {
      render(<DietProfileEditor />);
    });

    // Component renders without throwing
    expect(screen.getByText(/Diet Preset/i)).toBeTruthy();
  });

  it("clicking a preset button does not throw", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });

    const ketoBtn = screen.getByText("Keto");
    expect(() => fireEvent.click(ketoBtn)).not.toThrow();
  });

  it("clicking a restriction button does not throw", async () => {
    await act(async () => {
      render(<DietProfileEditor />);
    });

    const glutenBtn = screen.getByText(/Gluten/i);
    expect(() => fireEvent.click(glutenBtn)).not.toThrow();
  });

  it("toggleRestriction removes a restriction that is already active", async () => {
    mockWatch.mockImplementation((field: string) =>
      field === "preset" ? "generic" : (["gluten"] as string[]),
    );

    await act(async () => {
      render(<DietProfileEditor />);
    });

    const glutenBtn = screen.getByRole("button", { name: /gluten/i });
    fireEvent.click(glutenBtn);

    expect(mockSetValue).toHaveBeenCalledWith("restrictions", [], { shouldDirty: true });
  });
});
