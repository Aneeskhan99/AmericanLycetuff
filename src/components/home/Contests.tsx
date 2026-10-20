import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { CmsLink, unoptimized } from "./ui";

/** "Where Our Students Compete" contests strip (Figma 448:2323 desktop, 448:3200 mobile). */
export default function Contests({ content: c }: { content: HomeContent["contests"] }) {
  // The link used to point at the Academics contests list; edits saved before the Competitions page existed still carry that address.
  const href = c.link.href === "/academics#contests-title" ? "/competitions" : c.link.href;
  const hasLink = c.link.label && href;
  return (
    <section aria-labelledby="home-contests-title" className="bg-white px-[24px] py-[56px] lg:px-[6vw] lg:py-[110px]">
      <div className="mx-auto max-w-[1330px]">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-end lg:justify-between lg:gap-[40px] lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <h2
              id="home-contests-title"
              className="font-inter text-[30px] leading-[37px] text-navy lg:text-[clamp(40px,2.92vw,56px)] lg:leading-[1.143]"
            >
              <Rich text={c.heading} />
            </h2>
            {c.body && (
              <p className="mt-[14px] font-inter text-[16px] leading-[25px] text-[#5c5c5c] lg:mt-[20px] lg:max-w-[600px] lg:text-[16.2px] lg:leading-[26px]">
                {c.body}
              </p>
            )}
          </div>
          {hasLink && (
            <CmsLink
              href={href}
              className="group hidden shrink-0 items-center gap-[12px] border-b-[1.5px] border-crimson py-[6px] font-inter font-medium whitespace-nowrap text-crimson transition-colors duration-200 hover:border-navy hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:flex"
            >
              <span className="text-[15px] uppercase leading-[18px] tracking-[1.2px]">{c.link.label}</span>
              <span aria-hidden className="text-[18px] leading-[22px] transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </CmsLink>
          )}
        </div>

        {c.items.length > 0 && (
          <ul className="mt-[28px] grid grid-cols-2 gap-x-[12px] gap-y-[20px] md:grid-cols-3 lg:mt-[56px] lg:grid-cols-7 lg:gap-[21px]">
            {c.items.map((it, i) => (
              <li key={i} className="flex flex-col items-center gap-[10px] max-lg:[&:nth-child(n+7)]:hidden lg:gap-[14px]">
                <div className="relative h-[96px] w-full border border-[#d6d6d6] bg-white lg:h-[120px]">
                  {it.logo.src && (
                    <div className="absolute inset-[7px] lg:inset-[9px]">
                      <Image
                        src={it.logo.src}
                        alt={it.logo.alt}
                        unoptimized={unoptimized(it.logo.src)}
                        fill
                        quality={85}
                        sizes="(min-width: 1024px) 152px, 50vw"
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="w-full text-center font-inter text-[13px] font-medium leading-[18px] text-navy">{it.name}</p>
              </li>
            ))}
          </ul>
        )}

        {hasLink && (
          <CmsLink
            href={href}
            className="mt-[28px] flex w-full items-center justify-center border-[1.5px] border-crimson px-[20px] py-[17px] text-center font-inter text-[15.5px] font-medium uppercase leading-[19px] tracking-[1.5px] text-crimson transition-colors duration-200 hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:hidden"
          >
            {c.linkShort || c.link.label}
          </CmsLink>
        )}
      </div>
    </section>
  );
}
