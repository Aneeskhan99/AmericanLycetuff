import type { CalendarEntry } from "@/lib/public/events";
import { fmtRange, KIND_LABEL, MONTHS_LONG, weekday, ymd } from "./format";
import { Container, SectionIntro } from "./ui";

type Kind = CalendarEntry["kind"];
const KINDS: Kind[] = ["term", "holiday", "exam", "other"];

/** Colour per type; the type is always written out too, so colour is never the only cue. */
const STYLE: Record<Kind, { bar: string; swatch: string; label: string }> = {
  term: { bar: "bg-navy", swatch: "bg-navy", label: "text-navy" },
  holiday: { bar: "bg-crimson", swatch: "bg-crimson", label: "text-crimson" },
  exam: { bar: "bg-[#fd0]", swatch: "bg-[#fd0] ring-1 ring-inset ring-black/15", label: "text-[#7a5d00]" },
  other: { bar: "bg-[#9e9e9e]", swatch: "bg-[#9e9e9e]", label: "text-[#5c5c5c]" },
};

export default function AcademicCalendar({ year, entries, label, title, intro, empty }: {
  year: string | null; entries: CalendarEntry[]; label: string; title: string; intro: string; empty: string;
}) {
  const months: { key: string; name: string; rows: CalendarEntry[] }[] = [];
  for (const e of entries) {
    const key = e.start.slice(0, 7);
    let m = months.find((x) => x.key === key);
    if (!m) {
      const { y, m: mm } = ymd(e.start);
      months.push((m = { key, name: `${MONTHS_LONG[mm - 1]} ${y}`, rows: [] }));
    }
    m.rows.push(e);
  }
  const used = KINDS.filter((k) => entries.some((e) => e.kind === k));

  return (
    <section id="calendar" aria-labelledby="calendar-title" className="scroll-mt-[120px] bg-[#f8f8f8] py-14 lg:py-[120px]">
      <Container>
        <SectionIntro id="calendar-title" label={year ? `${label} ${year}` : label} title={title} intro={intro} aside />

        {entries.length === 0 ? (
          <p className="mt-10 border-l-[6px] border-[#fd0] bg-white px-6 py-8 text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:mt-[64px] lg:text-left">
            {empty}
          </p>
        ) : (
          <>
            <ul aria-label="Key" className="mt-8 flex flex-wrap justify-center gap-x-[24px] gap-y-[10px] lg:mt-[56px] lg:justify-start">
              {used.map((k) => (
                <li key={k} className="flex items-center gap-[10px] text-[14px] font-medium uppercase tracking-[1.5px] text-black">
                  <span aria-hidden className={`size-[14px] ${STYLE[k].swatch}`} />
                  {KIND_LABEL[k]}
                </li>
              ))}
            </ul>

            <ol className="mt-6 grid gap-[18px] md:grid-cols-2 lg:mt-[32px] lg:grid-cols-3 lg:gap-[30px]">
              {months.map((m) => (
                <li key={m.key} className="bg-white" data-testid="calendar-month">
                  <h3 className="flex items-center justify-between bg-navy px-[24px] py-[14px] text-[13px] font-semibold uppercase tracking-[2px] text-white">
                    {m.name}
                  </h3>
                  <ul className="divide-y divide-[#ececec]">
                    {m.rows.map((e) => (
                      <li key={e.id} className="relative flex gap-[16px] py-[16px] pl-[24px] pr-[20px]">
                        <span aria-hidden className={`absolute bottom-[14px] left-0 top-[14px] w-[5px] ${STYLE[e.kind].bar}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[12px] font-semibold uppercase tracking-[1.8px] ${STYLE[e.kind].label}`}>{KIND_LABEL[e.kind]}</p>
                          <p className="mt-[4px] text-[17px] font-semibold leading-[24px] text-black">{e.title}</p>
                          <p className="mt-[2px] text-[15px] leading-[22px] text-[#5c5c5c]">
                            <time dateTime={e.start}>{fmtRange(e.start, e.end)}</time>
                            <span className="text-[#9e9e9e]"> · {e.end && e.end !== e.start ? `${weekday(e.start)} – ${weekday(e.end)}` : weekday(e.start)}</span>
                          </p>
                          {e.notes && <p className="mt-[6px] text-[14px] leading-[21px] text-[#5c5c5c]">{e.notes}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </Container>
    </section>
  );
}
