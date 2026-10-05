import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { Rich } from "@/components/site/Rich";
import { Eyebrow } from "./ui";

type Props = { content: PageContent<typeof stemRoboticsPage>["why"] };
type Tile = { letter: string; label: string; bg: string };

/** Tile colours by position (S, E, T, M in the design); repeats for extra tiles. */
const tileBgs = ["bg-navy", "bg-navy-ink", "bg-crimson", "bg-navy"];

function StemTile({ letter, label, bg }: Tile) {
  return (
    <li
      className={`relative flex flex-col items-center p-[24px] text-center text-white lg:block lg:h-[calc(340*var(--u))] lg:w-[calc(330*var(--u))] lg:overflow-hidden lg:p-0 lg:text-left ${bg}`}
    >
      <span
        aria-hidden
        className="text-[36px] font-light leading-[40px] tracking-[-0.9818px] lg:absolute lg:left-[calc(28*var(--u))] lg:top-[calc(-10*var(--u))] lg:text-[calc(220*var(--u))] lg:leading-[calc(240*var(--u))] lg:tracking-[calc(-6*var(--u))]"
      >
        {letter}
      </span>
      <span className="mt-[16px] flex flex-col items-center lg:absolute lg:bottom-[calc(30*var(--u))] lg:left-[calc(36*var(--u))] lg:mt-0 lg:items-start">
        <span aria-hidden className="hidden h-[3px] w-[40px] bg-[#fd0] lg:block" />
        <span className="text-[20px] leading-[31px] lg:mt-[11px] lg:text-[clamp(20px,1.354vw,26px)] lg:leading-[34px]">{label}</span>
      </span>
    </li>
  );
}

export default function WhyStem({ content: c }: Props) {
  // Desktop: two staggered columns (first half, then the rest offset 60px). Mobile stacks them in the same order.
  const tiles: Tile[] = c.tiles.map((t, i) => ({ ...t, bg: tileBgs[i % tileBgs.length] }));
  const half = Math.ceil(tiles.length / 2);
  const columns = [tiles.slice(0, half), tiles.slice(half)].filter((col) => col.length > 0);

  return (
    <section aria-labelledby="why-stem-heading" className="bg-[#f8f8f8] text-black">
      <div className="frame gutter py-[56px] lg:pb-[calc(74*var(--u))] lg:pt-[calc(150*var(--u))]">
        <div className="mx-auto flex max-w-[1498px] flex-col gap-[32px] lg:flex-row lg:items-start lg:justify-between lg:gap-[40px]">
          <div className="text-center lg:max-w-[680px] lg:pt-[calc(10*var(--u))] lg:text-left">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2
              id="why-stem-heading"
              className="mt-[14px] text-[32px] leading-[36px] lg:mt-[20px] lg:text-[clamp(36px,2.92vw,56px)] lg:leading-[1.1429]"
            >
              <Rich text={c.heading} />
            </h2>
            <p className="mt-[16px] text-[16px] leading-[25px] tracking-[0.4938px] lg:mt-[36px] lg:max-w-[560px] lg:text-[16.2px] lg:leading-[27px] lg:tracking-[0.5px]">
              {c.body}
            </p>
          </div>

          {columns.length > 0 && (
            <div className="flex shrink-0 flex-col gap-[32px] lg:mr-[calc(3*var(--u))] lg:flex-row lg:gap-[calc(16*var(--u))]">
              {columns.map((col, i) => (
                <ul key={i} className={`flex flex-col gap-[18px] lg:gap-[calc(16*var(--u))] ${i === 1 ? "lg:mt-[calc(60*var(--u))]" : ""}`}>
                  {col.map((t, j) => (
                    <StemTile key={j} {...t} />
                  ))}
                </ul>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
