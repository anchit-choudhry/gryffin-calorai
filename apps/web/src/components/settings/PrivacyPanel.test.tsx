import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PrivacyPanel } from "./PrivacyPanel";

vi.mock("@/db/dbService", () => ({
  db: { delete: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import { db } from "@/db/dbService";
import { toast } from "sonner";

const mockDb = db as unknown as { delete: ReturnType<typeof vi.fn> };
const mockToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

describe("PrivacyPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("location", { ...window.location, reload: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders data category table with all 7 categories", () => {
    render(<PrivacyPanel />);
    expect(screen.getByText("Food log entries")).toBeTruthy();
    expect(screen.getByText("Recipes")).toBeTruthy();
    expect(screen.getByText("Body measurements")).toBeTruthy();
    expect(screen.getByText("Water logs")).toBeTruthy();
    expect(screen.getByText("Step & activity logs")).toBeTruthy();
    expect(screen.getByText("Fasting sessions")).toBeTruthy();
    expect(screen.getByText("Settings & profile")).toBeTruthy();
  });

  it("renders privacy explanation with Shield icon context", () => {
    render(<PrivacyPanel />);
    expect(screen.getByText(/only on this device/)).toBeTruthy();
    expect(screen.getByText(/IndexedDB/)).toBeTruthy();
    expect(screen.getByText(/Cloud Sync/)).toBeTruthy();
  });

  it("shows initial 'Clear all data' button state", () => {
    render(<PrivacyPanel />);
    expect(screen.getByRole("button", { name: /clear all data/i })).toBeTruthy();
    expect(screen.queryByText(/Confirm - delete everything/)).toBeNull();
    expect(screen.queryByText(/All data will be permanently deleted/)).toBeNull();
  });

  it("first click transitions to confirm state showing warning", () => {
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    expect(screen.getByText(/All data will be permanently deleted/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /confirm - delete everything/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
  });

  it("cancel button resets back to initial state", () => {
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/All data will be permanently deleted/)).toBeNull();
    expect(screen.getByRole("button", { name: /clear all data/i })).toBeTruthy();
  });

  it("second click calls db.delete and shows success toast", async () => {
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirm - delete everything/i }));
    });
    expect(mockDb.delete).toHaveBeenCalledOnce();
    expect(mockToast.success).toHaveBeenCalledWith("All local data cleared. Reloading...");
  });

  it("reloads page after 1200ms on successful clear", async () => {
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirm - delete everything/i }));
    });
    expect(window.location.reload).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it("shows error toast and resets state when db.delete throws", async () => {
    mockDb.delete.mockRejectedValueOnce(new Error("IndexedDB error"));
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirm - delete everything/i }));
    });
    expect(mockToast.error).toHaveBeenCalledWith("Failed to clear data - try again");
    expect(screen.getByRole("button", { name: /clear all data/i })).toBeTruthy();
  });

  it("disables clear button while clearing is in progress", async () => {
    let resolveClear!: () => void;
    mockDb.delete.mockReturnValueOnce(
      new Promise<void>((r) => {
        resolveClear = r;
      }),
    );
    render(<PrivacyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /clear all data/i }));
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /confirm - delete everything/i }));
    });
    expect(screen.getByRole("button", { name: /clearing/i })).toHaveProperty("disabled", true);
    await act(async () => {
      resolveClear();
    });
  });

  it("renders 'Stored locally' section header", () => {
    render(<PrivacyPanel />);
    expect(screen.getByText(/stored locally/i)).toBeTruthy();
  });

  it("renders 'Clear all local data' section header", () => {
    render(<PrivacyPanel />);
    expect(screen.getByText(/clear all local data/i)).toBeTruthy();
  });
});
