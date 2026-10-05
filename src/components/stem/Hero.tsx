import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { Rich } from "@/components/site/Rich";
import { CmsLink, CropImage, btnFilled, lines, unoptimized, type Crop } from "./ui";

type Props = { content: PageContent<typeof stemRoboticsPage>["hero"] };

/** Figma crops for the original photos; a replaced photo is simply cover-fitted. */
const crops: Record<string, Crop> = {
  "/images/stem/hero-building-students-circuit.jpg": { left: -13.375, top: -30.36, width: 126, height: 160 },
  "/images/stem/hero-programming-lab.jpg": { left: -14.6, top: -13.69, width: 128, height: 126.32 },
};

export default function Hero({ content: c }: Props) {
  // Ribbon words: one per line, *word* = crimson.
  const ribbon = lines(c.ribbon).map((line) => {
    const m = /^\*([^*]+)\*$/.exec(line);
    return m ? { word: m[1], color: "text-crimson" } : { word: line.replace(/\*/g, ""), color: "text-white" };
  });
  return (
    <section aria-labelledby="stem-hero-heading" className="bg-navy-ink text-white">
      <div className="frame gutter py-[56px] lg:pb-[60px] lg:pt-[calc(110*var(--u))]">
        <div className="mx-auto flex max-w-[1498px] flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-[40px]">
          {/* Copy */}
          <div className="flex flex-col items-center text-center lg:col-start-1 lg:row-start-1 lg:mt-[calc(125*var(--u))] lg:items-start lg:text-left">
            <p className="w-full text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-[#fd0] lg:text-[17.13px] lg:leading-[21px] lg:tracking-[1.9px]">
              {c.eyebrow}
            </p>
            <h1
              id="stem-hero-heading"
              className="mt-[32px] w-full text-[36px] font-bold capitalize leading-[40px] lg:-ml-[4px] lg:mt-[18px] lg:max-w-[820px] lg:text-[clamp(48px,3.65vw,70px)] lg:leading-[1.2958]"
            >
              <Rich text={c.heading} />
            </h1>
            <p className="mt-[16px] w-full text-[20px] leading-[31px] tracking-[0.4545px] lg:mt-[29px] lg:max-w-[604px] lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
              {c.intro}
            </p>
            {c.button.label && (
              <CmsLink href={c.button.href} className={`mt-[24px] lg:mt-[39px] ${btnFilled}`}>
                {c.button.label}
              </CmsLink>
            )}
          </div>

          {/* Rule + ribbon (ribbon sits under the copy on mobile, full width at the bottom on desktop) */}
          <div aria-hidden className="hidden h-px bg-white/25 lg:col-span-2 lg:row-start-2 lg:mt-[calc(90*var(--u))] lg:block" />
          {ribbon.length > 0 && (
            <p className="mt-[28px] flex flex-col items-center gap-[8px] text-center text-[36px] font-bold uppercase leading-[40px] tracking-[-0.6429px] lg:col-span-2 lg:row-start-3 lg:mt-[31px] lg:flex-row lg:gap-[clamp(32px,2.92vw,56px)] lg:text-left lg:text-[clamp(40px,2.92vw,56px)] lg:leading-[1.2143] lg:tracking-[-1px]">
              {ribbon.map((r, i) => (
                <span key={i} className={r.color}>
                  {r.word}
                </span>
              ))}
            </p>
          )}

          {/* Photo collage */}
          <div className="mt-[32px] flex flex-col lg:relative lg:col-start-2 lg:row-start-1 lg:mr-[calc(-10*var(--u))] lg:mt-0 lg:h-[calc(620*var(--u))] lg:w-[calc(675*var(--u))]">
            <div
              aria-hidden
              className="hidden bg-crimson lg:absolute lg:left-0 lg:top-[calc(52*var(--u))] lg:block lg:h-[calc(560*var(--u))] lg:w-[calc(400*var(--u))]"
            />
            <div className="px-[24px] pb-[28px] pt-[20px] lg:absolute lg:left-[calc(16*var(--u))] lg:top-[calc(20*var(--u))] lg:h-[calc(560*var(--u))] lg:w-[calc(400*var(--u))] lg:p-0">
              <div className="relative h-[415px] overflow-hidden border-[1.5px] border-white/40 lg:h-full lg:border-0">
                <CropImage
                  src={c.photoMain.src}
                  alt={c.photoMain.alt}
                  crop={crops[c.photoMain.src]}
                  sizes="(min-width: 1024px) 27vw, 100vw"
                  preload
                />
              </div>
            </div>

            <div className="mt-[32px] px-[24px] pb-[28px] pt-[20px] lg:absolute lg:left-[calc(425*var(--u))] lg:top-0 lg:mt-0 lg:h-[calc(190*var(--u))] lg:w-[calc(250*var(--u))] lg:p-0">
              <div className="relative h-[190px] overflow-hidden lg:h-full">
                <CropImage
                  src={c.photoTop.src}
                  alt={c.photoTop.alt}
                  crop={crops[c.photoTop.src]}
                  sizes="(min-width: 1024px) 17vw, 100vw"
                  preload
                />
                <span aria-hidden className="pointer-events-none absolute inset-0 border-[1.5px] border-dashed border-white/40" />
              </div>
            </div>

            <div className="relative mt-[26px] h-[400px] border-[10px] border-navy-ink lg:absolute lg:left-[calc(425*var(--u))] lg:top-[calc(220*var(--u))] lg:mt-0 lg:h-[calc(400*var(--u))] lg:w-[calc(240*var(--u))]">
              {c.photoBottom.src && (
                <Image
                  src={c.photoBottom.src}
                  alt={c.photoBottom.alt}
                  unoptimized={unoptimized(c.photoBottom.src)}
                  fill
                  preload
                  sizes="(min-width: 1024px) 13vw, 100vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
