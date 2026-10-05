import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, SectionHeading, Tag, lines, sectionX, unoptimized } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["process"] };

/** Long step names (e.g. "Assessment and Enrolment") are set a size smaller so they fit. */
const isLong = (title: string) => title.length > 16;

export default function AdmissionProcess({ content: c }: Props) {
  const steps = c.steps.map((s, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: s.title,
    body: s.body,
    chips: lines(s.chips),
    image: s.image.src,
    alt: s.image.alt,
    small: isLong(s.title),
  }));

  return (
    <section aria-labelledby="admission-process-title" className={`bg-navy-ink py-14 lg:pb-[120px] lg:pt-[130px] ${sectionX}`}>
      <Container>
        <SectionHeading id="admission-process-title" eyebrow={c.eyebrow} heading={c.heading} tone="dark" />

        {/* Mobile / tablet: stacked step cards */}
        {steps.length > 0 && (
          <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:hidden">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col border border-solid border-white/14 bg-white/6">
                <div className="relative h-[189px] border-[1.5px] border-solid border-white/40">
                  {s.image && (
                    <Image
                      src={s.image}
                      alt={s.alt}
                      unoptimized={unoptimized(s.image)}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col items-center gap-[10px] px-6 pb-7 pt-6 text-center text-white">
                  <span aria-hidden className="text-[36px] font-light leading-[40px] tracking-[-1.0588px] text-crimson">
                    {s.n}
                  </span>
                  <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0]">Step {s.n}</p>
                  <h3 className={`font-normal ${s.small ? "text-[27px] leading-[32px]" : "text-[32px] leading-[36px]"}`}>{s.title}</h3>
                  <p className="text-[16px] leading-[25px] tracking-[0.2824px]">{s.body}</p>
                  {s.chips.length > 0 && (
                    <ul className="flex w-full flex-col gap-2">
                      {s.chips.map((chip, i) => (
                        <li key={i}>
                          <Tag className="w-full border-white/40 text-white">{chip}</Tag>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Desktop: numbered journey with a vertical timeline */}
        {steps.length > 0 && (
          <ol className="relative mt-[84px] hidden flex-col gap-10 [--num:clamp(170px,15.5vw,298px)] lg:flex">
            <span aria-hidden className="absolute bottom-[58px] left-[calc(var(--num)+10px)] top-[42px] w-[2px] bg-white/25" />
            {steps.map((s) => (
              <li key={s.n} className="relative flex items-start">
                <span aria-hidden className="w-(--num) shrink-0">
                  <span className="relative -left-[6px] block text-[clamp(110px,8.85vw,170px)] font-light leading-[normal] tracking-[-5px] text-crimson">
                    {s.n}
                  </span>
                </span>
                <span aria-hidden className="relative mt-[58px] size-[22px] shrink-0">
                  <Image
                    src="/images/admissions/journey-node.svg"
                    alt=""
                    width={38}
                    height={38}
                    className="absolute -left-[8px] -top-[8px] max-w-none"
                  />
                </span>
                <div className="ml-[clamp(32px,3.6vw,69px)] mr-6 mt-10 min-w-0 flex-1 text-white lg:max-w-[520px]">
                  <p className="text-[13.1px] font-semibold uppercase leading-[normal] tracking-[2px] text-[#fd0]">Step {s.n}</p>
                  <h3 className={`mt-[18px] font-normal ${s.small ? "text-[40px] leading-[48px]" : "text-[56px] leading-[62px]"}`}>
                    {s.title}
                  </h3>
                  <p className="mt-[18px] max-w-[480px] text-[17px] leading-[28px] tracking-[0.3px]">{s.body}</p>
                  {s.chips.length > 0 && (
                    <ul className="mt-[18px] flex flex-wrap gap-[10px]">
                      {s.chips.map((chip, i) => (
                        <li key={i}>
                          <Tag className="border-white/40 text-white">{chip}</Tag>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative ml-auto mt-5 aspect-[500/270] w-[clamp(340px,26.05vw,500px)] shrink-0 border-[1.5px] border-dashed border-white/40">
                  {s.image && (
                    <Image src={s.image} alt={s.alt} unoptimized={unoptimized(s.image)} fill sizes="500px" className="object-cover" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </section>
  );
}
