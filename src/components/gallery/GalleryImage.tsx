import Image from "next/image";

type Props = {
  src: string;
  /** Present for media-library uploads: they already have WebP sizes, so a plain <img srcset> is used. */
  srcSet?: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
  quality?: number;
} & ({ fill: true; width?: undefined; height?: undefined } | { fill?: false; width: number; height: number });

/**
 * One image on the gallery pages. Designed photos in /public go through next/image
 * (unchanged from the original build); uploads from the media library are served
 * as they are, with their own srcset.
 */
export default function GalleryImage({ src, srcSet, alt, sizes, className = "", preload, quality, fill, width, height }: Props) {
  if (srcSet !== undefined || src.startsWith("/media/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={preload ? "eager" : "lazy"}
        fetchPriority={preload ? "high" : undefined}
        decoding="async"
        className={fill ? `absolute inset-0 size-full ${className}` : className}
      />
    );
  }
  return fill ? (
    <Image src={src} alt={alt} fill sizes={sizes} preload={preload} quality={quality} className={className} />
  ) : (
    <Image src={src} alt={alt} width={width!} height={height!} sizes={sizes} preload={preload} quality={quality} className={className} />
  );
}
