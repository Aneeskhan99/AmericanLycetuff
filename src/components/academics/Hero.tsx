import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { CmsLink, unoptimized } from "./ui";

type Content = PageContent<typeof academicsPage>["hero"];

export default function Hero({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="academics-hero-title" className="bg-white lg:pb-[41px] lg:pt-[40px]">
      <div className="frame lg:px-[clamp(40px,7.76vw,155px)]">
        <div className="relative mx-auto w-full max-w-[1611px]">
          {/* Image panel */}
          <div className="relative flex min-h-[530px] flex-col items-center overflow-hidden px-[24px] py-[64px] lg:h-[clamp(560px,37.5vw,720px)] lg:min-h-0 lg:items-start lg:px-[clamp(40px,4.11vw,79px)] lg:py-0 lg:pt-[clamp(80px,6.85vw,131.5px)]">
            {c.image.src && (
              <Image
                src={c.image.src}
                alt={c.image.alt}
                unoptimized={unoptimized(c.image.src)}
                fill
                preload
                quality={85}
                sizes="(min-width: 1024px) 1700px, 100vw"
                className="object-cover"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,30,63,0.74)_0%,rgba(8,30,63,0.48)_55%,rgba(8,30,63,0.08)_100%)]"
            />

            <div className="relative flex w-full flex-col items-center text-center text-white lg:w-auto lg:items-start lg:gap-[16px] lg:text-left">
              <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.77px] lg:text-[17.13px] lg:leading-[21px] lg:tracking-[1.9px]">
                {c.eyebrow}
              </p>
              <h1
                id="academics-hero-title"
                className="mt-[32px] text-[36px] font-bold capitalize leading-[40px] lg:mt-0 lg:max-w-[900px] lg:text-[clamp(48px,3.65vw,70px)] lg:leading-[1.296]"
              >
                <Rich text={c.heading} />
              </h1>
              <p className="mt-[16px] text-[20px] leading-[31px] tracking-[0.45px] lg:mt-0 lg:max-w-[660px] lg:text-[clamp(18px,1.15vw,22px)] lg:leading-[1.545] lg:tracking-[0.5px]">
                {c.intro}
              </p>
              {c.button.label && (
                <CmsLink
                  href={c.button.href}
                  className="mt-[24px] flex w-full justify-center bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-[21px] tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:mt-0 lg:w-auto"
                >
                  {c.button.label}
                </CmsLink>
              )}
            </div>
          </div>

          {/* Mobile: 6px yellow band under the image */}
          <div aria-hidden className="relative z-10 h-[6px] bg-[#fd0] lg:hidden" />

          {/* Stat cards: overlap the image bottom-right on desktop, stacked below on mobile */}
          {c.stats.length > 0 && (
            <ul className="flex flex-col gap-[12px] px-[24px] pb-[40px] pt-[26px] text-center text-white lg:relative lg:z-10 lg:-mt-[100px] lg:mr-[6px] lg:flex-row lg:justify-end lg:gap-[30px] lg:p-0">
              {c.stats.map((s, i) => (
                <li
                  key={i}
                  className="flex flex-col items-center justify-center gap-[6px] bg-crimson px-[20px] py-[28px] lg:h-[199px] lg:w-[230px] lg:gap-[14px] lg:px-[24px] lg:py-[60px]"
                >
                  <p className="text-[28px] font-semibold uppercase leading-[34px] tracking-[2.5px]">{s.value}</p>
                  <p className="text-[15px] leading-[22px] tracking-[0.7px] lg:w-[180px] lg:text-[13.8px]">{s.label}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
