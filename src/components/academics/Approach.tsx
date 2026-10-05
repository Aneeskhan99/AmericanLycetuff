import type { CSSProperties } from "react";
import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { Container, Eyebrow, SectionHeading, num } from "./ui";

type Content = PageContent<typeof academicsPage>["approach"];

/**
 * Rising steps: heights climb evenly from 300px to 580px on desktop (300 / 440 / 580
 * for the three-step design). The first step is navy, the middle ones deep navy,
 * the last one crimson.
 */
function look(i: number, n: number) {
  const h = n === 1 ? 580 : Math.round(300 + ((580 - 300) * i) / (n - 1));
  const bg = i === n - 1 ? "bg-crimson" : i === 0 ? "bg-navy-deep lg:bg-navy" : "bg-navy-deep";
  const mobileLabel = i === 0 ? "text-[22px] leading-[30px]" : "text-[20px] leading-[31px]";
  return { style: { "--h": `${h}px` } as CSSProperties, bg, mobileLabel };
}

export default function Approach({ content: c }: { content: Content }) {
  const n = c.steps.length;
  // Up to three steps keep their fixed design width; more steps share the row.
  const many = n > 3;
  return (
    <section aria-labelledby="approach-title" className="bg-[#f8f8f8] py-[56px] lg:pb-[100px] lg:pt-[150px]">
      <Container className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-[40px]">
        <div className="lg:max-w-[640px]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <SectionHeading id="approach-title" text={c.heading} className="mt-[12px] lg:mt-[20px] lg:max-w-[640px]" />
          <p className="mt-[16px] text-center text-[16px] leading-[25px] tracking-[0.49px] text-black lg:mt-[36px] lg:max-w-[560px] lg:text-left lg:text-[16.2px] lg:leading-[27px] lg:tracking-[0.5px]">
            {c.body}
          </p>
        </div>

        {n > 0 && (
          <ol
            className={`mt-[82px] flex flex-col gap-[9px] lg:mt-[90px] xl:mr-[-33px] lg:flex-row lg:items-end lg:gap-[16px] ${
              many ? "lg:min-w-0 lg:flex-1" : ""
            }`}
          >
            {c.steps.map((s, i) => {
              const l = look(i, n);
              return (
                <li
                  key={i}
                  style={l.style}
                  className={`flex flex-col items-center p-[24px] text-center text-white lg:items-start lg:justify-between lg:p-[20px] xl:p-[clamp(24px,1.67vw,32px)] lg:text-left lg:h-(--h) ${
                    many ? "lg:min-w-0 lg:flex-1" : "lg:w-[170px] lg:shrink-0 xl:w-[clamp(200px,12.5vw,240px)]"
                  } ${l.bg}`}
                >
                  <span className="text-[32px] font-light leading-[36px] tracking-[-0.5px] lg:text-[64px] lg:leading-[77px] lg:tracking-[-1px]">
                    {num(i)}
                  </span>
                  <span className="mt-[16px] flex flex-col lg:mt-0">
                    <span aria-hidden className="hidden h-[3px] w-[40px] bg-[#fd0] lg:mb-[17px] lg:block" />
                    <span
                      className={`${l.mobileLabel} lg:max-w-[176px] lg:text-[clamp(17px,1.15vw,22px)] lg:leading-[30px]`}
                    >
                      {s.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Container>
    </section>
  );
}
