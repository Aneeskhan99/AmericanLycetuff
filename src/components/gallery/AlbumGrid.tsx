"use client";

import PhotoButton from "./PhotoButton";
import type { GalleryPhoto } from "./photos";

const pad = (n: number) => String(n).padStart(2, "0");

/** The photos of one album (same grid as a gallery filter tab); each opens the lightbox. */
export default function AlbumGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <section aria-label="Photos" className="frame gutter bg-white">
      <ul className="mx-auto grid w-full max-w-[1498px] grid-cols-1 gap-x-[28px] gap-y-[32px] pb-[56px] pt-[48px] md:grid-cols-2 lg:grid-cols-3 lg:gap-y-[48px] lg:pb-[90px] lg:pt-[90px]">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <PhotoButton
              photo={photo}
              preload={i < 3}
              sizes="(min-width: 1024px) 470px, (min-width: 768px) 50vw, 100vw"
              className="aspect-[470/330] w-full"
            />
            <p className="mt-[20px] flex items-baseline justify-center gap-[20px] text-center lg:justify-start lg:text-left">
              <span className="text-[13px] font-semibold leading-[20px] tracking-[2px] text-crimson">{pad(i + 1)}</span>
              {photo.caption && <span className="text-[15px] leading-[23px] text-[#5c5c5c] lg:text-[14px]">{photo.caption}</span>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
