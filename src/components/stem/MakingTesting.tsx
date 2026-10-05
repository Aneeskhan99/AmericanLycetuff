import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { CropImage, lines, type Crop } from "./ui";

type Props = { content: PageContent<typeof stemRoboticsPage>["making"] };

/** Word styles by position; repeats for extra words. */
const wordStyles = [
  "text-navy",
  "text-crimson",
  // Outlined word: transparent fill with a navy stroke.
  "text-transparent [-webkit-text-stroke:1px_#1a2d59] lg:[-webkit-text-stroke-width:2px]",
  "text-navy",
];

const crops: Record<string, Crop> = {
  "/images/stem/testing-breadboard.jpg": { left: -4.674, top: -19.53, width: 108.7, height: 138.75 },
};

export default function MakingTesting({ content: c }: Props) {
  const words = lines(c.words).map((word, i) => ({ word, className: wordStyles[i % wordStyles.length] }));
  // "Making, testing, failing, improving"
  const label = words
    .map((w) => w.word.replace(/[.!]+$/, ""))
    .join(", ")
    .toLowerCase();
  const ariaLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <section aria-label={ariaLabel || undefined} className="bg-white">
      <div className="frame gutter pb-[48px] pt-[56px] lg:pb-[calc(114*var(--u))] lg:pt-[calc(110*var(--u))]">
        <div className="mx-auto flex max-w-[1498px] flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-[40px]">
          <h2 className="flex flex-col items-center gap-[8px] text-center text-[36px] font-bold leading-[40px] tracking-[-0.96px] lg:-ml-[6px] lg:items-start lg:gap-[calc(12*var(--u))] lg:text-left lg:text-[calc(150*var(--u))] lg:leading-[calc(160*var(--u))] lg:tracking-[calc(-4*var(--u))]">
            {words.map((w, i) => (
              <span key={i} className={`whitespace-nowrap ${w.className}`}>
                {w.word}
              </span>
            ))}
          </h2>

          <figure className="mt-[32px] lg:mt-[calc(20*var(--u))] lg:w-[calc(476*var(--u))] lg:shrink-0">
            <div className="relative lg:h-[calc(656*var(--u))]">
              <div
                aria-hidden
                className="hidden bg-crimson lg:absolute lg:left-0 lg:top-[calc(16*var(--u))] lg:block lg:h-[calc(640*var(--u))] lg:w-[calc(460*var(--u))]"
              />
              <div className="relative h-[448px] overflow-hidden border-[1.5px] border-[rgba(92,92,92,0.5)] lg:absolute lg:left-[calc(16*var(--u))] lg:top-0 lg:h-[calc(640*var(--u))] lg:w-[calc(460*var(--u))] lg:border-0">
                <CropImage src={c.photo.src} alt={c.photo.alt} crop={crops[c.photo.src]} sizes="(min-width: 1024px) 25vw, 100vw" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 hidden border-[1.5px] border-dashed border-[rgba(92,92,92,0.5)] lg:block"
                />
              </div>
            </div>
            {c.caption && (
              <figcaption className="mt-[26px] text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:ml-[calc(16*var(--u))] lg:mt-[24px] lg:max-w-[400px] lg:text-left">
                {c.caption}
              </figcaption>
            )}
          </figure>
        </div>
      </div>
    </section>
  );
}
