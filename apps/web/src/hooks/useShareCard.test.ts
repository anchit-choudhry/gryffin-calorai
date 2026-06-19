import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useShareCard } from "./useShareCard";

vi.mock("@/lib/shareCard", () => ({
  shareOrDownloadCard: vi.fn().mockResolvedValue(undefined),
}));

describe("useShareCard", () => {
  it("starts with sharing false", () => {
    const { result } = renderHook(() =>
      useShareCard(() => Promise.resolve(new Blob()), "test.png"),
    );
    expect(result.current.sharing).toBe(false);
  });

  it("sets sharing true during render, false after completion", async () => {
    let resolveBlob!: (b: Blob) => void;
    const deferredRender = new Promise<Blob>((r) => {
      resolveBlob = r;
    });
    const { result } = renderHook(() => useShareCard(() => deferredRender, "test.png"));

    act(() => {
      void result.current.handleShare();
    });
    expect(result.current.sharing).toBe(true);

    await act(async () => {
      resolveBlob(new Blob());
    });
    expect(result.current.sharing).toBe(false);
  });

  it("resets sharing to false when renderFn rejects", async () => {
    const { result } = renderHook(() =>
      useShareCard(() => Promise.reject(new Error("render failed")), "test.png"),
    );
    await act(async () => {
      await result.current.handleShare().catch(() => {});
    });
    expect(result.current.sharing).toBe(false);
  });

  it("calls shareOrDownloadCard with the resolved blob and filename", async () => {
    const { shareOrDownloadCard } = await import("@/lib/shareCard");
    const blob = new Blob(["data"], { type: "image/png" });
    const { result } = renderHook(() => useShareCard(() => Promise.resolve(blob), "streak.png"));
    await act(async () => {
      await result.current.handleShare();
    });
    expect(shareOrDownloadCard).toHaveBeenCalledWith(blob, "streak.png");
  });
});
