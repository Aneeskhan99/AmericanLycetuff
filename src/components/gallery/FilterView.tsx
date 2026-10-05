"use client";

import type { ReactNode } from "react";
import { useGallery } from "./GalleryProvider";
import PhotoButton from "./PhotoButton";
import { filters } from "./photos";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "All" shows the editorial story layout from Figma (passed as children).
 * Any other tab swaps it for a grid of the photos tagged with that category.
 */
export default function FilterView({ children }: { children: ReactNode }) {
  const { filter, items } = useGallery();
  const label = filters.find((f) => f.id === filter)?.label ?? "";

  return (
    <div id="gallery-results">
      <p className="sr-only" aria-live="polite">
        {filter === "all" ? "Showing all photos" : `Showing ${items.length} photos in ${label}`}
      </p>

      {filter === "all" ? (
        children
      ) : items.length === 0 ? (
        <section aria-label={`${label} photos`} className="frame gutter bg-white">
          <p className="mx-auto w-full max-w-[1498px] pb-[56px] pt-[8px] text-center text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:pb-[120px] lg:pt-[90px] lg:text-left">
            No photos in {label} yet.
          </p>
        </section>
      ) : (
        <section aria-label={`${label} photos`} className="frame gutter bg-white">
          <ul className="mx-auto grid w-full max-w-[1498px] grid-cols-1 gap-x-[28px] gap-y-[32px] pb-[56px] pt-[8px] md:grid-cols-2 lg:grid-cols-3 lg:gap-y-[48px] lg:pb-[120px] lg:pt-[90px]">
            {items.map((photo, i) => (
              <li key={photo.id}>
                <PhotoButton
                  photo={photo}
                  sizes="(min-width: 1024px) 470px, (min-width: 768px) 50vw, 100vw"
                  className="aspect-[470/330] w-full"
                />
                <p className="mt-[20px] flex items-center justify-center gap-[20px] text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] lg:justify-start lg:text-[13.1px] lg:tracking-[2px]">
                  <span className="text-crimson">{pad(i + 1)}</span>
                  <span className="text-navy">{label}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
