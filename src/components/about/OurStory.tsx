import Image from "next/image";
import type { CSSProperties } from "react";
import { Rich } from "@/components/site/Rich";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";
import { unoptimized } from "./cms";

type Content = PageContent<typeof aboutPage>["story"];

/** Desktop timeline columns: the 3-item design keeps its Figma proportions; other counts share the row (max 4 per row). */
function timelineCols(n: number) {
  if (n === 3) return { className: "lg:grid-cols-[540fr_540fr_418fr]", style: undefined };
  const cols = Math.max(1, Math.min(n, 4));
  return {
    className:
      n > 4 ? "lg:[grid-template-columns:var(--cols)] lg:gap-y-[64px]" : "lg:[grid-template-columns:var(--cols)]",
    style: { "--cols": `repeat(${cols}, minmax(0, 1fr))` } as CSSProperties,
  };
}

export default function OurStory({ content: c }: { content: Content }) {
  const cols = timelineCols(c.milestones.length);
  return (
    <section aria-labelledby="our-story-heading" className="bg-[#f8f8f8]">
      <div className="frame gutter py-[56px] lg:pb-[144px] lg:pt-[140px]">
        <div className="mx-auto max-w-[1498px]">
          <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between lg:gap-[60px]">
            <div className="w-full text-center text-black lg:max-w-[640px] lg:flex-1 lg:text-left">
              <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
                {c.eyebrow}
              </p>
              <h2
                id="our-story-heading"
                className="mt-[14px] text-[32px] leading-[36px] lg:mt-[20px] lg:text-[clamp(44px,2.92vw,56px)] lg:leading-[1.1429]"
              >
                <Rich text={c.heading} />
              </h2>
              <p className="mt-[16px] text-[16px] leading-[25px] tracking-[0.4938px] lg:mt-[36px] lg:max-w-[600px] lg:text-[16.2px] lg:leading-[27px] lg:tracking-[0.5px]">
                {c.body}
                {c.body2 && (
                  <>
                    {" "}
                    <span className="lg:mt-[27px] lg:block">{c.body2}</span>
                  </>
                )}
              </p>
            </div>

            {/* Story photo with offset crimson accent block (desktop) */}
            <div className="relative mt-[26px] w-full lg:mr-[calc(-1*min(87px,4.5vw))] lg:mt-[14px] lg:w-[min(796px,47vw)] lg:shrink-0 lg:pb-[16px] lg:pl-[16px]">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 hidden h-[calc(100%-16px)] w-[calc(100%-16px)] bg-crimson lg:block"
              />
              <div className="relative h-[254px] w-full overflow-hidden lg:aspect-[780/580] lg:h-auto">
                {c.image.src && (
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    unoptimized={unoptimized(c.image.src)}
                    fill
                    sizes="(min-width: 1024px) min(780px, 46vw), calc(100vw - 48px)"
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {c.milestones.length > 0 && (
            <div className="relative mt-[20px] lg:mt-[142px]">
              <div aria-hidden className="absolute left-0 right-0 top-[8px] hidden h-[2px] bg-[#d6d6d6] lg:block" />
              <ol style={cols.style} className={`relative flex flex-col gap-[32px] lg:grid lg:gap-0 ${cols.className}`}>
                {c.milestones.map((m, i) => (
                  <li key={i} className="text-center lg:text-left">
                    <Image
                      src="/images/about/timeline-dot.svg"
                      unoptimized
                      alt=""
                      width={18}
                      height={18}
                      className="hidden size-[18px] lg:block"
                    />
                    <p className="text-[32px] font-light leading-[36px] tracking-[-0.5px] text-navy lg:mt-[26px] lg:text-[64px] lg:leading-[77px] lg:tracking-[-1px]">
                      {m.year}
                    </p>
                    <p className="mt-[16px] text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-crimson lg:mt-[7px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
                      {m.label}
                    </p>
                    <p className="mt-[12px] text-[15px] leading-[23px] text-[#5c5c5c] lg:mt-[14px] lg:max-w-[380px] lg:pr-[16px] lg:text-[14.8px]">
                      {m.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
