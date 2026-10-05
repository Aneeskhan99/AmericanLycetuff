import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { Rich } from "@/components/site/Rich";
import { ChipGroup, CropImage, Eyebrow, lines, type Crop } from "./ui";

type Props = { content: PageContent<typeof stemRoboticsPage>["progress"] };

type Stage = {
  num: string;
  label: string;
  title: string;
  chips: string[];
  body?: string;
  image: { src: string; alt: string; crop?: Crop };
  node: { src: string; size: number; top: string };
};

/** Timeline node by position (growing dots); stages beyond the third use the largest. */
const nodes = [
  { src: "/images/stem/journey-node-sm.svg", size: 44, top: "lg:top-[22px]" },
  { src: "/images/stem/journey-node-md.svg", size: 60, top: "lg:top-[22px]" },
  { src: "/images/stem/journey-node-lg.svg", size: 76, top: "lg:top-[2px]" },
];

/** Figma crops for the original photos; a replaced photo is simply cover-fitted. */
const crops: Record<string, Crop> = {
  "/images/stem/progress-primary.jpg": { left: -21.848, top: -14.145, width: 143.043, height: 127.586 },
  "/images/stem/progress-middle.jpg": { left: -12.935, top: -6.214, width: 125.217, height: 111.724 },
  "/images/stem/progress-senior.jpg": { left: -15.326, top: -8.283, width: 130, height: 115.862 },
};

export default function Progress({ content: c }: Props) {
  const stages: Stage[] = c.stages.map((s, i) => ({
    num: String(i + 1).padStart(2, "0"),
    label: s.label,
    title: s.title,
    chips: lines(s.chips),
    body: s.body,
    image: { src: s.photo.src, alt: s.photo.alt, crop: crops[s.photo.src] },
    node: nodes[Math.min(i, nodes.length - 1)],
  }));

  return (
    <section aria-labelledby="progress-heading" className="bg-[#f8f8f8] text-black">
      <div className="frame gutter py-[56px] lg:pb-[calc(180*var(--u))] lg:pt-[130px]">
        <div className="mx-auto max-w-[1498px]">
          <div className="text-center lg:text-left">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2
              id="progress-heading"
              className="mt-[14px] text-[34px] leading-[38px] tracking-[-0.4722px] lg:mt-[20px] lg:max-w-[1000px] lg:text-[clamp(44px,3.75vw,72px)] lg:leading-[1.1111] lg:tracking-[-1px]"
            >
              <Rich text={c.heading} />
            </h2>
          </div>

          {stages.length > 0 && (
            <ol className="relative mt-[24px] flex flex-col gap-[16px] lg:mt-[84px] lg:gap-[calc(60*var(--u))]">
              {/* Journey line */}
              <span
                aria-hidden
                className="absolute bottom-[calc(-20*var(--u))] left-[calc(607*var(--u))] top-0 hidden w-[3px] bg-navy lg:block"
              />
              {stages.map((s) => (
                <li
                  key={s.num}
                  className="relative flex flex-col bg-white lg:grid lg:min-h-[calc(290*var(--u))] lg:grid-cols-[calc(460*var(--u))_1fr] lg:items-start lg:bg-transparent"
                >
                  <div className="relative h-[203px] overflow-hidden border-[1.5px] border-[rgba(92,92,92,0.5)] bg-[#d9d9d9] lg:h-[calc(290*var(--u))] lg:border-0">
                    <CropImage src={s.image.src} alt={s.image.alt} crop={s.image.crop} sizes="(min-width: 1024px) 25vw, 100vw" />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 hidden border-[1.5px] border-dashed border-[rgba(92,92,92,0.5)] lg:block"
                    />
                  </div>

                  <Image
                    src={s.node.src}
                    alt=""
                    width={s.node.size}
                    height={s.node.size}
                    className={`absolute left-[calc(608.5*var(--u))] hidden -translate-x-1/2 lg:block ${s.node.top}`}
                  />

                  <div className="flex flex-col items-center gap-[10px] px-[24px] pb-[28px] pt-[24px] text-center lg:items-start lg:gap-[18px] lg:p-0 lg:pl-[calc(229*var(--u))] lg:text-left">
                    <span
                      aria-hidden
                      className="text-[36px] font-light leading-[40px] tracking-[-1.08px] text-navy lg:pointer-events-none lg:absolute lg:left-[calc(1369*var(--u))] lg:top-[calc(-30*var(--u))] lg:text-[calc(200*var(--u))] lg:leading-[1.21] lg:tracking-[calc(-6*var(--u))] lg:opacity-[0.08]"
                    >
                      {s.num}
                    </span>
                    <Eyebrow className="w-full text-crimson">{s.label}</Eyebrow>
                    <h3 className="w-full text-[32px] leading-[36px] tracking-[-0.5px] text-navy lg:text-[clamp(44px,3.33vw,64px)] lg:leading-[1.09375] lg:tracking-[-1px]">
                      {s.title}
                    </h3>
                    {s.chips.length > 0 && (
                      <div className="w-full lg:max-w-[620px]">
                        <ChipGroup label="" chips={s.chips} tone="light" />
                      </div>
                    )}
                    {s.body && (
                      <p className="w-full text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:max-w-[560px] lg:leading-[30px]">
                        {s.body}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
