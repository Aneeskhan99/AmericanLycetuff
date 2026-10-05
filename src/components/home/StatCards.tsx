import type { HomeContent } from "@/content/home";

/** Fewer than four cards: card-sized columns, centred. */
const COLS: Record<number, string> = {
  1: "grid-cols-1 justify-center md:grid-cols-[minmax(0,360px)]",
  2: "grid-cols-2 justify-center md:grid-cols-[repeat(2,minmax(0,360px))]",
  3: "grid-cols-2 justify-center md:grid-cols-[repeat(3,minmax(0,360px))]",
};

/** Four crimson stat cards; on desktop they overlap the bottom of the hero. */
export default function StatCards({ content }: { content: HomeContent["stats"] }) {
  const stats = content.cards;
  if (!stats.length) return null;
  return (
    <section aria-label="American Lycetuff at a glance" className="relative z-30 px-[24px] py-[56px] lg:-mt-[122.4px] lg:p-0">
      <ul
        className={`mx-auto grid max-w-[1492.77px] lg:max-w-[min(1492.77px,calc(84vw_-_120px))] ${
          COLS[stats.length] ?? "grid-cols-2 md:grid-cols-4"
        } gap-[12px] lg:gap-[clamp(20px,1.98vw,38px)]`}
      >
        {stats.map((s, i) => (
          <li
            key={i}
            className="flex h-[174px] flex-col items-center justify-center bg-crimson p-[24px] text-center text-white transition-transform duration-300 hover:-translate-y-1 lg:h-[199px] lg:gap-[10px] lg:px-[16px] lg:py-0"
          >
            <p className="font-inter text-[27px] font-semibold uppercase leading-[32px] tracking-[2.5852px] lg:whitespace-nowrap lg:text-[clamp(28px,2.083vw,40px)] lg:leading-[30.639px] lg:tracking-[0.0957em]">
              {s.value}
            </p>
            <p className="mt-[16px] font-inter text-[15px] font-medium leading-[23px] tracking-[0.78px] lg:mt-0 lg:text-[clamp(12px,0.72vw,13.808px)] lg:leading-[21.783px] lg:tracking-[0.7181px]">
              {s.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
