import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDietProfile } from "./useDietProfile";
import * as appState from "../state/AppState";

vi.mock("../state/AppState");

const baseMock = {
  dietProfile: null,
  saveDietProfile: vi.fn(),
};

describe("useDietProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appState).useAppState.mockReturnValue(
      baseMock as unknown as ReturnType<typeof appState.useAppState>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns form and onSubmit", () => {
    const { result } = renderHook(() => useDietProfile());
    expect(result.current.form).toBeDefined();
    expect(typeof result.current.onSubmit).toBe("function");
  });

  it("defaults preset to generic when no profile exists", () => {
    const { result } = renderHook(() => useDietProfile());
    expect(result.current.form.getValues("preset")).toBe("generic");
  });

  it("defaults restrictions to empty array", () => {
    const { result } = renderHook(() => useDietProfile());
    expect(result.current.form.getValues("restrictions")).toStrictEqual([]);
  });

  it("uses existing profile values as defaults", () => {
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      dietProfile: { preset: "keto", restrictions: ["gluten", "dairy"] },
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDietProfile());
    expect(result.current.form.getValues("preset")).toBe("keto");
    expect(result.current.form.getValues("restrictions")).toStrictEqual(["gluten", "dairy"]);
  });

  it("calls saveDietProfile with preset and restrictions on submit", async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      saveDietProfile: mockSave,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDietProfile());

    await act(async () => {
      result.current.form.setValue("preset", "vegan", { shouldDirty: true });
      result.current.form.setValue("restrictions", ["gluten"], { shouldDirty: true });
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockSave).toHaveBeenCalledWith("vegan", ["gluten"]);
  });

  it("exposes dietProfile from state", () => {
    const profile = { preset: "paleo", restrictions: [] };
    vi.mocked(appState).useAppState.mockReturnValue({
      ...baseMock,
      dietProfile: profile,
    } as unknown as ReturnType<typeof appState.useAppState>);

    const { result } = renderHook(() => useDietProfile());
    expect(result.current.dietProfile).toStrictEqual(profile);
  });
});
