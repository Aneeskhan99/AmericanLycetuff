import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { HorizontalScrollLine } from "./ScrollLines";
import { body, btnNavy, CmsLink, eyebrow, heading, unoptimized } from "./ui";

function Check() {
  return (
    <span aria-hidden className="relative block size-[28px] shrink-0">
      <span className="absolute left-0 top-0 size-[28px] rounded-[7px] bg-[#d9d9d9]" />
      <Image
        src="/images/home/check-tick.png"
        alt=""
        width={25}
        height={18}
        sizes="50px"
        className="absolute left-[5px] top-[3.85px] h-[18px] w-[25px] max-w-none object-cover"
      />
    </span>
  );
}

/** "A National School with a Local Heart." intro (Figma Component 1). */
export default function AboutIntro({ content: c }: { content: HomeContent["about"] }) {
  return (
    <section className="relative overflow-hidden bg-[#f8f8f8] px-[24px] py-[56px] lg:mt-[39px] lg:px-[6vw] lg:py-[clamp(100px,8.33vw,160px)]">
      <HorizontalScrollLine />
      <div className="mx-auto flex max-w-[1498px] flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-[clamp(48px,4vw,77px)]">
        <div className="flex w-full flex-col items-center text-center lg:w-[563px] lg:shrink-0 lg:items-start lg:gap-[50px] lg:text-left">
          <div className="flex w-full flex-col gap-[32px] lg:gap-[23px]">
            <div className="flex flex-col gap-[14px] text-black lg:gap-[10px]">
              {c.eyebrow && <p className={eyebrow}>{c.eyebrow}</p>}
              <h2 className={`${heading} mt-0 lg:mt-0`}>
                <Rich text={c.heading} />
              </h2>
              {c.body && <p className={`${body} mt-[2px] lg:mt-0`}>{c.body}</p>}
            </div>
            {c.points.length > 0 && (
              <ul className="flex flex-col gap-[18px] lg:gap-[23px]">
                {c.points.map((p, i) => (
                  <li key={i} className="flex items-center gap-[10px] lg:gap-[20px]">
                    <Check />
                    <span className={`${body} flex-1 text-black lg:flex-none`}>{p.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {c.button.label && c.button.href && (
            <CmsLink href={c.button.href} className={`${btnNavy} mt-[26px] w-full lg:mt-0 lg:w-auto`}>
              {c.button.label}
            </CmsLink>
          )}
        </div>

        <div className="relative mt-[32px] h-[442px] w-full shadow-[-14.11px_14.11px_0px_0px_#d31245] lg:mt-0 lg:aspect-[858/631] lg:h-auto lg:max-w-[858px] lg:flex-1">
          <div className="absolute inset-0 overflow-hidden">
            {c.photo.src && (
              <Image
                src={c.photo.src}
                alt={c.photo.alt}
                unoptimized={unoptimized(c.photo.src)}
                width={1920}
                height={1286}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="absolute h-full w-full max-w-none object-cover lg:left-[-6.31%] lg:top-[-1.03%] lg:h-[102.06%] lg:w-[112.61%]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
