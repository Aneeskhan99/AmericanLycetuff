import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { Container, Eyebrow, SectionHeading, num } from "./ui";

type Content = PageContent<typeof academicsPage>["beyond"];

/** Colour block cycles navy / crimson / navy-ink / crimson; on wide screens each row of four steps down. */
const BGS = ["bg-navy", "bg-crimson", "bg-navy-ink", "bg-crimson"];
const OFFSETS = ["xl:mt-0", "xl:mt-[50px]", "xl:mt-[100px]", "xl:mt-[150px]"];

export default function BeyondTextbook({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="beyond-title" className="bg-white py-[56px] lg:pb-[90px] lg:pt-[130px]">
      <Container>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <SectionHeading id="beyond-title" text={c.heading} className="mt-[14px] lg:mt-[20px]" />
        {c.items.length > 0 && (
          <ul className="mt-[24px] grid grid-cols-1 gap-[32px] md:grid-cols-2 lg:mt-[110px] lg:items-start xl:grid-cols-4 lg:gap-[33px]">
            {c.items.map((item, i) => {
              const it = { ...item, n: num(i), bg: BGS[i % 4], offset: OFFSETS[i % 4] };
              return (
                <li key={i} className={`flex flex-col gap-[28px] lg:gap-0 ${it.offset}`}>
                  <div
                    className={`flex flex-col items-center p-[24px] text-white lg:h-[250px] lg:items-start lg:justify-between lg:px-[32px] lg:pb-[37px] lg:pt-[20px] ${it.bg}`}
                  >
                    <span
                      aria-hidden
                      className="text-[36px] font-light leading-[40px] tracking-[-0.5px] lg:text-[clamp(96px,6.25vw,120px)] lg:leading-[1.21] lg:tracking-[-3px]"
                    >
                      {it.n}
                    </span>
                    <span aria-hidden className="hidden h-[3px] w-[40px] bg-[#fd0] lg:block" />
                  </div>
                  <div className="flex flex-col bg-[#f8f8f8] p-[24px] text-center lg:min-h-[230px] lg:p-[32px] lg:text-left">
                    <h3 className="text-[20px] leading-[31px] text-navy lg:text-[clamp(22px,1.3vw,25px)] lg:leading-[34px]">
                      {it.title}
                    </h3>
                    <p className="mt-[14px] text-[15.5px] leading-[25px] text-[#5c5c5c] lg:mt-[16px] lg:leading-[24px]">
                      {it.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
