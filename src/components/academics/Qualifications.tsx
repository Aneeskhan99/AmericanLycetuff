import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { Container, Eyebrow, SectionHeading, Tag, TagList, lines } from "./ui";

type Content = PageContent<typeof academicsPage>["qualifications"];

/** Cards alternate navy / crimson. */
const BGS = ["bg-navy", "bg-crimson"];

export default function Qualifications({ content: q }: { content: Content }) {
  return (
    <section aria-labelledby="qualifications-title" className="bg-[#f8f8f8] py-[56px] lg:pb-[100px] lg:pt-[130px]">
      <Container>
        <Eyebrow>{q.eyebrow}</Eyebrow>
        <SectionHeading id="qualifications-title" text={q.heading} className="mt-[14px] lg:mt-[20px]" />
        {q.cards.length > 0 && (
          <ul className="mt-[24px] grid grid-cols-1 gap-[32px] md:grid-cols-2 md:gap-[24px] lg:mt-[70px] lg:gap-[38px]">
            {q.cards.map((c, i) => {
              const leadsTo = lines(c.leadsTo);
              return (
                <li
                  key={i}
                  className={`relative flex flex-col overflow-hidden p-[24px] text-center text-white lg:min-h-[560px] lg:px-[72px] lg:pb-[62px] lg:pt-[170px] lg:text-left ${BGS[i % 2]}`}
                >
                  <span
                    aria-hidden
                    className="text-[36px] font-bold leading-[40px] lg:absolute lg:right-[-30px] lg:top-[-40px] lg:whitespace-nowrap lg:text-[260px] lg:leading-[315px] lg:tracking-[-8px] lg:opacity-[0.08]"
                  >
                    {c.watermark}
                  </span>
                  <h3 className="relative mt-[8px] text-[28px] leading-[32px] lg:mt-0 lg:max-w-[560px] lg:text-[clamp(32px,2.08vw,40px)] lg:leading-[1.2]">
                    {c.title}
                  </h3>
                  <span aria-hidden className="relative mt-[28px] hidden h-[3px] w-[60px] bg-[#fd0] lg:block" />
                  <p className="relative mt-[16px] text-[18px] leading-[28px] lg:mt-[37px] lg:max-w-[560px] lg:text-[20px] lg:leading-[32px]">
                    {c.description}
                  </p>
                  {leadsTo.length > 0 && (
                    <>
                      <p className="relative mt-[32px] text-[12px] font-semibold uppercase leading-[20px] tracking-[2.5px] text-[#fd0] lg:mt-auto lg:pt-[48px] lg:leading-[15px]">
                        {q.leadsToLabel}
                      </p>
                      <TagList className="relative mt-[12px] lg:mt-[13px]">
                        {leadsTo.map((t, ti) => (
                          <Tag key={ti} variant="dark">
                            {t}
                          </Tag>
                        ))}
                      </TagList>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
