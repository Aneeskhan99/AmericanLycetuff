"use client";

import { useRef } from "react";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { ArrowCircle, btnCrimson, CmsLink, eyebrow, heading } from "./ui";

type Content = HomeContent["admissions"];

/** Mobile frame lists the first four key dates only. */
const MOBILE_COUNT = 4;

function DateCard({ day, month, label }: Content["dates"][number]) {
  return (
    <>
      <span className="relative block h-[200px] w-full bg-navy-deep text-center text-white">
        <span className="absolute inset-x-0 top-[67px] flex h-[24px] items-center justify-center font-inter text-[75px] font-bold leading-[24px] tracking-[-4px]">
          {day}
        </span>
        <span className="absolute inset-x-0 top-[120px] flex h-[42px] items-center justify-center font-inter text-[31px] font-light leading-[18px] tracking-[-0.64px]">
          {month}
        </span>
      </span>
      <span className="mt-[26px] block text-center font-inter text-[20px] leading-[31px] text-black lg:mt-[16px] lg:flex lg:h-[69px] lg:items-center lg:justify-center lg:text-[24px] lg:leading-[36px]">
        {label}
      </span>
    </>
  );
}

/** "Admissions Open for 2027–28" key dates (Figma Section 56:5740 / Component 14). */
export default function Admissions({ content: c }: { content: Content }) {
  const events = c.dates;
  const viewport = useRef<HTMLUListElement>(null);

  /** Step one card; wraps around at either end so both arrows always work (as in the design). */
  const scroll = (dir: 1 | -1) => {
    const el = viewport.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= max - 2) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 2) el.scrollTo({ left: max, behavior: "smooth" });
    else el.scrollBy({ left: dir * 242, behavior: "smooth" });
  };

  return (
    <section className="bg-white px-[24px] py-[56px] lg:px-[6vw] lg:py-[124px]">
      <div className="mx-auto flex max-w-[1341px] flex-col items-center">
        <div className="flex flex-col items-center text-center text-black">
          {c.eyebrow && <p className={eyebrow}>{c.eyebrow}</p>}
          <h2 className={`${heading} mt-[14px] lg:mt-[26px] lg:max-w-[922px]`}>
            <Rich text={c.heading} />
          </h2>
          {c.body && (
            <p className="mt-[16px] font-inter text-[16px] leading-[25px] lg:mt-[26px] lg:max-w-[828px] lg:text-[16.227px] lg:leading-[26.205px]">
              {c.body}
            </p>
          )}
        </div>

        {events.length > 0 && (
          <>
            {/* Mobile: stacked list */}
            <div className="mt-[32px] w-full bg-white p-[24px] lg:hidden">
              <ol className="flex flex-col gap-[18px] bg-[#f5f5f5] p-[24px]">
                {events.slice(0, MOBILE_COUNT).map((e, i) => (
                  <li key={i}>
                    <DateCard {...e} />
                  </li>
                ))}
              </ol>
            </div>

            {/* Desktop: grey band with a 4-up slider */}
            <div className="relative mt-[76px] hidden h-[286px] w-full lg:block">
              <div className="absolute inset-x-0 top-[60px] h-[124px] bg-[#f5f5f5]" />
              <div className="absolute left-1/2 top-[100.15px] flex w-[88%] max-w-[1180px] -translate-x-1/2 items-center justify-between">
                <ArrowCircle direction="prev" label="Previous dates" onClick={() => scroll(-1)} />
                <ArrowCircle direction="next" label="Next dates" onClick={() => scroll(1)} />
              </div>
              <ul
                ref={viewport}
                aria-label="Key admission dates"
                className={`no-scrollbar absolute left-1/2 top-[-0.7px] flex w-[min(926px,calc(88%-140px))] -translate-x-1/2 snap-x snap-mandatory gap-[42px] overflow-x-auto ${
                  events.length < 4 ? "justify-center-safe" : ""
                }`}
              >
                {events.map((e, i) => (
                  <li key={i} className="w-[200px] shrink-0 snap-start">
                    <DateCard {...e} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {c.button.label && c.button.href && (
          <CmsLink href={c.button.href} className={`${btnCrimson} mt-[26px] w-full lg:mt-[76px] lg:w-auto`}>
            {c.button.label}
          </CmsLink>
        )}
      </div>
    </section>
  );
}
