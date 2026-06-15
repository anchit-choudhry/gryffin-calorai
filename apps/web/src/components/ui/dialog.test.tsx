import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog UI components", () => {
  it("DialogTrigger renders a trigger element", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Open Dialog")).toBeTruthy();
  });

  it("DialogTrigger opens dialog on click", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Opened Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText("Opened Title")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByText("Open"));
    });
    await waitFor(() => {
      expect(screen.getByText("Opened Title")).toBeTruthy();
    });
  });

  it("DialogContent shows children when open", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <p>Dialog body text</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Dialog body text")).toBeTruthy();
  });

  it("DialogContent hides children when not open", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText("Hidden Title")).toBeNull();
  });

  it("DialogContent with showCloseButton=false hides the X button", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: /^Close$/i })).toBeNull();
  });

  it("DialogClose renders inside dialog content", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Custom Close")).toBeTruthy();
  });

  it("DialogHeader renders its children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Header Title")).toBeTruthy();
  });

  it("DialogFooter renders children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>
            <button>Action Button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Action Button")).toBeTruthy();
  });

  it("DialogFooter with showCloseButton renders a Close button", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter showCloseButton>
            <span>Footer</span>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: /Close/i })).toBeTruthy();
  });

  it("DialogDescription renders descriptive text", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Descriptive text content</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Descriptive text content")).toBeTruthy();
  });

  it("DialogContent has editorial squared styling (rounded-none, no shadow)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const content = document.querySelector("[data-slot='dialog-content']");
    expect(content?.className).toContain("rounded-none");
    expect(content?.className).toContain("shadow-none");
    expect(content?.className).toContain("bg-paper");
  });

  it("DialogContent renders 4 RuleCorner ornaments", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const content = document.querySelector("[data-slot='dialog-content']");
    const svgs = content?.querySelectorAll("svg");
    expect(svgs?.length).toBeGreaterThanOrEqual(4);
  });

  it("DialogTitle renders with serif font class", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Serif Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const title = document.querySelector("[data-slot='dialog-title']");
    expect(title?.className).toContain("font-serif");
    expect(title?.className).toContain("font-light");
  });
});
