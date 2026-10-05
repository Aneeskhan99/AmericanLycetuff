import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, SectionHeading, sectionX } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["dates"] };

/** Card colours by position; repeats for extra cards. */
const cardBgs = ["bg-navy", "bg-crimson", "bg-navy-ink", "bg-navy"];

export default function KeyDates({ content: c }: Props) {
  const dates = c.items.map((d, i) => ({ ...d, bg: cardBgs[i % cardBgs.length] }));

  return (
    <section aria-labelledby="key-dates-title" className={`bg-[#f8f8f8] py-14 lg:pb-[120px] lg:pt-[130px] ${sectionX}`}>
      <Container>
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
          <SectionHeading id="key-dates-title" eyebrow={c.eyebrow} heading={c.heading} />
          {c.note && (
            <p className="mt-4 text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:mt-[70px] lg:w-[520px] lg:max-w-[40%] lg:shrink-0 lg:text-left lg:leading-[30px]">
              {c.note}
            </p>
          )}
        </div>

        {dates.length > 0 && (
          <ul className="mt-6 grid gap-[18px] md:grid-cols-2 lg:mt-[114px] lg:grid-cols-4 lg:gap-[33px]">
            {dates.map((d, i) => (
              <li
                key={i}
                className={`flex flex-col items-center p-6 text-center text-white lg:h-[320px] lg:items-start lg:px-9 lg:pb-0 lg:pt-10 lg:text-left ${d.bg}`}
              >
                <h3 className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-[13.1px] lg:leading-[normal] lg:tracking-[2px]">
                  {d.label}
                </h3>
                <span aria-hidden className="mt-5 hidden h-[3px] w-10 bg-[#fd0] lg:block" />
                <p className="mt-[14px] text-[32px] font-light leading-[36px] tracking-[-0.5px] lg:mt-[71px] lg:text-[clamp(52px,3.34vw,64px)] lg:leading-[normal] lg:tracking-[-1px]">
                  {d.date}
                </p>
                <p className="mt-4 text-[15px] leading-[23px] tracking-[0.75px] lg:mt-[13px] lg:text-[14px] lg:leading-[normal] lg:tracking-[0.7px]">
                  {d.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
