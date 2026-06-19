import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonalOrnament } from "./SeasonalOrnament";

describe("SeasonalOrnament", () => {
  it("renders SpringBlossom for a spring date", () => {
    const { container } = render(<SeasonalOrnament date={new Date("2026-04-15")} />);
    expect(container.querySelector('[data-testid="spring-blossom"]')).toBeTruthy();
  });

  it("renders WheatSprig for a summer date", () => {
    const { container } = render(<SeasonalOrnament date={new Date("2026-07-04")} />);
    expect(container.querySelector('[viewBox="0 0 48 80"]')).toBeTruthy();
  });

  it("renders SeasonalFlourish for a fall date", () => {
    const { container } = render(<SeasonalOrnament date={new Date("2026-10-10")} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("renders WinterBranch for a winter date", () => {
    const { container } = render(<SeasonalOrnament date={new Date("2026-01-15")} />);
    expect(container.querySelector('[data-testid="winter-branch"]')).toBeTruthy();
  });

  it("renders SeasonalFlourish on the summer solstice (transition override)", () => {
    const { container } = render(<SeasonalOrnament date={new Date("2026-06-21")} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("forwards className to the rendered icon", () => {
    const { container } = render(
      <SeasonalOrnament date={new Date("2026-04-15")} className="test-cls" />,
    );
    expect(container.firstChild).toHaveClass("test-cls");
  });

  it("renders SeasonalFlourish during the autumn transition window (Sep 20)", () => {
    // Use local Date constructor to avoid UTC midnight timezone offset issues
    const { container } = render(<SeasonalOrnament date={new Date(2026, 8, 20)} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("renders SeasonalFlourish during the winter transition window (Dec 20)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 11, 20)} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("renders SeasonalFlourish during the spring transition window (Mar 20)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 2, 20)} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("renders SpringBlossom on Mar 25 (first post-spring-transition day)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 2, 25)} />);
    expect(container.querySelector('[data-testid="spring-blossom"]')).toBeTruthy();
  });

  it("renders WheatSprig on Jun 26 (first post-summer-transition day)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 5, 26)} />);
    expect(container.querySelector('[viewBox="0 0 48 80"]')).toBeTruthy();
  });

  it("renders SeasonalFlourish on Sep 27 (first post-autumn-transition day)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 8, 27)} />);
    expect(container.querySelector('[viewBox="0 0 120 24"]')).toBeTruthy();
  });

  it("renders WinterBranch on Dec 26 (first post-winter-transition day)", () => {
    const { container } = render(<SeasonalOrnament date={new Date(2026, 11, 26)} />);
    expect(container.querySelector('[data-testid="winter-branch"]')).toBeTruthy();
  });
});
