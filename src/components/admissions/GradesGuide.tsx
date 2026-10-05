import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, SectionHeading, Tag, lines, sectionX } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["grades"] };

const cols = "lg:grid lg:grid-cols-[minmax(0,489fr)_minmax(0,300fr)_minmax(0,709fr)] lg:items-center";
const labelClass =
  "whitespace-nowrap text-[13px] font-semibold uppercase leading-[20px] tracking-[2.7083px] text-crimson lg:text-[12px] lg:leading-[normal] lg:tracking-[2.5px]";

function Dot() {
  return <Image src="/images/admissions/legend-dot.svg" alt="" width={4} height={4} className="size-1 shrink-0" />;
}

export default function GradesGuide({ content: c }: Props) {
  // The last row (Senior School in the design) gets the navy marker.
  const stages = c.rows.map((r, i, all) => ({
    stage: r.stage,
    age: r.age,
    entry: lines(r.entry),
    navy: i === all.length - 1 && all.length > 1,
  }));

  return (
    <section aria-labelledby="grades-guide-title" className={`bg-[#f8f8f8] py-14 lg:pb-[87px] lg:pt-[130px] ${sectionX}`}>
      <Container>
        <SectionHeading id="grades-guide-title" eyebrow={c.eyebrow} heading={c.heading} />

        {/* Mobile legend */}
        {stages.length > 0 && (
          <p className="mt-6 flex items-center justify-center gap-2 lg:hidden" aria-hidden>
            <span className={labelClass}>{c.colStage}</span>
            <Dot />
            <span className={labelClass}>{c.colAge}</span>
            <Dot />
            <span className={labelClass}>{c.colEntry}</span>
          </p>
        )}

        {/* Desktop column labels */}
        {stages.length > 0 && (
          <>
            <div className={`mt-[94px] hidden pb-[25px] ${cols}`} aria-hidden>
              <span className={labelClass}>{c.colStage}</span>
              <span className={labelClass}>{c.colAge}</span>
              <span className={labelClass}>{c.colEntry}</span>
            </div>

            <ul className="mt-3 flex flex-col gap-3 lg:mt-0 lg:gap-0 lg:border-t lg:border-solid lg:border-[#d6d6d6]">
              {stages.map((s, i) => (
                <li
                  key={i}
                  className={`relative flex flex-col items-center gap-2 bg-white px-6 py-7 text-center lg:h-[118px] lg:gap-0 lg:border-b lg:border-solid lg:border-[#d6d6d6] lg:bg-transparent lg:p-0 lg:text-left ${cols}`}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-px bottom-0 left-0 hidden w-1 lg:block ${s.navy ? "bg-navy" : "bg-crimson"}`}
                  />
                  <h3 className="w-full text-[24px] font-normal leading-[29px] text-navy lg:pl-[29px] lg:text-[32px] lg:leading-[40px]">
                    {s.stage}
                  </h3>
                  <p className="w-full text-[32px] font-light leading-[36px] tracking-[-0.5px] text-crimson lg:text-[clamp(52px,3.34vw,64px)] lg:leading-[normal] lg:tracking-[-1px]">
                    <span className="sr-only">{c.colAge}: </span>
                    {s.age}
                  </p>
                  <ul aria-label={c.colEntry} className="flex w-full flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-[10px]">
                    {s.entry.map((e, j) => (
                      <li key={j}>
                        <Tag className="w-full border-[#d6d6d6] text-navy lg:w-auto">{e}</Tag>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </section>
  );
}
