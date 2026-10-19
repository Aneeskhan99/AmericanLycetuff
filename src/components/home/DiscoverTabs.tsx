"use client";

import Image from "next/image";
import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { HomeContent } from "@/content/home";
import { ArrowCircle, btn, btnCrimson, btnFit, CmsLink, unoptimized } from "./ui";

type Content = HomeContent["discover"];

/** Figma crops of the bundled photos: main (right) photo and the narrow left strip (previous slide). */
const CROPS: Record<string, { crop: CSSProperties; strip: CSSProperties }> = {
  "/images/home/discover-green-day.jpg": {
    crop: { left: "-4.17%", top: "-12.57%", width: "108.33%", height: "131.68%" },
    strip: { left: "-179.6%", top: "-7.36%", width: "359.4%", height: "114.9%" },
  },
  "/images/home/discover-stem.jpg": {
    crop: { left: "-0.65%", top: "-19.66%", width: "102.08%", height: "124.1%" },
    strip: { left: "-121.5%", top: "-15.17%", width: "369.4%", height: "118.2%" },
  },
  "/images/home/discover-cultural-day.jpg": {
    crop: { left: "-3.45%", top: "-26.12%", width: "106.89%", height: "130.02%" },
    strip: { left: "-95.05%", top: "-5.9%", width: "340.59%", height: "108.97%" },
  },
};
/** Any other photo simply covers the box. */
const COVER: CSSProperties = { left: "0%", top: "0%", width: "100%", height: "100%" };

/** Desktop tab widths from Figma (text is centred in each); other tab names size to their text. */
const TAB_WIDTHS: Record<string, string> = {
  "Discover Swabi": "lg:w-[177.6px]",
  "STEM & Robotics": "lg:w-[232px]",
  "Campus Life": "lg:w-[162.2px]",
};
const TAB_AUTO = "lg:w-auto lg:px-[24px]!";

