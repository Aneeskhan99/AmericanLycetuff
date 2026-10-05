"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Lightbox from "./Lightbox";
import { filters, photosFor, type FilterId, type GalleryLibrary, type GalleryPhoto } from "./photos";

type GalleryContextValue = {
  filter: FilterId;
  setFilter: (filter: FilterId) => void;
  /** Photos of the current filter (the lightbox sequence). */
  items: GalleryPhoto[];
  /** Open the lightbox on a photo, within the photos of the current filter. */
  open: (photoId: string) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used inside <GalleryProvider>");
  return ctx;
}

export default function GalleryProvider({ children, allView, library, label }: GalleryLibrary & {
  children: ReactNode;
  /** Lightbox label for every photo (album pages). */
  label?: string;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [index, setIndex] = useState<number | null>(null);

  const items: GalleryPhoto[] = useMemo(() => photosFor(filter, { allView, library }), [filter, allView, library]);

  const open = useCallback(
    (photoId: string) => {
      const i = items.findIndex((photo) => photo.id === photoId);
      if (i >= 0) setIndex(i);
    },
    [items],
  );

  const value = useMemo(() => ({ filter, setFilter, items, open }), [filter, items, open]);

  return (
    <GalleryContext.Provider value={value}>
      {children}
      <Lightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
        categoryLabel={label ?? (filter === "all" ? undefined : filters.find((f) => f.id === filter)?.label)}
      />
    </GalleryContext.Provider>
  );
}
