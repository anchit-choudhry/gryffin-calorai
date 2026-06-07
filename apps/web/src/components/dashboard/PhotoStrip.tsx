import { useEffect, useState } from "react";
import type { FC } from "react";
import { Camera } from "lucide-react";
import type { FoodPhoto } from "@/db/dbService";
import { getFoodPhotosByUser } from "@/db/dbService";
import type { ISODate, UserId } from "@/types";

interface Props {
  userId: UserId;
  date: ISODate;
}

export const PhotoStrip: FC<Props> = ({ userId, date }) => {
  const [photoList, setPhotoList] = useState<FoodPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = photoList.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    getFoodPhotosByUser(userId, date)
      .then(setPhotoList)
      .catch(() => {});
  }, [userId, date]);

  if (photoList.length === 0) return null;

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 snap-x"
        role="list"
        aria-label="Meal photos for today"
      >
        {photoList.map((photo) => (
          <div key={photo.id} role="listitem" className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setSelectedId(photo.id ?? null)}
              className="block size-16 border border-rule overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
              aria-label="View meal photo"
            >
              <img
                src={photo.thumbnailData}
                alt="Meal photo thumbnail"
                className="size-full object-cover"
              />
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full meal photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper/90 p-6"
          onClick={() => setSelectedId(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.imageData} alt="Meal photo" className="w-full border border-rule" />
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute top-2 right-2 size-8 flex items-center justify-center bg-paper border border-rule hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
              aria-label="Close photo"
            >
              <Camera className="size-4 text-ink" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
