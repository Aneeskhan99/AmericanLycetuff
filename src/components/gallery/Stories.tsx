import type { ImageValue } from "@/lib/content";
import GalleryImage from "./GalleryImage";
import PhotoButton from "./PhotoButton";
import type { GalleryPhoto } from "./photos";

type StoryText = { number: string; label: string; caption: string };

const FEATURE_SIZES = "(min-width: 1024px) min(1000px, 58vw), 100vw";
const SIDE_SIZES = "(min-width: 1024px) min(470px, 28vw), 100vw";

/** Number · category · caption line under a story (stacked + centered on mobile). */
function StoryCaption({ number, label, caption, className = "" }: StoryText & { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-[12px] text-center lg:flex-row lg:items-center lg:self-start lg:gap-[20px] lg:whitespace-nowrap lg:text-left ${className}`}
    >
      <p className="text-[13px] font-semibold leading-[20px] tracking-[1.9847px] text-crimson lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]">
        {number}
      </p>
      <h2 className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-navy lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]">
        {label}
      </h2>
      {caption && <p className="text-[15px] leading-[23px] text-[#5c5c5c] lg:text-[14px] lg:leading-[17px]">{caption}</p>}
    </div>
  );
}

/** Two stacked side photos (470x330 + 470x342 on desktop). */
function SideColumn({ top, bottom, className = "" }: { top: GalleryPhoto; bottom: GalleryPhoto; className?: string }) {
  return (
    <div className={`flex flex-col gap-[16px] lg:grid lg:h-full lg:grid-rows-[330fr_342fr] lg:gap-[28px] ${className}`}>
      <PhotoButton photo={top} sizes={SIDE_SIZES} className="aspect-[470/330] w-full lg:aspect-auto lg:h-full" />
      <PhotoButton photo={bottom} sizes={SIDE_SIZES} className="aspect-[470/342] w-full lg:aspect-auto lg:h-full" />
    </div>
  );
}

/** Figma: Story 01 / Life at our campus (desktop 141:8482, mobile 165:6857). */
export function StoryCampusLife({ feature, sideTop, sideBottom, text }: { feature: GalleryPhoto; sideTop: GalleryPhoto; sideBottom: GalleryPhoto; text: StoryText }) {
  return (
    <section className="frame gutter overflow-hidden bg-white">
      <div className="mx-auto grid w-full max-w-[1498px] grid-cols-1 pb-[56px] pt-[8px] lg:grid-cols-[1000fr_470fr] lg:gap-x-[28px] lg:pb-0 lg:pt-[90px]">
        <div className="relative">
          <PhotoButton photo={feature} sizes={FEATURE_SIZES} className="aspect-[1000/700] w-full" />
          <span
            aria-hidden
            className="absolute bottom-[-20px] left-[-40px] hidden size-[min(6.25vw,120px)] bg-crimson lg:block"
          />
        </div>

        <StoryCaption {...text} className="mt-[20px] lg:col-start-1 lg:row-start-2 lg:mt-[40px]" />

        <SideColumn
          top={sideTop}
          bottom={sideBottom}
          className="mt-[32px] lg:col-start-2 lg:row-start-1 lg:mt-0"
        />

        <p
          aria-hidden
          className="mt-[24px] text-center text-[36px] font-light leading-[40px] tracking-[-1.08px] text-navy lg:col-start-2 lg:row-start-2 lg:mb-[-2px] lg:ml-[min(3.18vw,61px)] lg:mt-[30px] lg:text-left lg:text-[min(10.417vw,200px)] lg:leading-[1.21] lg:tracking-[-0.03em] lg:opacity-[0.07]"
        >
          {text.number}
        </p>
      </div>
    </section>
  );
}

/** Figma: Full-bleed Moment (desktop 141:8492, mobile 165:6874). */
export function FullBleedMoment({ background, lines }: { background: ImageValue & { srcSet?: string }; lines: [string, string, string] }) {
  const word =
    "text-[36px] font-bold leading-[40px] tracking-[-0.8182px] lg:text-[clamp(64px,6.875vw,132px)] lg:-ml-[0.045em] lg:leading-[1.03] lg:tracking-[-0.0227em]";
  return (
    <section aria-label={lines.map((l) => l.replace(/[.!]+$/, "")).filter(Boolean).join(", ")} className="relative overflow-hidden bg-navy-ink">
      <div aria-hidden className="absolute inset-0">
        <GalleryImage src={background.src} srcSet={background.srcSet} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,30,63,0.88)_0%,rgba(8,30,63,0.35)_60%,rgba(8,30,63,0.05)_100%)]" />
      </div>
      <div className="frame gutter relative">
        <div className="mx-auto flex min-h-[560px] w-full max-w-[1498px] flex-col items-center gap-[8px] py-[64px] text-center text-white lg:h-[clamp(560px,46.875vw,900px)] lg:min-h-0 lg:items-start lg:gap-[min(0.73vw,14px)] lg:pb-0 lg:pt-[clamp(80px,8.854vw,170px)] lg:text-left">
          {lines[0] && <p className={word}>{lines[0]}</p>}
          {lines[1] && <p className={`${word} text-transparent [-webkit-text-stroke:1.5px_#fff]`}>{lines[1]}</p>}
          {lines[2] && <p className={word}>{lines[2]}</p>}
        </div>
      </div>
    </section>
  );
}

/** Figma: Story 02 / STEM & Robotics (desktop 141:8498, mobile 165:6880). */
export function StoryStem({ feature, sideTop, sideBottom, text }: { feature: GalleryPhoto; sideTop: GalleryPhoto; sideBottom: GalleryPhoto; text: StoryText }) {
  return (
    <section className="frame gutter overflow-hidden bg-[#f8f8f8]">
      <div className="mx-auto grid w-full max-w-[1498px] grid-cols-1 py-[56px] lg:grid-cols-[470fr_1000fr] lg:gap-x-[28px] lg:pb-[min(11.09vw,213px)] lg:pt-[90px]">
        <SideColumn top={sideTop} bottom={sideBottom} />

        <div className="relative mt-[26px] lg:mt-0">
          <PhotoButton photo={feature} sizes={FEATURE_SIZES} className="aspect-[1000/700] w-full" />
          <span
            aria-hidden
            className="absolute bottom-[-80px] right-[-60px] hidden size-[min(6.25vw,120px)] bg-crimson lg:block"
          />
        </div>

        <StoryCaption {...text} className="mt-[20px] lg:mt-[40px]" />
      </div>
    </section>
  );
}
