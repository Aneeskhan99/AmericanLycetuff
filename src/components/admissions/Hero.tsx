import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Rich } from "@/components/site/Rich";
import { FilledButton, StrokedButton, unoptimized } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["hero"] };

export default function Hero({ content: c }: Props) {
  const stats = c.stats;
  return (
    <section aria-labelledby="admissions-hero-title" className="bg-white lg:px-[clamp(40px,4vw,80px)] lg:pb-[140px] lg:pt-[40px]">
      <div className="relative mx-auto w-full max-w-[1611px]">
        {/* Hero image with navy gradient and yellow frame */}
        <div className="relative flex min-h-[551px] flex-col justify-center overflow-hidden border-y-6 border-solid border-[#fd0] px-6 py-[58px] lg:block lg:h-[720px] lg:min-h-0 lg:border-6 lg:px-0 lg:py-0">
          {c.image.src && (
            <Image
              src={c.image.src}
              alt={c.image.alt}
              unoptimized={unoptimized(c.image.src)}
              fill
              preload
              sizes="(min-width: 1024px) 1611px, 100vw"
              className="object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,30,63,0.93)_0%,rgba(8,30,63,0.62)_55%,rgba(8,30,63,0.1)_100%)]"
          />
          <div className="relative flex flex-col items-center text-center text-white lg:items-start lg:pl-[120px] lg:pr-10 lg:pt-[130px] lg:text-left">
            <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] lg:text-[17.13px] lg:leading-[normal] lg:tracking-[1.9px]">
              {c.eyebrow}
            </p>
            <h1
              id="admissions-hero-title"
              className="mt-8 text-[36px] font-bold capitalize leading-[40px] lg:mt-[26px] lg:max-w-[clamp(600px,44.8vw,860px)] lg:text-[clamp(52px,3.65vw,70px)] lg:leading-[1.2958]"
            >
              <Rich text={c.heading} />
            </h1>
            <p className="mt-4 text-[20px] leading-[31px] tracking-[0.4545px] lg:mt-[26px] lg:max-w-[640px] lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
              {c.intro}
            </p>
            {(c.primary.label || c.secondary.label) && (
              <div className="mt-6 flex w-full flex-col gap-3 lg:mt-[26px] lg:w-auto lg:flex-row lg:gap-5">
                {c.primary.label && (
                  <FilledButton href={c.primary.href} className="w-full lg:w-auto">
                    {c.primary.label}
                  </FilledButton>
                )}
                {c.secondary.label && (
                  <StrokedButton href={c.secondary.href} className="w-full lg:w-auto">
                    {c.secondary.label}
                  </StrokedButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat cards: stacked on mobile, overlapping the image bottom-right on desktop */}
        {stats.length > 0 && (
          <ul className="flex flex-col gap-3 px-6 pb-10 pt-8 text-center text-white lg:absolute lg:right-[6px] lg:top-[620px] lg:flex-row lg:gap-[30px] lg:p-0">
            {stats.map((s, i) => (
              <li
                key={i}
                className="flex flex-col items-center justify-center gap-[6px] bg-crimson px-5 py-7 lg:h-[199px] lg:w-[230px] lg:gap-[14px] lg:px-6 lg:py-[60px]"
              >
                <span className="text-[28px] font-semibold uppercase leading-[normal] tracking-[2.5px] whitespace-nowrap">{s.value}</span>
                <span className="text-[13.8px] leading-[22px] tracking-[0.7px] lg:w-[180px]">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
