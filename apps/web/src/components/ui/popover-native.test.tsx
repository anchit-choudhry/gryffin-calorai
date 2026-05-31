import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PopoverNative } from "./popover-native";

describe("PopoverNative", () => {
  it("renders trigger and content", () => {
    render(
      <PopoverNative trigger={(id) => <button popoverTarget={id}>Open</button>}>
        <p>Popover content</p>
      </PopoverNative>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByText("Popover content")).toBeInTheDocument();
  });

  it("trigger receives a stable string id", () => {
    let capturedId = "";
    render(
      <PopoverNative
        trigger={(id) => {
          capturedId = id;
          return <button popoverTarget={id}>Trigger</button>;
        }}
      >
        <span>Content</span>
      </PopoverNative>,
    );
    expect(capturedId).toBeTruthy();
    expect(typeof capturedId).toBe("string");
  });

  it("content container has border and bg classes", () => {
    const { container } = render(
      <PopoverNative trigger={(id) => <button popoverTarget={id}>T</button>}>
        <span>C</span>
      </PopoverNative>,
    );
    const popoverEl = container.querySelector("[popover]");
    expect(popoverEl).not.toBeNull();
    expect(popoverEl?.className).toContain("border-rule");
    expect(popoverEl?.className).toContain("bg-paper");
  });

  it("accepts custom className on content", () => {
    const { container } = render(
      <PopoverNative
        trigger={(id) => <button popoverTarget={id}>T</button>}
        className="my-custom-class"
      >
        <span>C</span>
      </PopoverNative>,
    );
    const popoverEl = container.querySelector("[popover]");
    expect(popoverEl?.className).toContain("my-custom-class");
  });
});
