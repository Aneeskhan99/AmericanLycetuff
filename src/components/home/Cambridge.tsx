import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { btn, btnFit, btnWhite, CmsLink, softBreaks, unoptimized } from "./ui";

const DEFAULT_PHOTO = "/images/home/cambridge-students.jpg";
/** Desktop crop of the default photo (from Figma). Any other photo simply covers the panel. */
const DEFAULT_CROP = { left: "-44.64%", top: "-40.38%", width: "162.62%", height: "175.21%" };
const COVER = { left: "0%", top: "0%", width: "100%", height: "100%" };

/** Outlined white button ("Book a campus visit (stroked)"). */
const btnStroked = `${btn} border-[1.5px] border-white font-medium text-white hover:bg-white hover:text-navy`;

/** Cambridge IGCSE / O Level band (Figma Frame 29 → Cambridge Panel), with the floating school cap on desktop. */
export default function Cambridge({ content: c }: { content: HomeContent["cambridge"] }) {
  const photo = c.photo.src;
  const hasButton = c.button.label && c.button.href;
  const hasButton2 = c.button2.label && c.button2.href;
  return (
    <section className="relative lg:flex lg:min-h-[clamp(560px,36.56vw,702px)]">
      {/* Floating cap that overlaps the section above (desktop only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10 hidden aspect-[371.87/282.83] w-[clamp(220px,19.37vw,371.87px)] overflow-hidden lg:block"
        style={{ left: "calc(max(41.2%, 560px) - clamp(80px, 7.09vw, 136px))", top: "calc(clamp(220px, 19.37vw, 371.87px) * -0.7606 + clamp(30px, 26.5vw - 360px, 148px) + clamp(0px, (1920px - 100vw) * 0.064, 40px))" }}
      >
        <Image
          src="/images/home/school-cap.png"
          alt=""
          width={848}
          height={1264}
          sizes="(min-width: 1024px) 450px, 1px"
          className="absolute max-w-none"
          style={{ left: "-10.61%", top: "-90.18%", width: "118.44%", height: "288.58%" }}
        />
      </div>

      {/* Photo: top on mobile, right side on desktop */}
      <div className="relative h-[261px] overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
        {photo && (
          <>
            <Image
              src={photo}
              alt={c.photo.alt}
              unoptimized={unoptimized(photo)}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover lg:hidden"
            />
            <Image
              src={photo}
              alt=""
              aria-hidden
              unoptimized={unoptimized(photo)}
              width={1920}
              height={1286}
              sizes="(min-width: 1024px) 100vw, 1px"
              className="absolute hidden max-w-none object-cover lg:block"
              style={photo === DEFAULT_PHOTO ? DEFAULT_CROP : COVER}
            />
          </>
        )}
      </div>

      <div className="px-[24px] py-[32px] lg:order-1 lg:flex lg:w-[41.2%] lg:min-w-[560px] lg:items-center lg:bg-navy-deep lg:py-[clamp(40px,3.5vw,67px)] lg:pl-[clamp(40px,6.4vw,123px)] lg:pr-[clamp(32px,4.4vw,84px)]">
        <div className="flex flex-col items-center bg-navy-deep px-[24px] py-[40px] text-center text-white lg:w-full lg:max-w-[584px] lg:items-start lg:bg-transparent lg:p-0 lg:text-left">
          {c.eyebrow && (
            <p className="font-inter text-[13px] font-semibold uppercase leading-[16px] tracking-[2.2px] text-[#fd0] lg:text-[13.1px] lg:tracking-[2.4px]">
              {c.eyebrow}
            </p>
          )}
          <h2 className="mt-[12px] font-inter text-[30px] leading-[37px] lg:mt-[16px] lg:max-w-[9.77em] lg:text-[clamp(34px,2.4vw,46px)] lg:leading-[1.174]">
            <Rich text={softBreaks(c.heading)} hl="text-[#ff6b85]" brClassName="hidden lg:block" />
          </h2>
          {c.body && (
            <p className="mt-[16px] font-inter text-[16px] leading-[25px] text-white/88 lg:mt-[20px] lg:max-w-[540px] lg:text-[16.2px] lg:leading-[26px]">
              {c.body}
            </p>
          )}

          {c.points.length > 0 && (
            <ul className="mt-[24px] flex w-full flex-col border border-white/14 bg-white/6 px-[16px] text-left lg:mt-[26px] lg:gap-[12px] lg:border-0 lg:bg-transparent lg:p-0">
              {c.points.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center gap-[12px] border-b border-white/14 py-[14px] last:border-b-0 lg:gap-[14px] lg:border-b-0 lg:py-0"
                >
                  <span
                    aria-hidden
                    className="flex h-[22px] shrink-0 items-center justify-center bg-crimson font-inter text-[13px] font-bold leading-none text-white lg:w-[22px]"
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 font-inter text-[15.5px] font-medium leading-[22px] lg:text-[16.2px] lg:leading-[24px]">{p.text}</span>
                </li>
              ))}
            </ul>
          )}

          {(hasButton || hasButton2) && (
            <div className="mt-[28px] flex w-full flex-col gap-[12px] lg:mt-[36px] lg:w-auto lg:flex-row lg:flex-nowrap lg:gap-[clamp(10px,0.83vw,16px)]">
              {hasButton && (
                <CmsLink href={c.button.href} className={`${btnWhite} w-full lg:w-auto ${btnFit}`}>
                  {c.button.label}
                </CmsLink>
              )}
              {hasButton2 && (
                <CmsLink href={c.button2.href} className={`${btnStroked} w-full py-[17px] lg:w-auto lg:py-[16.42px] ${btnFit}`}>
                  {c.button2.label}
                </CmsLink>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
