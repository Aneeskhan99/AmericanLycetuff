import Image from "next/image";
import type { ImageValue } from "@/lib/content";
import { Rich } from "@/components/site/Rich";
import { isMedia } from "./ui";

type Props = { eyebrow: string; heading: string; intro: string; image?: ImageValue | null; id?: string };

/**
 * Inner-page hero in the Contact page style: text on the left, photo with the yellow
 * frame and crimson accent on the right. Without an image it becomes a compact header
 * (category pages and page 2+).
 */
export default function NewsHero({ eyebrow, heading, intro, image, id = "news-hero-heading" }: Props) {
  return (
    <section aria-labelledby={id} className="bg-white">
      <div className={`frame gutter ${image ? "py-[56px] lg:py-[80px]" : "pb-[32px] pt-[56px] lg:pb-[48px] lg:pt-[90px]"}`}>
        <div className="mx-auto flex max-w-[1498px] flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-[40px]">
          <div className={`flex w-full min-w-0 flex-col items-center text-center lg:items-start lg:text-left ${image ? "lg:mb-[46px] lg:max-w-[700px]" : "lg:max-w-[900px]"}`}>
            <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-crimson lg:text-[17.13px] lg:leading-normal lg:tracking-[1.9px]">
              {eyebrow}
            </p>
            <h1
              id={id}
              className="mt-[32px] text-[36px] font-bold capitalize leading-[40px] text-navy lg:mt-[30px] lg:ml-[-4px] lg:text-[clamp(52px,3.65vw,70px)] lg:leading-[1.2958]"
            >
              <Rich text={heading} />
            </h1>
            {intro && (
              <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.36px] text-[#5c5c5c] lg:mt-[17px] lg:max-w-[560px] lg:text-[20px] lg:leading-[32px] lg:tracking-[0.4px]">
                {intro}
              </p>
            )}
          </div>

          {image?.src && (
            <div className="relative mt-[26px] w-full lg:mt-0 lg:mr-[-20px] lg:aspect-[820/600] lg:w-[50%] lg:shrink-0">
              <div aria-hidden className="absolute bottom-0 left-0 hidden h-[calc(100%-20px)] w-[calc(100%-20px)] bg-crimson lg:block" />
              <div className="relative h-[291px] w-full border-[6px] border-[#fd0] lg:absolute lg:right-0 lg:top-0 lg:h-[calc(100%-20px)] lg:w-[calc(100%-20px)]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  unoptimized={isMedia(image.src)}
                  fill
                  preload
                  quality={85}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
