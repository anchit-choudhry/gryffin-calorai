import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoStrip } from "./PhotoStrip";
import type { FoodPhoto } from "@/db/dbService";
import * as dbService from "@/db/dbService";
import { FoodPhotoId, ISODate, UserId } from "@/types";

vi.mock("@/db/dbService", async (importOriginal) => ({
  ...(await importOriginal<typeof dbService>()),
  getFoodPhotosByUser: vi.fn(),
}));

const mockGetPhotos = dbService.getFoodPhotosByUser as ReturnType<typeof vi.fn>;

const userId = UserId("u1");
const date = ISODate("2026-06-07");

function makePhoto(id: number, suffix = ""): FoodPhoto {
  return {
    id: FoodPhotoId(id),
    userId,
    imageData: `data:image/png;base64,orig${suffix}`,
    thumbnailData: `data:image/png;base64,thumb${suffix}`,
    mimeType: "image/png",
    createdAt: `${date}T12:00:00.000Z`,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("PhotoStrip", () => {
  it("renders nothing when no photos exist", async () => {
    mockGetPhotos.mockResolvedValue([]);
    const { container } = render(<PhotoStrip userId={userId} date={date} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders thumbnails when photos are present", async () => {
    mockGetPhotos.mockResolvedValue([makePhoto(1), makePhoto(2)]);
    render(<PhotoStrip userId={userId} date={date} />);
    const thumbnails = await screen.findAllByAltText("Meal photo thumbnail");
    expect(thumbnails).toHaveLength(2);
  });

  it("has accessible list label", async () => {
    mockGetPhotos.mockResolvedValue([makePhoto(1)]);
    render(<PhotoStrip userId={userId} date={date} />);
    expect(await screen.findByRole("list", { name: /meal photos for today/i })).toBeInTheDocument();
  });

  it("opens lightbox when a thumbnail is clicked", async () => {
    mockGetPhotos.mockResolvedValue([makePhoto(1, "A")]);
    render(<PhotoStrip userId={userId} date={date} />);
    const btn = await screen.findByRole("button", { name: /view meal photo/i });
    fireEvent.click(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Meal photo")).toHaveAttribute("src", "data:image/png;base64,origA");
  });

  it("closes lightbox when backdrop is clicked", async () => {
    mockGetPhotos.mockResolvedValue([makePhoto(1)]);
    render(<PhotoStrip userId={userId} date={date} />);
    fireEvent.click(await screen.findByRole("button", { name: /view meal photo/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("closes lightbox when close button is clicked", async () => {
    mockGetPhotos.mockResolvedValue([makePhoto(1)]);
    render(<PhotoStrip userId={userId} date={date} />);
    fireEvent.click(await screen.findByRole("button", { name: /view meal photo/i }));
    fireEvent.click(screen.getByRole("button", { name: /close photo/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("handles DB errors gracefully (renders nothing)", async () => {
    mockGetPhotos.mockRejectedValue(new Error("DB error"));
    const { container } = render(<PhotoStrip userId={userId} date={date} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
