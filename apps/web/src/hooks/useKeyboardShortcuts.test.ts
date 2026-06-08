import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const makeHandlers = () => ({
  onFocusLogger: vi.fn(),
  onAddWater: vi.fn(),
  onAddStep: vi.fn(),
  onOpenBarcode: vi.fn(),
  onFocusRecipeSearch: vi.fn(),
  onToggleHelp: vi.fn(),
  onToggleDark: vi.fn(),
  onNavigate: vi.fn(),
  onOpenQuickAdd: vi.fn(),
  onOpenCommandPalette: vi.fn(),
});

const fire = (key: string, opts: Partial<KeyboardEventInit> = {}, target?: EventTarget) => {
  const el = target ?? window;
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
};

describe("useKeyboardShortcuts", () => {
  describe("single-key shortcuts (no modifiers, not in an input)", () => {
    it("l calls onFocusLogger", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("l");
      expect(h.onFocusLogger).toHaveBeenCalledOnce();
    });

    it("w calls onAddWater", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("w");
      expect(h.onAddWater).toHaveBeenCalledOnce();
    });

    it("s calls onAddStep", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("s");
      expect(h.onAddStep).toHaveBeenCalledOnce();
    });

    it("b calls onOpenBarcode", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("b");
      expect(h.onOpenBarcode).toHaveBeenCalledOnce();
    });

    it("/ calls onFocusRecipeSearch", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("/");
      expect(h.onFocusRecipeSearch).toHaveBeenCalledOnce();
    });

    it("? calls onToggleHelp", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("?");
      expect(h.onToggleHelp).toHaveBeenCalledOnce();
    });

    it("d calls onToggleDark (without prior g press)", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("d");
      expect(h.onToggleDark).toHaveBeenCalledOnce();
      expect(h.onNavigate).not.toHaveBeenCalled();
    });
  });

  describe("g+x navigation sequence", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("g then d within 800ms calls onNavigate('dashboard')", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("g");
      fire("d");
      expect(h.onNavigate).toHaveBeenCalledWith("dashboard");
      expect(h.onToggleDark).not.toHaveBeenCalled();
    });

    it("g then r within 800ms calls onNavigate('recipes')", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("g");
      fire("r");
      expect(h.onNavigate).toHaveBeenCalledWith("recipes");
    });

    it("g then p within 800ms calls onNavigate('progress')", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("g");
      fire("p");
      expect(h.onNavigate).toHaveBeenCalledWith("progress");
    });

    it("g then d after 800ms does NOT navigate (timer expired)", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("g");
      vi.advanceTimersByTime(801);
      fire("d");
      expect(h.onNavigate).not.toHaveBeenCalled();
      expect(h.onToggleDark).toHaveBeenCalledOnce();
    });
  });

  describe("blocked when focus is inside a form control", () => {
    it("ignores l when target is an INPUT", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
      expect(h.onFocusLogger).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it("ignores w when target is a TEXTAREA", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      const ta = document.createElement("textarea");
      document.body.appendChild(ta);
      ta.dispatchEvent(new KeyboardEvent("keydown", { key: "w", bubbles: true }));
      expect(h.onAddWater).not.toHaveBeenCalled();
      document.body.removeChild(ta);
    });

    it("ignores b when target has contentEditable", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      const div = document.createElement("div");
      div.contentEditable = "true";
      document.body.appendChild(div);
      div.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
      expect(h.onOpenBarcode).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });
  });

  describe("Cmd/Ctrl-K opens command palette", () => {
    it("metaKey+K calls onOpenCommandPalette", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("k", { metaKey: true });
      expect(h.onOpenCommandPalette).toHaveBeenCalledOnce();
    });

    it("ctrlKey+K calls onOpenCommandPalette", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("k", { ctrlKey: true });
      expect(h.onOpenCommandPalette).toHaveBeenCalledOnce();
    });

    it("metaKey+K does not trigger other handlers", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("k", { metaKey: true });
      expect(h.onFocusLogger).not.toHaveBeenCalled();
      expect(h.onToggleDark).not.toHaveBeenCalled();
    });

    it("metaKey+K works even when focus is inside an input", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
      expect(h.onOpenCommandPalette).toHaveBeenCalledOnce();
      document.body.removeChild(input);
    });
  });

  describe("blocked when modifier keys are held", () => {
    it("ignores l when metaKey is held", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("l", { metaKey: true });
      expect(h.onFocusLogger).not.toHaveBeenCalled();
    });

    it("ignores l when ctrlKey is held", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("l", { ctrlKey: true });
      expect(h.onFocusLogger).not.toHaveBeenCalled();
    });

    it("ignores l when altKey is held", () => {
      const h = makeHandlers();
      renderHook(() => useKeyboardShortcuts(h));
      fire("l", { altKey: true });
      expect(h.onFocusLogger).not.toHaveBeenCalled();
    });
  });

  describe("cleanup on unmount", () => {
    it("removes the keydown listener on unmount", () => {
      const h = makeHandlers();
      const { unmount } = renderHook(() => useKeyboardShortcuts(h));
      unmount();
      fire("l");
      expect(h.onFocusLogger).not.toHaveBeenCalled();
    });

    it("clears the g-timer on unmount (no leaking setTimeouts)", () => {
      vi.useFakeTimers();
      const h = makeHandlers();
      const { unmount } = renderHook(() => useKeyboardShortcuts(h));
      fire("g");
      expect(vi.getTimerCount()).toBe(1);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
    });
  });
});
