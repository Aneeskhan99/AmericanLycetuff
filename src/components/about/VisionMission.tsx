import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";

type Content = PageContent<typeof aboutPage>["visionMission"];

/** Cards alternate navy / crimson; every second card drops down on desktop. */
const look = (i: number) =>
  i % 2 === 0 ? { bg: "bg-navy", offset: "" } : { bg: "bg-crimson", offset: "lg:mt-[90px]" };

export default function VisionMission({ content: c }: { content: Content }) {
  if (c.cards.length === 0) return null;
  return (
    <section aria-label="Our vision and mission" className="bg-white">
      <div className="frame gutter py-[56px] lg:pb-[150px] lg:pt-[140px]">
        <div className="mx-auto flex max-w-[1498px] flex-col gap-[32px] lg:flex-row lg:items-start lg:gap-[38px]">
          {c.cards.map((card, i) => (
            <article
              key={i}
              className={`${look(i).bg} ${look(i).offset} flex flex-col items-center p-[24px] text-center text-white lg:min-h-[520px] lg:flex-1 lg:items-start lg:gap-[36px] lg:px-[clamp(48px,3.75vw,72px)] lg:py-[80px] lg:text-left`}
            >
              <h2 className="w-full text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]">
                {card.title}
              </h2>
              <span aria-hidden className="hidden h-[3px] w-[60px] bg-[#fd0] lg:block" />
              <p className="mt-[14px] text-[24px] leading-[29px] lg:mt-0 lg:max-w-[586px] lg:text-[clamp(26px,1.67vw,32px)] lg:leading-[1.4375]">
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
