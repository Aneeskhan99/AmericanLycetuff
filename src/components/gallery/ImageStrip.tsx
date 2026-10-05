"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PhotoButton from "./PhotoButton";
import type { GalleryPhoto } from "./photos";

/**
 * Desktop: a horizontal, freely scrolling strip that bleeds off both edges, with a
 * progress bar and prev/next arrows. Mobile: the photos stack (per the 390 frame).
 */
const SLOTS = [
  { w: "lg:w-[480px]", h: "h-[271px]", offset: "lg:mt-0", gap: "mb-[16px]" },
  { w: "lg:w-[620px]", h: "h-[212px]", offset: "lg:mt-[40px]", gap: "mb-[26px]" },
  { w: "lg:w-[400px]", h: "h-[325px]", offset: "lg:mt-0", gap: "mb-[20px]" },
  { w: "lg:w-[560px]", h: "h-[232px]", offset: "lg:mt-[40px]", gap: "mb-[26px]" },
  { w: "lg:w-[440px]", h: "h-[295px]", offset: "lg:mt-0", gap: "mb-[16px]" },
  { w: "lg:w-[500px]", h: "h-[260px]", offset: "lg:mt-[40px]", gap: "mb-[16px]" },
];

/** The photos with their layout slot (the six designed sizes repeat; the last one has no bottom gap). */
const layout = (photos: GalleryPhoto[]) =>
  photos.map((photo, i) => ({ photo, ...SLOTS[i % SLOTS.length], ...(i === photos.length - 1 ? { gap: "mb-0" } : {}) }));

export default function ImageStrip({ heading, photos }: { heading: string; photos: GalleryPhoto[] }) {
  const strip = layout(photos);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = el.scrollLeft;
    setProgress(max > 0 ? x / max : 0);
    setAtStart(x <= 2);
    setAtEnd(x >= max - 2);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(400, el.clientWidth * 0.5), behavior: "smooth" });
  };

  if (!strip.length) return null;

  return (
    <section aria-labelledby="everyday-moments" className="overflow-hidden bg-navy-ink">
      <div className="frame gutter pt-[56px] lg:pt-[110px]">
        <div className="mx-auto w-full max-w-[1498px]">
          <h2
            id="everyday-moments"
            className="text-center text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-left lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]"
          >
            {heading}
          </h2>
        </div>
      </div>

      <div className="frame">
        <ul
          ref={scrollerRef}
          onScroll={update}
          aria-label={`${heading} photos`}
          className="mt-[12px] flex flex-col px-[24px] lg:mt-[44px] lg:h-[420px] lg:flex-row lg:items-start lg:gap-[24px] lg:overflow-x-auto lg:overscroll-x-contain lg:px-0 lg:no-scrollbar"
        >
          {strip.map((item, i) => (
            <li
              key={i}
              className={`shrink-0 lg:mb-0 ${item.gap} ${item.offset} ${
                i === 0 ? "lg:ml-[-140px]" : ""
              } ${i === strip.length - 1 ? "lg:mr-[clamp(40px,7.76vw,149px)]" : ""}`}
            >
              <PhotoButton
                photo={item.photo}
                sizes="(min-width: 1024px) 620px, 100vw"
                className={`w-full lg:h-[380px] ${item.h} ${item.w}`}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="frame gutter pb-[56px] lg:pb-[58px]">
        <div className="mx-auto hidden w-full max-w-[1498px] items-center gap-[40px] pt-[28px] lg:flex">
          <div aria-hidden className="relative h-[3px] max-w-[1200px] flex-1">
            <div className="absolute inset-0 bg-[#ccc] opacity-40" />
            <div
              className="absolute inset-y-0 left-0 w-1/5 bg-crimson transition-transform duration-150"
              style={{ transform: `translateX(${progress * 400}%)` }}
            />
          </div>
          <div className="ml-auto mr-[44px] flex gap-[12px]">
            <StripArrow label="Scroll photos left" disabled={atStart} onClick={() => scrollByPage(-1)}>
              ←
            </StripArrow>
            <StripArrow label="Scroll photos right" disabled={atEnd} onClick={() => scrollByPage(1)}>
              →
            </StripArrow>
          </div>
        </div>
      </div>
    </section>
  );
}

function StripArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[44px] items-center justify-center rounded-[22px] border-[1.5px] border-white/50 text-[20px] leading-none text-white transition-colors enabled:hover:border-white enabled:hover:bg-white enabled:hover:text-navy-ink disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0]"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
