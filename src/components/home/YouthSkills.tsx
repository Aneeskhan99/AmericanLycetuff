import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { body, btnWhite, CmsLink, eyebrow, heading, unoptimized } from "./ui";

const DEFAULT_PHOTO = "/images/home/youth-skills-students.jpg";
/** Desktop crop of the default photo (from Figma). Any other photo simply covers the panel. */
const DEFAULT_CROP = { left: "-44.64%", top: "-40.38%", width: "162.62%", height: "175.21%" };
const COVER = { left: "0%", top: "0%", width: "100%", height: "100%" };

/** Prime Minister's Youth Skills Programme band (Figma Frame 29), with the floating school cap on desktop. */
export default function YouthSkills({ content: c }: { content: HomeContent["youth"] }) {
  const photo = c.photo.src;
  return (
    <section className="relative lg:flex lg:min-h-[clamp(560px,36.56vw,702px)]">
      {/* Floating cap that overlaps the section above (desktop only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10 hidden aspect-[371.87/282.83] w-[clamp(220px,19.37vw,371.87px)] overflow-hidden lg:block"
        style={{ left: "calc(max(41.2%, 500px) - clamp(80px, 7.09vw, 136px))", top: "calc(clamp(220px, 19.37vw, 371.87px) * -0.7606 + clamp(30px, 26.5vw - 360px, 148px) + clamp(0px, (1920px - 100vw) * 0.064, 40px))" }}
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

      <div className="px-[24px] py-[32px] lg:order-1 lg:flex lg:w-[41.2%] lg:min-w-[500px] lg:items-center lg:bg-navy-deep lg:p-0 lg:pl-[clamp(40px,15.3vw_-_110px,184px)] lg:pr-[40px]">
        <div className="flex flex-col items-center bg-navy-deep p-[24px] text-center text-white lg:-translate-y-[11px] lg:max-w-[563px] lg:items-start lg:bg-transparent lg:p-0 lg:text-left">
          {c.eyebrow && <p className={eyebrow}>{c.eyebrow}</p>}
          <h2 className={`${heading} mt-[14px] lg:mt-[11px] lg:max-w-[531px] lg:text-[clamp(38px,2.6vw,50px)]`}>
            <Rich text={c.heading} />
          </h2>
          {c.body && <p className={`${body} mt-[16px] lg:mt-[9.5px] lg:max-w-[469px]`}>{c.body}</p>}
          {c.button.label && c.button.href && (
            <CmsLink href={c.button.href} className={`${btnWhite} mt-[24px] w-full lg:mt-[45px] lg:w-auto`}>
              {c.button.label}
            </CmsLink>
          )}
        </div>
      </div>
    </section>
  );
}
