import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DateKicker from "./DateKicker";
import { useAppState } from "@/state/AppState";
import { ISODate, todayISO, UserId } from "@/types";

const TODAY = new Date("2026-06-07T00:00:00");
const TODAY_ISO = ISODate("2026-06-07");
const TEST_USER = UserId("dk-test-user");

beforeEach(() => {
  useAppState.setState({ selectedDate: TODAY_ISO, userId: TEST_USER });
});

describe("DateKicker (non-interactive)", () => {
  it("renders the formatted date string vertically", () => {
    render(<DateKicker date={TODAY} />);
    expect(screen.getByText(/SUN · JUN 07 · 2026/)).toBeTruthy();
  });

  it("provides a full accessible label via aria-label", () => {
    render(<DateKicker date={TODAY} />);
    const container = screen.getByLabelText(/Sunday, June 7, 2026/i);
    expect(container).toBeTruthy();
  });

  it("does not render navigation buttons", () => {
    render(<DateKicker date={TODAY} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("DateKicker (interactive)", () => {
  it("renders Previous Day and Next Day buttons", () => {
    render(<DateKicker date={TODAY} interactive />);
    expect(screen.getByRole("button", { name: /previous day/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next day/i })).toBeTruthy();
  });

  it("Next Day button is disabled when viewing today", () => {
    useAppState.setState({ selectedDate: todayISO() });
    render(<DateKicker date={TODAY} interactive />);
    const nextBtn = screen.getByRole("button", { name: /next day/i });
    expect(nextBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("Previous Day button navigates to the previous date", async () => {
    useAppState.setState({ selectedDate: TODAY_ISO, userId: TEST_USER });
    render(<DateKicker date={TODAY} interactive />);
    fireEvent.click(screen.getByRole("button", { name: /previous day/i }));
    await waitFor(() => expect(useAppState.getState().selectedDate).toBe(ISODate("2026-06-06")));
  });

  it("Today button appears when not on today and navigates back", async () => {
    useAppState.setState({ selectedDate: ISODate("2026-01-01"), userId: TEST_USER });
    render(<DateKicker date={TODAY} interactive />);
    const todayBtn = screen.getByRole("button", { name: /return to today/i });
    expect(todayBtn).toBeTruthy();
    fireEvent.click(todayBtn);
    await waitFor(() => expect(useAppState.getState().selectedDate).toBe(todayISO()));
  });

  it("Today button does not appear when already on today", () => {
    useAppState.setState({ selectedDate: todayISO() });
    render(<DateKicker date={TODAY} interactive />);
    expect(screen.queryByRole("button", { name: /return to today/i })).toBeNull();
  });

  it("shows selected date display not today when date is different", () => {
    useAppState.setState({ selectedDate: ISODate("2026-01-15") });
    render(<DateKicker date={TODAY} interactive />);
    expect(screen.getByText(/JAN 15/)).toBeTruthy();
  });

  it("Next Day button navigates forward from a past date", async () => {
    useAppState.setState({ selectedDate: ISODate("2026-06-06"), userId: TEST_USER });
    render(<DateKicker date={TODAY} interactive />);
    fireEvent.click(screen.getByRole("button", { name: /next day/i }));
    await waitFor(() => expect(useAppState.getState().selectedDate).toBe(ISODate("2026-06-07")));
  });
});
