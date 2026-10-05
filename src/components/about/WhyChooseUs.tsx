import type { CSSProperties } from "react";
import { Rich } from "@/components/site/Rich";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";

type Content = PageContent<typeof aboutPage>["why"];

// Order follows the mobile design (left column first); on desktop the grid flows
// column-first in two columns, so six reasons fill the 2 x 3 grid exactly as in Figma.
export default function WhyChooseUs({ content: c }: { content: Content }) {
  const n = c.reasons.length;
  const rows = Math.max(1, Math.ceil(n / 2));
  const rowStyle = rows === 3 ? undefined : ({ "--rows": `repeat(${rows}, minmax(0, 1fr))` } as CSSProperties);
  return (
    <section aria-labelledby="why-heading" className="bg-white">
      <div className="frame gutter py-[56px] lg:py-[100px]">
        <div className="mx-auto flex max-w-[1452px] flex-col gap-[32px] lg:grid lg:grid-cols-[560fr_892fr] lg:gap-0">
          <div className="flex flex-col items-center bg-[#001e3b] p-[24px] text-center lg:items-start lg:px-[clamp(40px,3.1vw,60px)] lg:pb-[60px] lg:pt-[120px] lg:text-left">
            <p className="w-full text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-[13.1px] lg:leading-[30px] lg:tracking-[2px]">
              {c.eyebrow}
            </p>
            <h2
              id="why-heading"
              className="mt-[14px] w-full text-[30px] leading-[34px] text-white lg:mt-[20px] lg:max-w-[430px] lg:text-[clamp(40px,2.6vw,50px)] lg:leading-[1.14]"
            >
              <Rich text={c.heading} />
            </h2>
            <span aria-hidden className="mt-[36px] hidden h-[3px] w-[60px] bg-[#fd0] lg:block" />
          </div>

          {n > 0 && (
            <ul
              style={rowStyle}
              className={`flex flex-col gap-[24px] bg-navy-deep p-[24px] lg:grid lg:min-h-[780px] lg:grid-flow-col lg:gap-0 ${n > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"} lg:p-0 ${
                rowStyle ? "lg:grid-rows-(--rows)" : "lg:grid-rows-3"
              }`}
            >
              {c.reasons.map(({ text: r }, i) => {
                const leftCol = n > 1 && i < rows;
                const lastRow = i % rows === rows - 1 || i === n - 1;
                return (
                  <li
                    key={i}
                    className={`flex flex-col items-center gap-[28px] text-center lg:items-start lg:gap-[22px] lg:border-white/15 lg:px-[clamp(32px,3.1vw,60px)] lg:pb-[40px] lg:pt-[60px] lg:text-left ${
                      leftCol ? "lg:border-r" : ""
                    } ${lastRow ? "" : "lg:border-b"} ${i === rows && rows > 1 ? "mt-[8px] lg:mt-0" : ""}`}
                  >
                    <span
                      aria-hidden
                      className="flex size-[34px] shrink-0 items-center justify-center bg-crimson text-[20px] font-bold leading-none text-white"
                    >
                      ✓
                    </span>
                    <p className="text-[20px] leading-[31px] text-white lg:max-w-[320px] lg:text-[22px] lg:leading-[32px]">
                      {r}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