/** "Discover Swabi / STEM & Robotics / Campus Life" tabbed slider (Figma Component 15). */
export default function DiscoverTabs({ content: c }: { content: Content }) {
  const tabs = c.tabs;
  const [current, setActive] = useState(0);
  const n = tabs.length;
  const active = n ? Math.min(current, n - 1) : 0;
  const prev = (active - 1 + n) % n;
  const uid = useId();
  const tabId = (i: number) => `${uid}-tab-${i}`;
  const panelId = `${uid}-panel`;
  const t = tabs[active];
  const crop = (src: string) => CROPS[src]?.crop ?? COVER;
  const stripCrop = (src: string) => CROPS[src]?.strip ?? COVER;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (active + keys[e.key] + n) % n;
    setActive(next);
    document.getElementById(tabId(next))?.focus();
  };

  if (!n) return null;
  /** Mobile backdrop behind the stacked photos: the last tab's photo. */
  const backdrop = tabs[n - 1].photo.src;

  return (
    <section className="bg-white lg:py-[72.57px]">
      <div className="flex flex-col lg:grid lg:grid-cols-[202fr_844.8fr_768fr] lg:grid-rows-[62.49px_423.3px] lg:pr-[5.52vw]">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Explore the campus"
          onKeyDown={onKey}
          className="order-1 flex flex-col gap-[12px] bg-white px-[24px] py-[26px] lg:order-none lg:col-[2/4] lg:row-start-1 lg:flex-row lg:p-0 lg:pl-[48.38px]"
        >
          {tabs.map((tab, i) => (
            <button
              key={i}
              id={tabId(i)}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={panelId}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`flex h-[48px] w-full cursor-pointer items-center justify-center border-b-[1.008px] px-[14px] font-inter text-[14px] uppercase leading-[21.165px] tracking-[1.0079px] text-navy-ink transition-colors hover:text-crimson focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-crimson lg:h-[62.49px] lg:shrink-0 lg:px-0 lg:text-[14.11px] ${TAB_WIDTHS[tab.tab] ?? TAB_AUTO} ${
                i === active ? "border-crimson" : "border-transparent"
              }`}
            >
              {tab.tab}
            </button>
          ))}
        </div>

        {/* Mobile photo stack */}
        <div className="order-2 px-[24px] py-[32px] lg:hidden">
          <div className="relative flex flex-col gap-[32px] overflow-hidden p-[24px]">
            {backdrop && (
              <Image src={backdrop} alt="" aria-hidden unoptimized={unoptimized(backdrop)} fill sizes="100vw" className="object-cover" />
            )}
            <div aria-hidden className="absolute inset-0 bg-[rgba(26,45,89,0.9)]" />
            {tabs.map(({ photo: p }, i) => (
              <div key={i} className="relative h-[296px] w-full">
                {p.src && <Image src={p.src} alt={p.alt} unoptimized={unoptimized(p.src)} fill sizes="100vw" className="object-cover" />}
              </div>
            ))}
          </div>
        </div>

        {/* Left strip: previous slide peeking in */}
        <div className="relative hidden overflow-hidden lg:col-start-1 lg:row-start-2 lg:block">
          {tabs.map((tab, i) =>
            tab.photo.src ? (
              <Image
                key={i}
                src={tab.photo.src}
                alt=""
                aria-hidden
                unoptimized={unoptimized(tab.photo.src)}
                width={1920}
                height={1286}
                sizes="(min-width: 1024px) 40vw, 1px"
                className={`absolute max-w-none object-cover transition-opacity duration-700 ${prev === i ? "opacity-100" : "opacity-0"}`}
                style={stripCrop(tab.photo.src)}
              />
            ) : null,
          )}
        </div>

        {/* Text panel */}
        <div className="order-3 px-[24px] py-[32px] lg:order-none lg:col-start-2 lg:row-start-2 lg:p-0">
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(active)}
            className="relative flex flex-col items-center border border-[#ddd] bg-white p-[24px] text-center lg:h-full lg:items-start lg:border-x-0 lg:border-b-0 lg:border-t-[1.008px] lg:pb-[40px] lg:pl-[clamp(32px,2.2vw,42.33px)] lg:pr-[clamp(40px,4.9vw,93.94px)] lg:pt-[42.3px] lg:text-left"
          >
            <h2 className="font-inter text-[27px] leading-[32px] tracking-[-0.1247px] text-navy-ink lg:text-[clamp(32px,2.27vw,43.641px)] lg:leading-[1.2471] lg:tracking-[-0.2016px]">
              {t.title}
            </h2>
            <p className="mt-[16px] font-inter text-[16px] leading-[25px] tracking-[-0.2px] text-navy-ink lg:mt-[18px] lg:text-[16.126px] lg:leading-[24.189px] lg:tracking-[-0.2016px]">
              {t.text}
            </p>
            {((c.button.label && c.button.href) || (c.button2.label && c.button2.href)) && (
              <div className="mt-[24px] flex w-full flex-col gap-[12px] lg:mt-[41.5px] lg:w-auto lg:flex-row lg:flex-nowrap lg:gap-[10px]">
                {c.button.label && c.button.href && (
                  <CmsLink href={c.button.href} className={`${btnCrimson} w-full lg:w-auto ${btnFit}`}>
                    {c.button.label}
                  </CmsLink>
                )}
                {c.button2.label && c.button2.href && (
                  <CmsLink
                    href={c.button2.href}
                    className={`${btn} w-full border border-black text-black hover:bg-black hover:text-white lg:w-auto ${btnFit}`}
                  >
                    {c.button2.label}
                  </CmsLink>
                )}
              </div>
            )}
            {n > 1 && (
              <div className="absolute bottom-[39.4px] right-[clamp(32px,3.15vw,60.6px)] hidden gap-[10px] lg:flex">
                <ArrowCircle direction="prev" label="Previous" onClick={() => setActive(prev)} />
                <ArrowCircle direction="next" label="Next" onClick={() => setActive((active + 1) % n)} />
              </div>
            )}
          </div>
        </div>

        {/* Right photo */}
        <div className="relative hidden overflow-hidden lg:col-start-3 lg:row-start-2 lg:block">
          {tabs.map((tab, i) =>
            tab.photo.src ? (
              <Image
                key={i}
                src={tab.photo.src}
                alt={i === active ? tab.photo.alt : ""}
                aria-hidden={i !== active}
                unoptimized={unoptimized(tab.photo.src)}
                width={1920}
                height={1286}
                sizes="(min-width: 1024px) 45vw, 1px"
                className={`absolute max-w-none object-cover transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
                style={crop(tab.photo.src)}
              />
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
