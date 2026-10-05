import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { btnCrimson, CmsLink, unoptimized } from "./ui";

/** "Every Stage, under One Roof" programmes row (Figma Component 6). */
export default function Stages({ content: c }: { content: HomeContent["stages"] }) {
  /** Fewer than four cards are centred instead of leaving empty columns. */
  const few = c.cards.length < 4;
  return (
    <section className="bg-white pt-[56px] lg:px-[6vw] lg:py-[clamp(100px,8.33vw,160px)]">
      <div className="mx-auto flex max-w-[1552px] flex-col items-center lg:gap-[60px]">
        <div className="flex flex-col items-center gap-[16px] px-[24px] text-center lg:gap-[25px] lg:px-0">
          <h2 className="font-inter text-[30px] leading-[34px] text-[#222] lg:text-[clamp(38px,2.6vw,49.89px)] lg:leading-[1.1515]">
            <Rich text={c.heading} />
          </h2>
          {c.intro && (
            <p className="max-w-[834px] font-inter text-[16px] leading-[25px] text-black lg:text-[16.227px] lg:leading-[26.205px]">
              {c.intro}
            </p>
          )}
        </div>

        {c.cards.length > 0 && (
          <ul
            className={`grid w-full grid-cols-1 gap-[32px] px-[24px] pt-[56px] md:grid-cols-2 lg:grid-cols-4 lg:gap-[clamp(24px,4.17vw,80px)] lg:px-0 lg:pt-0 ${
              few ? "md:flex md:flex-wrap md:justify-center" : ""
            }`}
          >
            {c.cards.map((s, i) => (
              <li key={i} className={few ? "md:w-[calc(50%-16px)] lg:w-[328px]" : undefined}>
                <CmsLink
                  href={s.href || "/academics"}
                  className="group flex flex-col items-center px-[24px] pb-[28px] pt-[20px] text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson lg:gap-[9.939px] lg:p-0"
                >
                  <span className="relative block h-[230px] w-full overflow-hidden lg:aspect-square lg:h-auto lg:max-w-[328px]">
                    {s.photo.src && (
                      <Image
                        src={s.photo.src}
                        alt={s.photo.alt}
                        unoptimized={unoptimized(s.photo.src)}
                        fill
                        sizes="(min-width: 1024px) 328px, (min-width: 768px) 45vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {/* Hover state: navy wedge slides up and the crimson arrow appears */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/home/stage-hover-overlay.svg"
                      alt=""
                      aria-hidden
                      className="absolute inset-0 size-full translate-y-[102.45%] transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/home/stage-arrow-icon-hover.svg"
                      alt=""
                      aria-hidden
                      width={49.697}
                      height={49.697}
                      className="absolute left-1/2 top-1/2 size-[49.697px] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity delay-150 duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    />
                  </span>
                  <span className="mt-[26px] block font-inter text-[13px] font-semibold uppercase leading-[20px] tracking-[4.0697px] text-crimson lg:mt-0 lg:text-[12px] lg:leading-[22.54px] lg:tracking-[3.7566px]">
                    {s.ages}
                  </span>
                  <span className="mt-[12px] flex flex-col gap-[14px] lg:mt-0 lg:gap-[4.97px]">
                    <span className="font-inter text-[20px] leading-[31px] text-navy lg:text-[clamp(20px,1.3vw,25.044px)] lg:leading-[40.071px]">
                      {s.title}
                    </span>
                    <span className="font-inter text-[15px] leading-[23px] text-[#5c5c5c] lg:max-w-[328px] lg:text-[13.774px] lg:leading-[20.5px]">
                      {s.text}
                    </span>
                  </span>
                </CmsLink>
              </li>
            ))}
          </ul>
        )}

        {c.button.label && c.button.href && (
          <div className="w-full px-[24px] py-[32px] lg:w-auto lg:p-0">
            <CmsLink href={c.button.href} className={`${btnCrimson} w-full lg:w-auto`}>
              {c.button.label}
            </CmsLink>
          </div>
        )}
      </div>
    </section>
  );
}
