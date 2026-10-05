import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { unoptimized } from "./ui";

type Stat = HomeContent["numbers"]["figures"][number];

/* Desktop is a 2-column grid read row by row; mobile shows the left column then the right column.
   Spacing and type sizes per row / figure come from Figma (three rows of two); extra rows reuse them. */
const rowPad = ["pt-[60.45px]", "pt-[50px]", "pt-[39.5px]"];
const rowHeight = ["h-[248.37px]", "h-[234.9px]", "h-[215.9px]"];
const mobileSize = ["text-[27px] leading-[32px]", "text-[24px] leading-[29px]", "text-[27px] leading-[32px]"];
const figureSize = ["36.907px", "35.193px", "34.79px", "37.714px", "37.21px", "37.714px"];

/** "Our People, Our Strength." numbers panel (Figma Background 56:5840). */
export default function Numbers({ content: c }: { content: HomeContent["numbers"] }) {
  const rows: Stat[][] = [];
  c.figures.forEach((s, i) => (i % 2 ? rows[rows.length - 1].push(s) : rows.push([s])));
  return (
    <section className="relative bg-[#001e3b] px-[24px] py-[64px] lg:bg-[#f2f2f2] lg:px-[6vw] lg:pb-[48.43px] lg:pt-0">
      <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-[398px] bg-[#cfcfcf] lg:block" />
      <div className="relative mx-auto flex max-w-[1451.34px] flex-col lg:min-h-[699.18px] lg:flex-row lg:bg-[#001e3b]">
        {/* Intro */}
        <div className="relative flex flex-col items-center text-center text-white lg:flex-1 lg:items-start lg:pl-[60.47px] lg:pr-[40px] lg:pt-[77.2px] lg:text-left">
          {c.crest.src && (
            <Image
              src={c.crest.src}
              alt={c.crest.alt}
              unoptimized={unoptimized(c.crest.src)}
              width={2400}
              height={2400}
              sizes="160px"
              className="hidden h-[160px] w-[127px] object-cover lg:block"
            />
          )}
          {c.eyebrow && (
            <p className="font-inter text-[18px] leading-[28px] lg:mt-[52.7px] lg:text-[18.151px] lg:leading-[30.312px]">
              {c.eyebrow}
            </p>
          )}
          <h2 className="mt-[32px] font-inter text-[30px] leading-[34px] lg:mt-[29px] lg:max-w-[484px] lg:text-[clamp(38px,2.6vw,49.89px)] lg:leading-[1.1515]">
            <Rich text={c.heading} />
          </h2>
          {c.body && (
            <p className="mt-[16px] font-inter text-[16px] leading-[25px] lg:mt-[26px] lg:max-w-[446.14px] lg:text-[16.134px] lg:leading-[24.202px]">
              {c.body}
            </p>
          )}
        </div>

        {/* Mobile figures: two columns stacked */}
        {rows.length > 0 && (
          <div className="mt-[32px] flex flex-col gap-[32px] bg-navy-deep p-[24px] text-center text-white lg:hidden">
            {[0, 1].map((col) =>
              rows.some((r) => r[col]) ? (
                <dl key={col} className="flex flex-col gap-[32px]">
                  {rows.map((r, i) =>
                    r[col] ? (
                      <div key={i} className="flex flex-col gap-[16px]">
                        <dt className={`order-2 font-inter text-[16px] leading-[25px]`}>{r[col].label}</dt>
                        <dd className={`order-1 font-inter ${mobileSize[(i + col) % 3]}`}>{r[col].value}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              ) : null,
            )}
          </div>
        )}

        {/* Desktop figures: 2 × 3 grid */}
        {rows.length > 0 && (
          <dl className="hidden bg-navy-deep text-white lg:grid lg:w-[54.17%] lg:shrink-0 lg:grid-cols-2">
            {rows.map((r, i) =>
              r.map((s, col) => (
                <div
                  key={`${i}-${col}`}
                  className={`flex flex-col pl-[clamp(32px,3.15vw,60.47px)] pr-[24px] ${rowPad[Math.min(i, rowPad.length - 1)]} ${
                    rowHeight[Math.min(i, rowHeight.length - 1)]
                  } ${i < rows.length - 1 ? "border-b-[1.008px] border-white/30" : ""}`}
                >
                  <dt className="order-2 mt-[6px] max-w-[265px] font-inter text-[16.639px] leading-[27.227px]">{s.label}</dt>
                  <dd className="order-1 font-inter leading-[60.504px]" style={{ fontSize: figureSize[(i * 2 + col) % figureSize.length] }}>
                    {s.value}
                  </dd>
                </div>
              )),
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
