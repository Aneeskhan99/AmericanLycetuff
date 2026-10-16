"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGallery } from "./GalleryProvider";
import { filters } from "./photos";

/**
 * Figma: Category Navigation (desktop 141:8457, mobile 165:6826).
 * Mobile: boxed tabs in a horizontally swipeable row that bleeds to the screen
 * edges, with a white fade on the right while more tabs are off-screen
 * (Tab Scroller 232:3088). Desktop: labels over an underline bar, wrapping.
 */
export default function CategoryNav({ intro }: { intro: string }) {
  const { filter, setFilter } = useGallery();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  return (
    <section aria-label="Gallery categories" className="frame gutter bg-white">
      <div className="mx-auto w-full max-w-[1498px] py-[48px] lg:border-b lg:border-[#d6d6d6] lg:pb-[26px] lg:pt-[36px]">
        <p className="text-center text-[16px] leading-[25px] tracking-[0.3px] text-[#5c5c5c] lg:max-w-[640px] lg:text-left lg:text-[18px] lg:leading-[28px]">
          {intro}
        </p>

        <div className="relative -mx-[24px] mt-[28px] lg:mx-0 lg:mt-[48px]">
          <div
            ref={scrollerRef}
            onScroll={update}
            role="group"
            aria-label="Filter photos by category"
            className="no-scrollbar flex gap-[8px] overflow-x-auto overscroll-x-contain scroll-px-[24px] px-[24px] lg:flex-wrap lg:gap-x-[clamp(24px,2.29vw,44px)] lg:gap-y-[20px] lg:overflow-visible lg:px-0"
          >
            {filters.filter((f) => !f.hidden).map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  aria-controls="gallery-results"
                  onClick={(e) => {
                    setFilter(f.id);
                    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
                  }}
                  className={`group flex h-[44px] shrink-0 items-center justify-center border px-[18px] text-center transition-colors lg:transition-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-crimson lg:h-auto lg:w-auto lg:flex-col lg:items-stretch lg:justify-start lg:gap-[12px] lg:border-0 lg:bg-transparent lg:p-0 lg:pb-[2px] lg:text-left lg:focus-visible:outline-offset-2 ${
                    active
                      ? "border-navy bg-navy text-white lg:text-navy"
                      : "border-[#d6d6d6] bg-white text-navy hover:border-navy lg:text-[#5c5c5c] lg:hover:text-navy"
                  }`}
                >
                  {/* Mobile tabs are as wide as the label at 2px tracking (as in Figma) while the label shows at 1.2px. */}
                  <span className="grid shrink-0 whitespace-nowrap text-[13px] font-medium uppercase leading-normal lg:block lg:text-[13.1px] lg:leading-[16px]">
                    <span className="col-start-1 row-start-1 tracking-[1.2px] lg:tracking-[2px]">{f.label}</span>
                    <span aria-hidden className="invisible col-start-1 row-start-1 tracking-[2px] lg:hidden">
                      {f.label}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`hidden h-[2px] w-full transition-colors lg:block ${
                      active ? "bg-crimson" : "bg-[#d6d6d6] group-hover:bg-navy/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span
            aria-hidden
            className={`pointer-events-none absolute right-0 top-0 h-[44px] w-[56px] bg-linear-to-r from-white/0 to-white transition-opacity duration-200 lg:hidden ${
              atEnd ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
      </div>
      <div aria-hidden className="hidden h-[19px] lg:block" />
    </section>
  );
}
