import { Rich } from "@/components/site/Rich";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";
import { num } from "./cms";

type Content = PageContent<typeof aboutPage>["values"];

/** Accent alternates crimson / navy; on desktop each row of four steps down like a staircase. */
const OFFSETS = ["", "lg:mt-[70px]", "lg:mt-[140px]", "lg:mt-[210px]"];
const look = (i: number) => ({ accent: i % 2 === 0 ? "crimson" : "navy", offset: OFFSETS[i % 4] });

export default function Values({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="values-heading" className="bg-[#f8f8f8]">
      <div className="frame gutter py-[56px] lg:pb-[146px] lg:pt-[130px]">
        <div className="mx-auto max-w-[1498px] text-center text-black lg:text-left">
          <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
            {c.eyebrow}
          </p>
          <h2
            id="values-heading"
            className="mt-[14px] text-[32px] leading-[36px] lg:mt-[20px] lg:text-[clamp(44px,2.92vw,56px)] lg:leading-[1.1429]"
          >
            <Rich text={c.heading} />
          </h2>

          {c.items.length > 0 && (
            <ol className="mt-[24px] grid gap-[32px] md:grid-cols-2 lg:mt-[100px] lg:grid-cols-4 lg:items-start lg:gap-[clamp(28px,2.7vw,52px)]">
              {c.items.map((item, i) => {
                const v = { ...item, ...look(i), n: num(i) };
                return (
                  <li key={i} className={v.offset}>
                    <span
                      aria-hidden
                      className={`hidden h-[3px] w-full max-w-[340px] lg:block ${v.accent === "crimson" ? "bg-crimson" : "bg-navy"}`}
                    />
                    <p
                      className={`text-[36px] font-light leading-[40px] tracking-[-0.75px] lg:mt-[21px] lg:text-[clamp(72px,5vw,96px)] lg:leading-[1.2083] lg:tracking-[-2px] ${
                        v.accent === "crimson" ? "text-crimson" : "text-navy"
                      }`}
                    >
                      {v.n}
                    </p>
                    <h3 className="mt-[8px] text-[24px] leading-[29px] text-navy lg:mt-[20px] lg:text-[clamp(26px,1.67vw,32px)] lg:leading-[40px]">
                      {v.title}
                    </h3>
                    <p className="mt-[16px] text-[16px] leading-[25px] tracking-[0.2963px] text-[#5c5c5c] lg:max-w-[320px] lg:text-[16.2px] lg:leading-[26px] lg:tracking-[0.3px]">
                      {v.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
