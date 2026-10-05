"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { ArrowBadge, ArrowCircle, body, btnCrimson, CmsLink, softBreaks, unoptimized } from "./ui";

/** Intrinsic sizes of the bundled lab photos; anything else (uploads) is drawn at 1200 × 800 and cropped to the card. */
const SIZES: Record<string, [number, number]> = {
  "/images/home/lab-robotics.png": [1199, 839],
  "/images/home/lab-science.png": [626, 417],
  "/images/home/lab-computer.png": [1199, 798],
  "/images/home/lab-physics.png": [1200, 900],
  "/images/home/lab-chemistry.png": [736, 515],
};

const STEP = 423.307 + 12;

/** "Discover our STEM Labs" slider (Figma Component 13). */
export default function StemLabs({ content: c }: { content: HomeContent["labs"] }) {
  const labs = c.cards;
  const track = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  /** False when every card already fits (few labs): the slider controls are then hidden. */
  const [scrollable, setScrollable] = useState(true);

  const sync = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0);
    setScrollable(max > 2);
  };

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= max - 2) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 2) el.scrollTo({ left: max, behavior: "smooth" });
    else el.scrollBy({ left: dir * STEP, behavior: "smooth" });
  };

  const seek = (v: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: (v / 1000) * (el.scrollWidth - el.clientWidth) });
  };

  return (
    <section className="overflow-hidden bg-[#f2f2f2] px-[24px] py-[56px] lg:px-[6vw] lg:pb-[73px] lg:pt-[70.63px]">
      <div className="mx-auto max-w-[1330px]">
        <div className="flex flex-col lg:flex-row lg:items-start">
          <div className="flex flex-col items-center text-center lg:w-[clamp(380px,28.33vw,544px)] lg:shrink-0 lg:items-start lg:pr-[clamp(48px,3.6vw,72px)] lg:text-left">
            <h2 className="font-inter text-[30px] leading-[34px] text-navy-ink lg:max-w-[440px] lg:text-[clamp(38px,2.6vw,49.89px)] lg:leading-[1.1515]">
              <Rich text={softBreaks(c.heading)} brClassName="hidden lg:block" />
            </h2>
            {c.body && <p className={`${body} mt-[16px] text-black lg:mt-[19px] lg:max-w-[471px]`}>{c.body}</p>}
            {c.button.label && c.button.href && (
              <CmsLink
                href={c.button.href}
                className={`${btnCrimson} w-full lg:mt-[36px] lg:w-auto lg:max-w-full lg:whitespace-normal lg:px-[clamp(20px,1.56vw,30px)] lg:text-[clamp(14px,0.892vw,17.134px)] lg:tracking-[0.11em]`}
              >
                <span className="lg:hidden">{c.buttonShort || c.button.label}</span>
                <span className="hidden lg:inline">{c.button.label}</span>
              </CmsLink>
            )}
          </div>

          {labs.length > 0 && (
            <ul
              ref={track}
              onScroll={sync}
              aria-label="Our STEM labs"
              className="no-scrollbar mt-[32px] flex flex-col gap-[32px] lg:mr-[calc(50%-50vw)] lg:mt-[0.22px] lg:min-w-0 lg:flex-1 lg:snap-x lg:snap-mandatory lg:flex-row lg:gap-[12px] lg:overflow-x-auto"
            >
              {labs.map((lab, i) => (
                <li key={i} className="lg:w-[423.307px] lg:shrink-0 lg:snap-start">
                  <CmsLink
                    href={lab.href || "/stem-robotics"}
                    className="group flex flex-col items-center bg-white p-[24px] text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-crimson lg:items-start lg:p-0 lg:text-left"
                  >
                    <span className="relative block h-[191px] w-full overflow-hidden lg:h-[272.409px]">
                      {lab.photo.src && (
                        <Image
                          src={lab.photo.src}
                          alt={lab.photo.alt}
                          unoptimized={unoptimized(lab.photo.src)}
                          width={SIZES[lab.photo.src]?.[0] ?? 1200}
                          height={SIZES[lab.photo.src]?.[1] ?? 800}
                          sizes="(min-width: 1024px) 424px, 100vw"
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="mt-[18px] flex w-full flex-col items-center lg:mt-0 lg:items-start lg:gap-[16px] lg:px-[40px] lg:py-[30px]">
                      <span className="font-inter text-[15px] uppercase leading-[23px] tracking-[1.0714px] text-navy-ink lg:text-[14.118px] lg:leading-[21.176px] lg:tracking-[1.0084px]">
                        {lab.kind}
                      </span>
                      <span className="relative mt-[24px] block w-full overflow-hidden lg:mt-0 lg:h-[35.259px]">
                        <span className="block font-inter text-[18px] leading-[28px] text-crimson lg:text-[21.176px] lg:leading-[36.302px]">
                          {lab.title}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/home/lab-title-line.svg"
                          alt=""
                          aria-hidden
                          width={200}
                          height={2}
                          className="absolute left-[-200px] top-[33.26px] hidden h-[2px] w-[200px] max-w-none transition-transform duration-500 group-hover:translate-x-[200px] lg:block"
                        />
                      </span>
                      <ArrowBadge className="mt-[28px] group-hover:border-crimson lg:mt-0" />
                    </span>
                  </CmsLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slider range control + arrows (desktop) */}
        {labs.length > 0 && (
          <div className={`mt-[95.9px] hidden items-center gap-[19px] lg:flex ${scrollable ? "" : "invisible"}`}>
            <div
              className="relative h-[5px] flex-1 rounded-[5.042px]"
              style={
                {
                  "--p": progress,
                  background:
                    "linear-gradient(90deg, #1a2d59 calc(27.5px + var(--p) * (100% - 70.5px)), #ccc calc(27.5px + var(--p) * (100% - 70.5px)))",
                } as CSSProperties
              }
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-[-15.64px] flex h-[36.321px] w-[58.54px] items-center justify-center rounded-[30.252px] bg-crimson"
                style={{ left: `calc(12px + ${progress} * (100% - 70.54px))` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/home/slider-handle-icon.svg" alt="" width={19.146} height={11.098} className="h-[11.098px] w-[19.146px] -scale-x-100" />
              </span>
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(progress * 1000)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Scroll through the labs"
                className="absolute inset-x-0 top-[-16px] h-[37px] w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="flex gap-[10px]">
              <ArrowCircle direction="prev" label="Previous lab" onClick={() => step(-1)} />
              <ArrowCircle direction="next" label="Next lab" onClick={() => step(1)} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
