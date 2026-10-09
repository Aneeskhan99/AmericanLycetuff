import { getEventBySlug, getEventSlugs, type PublicEvent } from "@/lib/public/events";

/**
 * GET /events/<slug>/ics — "Add to calendar" file for one event (iCalendar, RFC 5545).
 * Generated statically and refreshed when the event changes (and at least hourly).
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getEventSlugs()).map((slug) => ({ slug }));
}

const siteUrl = () => (process.env.SITE_URL || "https://swabi.americanlycetuffdnk.edu.pk").replace(/\/$/, "");

/** Escapes TEXT values. */
const text = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds lines longer than 75 octets (continuation lines start with a space). */
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch, "utf8");
    if (len + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      len = 0;
    }
    cur += ch;
    len += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateOnly = (d: string) => d.replace(/-/g, "");
function nextDay(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + 1)).toISOString().slice(0, 10);
}

function ics(e: PublicEvent) {
  const url = `${siteUrl()}/events/${e.slug}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//American Lycetuff Swabi//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${e.id}@swabi.americanlycetuffdnk.edu.pk`,
    `DTSTAMP:${utc(e.updatedAt)}`,
    ...(e.allDay
      ? [`DTSTART;VALUE=DATE:${dateOnly(e.startDate)}`, `DTEND;VALUE=DATE:${dateOnly(nextDay(e.endDate ?? e.startDate))}`]
      : [`DTSTART:${utc(e.startsAt)}`, `DTEND:${utc(e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 60 * 60 * 1000).toISOString())}`]),
    `SUMMARY:${text(e.title)}`,
    ...(e.venue ? [`LOCATION:${text(`${e.venue}, American Lycetuff Swabi Campus`)}`] : [`LOCATION:${text("American Lycetuff Swabi Campus, Shahmansoor Township, Swabi")}`]),
    `DESCRIPTION:${text([e.description, url].filter(Boolean).join("\n\n"))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export async function GET(_req: Request, { params }: RouteContext<"/events/[slug]/ics">) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return new Response("Event not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(ics(e), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
