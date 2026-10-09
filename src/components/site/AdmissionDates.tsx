"use client";

import { useRef } from "react";
import { ArrowCircle, btnCrimson, CmsLink, eyebrow as eyebrowCls, heading as headingCls } from "@/components/home/ui";
import { Rich } from "@/components/site/Rich";

export type KeyDate = { day: string; month: string; label: string };

type Props = {
  id?: string;
  eyebrow: string;
  heading: string;
  body: string;
  dates: KeyDate[];
  button: { label: string; href: string };
  /** "white": white page with a grey band (Home). "grey": #f8f8f8 page with a white band (Admissions). */
  tone?: "white" | "grey";
};

/** Cards visible at once on computers; arrows appear only when there are more. */
const VISIBLE = 4;

function DateCard({ day, month, label }: KeyDate) {
  return (
    <>
      <span className="relative block h-[200px] w-full overflow-hidden bg-navy-deep text-center text-white">
        <span className="absolute inset-x-0 top-[67px] flex h-[24px] items-center justify-center font-inter text-[75px] font-bold leading-[24px] tracking-[-4px]">
          {day}
        </span>
        <span className="absolute inset-x-0 top-[120px] flex h-[42px] items-center justify-center font-inter text-[31px] font-light leading-[18px] tracking-[-0.64px]">
          {month}
        </span>
        {/* Faint "2027" behind the day (Figma vector "2027", white at 5%). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shared/date-watermark-2027.svg"
          alt=""
          aria-hidden
          width={198}
          height={63}
          className="pointer-events-none absolute left-1/2 top-[68.15px] h-[63px] w-[198px] max-w-none -translate-x-1/2"
        />
      </span>
      <span className="mt-[26px] block text-center font-inter text-[20px] leading-[31px] text-black lg:mt-[16px] lg:flex lg:h-[69px] lg:items-center lg:justify-center lg:text-[24px] lg:leading-[36px]">
        {label}
      </span>
    </>
  );
}

/**
 * "Admissions Open for 2027–28" with the key date cards. Figma: Home Section 56:5740 and
 * Admissions "Key Dates" 137:8282 (both use Component 14). Used on Home and Admissions.
 */
export default function AdmissionDates({ id, eyebrow, heading, body, dates, button, tone = "white" }: Props) {
  const viewport = useRef<HTMLUListElement>(null);
  const grey = tone === "grey";
  const band = grey ? "bg-white" : "bg-[#f5f5f5]";
  const slider = dates.length > VISIBLE;

  /** Step one card; wraps around at either end so both arrows always work. */
  const scroll = (dir: 1 | -1) => {
    const el = viewport.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= max - 2) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 2) el.scrollTo({ left: max, behavior: "smooth" });
    else el.scrollBy({ left: dir * 242, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby={id}
      className={`${grey ? "bg-[#f8f8f8]" : "bg-white"} px-[24px] py-[56px] lg:px-[6vw] lg:py-[124px]`}
    >
      <div className="mx-auto flex max-w-[1341px] flex-col items-center">
        <div className="flex flex-col items-center text-center text-black">
          {eyebrow && <p className={eyebrowCls}>{eyebrow}</p>}
          <h2 id={id} className={`${headingCls} mt-[14px] lg:mt-[26px] lg:max-w-[922px]`}>
            <Rich text={heading} />
          </h2>
          {body && (
            <p className="mt-[16px] font-inter text-[16px] leading-[25px] lg:mt-[26px] lg:max-w-[828px] lg:text-[16.227px] lg:leading-[26.205px]">
              {body}
            </p>
          )}
        </div>

        {dates.length > 0 && (
          <>
            {/* Phones: stacked cards (first four) */}
            <div className={`mt-[32px] w-full p-[24px] lg:hidden ${grey ? "bg-[#f8f8f8]" : "bg-white"}`}>
              <ol className={`flex flex-col gap-[18px] p-[24px] ${band}`}>
                {dates.slice(0, VISIBLE).map((d, i) => (
                  <li key={i}>
                    <DateCard {...d} />
                  </li>
                ))}
              </ol>
            </div>

            {/* Computers: band with up to four cards; a slider with arrows when there are more */}
            <div className="relative mt-[76px] hidden h-[286px] w-full lg:block">
              <div className={`absolute inset-x-0 top-[60px] h-[124px] ${band}`} />
              {slider && (
                <div className="absolute left-1/2 top-[100.15px] flex w-[88%] max-w-[1180px] -translate-x-1/2 items-center justify-between">
                  <ArrowCircle direction="prev" label="Previous dates" onClick={() => scroll(-1)} />
                  <ArrowCircle direction="next" label="Next dates" onClick={() => scroll(1)} />
                </div>
              )}
              <ul
                ref={viewport}
                aria-label="Key admission dates"
                className={
                  slider
                    ? "no-scrollbar absolute left-1/2 top-[-0.7px] flex w-[min(926px,calc(88%-140px))] -translate-x-1/2 snap-x snap-mandatory gap-[42px] overflow-x-auto"
                    : "absolute inset-x-0 top-[-0.7px] flex justify-center gap-[clamp(16px,2.19vw,42px)]"
                }
              >
                {dates.map((d, i) => (
                  <li key={i} className="w-[200px] shrink-0 snap-start">
                    <DateCard {...d} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {button.label && button.href && (
          <CmsLink href={button.href} className={`${btnCrimson} mt-[26px] w-full lg:mt-[76px] lg:w-auto`}>
            {button.label}
          </CmsLink>
        )}
      </div>
    </section>
  );
}
