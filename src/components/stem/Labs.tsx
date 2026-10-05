import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { Rich } from "@/components/site/Rich";
import { ChipGroup, CropImage, Eyebrow, lines, type Crop } from "./ui";

type Content = PageContent<typeof stemRoboticsPage>["labs"];
type LabItem = Content["items"][number];

/** Per-position layout from the design (navy / crimson / blue). Labs beyond the third repeat the cycle. */
type Layout = {
  id: string;
  bg: string;
  /** Desktop: which half the photo occupies. */
  imageSide: "left" | "right";
  /** Mobile: the science lab leads with its watermark word; the others lead with the photo. */
  mobileWatermarkFirst?: boolean;
  /** Mobile gap between the two chip groups. */
  groupGap: string;
  /** Desktop positions of the watermark word and the photo note card (kept inside the photo half). */
  watermarkLeft: string;
  noteLeft: string;
};

const layouts: Layout[] = [
  {
    id: "robotics-lab",
    bg: "bg-navy-ink",
    imageSide: "left",
    groupGap: "mt-[32px]",
    watermarkLeft: "lg:left-[calc(1000*var(--u))]",
    noteLeft: "lg:right-[calc(50%+60*var(--u))]",
  },
  {
    id: "science-lab",
    bg: "bg-crimson",
    imageSide: "right",
    mobileWatermarkFirst: true,
    groupGap: "mt-[18px]",
    watermarkLeft: "lg:left-[calc(40*var(--u))]",
    noteLeft: "lg:left-[calc(50%+60*var(--u))]",
  },
  {
    id: "ict-lab",
    bg: "bg-navy",
    imageSide: "left",
    groupGap: "mt-[18px]",
    watermarkLeft: "lg:left-[calc(1000*var(--u))]",
    noteLeft: "lg:right-[calc(50%+60*var(--u))]",
  },
];

/** Figma crops for the original photos; a replaced photo is simply cover-fitted. */
const crops: Record<string, Crop> = {
  "/images/stem/lab-robotics.jpg": { left: -8.75, top: -2.815, width: 117.5, height: 105.75 },
  "/images/stem/lab-science.jpg": { left: -31.146, top: -4.69, width: 162.29, height: 109.5 },
  "/images/stem/lab-ict-students-breadboard.jpg": { left: -24.0625, top: 0.06, width: 148.125, height: 100 },
};

type Lab = Layout & {
  watermark: string;
  eyebrow: string;
  title: string;
  body: string;
  groups: { label: string; chips: string[] }[];
  image: { src: string; alt: string; crop?: Crop };
  photoNote: string;
  photoNoteLabel: string;
};

function toLab(item: LabItem, i: number, photoNoteLabel: string): Lab {
  const layout = layouts[i % layouts.length];
  return {
    ...layout,
    id: i < layouts.length ? layout.id : `lab-${i + 1}`,
    watermark: item.watermark,
    eyebrow: item.eyebrow,
    title: item.title,
    body: item.body,
    groups: [
      { label: item.group1Label, chips: lines(item.group1Chips) },
      { label: item.group2Label, chips: lines(item.group2Chips) },
    ].filter((g) => g.label || g.chips.length > 0),
    image: { src: item.photo.src, alt: item.photo.alt, crop: crops[item.photo.src] },
    photoNote: item.photoNote,
    photoNoteLabel,
  };
}

