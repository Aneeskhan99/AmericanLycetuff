"use client";

import GalleryImage from "./GalleryImage";
import { useGallery } from "./GalleryProvider";
import type { GalleryPhoto } from "./photos";

type Props = {
  photo: GalleryPhoto;
  /** Sizing / positioning classes for the clickable frame. */
  className?: string;
  sizes: string;
  preload?: boolean;
};

/** A cropped photo (object-cover) that opens the lightbox on click / Enter / Space. */
export default function PhotoButton({ photo, className = "", sizes, preload }: Props) {
  const { open } = useGallery();
  return (
    <button
      type="button"
      onClick={() => open(photo.id)}
      aria-label={`View photo: ${photo.alt}`}
      aria-haspopup="dialog"
      className={`group relative block cursor-zoom-in overflow-hidden focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-crimson ${className}`}
    >
      <GalleryImage
        src={photo.src}
        srcSet={photo.srcSet}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </button>
  );
}
