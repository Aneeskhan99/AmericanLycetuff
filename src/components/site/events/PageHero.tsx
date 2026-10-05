import type { ReactNode } from "react";
import { Rich } from "@/components/site/Rich";
import type { ImageValue } from "@/lib/content";
import { ContentImage } from "./ui";

/**
 * Inner-page hero in the Contact page style: text on the left, photo in a yellow
 * frame with a crimson accent block on the right (stacked on mobile). Without a
 * photo the text column spans the width.
 */
export default function PageHero({ id, label, title, intro, image, children }: {
  id: string; label: string; title: string; intro?: string; image?: ImageValue | null; children?: ReactNode;
}) {
  const hasImage = Boolean(image?.src);
  return (
    <section aria-labelledby={id} className="bg-white">
      <div className={`frame gutter ${hasImage ? "py-[56px] lg:py-[80px]" : "py-[56px] lg:pb-[40px] lg:pt-[96px]"}`}>
        <div className="mx-auto flex max-w-[1498px] flex-col items-center lg:flex-row lg:items-center lg:justify-between lg:gap-[40px]">
          <div className={`flex w-full min-w-0 flex-col items-center text-center lg:items-start lg:text-left ${hasImage ? "lg:mb-[46px] lg:max-w-[700px]" : "lg:max-w-[1000px]"}`}>
            <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-crimson lg:text-[17.13px] lg:leading-normal lg:tracking-[1.9px]">
              {label}
            </p>
            <h1
              id={id}
              className="mt-[32px] text-[36px] font-bold capitalize leading-[40px] text-navy lg:mt-[30px] lg:ml-[-4px] lg:text-[clamp(52px,3.65vw,70px)] lg:leading-[1.2958]"
            >
              <Rich text={title} />
            </h1>
            {intro && (
              <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.36px] text-[#5c5c5c] lg:mt-[17px] lg:max-w-[560px] lg:text-[20px] lg:leading-[32px] lg:tracking-[0.4px]">
                {intro}
              </p>
            )}
            {children && <div className="mt-[24px] flex w-full flex-col gap-[12px] lg:mt-[48px] lg:w-auto lg:flex-row lg:flex-wrap lg:gap-[20px]">{children}</div>}
          </div>

          {hasImage && (
            <div className="relative mt-[26px] w-full lg:mt-0 lg:mr-[-20px] lg:aspect-[820/700] lg:w-[54.74%] lg:shrink-0">
              <div aria-hidden className="absolute bottom-0 left-0 hidden h-[calc(100%-20px)] w-[calc(100%-20px)] bg-crimson lg:block" />
              <div className="relative h-[291px] w-full overflow-hidden border-[6px] border-[#fd0] lg:absolute lg:right-0 lg:top-0 lg:h-[calc(100%-20px)] lg:w-[calc(100%-20px)]">
                <ContentImage image={image!} preload sizes="(min-width: 1024px) 42vw, 100vw" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
