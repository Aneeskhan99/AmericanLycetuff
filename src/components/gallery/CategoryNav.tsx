"use client";

import { useGallery } from "./GalleryProvider";
import { filters } from "./photos";

/** Figma: Category Navigation (desktop 141:8457, mobile 165:6826). */
export default function CategoryNav({ intro }: { intro: string }) {
  const { filter, setFilter } = useGallery();

  return (
    <section aria-label="Gallery categories" className="frame gutter bg-white">
      <div className="mx-auto w-full max-w-[1498px] pb-[48px] pt-[56px] lg:border-b lg:border-[#d6d6d6] lg:pb-[26px] lg:pt-[36px]">
        <p className="text-center text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:max-w-[640px] lg:text-left">
          {intro}
        </p>

        <div
          role="group"
          aria-label="Filter photos by category"
          className="mt-[24px] flex flex-col gap-[8px] lg:mt-[48px] lg:flex-row lg:flex-wrap lg:gap-x-[clamp(24px,2.29vw,44px)] lg:gap-y-[20px]"
        >
          {filters.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                aria-controls="gallery-results"
                onClick={() => setFilter(f.id)}
                className={`group flex w-full items-center gap-[20px] py-[13px] pl-[16px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:w-auto lg:flex-col lg:items-stretch lg:gap-[12px] lg:p-0 lg:pb-[2px] ${
                  active ? "text-navy" : "text-[#5c5c5c] hover:text-navy"
                }`}
              >
                <span className="shrink-0 whitespace-nowrap text-[13.1px] font-medium uppercase leading-[16px] tracking-[2px]">
                  {f.label}
                </span>
                <span
                  aria-hidden
                  className={`h-[16px] min-w-0 flex-1 transition-colors lg:h-[2px] lg:w-full lg:flex-none ${
                    active ? "bg-crimson" : "bg-[#d6d6d6] group-hover:bg-navy/40"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="hidden h-[19px] lg:block" />
    </section>
  );
}
