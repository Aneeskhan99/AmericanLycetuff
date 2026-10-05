import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";
import { CmsLink, unoptimized } from "./cms";

type Content = PageContent<typeof aboutPage>["hero"];

export default function AboutHero({ content: c }: { content: Content }) {
  return (
    <section aria-labelledby="about-hero-heading" className="bg-white">
      <div className="frame lg:gutter lg:pb-[140px] lg:pt-[40px]">
        <div className="relative mx-auto lg:max-w-[1611px]">
          {/* Image panel: yellow top/bottom border on mobile, clean crop on desktop */}
          <div className="relative flex min-h-[513px] flex-col items-center justify-center overflow-hidden border-y-[6px] border-[#fd0] px-[24px] py-[64px] lg:block lg:h-[clamp(560px,37.5vw,720px)] lg:min-h-0 lg:border-0 lg:p-0">
            <div className="absolute inset-0 lg:inset-x-[-0.93%] lg:inset-y-[-0.9%]">
              {c.image.src && (
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  unoptimized={unoptimized(c.image.src)}
                  fill
                  preload
                  sizes="(min-width: 1024px) min(1641px, 86vw), 100vw"
                  className="object-cover"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,30,63,0.55)_0%,rgba(8,30,63,0.36)_55%,rgba(8,30,63,0.06)_100%)]"
              />
            </div>

            <div className="relative flex w-full flex-col items-center text-center text-white lg:absolute lg:left-[clamp(40px,5.5vw,105px)] lg:top-[clamp(80px,7.45vw,143.5px)] lg:w-auto lg:items-start lg:gap-[26px] lg:text-left">
              <p className="w-full text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] lg:w-auto lg:text-[17.13px] lg:leading-normal lg:tracking-[1.9px]">
                {c.eyebrow}
              </p>
              <h1
                id="about-hero-heading"
                className="mt-[32px] w-full text-[36px] font-bold capitalize leading-[40px] lg:mt-0 lg:w-[clamp(620px,46.9vw,900px)] lg:text-[clamp(48px,3.65vw,70px)] lg:leading-[1.2958]"
              >
                <Rich text={c.heading} />
              </h1>
              <p className="mt-[16px] w-full text-[20px] leading-[31px] tracking-[0.4545px] lg:mt-0 lg:w-[640px] lg:max-w-full lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
                {c.intro}
              </p>
              {c.button.label && (
                <CmsLink
                  href={c.button.href}
                  className="mt-[24px] flex w-full justify-center bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase leading-normal tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:mt-0 lg:w-auto"
                >
                  {c.button.label}
                </CmsLink>
              )}
            </div>
          </div>

          {/* Stat cards: overlap the bottom-right of the image on desktop */}
          {c.stats.length > 0 && (
            <ul className="flex flex-col gap-[12px] px-[24px] pb-[40px] pt-[32px] text-center text-white lg:absolute lg:bottom-[-99px] lg:right-[-10px] lg:flex-row lg:gap-[38px] lg:p-0">
              {c.stats.map((s, i) => (
                <li
                  key={i}
                  className="flex flex-col items-center justify-center gap-[6px] bg-crimson px-[20px] py-[28px] lg:h-[199px] lg:w-[200px] lg:gap-[14px] lg:px-[24px] lg:py-[60px]"
                >
                  <span
                    className={`w-full font-semibold uppercase leading-normal lg:w-auto lg:whitespace-nowrap ${
                      s.value.length > 5 ? "text-[30px] tracking-[2.5px]" : "text-[40px] tracking-[3.8px]"
                    }`}
                  >
                    {s.value}
                  </span>
                  <span className="w-full text-[15px] leading-[22px] tracking-[0.7px] lg:w-[150px] lg:text-[13.8px]">
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
