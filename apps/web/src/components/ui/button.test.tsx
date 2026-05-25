import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button-variants";
import { cn } from "@/lib/utils";

describe("buttonVariants base", () => {
  it("includes active:scale-[0.97] for press feedback", () => {
    expect(buttonVariants()).toContain("active:scale-[0.97]");
  });
});

describe("buttonVariants persimmon", () => {
  it("includes rounded-none for editorial sharpness", () => {
    expect(buttonVariants({ variant: "persimmon" })).toContain("rounded-none");
  });

  it("resolves rounded-none as winner over base rounded-md via cn", () => {
    const resolved = cn(buttonVariants({ variant: "persimmon" }));
    expect(resolved).toContain("rounded-none");
    expect(resolved).not.toContain("rounded-md");
  });

  it("includes active:brightness-[0.88] for stronger press feedback", () => {
    expect(buttonVariants({ variant: "persimmon" })).toContain("active:brightness-[0.88]");
  });
});
