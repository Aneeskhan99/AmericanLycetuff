import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { isInternal } from "@/lib/content";

/**
 * Desktop compositions on this page are drawn on a 1920px Figma frame. Section
 * components size those pieces in "design px" through the `--u` custom property
 * (set on the page wrapper): 1px at >=1920 viewports, scaling down proportionally
 * below that, so collages keep their exact proportions at 1366 / 1280 / 1024.
 */
export const designUnit = { "--u": "min(1px, 100vw / 1920)" } as CSSProperties;

/** Crop box in percent of the frame, taken from the Figma image layer geometry. */
export type Crop = { left: number; top: number; width: number; height: number };

/**
 * Image filling its (relative, overflow-hidden) parent. Mobile uses object-cover
 * like the 390 frame; from `lg` up it applies the exact desktop Figma crop.
 */
export function CropImage({
  src,
  alt,
  crop,
  sizes,
  preload = false,
}: {
  src: string;
  alt: string;
  crop?: Crop;
  sizes: string;
  preload?: boolean;
}) {
  if (!src) return null;
  const style = crop
    ? ({
        "--cl": `${crop.left}%`,
        "--ct": `${crop.top}%`,
        "--cw": `${crop.width}%`,
        "--ch": `${crop.height}%`,
      } as CSSProperties)
    : undefined;
  return (
    <div
      style={style}
      className={crop ? "absolute inset-0 lg:inset-auto lg:top-(--ct) lg:left-(--cl) lg:h-(--ch) lg:w-(--cw)" : "absolute inset-0"}
    >
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} unoptimized={unoptimized(src)} className="object-cover" />
    </div>
  );
}

/** Eyebrow label used above section headings (13.1px semibold, 2px tracking). */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px] ${className}`}
    >
      {children}
    </p>
  );
}

/** Labelled group of outline chips: stacked full width on mobile, wrapping row on desktop. */
export function ChipGroup({ label, chips, tone }: { label: string; chips: string[]; tone: "dark" | "light" }) {
  const chip = tone === "dark" ? "border-white/40 text-white" : "border-[#d6d6d6] text-navy";
  return (
    <div className="flex w-full flex-col items-center gap-[12px] lg:items-start">
      {label && (
        <p className="w-full text-center text-[13px] font-semibold uppercase leading-[20px] tracking-[2.7083px] text-[#fd0] lg:text-left lg:text-[12px] lg:leading-normal lg:tracking-[2.5px]">
          {label}
        </p>
      )}
      <ul className="flex w-full flex-col gap-[8px] lg:max-w-[690px] lg:flex-row lg:flex-wrap lg:gap-[10px]">
        {chips.map((c, i) => (
          <li
            key={i}
            className={`flex items-center justify-center border px-[16px] py-[13px] text-center text-[14px] font-medium leading-[17px] lg:justify-start lg:py-[10px] ${chip}`}
          >
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const btnFilled =
  "flex w-full items-center justify-center bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:w-auto";

export const btnStroked =
  "flex w-full items-center justify-center border-2 border-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-white transition-colors hover:bg-white hover:text-navy-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:w-auto";

/** next/image only optimises local files; anything external is shown as-is. */
export const unoptimized = (src: string) => /^(https?:)?\/\//i.test(src);

/** "One per line" admin text → trimmed, non-empty lines. */
export const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** Admin-edited link: internal → <Link>, http(s) → new tab, anything else (tel:, mailto:, #) → plain <a>. */
export function CmsLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isInternal(href))
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  if (/^(https?:)?\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
