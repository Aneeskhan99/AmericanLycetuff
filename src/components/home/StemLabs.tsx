import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { ArrowBadge, body, btnCrimson, CmsLink, softBreaks, unoptimized } from "./ui";

/** Intrinsic sizes of the bundled lab photos; anything else (uploads) is drawn at 1200 × 800 and cropped to the card. */
const SIZES: Record<string, [number, number]> = {
  "/images/home/lab-robotics-students.jpg": [2560, 1440],
  "/images/home/lab-computer-ict.jpg": [2560, 1920],
};

/** "Discover our STEM Labs" (Figma 447:3109): heading, text and button on the left, two lab cards on the right. No slider. */
export default function StemLabs({ content: c }: { content: HomeContent["stemLabs"] }) {
  const labs = c.cards;

  return (
    <section className="bg-[#f2f2f2] px-[24px] py-[56px] lg:px-[6vw] lg:py-[clamp(96px,7.44vw,142.85px)]">
      <div className="mx-auto flex max-w-[1330px] flex-col xl:flex-row xl:items-start">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left xl:w-[clamp(380px,25.68vw,493px)] xl:shrink-0 xl:pr-[clamp(40px,3.6vw,72px)]">
          <h2 className="font-inter text-[30px] leading-[34px] text-navy-ink lg:max-w-[440px] lg:text-[clamp(38px,2.6vw,49.89px)] lg:leading-[1.1515]">
            <Rich text={softBreaks(c.heading)} brClassName="hidden lg:block" />
          </h2>
          {c.body && <p className={`${body} mt-[16px] text-black lg:mt-[19px] lg:max-w-[412px]`}>{c.body}</p>}
          {c.button.label && c.button.href && (
            <CmsLink
              href={c.button.href}
              className={`${btnCrimson} mt-[24px] w-full lg:mt-[32px] lg:w-auto lg:max-w-full lg:whitespace-normal lg:px-[clamp(20px,1.56vw,30px)] lg:text-[clamp(14px,0.892vw,17.134px)] lg:tracking-[0.11em] xl:mt-[79px]`}
            >
              <span className="lg:hidden">{c.buttonShort || c.button.label}</span>
              <span className="hidden lg:inline">{c.button.label}</span>
            </CmsLink>
          )}
        </div>

        {labs.length > 0 && (
          <ul
            aria-label="Our STEM labs"
            className="mt-[32px] grid gap-[32px] sm:grid-cols-2 sm:gap-[24px] lg:mt-[48px] lg:gap-[clamp(24px,2.07vw,39.693px)] xl:mt-[0.22px] xl:max-w-[886.307px] xl:flex-1"
          >
            {labs.map((lab, i) => (
              <li key={i} className="min-w-0">
                <CmsLink
                  href={lab.href || "/stem-robotics"}
                  className="group flex h-full flex-col items-center bg-white p-[24px] text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-crimson lg:items-start lg:p-0 lg:text-left"
                >
                  <span className="relative block h-[191px] w-full overflow-hidden lg:aspect-[423.307/272.409] lg:h-auto">
                    {lab.photo.src && (
                      <Image
                        src={lab.photo.src}
                        alt={lab.photo.alt}
                        unoptimized={unoptimized(lab.photo.src)}
                        width={SIZES[lab.photo.src]?.[0] ?? 1200}
                        height={SIZES[lab.photo.src]?.[1] ?? 800}
                        sizes="(min-width: 1024px) 424px, (min-width: 640px) 50vw, 100vw"
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="mt-[18px] flex w-full flex-col items-center lg:mt-0 lg:items-start lg:gap-[16px] lg:px-[clamp(24px,2.08vw,40px)] lg:py-[30px]">
                    <span className="font-inter text-[15px] uppercase leading-[23px] tracking-[1.0714px] text-navy-ink lg:text-[14.118px] lg:leading-[21.176px] lg:tracking-[1.0084px]">
                      {lab.kind}
                    </span>
                    <span className="relative mt-[24px] block w-full overflow-hidden lg:mt-0 lg:min-h-[35.259px]">
                      <span className="block font-inter text-[18px] leading-[28px] text-crimson lg:text-[21.176px] lg:leading-[36.302px]">
                        {lab.title}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/home/lab-title-line.svg"
                        alt=""
                        aria-hidden
                        width={200}
                        height={2}
                        className="absolute bottom-0 left-[-200px] hidden h-[2px] w-[200px] max-w-none transition-transform duration-500 group-hover:translate-x-[200px] lg:block"
                      />
                    </span>
                    <ArrowBadge className="mt-[28px] group-hover:border-crimson lg:mt-0" />
                  </span>
                </CmsLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