function LabSection({ lab }: { lab: Lab }) {
  const wFirst = lab.mobileWatermarkFirst;
  const imageCol = lab.imageSide === "left" ? "lg:col-start-1" : "lg:col-start-2";
  const contentCol = lab.imageSide === "left" ? "lg:col-start-2" : "lg:col-start-1";

  return (
    <section id={lab.id} aria-labelledby={`${lab.id}-heading`} className={`${lab.bg} scroll-mt-[120px] text-white`}>
      <div
        className={`frame relative flex flex-col overflow-hidden px-[24px] lg:grid lg:min-h-[calc(800*var(--u))] lg:grid-cols-2 lg:p-0 ${
          wFirst ? "pb-[72px] pt-[40px]" : "py-[56px]"
        }`}
      >
        {/* Photo half */}
        <div
          className={`relative h-[560px] w-full overflow-hidden lg:order-none lg:row-start-1 lg:h-auto ${imageCol} ${
            wFirst ? "order-2 mt-[32px] lg:mt-0" : "order-1"
          }`}
        >
          <CropImage src={lab.image.src} alt={lab.image.alt} crop={lab.image.crop} sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>

        {/* Big watermark word: faint on desktop, solid heading-like word on mobile */}
        {lab.watermark && (
          <p
            aria-hidden
            className={`w-full text-center text-[36px] font-bold uppercase leading-[40px] tracking-[-1.1077px] lg:pointer-events-none lg:absolute lg:top-[calc(-30*var(--u))] lg:w-auto lg:whitespace-nowrap lg:text-left lg:text-[calc(260*var(--u))] lg:leading-[1.21] lg:tracking-[calc(-8*var(--u))] lg:z-[1] lg:order-none lg:opacity-[0.07] ${lab.watermarkLeft} ${
              wFirst ? "order-1" : "order-3 mt-[64px] lg:mt-0"
            }`}
          >
            {lab.watermark}
          </p>
        )}

        {/* "Photo to be added" note card from the design */}
        {lab.photoNote && (
          <div
            className={`relative hidden h-[210px] flex-col items-center justify-center gap-[8px] border-8 border-white bg-[#173054] px-[16px] text-center lg:absolute lg:bottom-[calc(60*var(--u))] lg:z-[2] lg:flex lg:w-[300px] ${lab.noteLeft}`}
          >
            {lab.photoNoteLabel && (
              <p className="text-[13px] font-semibold uppercase leading-[16px] tracking-[2.5px] text-[#fd0] lg:text-[11px] lg:leading-[13px]">
                {lab.photoNoteLabel}
              </p>
            )}
            <p className="max-w-[252px] text-[15px] leading-[22px]">{lab.photoNote}</p>
          </div>
        )}

        {/* Copy */}
        <div
          className={`relative flex flex-col items-center text-center lg:z-[2] lg:order-none lg:row-start-1 lg:items-start lg:gap-[26px] lg:pb-[80px] lg:pt-[calc(120*var(--u))] lg:text-left lg:pl-[calc(110*var(--u))] lg:pr-[max(40px,calc(150*var(--u)))] ${contentCol} ${
            wFirst ? "order-3 mt-[64px] lg:mt-0" : "order-4 mt-[24px] lg:mt-0"
          }`}
        >
          <Eyebrow className="w-full text-[#fd0]">{lab.eyebrow}</Eyebrow>
          <h3
            id={`${lab.id}-heading`}
            className="mt-[14px] w-full text-[32px] leading-[36px] lg:mt-0 lg:max-w-[700px] lg:text-[clamp(40px,2.92vw,56px)] lg:leading-[1.1429]"
          >
            {lab.title}
          </h3>
          <span aria-hidden className="hidden h-[3px] w-[60px] bg-[#fd0] lg:block" />
          <p className="mt-[16px] w-full text-[18px] leading-[28px] tracking-[0.3px] lg:mt-0 lg:max-w-[690px] lg:leading-[30px]">
            {lab.body}
          </p>
          {lab.groups.map((g, i) => (
            <div key={i} className={`w-full lg:mt-0 ${i === 0 ? "mt-[24px]" : lab.groupGap}`}>
              <ChipGroup label={g.label} chips={g.chips} tone="dark" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Labs({ content: c }: { content: Content }) {
  const labs = c.items.map((item, i) => toLab(item, i, c.photoNoteLabel));
  return (
    <>
      <section aria-labelledby="labs-heading" className="bg-white text-black">
        <div className="frame gutter pb-[56px] pt-[8px] lg:pb-[114px] lg:pt-[130px]">
          <div className="mx-auto max-w-[1498px] text-center lg:text-left">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2
              id="labs-heading"
              className="mt-[14px] text-[34px] leading-[38px] tracking-[-0.4722px] lg:mt-[20px] lg:max-w-[1000px] lg:text-[clamp(44px,3.75vw,72px)] lg:leading-[1.1111] lg:tracking-[-1px]"
            >
              <Rich text={c.heading} />
            </h2>
          </div>
        </div>
      </section>
      {labs.map((lab) => (
        <LabSection key={lab.id} lab={lab} />
      ))}
    </>
  );
}
