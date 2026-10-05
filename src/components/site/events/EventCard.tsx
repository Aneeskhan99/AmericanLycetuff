import Link from "next/link";
import type { PublicEvent } from "@/lib/public/events";
import { eventWhen } from "./format";
import { DateBlock, Meta } from "./ui";

const when = (e: PublicEvent) => eventWhen({ startDate: e.startDate, startTime: e.startTime || null, endDate: e.endDate, endTime: e.endTime, allDay: e.allDay });

/** Upcoming event card: photo (or navy panel) with the date block, then title, time and venue. */
export function EventCard({ event: e, headingLevel = 3 }: { event: PublicEvent; headingLevel?: 3 | 4 }) {
  const w = when(e);
  const H = `h${headingLevel}` as "h3" | "h4";
  return (
    <article className="group relative flex h-full flex-col bg-[#f8f8f8] transition-shadow hover:shadow-[0_12px_32px_rgba(8,30,63,0.12)]" data-testid="event-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy">
        {e.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.image.url}
            srcSet={e.image.srcSet || undefined}
            sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
            alt={e.image.alt}
            width={e.image.width ?? undefined}
            height={e.image.height ?? undefined}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(211,18,69,0.35),transparent_55%),linear-gradient(135deg,#1a2d59,#081e3f)]" />
        )}
        <DateBlock date={e.startDate} className="absolute left-0 top-0" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[6px] bg-[#fd0]" />
      </div>
      <div className="flex flex-1 flex-col p-[24px] lg:p-[28px]">
        <H className="text-[22px] font-semibold leading-[30px] text-black lg:text-[24px] lg:leading-[32px]">
          <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline">
            {e.title}
          </Link>
        </H>
        <ul className="mt-[16px] flex flex-col gap-[8px] text-[15px] leading-[23px] text-[#5c5c5c]">
          <Meta icon="calendar" label="Date">{w.date}</Meta>
          <Meta icon="clock" label="Time">{w.time}</Meta>
          {e.venue && <Meta icon="pin" label="Venue">{e.venue}</Meta>}
        </ul>
        <span aria-hidden className="mt-auto flex items-center gap-[10px] pt-[24px] text-[14px] font-medium uppercase tracking-[1.9px] text-crimson">
          Event details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px] transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </article>
  );
}

/** Compact card for past events. */
export function PastEventCard({ event: e }: { event: PublicEvent }) {
  const w = when(e);
  return (
    <article className="group relative flex h-full items-stretch gap-[16px] border-b border-[#e6e6e6] pb-[20px]" data-testid="past-event">
      <DateBlock date={e.startDate} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className="text-[18px] font-semibold leading-[26px] text-black">
          <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 group-hover:text-crimson">
            {e.title}
          </Link>
        </h3>
        <p className="mt-[4px] text-[14px] leading-[22px] text-[#5c5c5c]">
          {w.date}
          {e.venue ? ` · ${e.venue}` : ""}
        </p>
      </div>
    </article>
  );
}
