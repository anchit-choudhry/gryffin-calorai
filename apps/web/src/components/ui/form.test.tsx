import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useForm({
    defaultValues: { email: "", password: "" },
  });

  return (
    <Form {...form}>
      <form>{children}</form>
    </Form>
  );
}

function FormWithFieldWrapper() {
  const form = useForm({
    defaultValues: { email: "" },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("Form components", () => {
  it("renders Form with children", () => {
    render(
      <FormWrapper>
        <div>Form content</div>
      </FormWrapper>,
    );
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("renders FormField with control and FormLabel", () => {
    render(<FormWithFieldWrapper />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders FormItem with children", () => {
    render(
      <FormWrapper>
        <FormItem>
          <div>Item content</div>
        </FormItem>
      </FormWrapper>,
    );
    expect(screen.getByText("Item content")).toBeInTheDocument();
  });

  it("renders FormItem with data-slot attribute", () => {
    const { container } = render(
      <FormWrapper>
        <FormItem>Content</FormItem>
      </FormWrapper>,
    );
    expect(container.querySelector('[data-slot="form-item"]')).toBeInTheDocument();
  });

  it("FormItem applies custom className", () => {
    const { container } = render(
      <FormWrapper>
        <FormItem className="custom-class">Content</FormItem>
      </FormWrapper>,
    );
    const formItem = container.querySelector('[data-slot="form-item"]');
    expect(formItem?.className).toContain("custom-class");
  });

  it("renders FormControl with input child", () => {
    const { container } = render(
      <FormWrapper>
        <FormItem>
          <FormControl>
            <Input type="text" />
          </FormControl>
        </FormItem>
      </FormWrapper>,
    );
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("renders FormLabel and FormMessage in form context", () => {
    render(<FormWithFieldWrapper />);
    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("FormControl applies custom className", () => {
    const { container } = render(
      <FormWrapper>
        <FormItem>
          <FormControl className="control-class">
            <Input type="text" />
          </FormControl>
        </FormItem>
      </FormWrapper>,
    );
    const formControl = container.querySelector('[data-slot="form-control"]');
    expect(formControl?.className).toContain("control-class");
  });

  it("FormLabel has correct data-slot attribute", () => {
    const { container } = render(<FormWithFieldWrapper />);
    expect(container.querySelector('[data-slot="form-label"]')).toBeInTheDocument();
  });

  it("FormControl has data-slot and aria attributes", () => {
    const { container } = render(<FormWithFieldWrapper />);
    const formControl = container.querySelector('[data-slot="form-control"]');
    expect(formControl).toBeInTheDocument();
    expect(formControl).toHaveAttribute("aria-invalid");
  });
});
