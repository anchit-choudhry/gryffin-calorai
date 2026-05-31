import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs component", () => {
  it("renders Tabs wrapper", () => {
    const { container } = render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
  });

  it("renders TabsList", () => {
    const { container } = render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
  });

  it("renders TabsTrigger", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument();
  });

  it("renders TabsContent", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <Tabs className="custom-class">
        <TabsList className="list-class">
          <TabsTrigger value="tab1" className="trigger-class">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="content-class">
          Content
        </TabsContent>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs"]')).toHaveClass("custom-class");
  });

  it("supports vertical orientation", () => {
    const { container } = render(
      <Tabs orientation="vertical">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs"]')).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("TabsList supports variant prop", () => {
    const { container } = render(
      <Tabs>
        <TabsList variant="line">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(container.querySelector('[data-slot="tabs-list"]')).toHaveAttribute(
      "data-variant",
      "line",
    );
  });
});
