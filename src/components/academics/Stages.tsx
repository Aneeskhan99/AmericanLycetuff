import type { CSSProperties } from "react";
import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { Container, Eyebrow, SectionHeading, Tag, TagList, lines } from "./ui";

type Content = PageContent<typeof academicsPage>["stages"];
type Item = Content["items"][number];

type Group = { label: string; tags: string[]; variant?: "light" | "dark" | "filled" };
type Stage = {
  stage: string;
  ages: string;
  name: string;
  description: string;
  note?: string;
  groups: Group[];
  dark?: boolean;
  /** desktop min height (grows 20px per stage: 280, 300, 320, 340) */
  minH: CSSProperties;
  /** mobile gap between name block and description */
  introGap: string;
  /** mobile gap between a group label and its chips */
  labelGap?: string;
};

/**
 * Admin item → row. The last stage (when there is more than one) is the navy
 * "Senior School" band: its first list uses outline chips, its second crimson chips.
 * A long list label (it wraps to three lines on phones) gets a little more room.
 */
function toStage(it: Item, i: number, n: number): Stage {
  const dark = n > 1 && i === n - 1;
  const groups: Group[] = [
    { label: it.group1Label, tags: lines(it.group1), variant: dark ? "dark" : "light" },
    { label: it.group2Label, tags: lines(it.group2), variant: dark ? "filled" : "light" },
  ].filter((g) => g.label.trim() || g.tags.length) as Group[];
  const longLabel = groups.some((g) => g.label.length > 40);
  return {
    stage: it.stage,
    ages: it.ages,
    name: it.name,
    description: it.description,
    note: it.note.trim() || undefined,
    groups,
    dark,
    minH: { "--mh": `${280 + 20 * Math.min(i, 3)}px` } as CSSProperties,
    introGap: it.note.trim() ? "mt-[32px]" : "mt-[26px]",
    labelGap: longLabel ? "mt-[24px] lg:mt-[16px]" : undefined,
  };
}

function StageRow({ s }: { s: Stage }) {
  const accent = s.dark ? "text-[#fd0]" : "text-crimson";
  return (
    <li
      style={s.minH}
      className={`grid grid-cols-1 px-[24px] py-[56px] text-center lg:grid-cols-[380fr_540fr_578fr] lg:pb-[40px] lg:pt-[44px] lg:text-left lg:min-h-(--mh) ${
        s.dark
          ? "bg-navy-ink text-white lg:-mx-[48px] lg:px-[48px]"
          : "bg-white lg:border-t lg:border-[#d6d6d6] lg:px-0"
      }`}
    >
      {/* Stage, ages, name */}
      <div className="flex flex-col">
        <p
          className={`text-[13px] font-semibold uppercase leading-[20px] tracking-[2px] lg:text-[13.1px] lg:leading-[16px] ${accent}`}
        >
          {s.stage}
        </p>
        <p
          className={`mt-[14px] text-[36px] font-light leading-[40px] tracking-[-0.5px] lg:mt-[10px] lg:whitespace-nowrap lg:text-[clamp(80px,5.73vw,110px)] lg:leading-[1.21] lg:tracking-[-3px] ${
            s.dark ? "text-white" : "text-crimson"
          }`}
        >
          {s.ages}
        </p>
        <h3
          className={`mt-[8px] text-[24px] leading-[29px] lg:-mt-[6px] lg:text-[clamp(26px,1.67vw,32px)] lg:leading-[40px] ${
            s.dark ? "text-white" : "text-navy"
          }`}
        >
          {s.name}
        </h3>
      </div>

      {/* Description (+ note) */}
      <div className={`${s.introGap} lg:mt-[4px] lg:pr-[40px]`}>
        <p
          className={`text-[18px] leading-[28px] tracking-[0.3px] lg:max-w-[460px] lg:leading-[30px] ${
            s.dark ? "text-white" : "text-black"
          }`}
        >
          {s.description}
        </p>
        {s.note && (
          <p className="mt-[24px] border border-crimson bg-[#f8f8f8] p-[24px] text-[15px] font-medium leading-[23px] text-navy lg:mt-[28px] lg:max-w-[464px] lg:border-0 lg:border-l-4 lg:px-[20px] lg:py-[16px] lg:leading-[24px]">
            {s.note}
          </p>
        )}
      </div>

      {/* Groups */}
      <div className={`${s.note ? "mt-[32px]" : "mt-[24px]"} flex flex-col lg:mt-[4px]`}>
        {s.groups.map((g, i) => (
          <div key={i} className={i > 0 ? "mt-[26px] lg:mt-[37px]" : ""}>
            <p
              className={`text-[12px] font-semibold uppercase leading-[20px] tracking-[2.5px] lg:leading-[15px] ${accent}`}
            >
              {g.label}
            </p>
            <TagList className={s.labelGap ?? "mt-[12px] lg:mt-[15px]"}>
              {g.tags.map((t, ti) => (
                <Tag key={ti} variant={g.variant ?? "light"}>
                  {t}
                </Tag>
              ))}
            </TagList>
          </div>
        ))}
      </div>
    </li>
  );
}

export default function Stages({ content: c }: { content: Content }) {
  const n = c.items.length;
  return (
    <section aria-labelledby="stages-title" className="bg-white py-[56px] lg:pb-[130px] lg:pt-[130px]">
      <Container>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <SectionHeading id="stages-title" text={c.heading} className="mt-[14px] lg:mt-[20px]" />
        {n > 0 && (
          <ol className="mt-[24px] flex flex-col gap-[32px] lg:mt-[60px] lg:gap-0 lg:border-b lg:border-[#d6d6d6]">
            {c.items.map((it, i) => (
              <StageRow key={i} s={toStage(it, i, n)} />
            ))}
          </ol>
        )}
      </Container>
    </section>
  );
}
