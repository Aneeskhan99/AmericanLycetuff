import "server-only";
import { academicYearOf, todayPk } from "@/components/site/events/format";
import { dbConfigured, one, q } from "@/lib/db";
import { getMediaRefs, type MediaRef } from "@/lib/media";

/**
 * Events and the academic calendar for the public site. Every function catches
 * database errors and returns an empty result, so `next build` works without a DB.
 * Dates/times are returned as Pakistan-time strings.
 */
export type PublicEvent = {
  id: number; title: string; slug: string; allDay: boolean;
  startDate: string; startTime: string; endDate: string | null; endTime: string | null;
  startsAt: string; endsAt: string | null;
  venue: string; description: string; image: MediaRef | null; updatedAt: string;
};

export type CalendarEntry = { id: number; title: string; kind: "term" | "holiday" | "exam" | "other"; start: string; end: string | null; notes: string };

type Row = {
  id: number; title: string; slug: string; all_day: boolean; start_date: string; start_time: string; end_date: string | null; end_time: string | null;
  starts_at: Date; ends_at: Date | null; venue: string; description: string; media_id: number | null; image_alt: string; updated_at: Date;
};

const COLS = `e.id::int AS id, e.title, e.slug, e.all_day, e.venue, e.description, e.media_id::int AS media_id, e.image_alt,
  e.starts_at, e.ends_at, e.updated_at,
  to_char(e.starts_at AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') AS start_date,
  to_char(e.starts_at AT TIME ZONE 'Asia/Karachi', 'HH24:MI') AS start_time,
  to_char(e.ends_at AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') AS end_date,
  to_char(e.ends_at AT TIME ZONE 'Asia/Karachi', 'HH24:MI') AS end_time`;

/** All-day events last until the end of their last day. */
const END = `(CASE WHEN e.all_day THEN COALESCE(e.ends_at, e.starts_at) + interval '1 day' ELSE COALESCE(e.ends_at, e.starts_at) END)`;

const warn = (what: string, err: unknown) => {
  if (process.env.NODE_ENV !== "production") console.warn(`[events] ${what}: ${(err as Error).message}`);
};

async function toEvents(rows: Row[]): Promise<PublicEvent[]> {
  const refs = await getMediaRefs(rows.map((r) => r.media_id));
  return rows.map((r) => {
    const ref = r.media_id ? refs.get(r.media_id) : undefined;
    return {
      id: r.id, title: r.title, slug: r.slug, allDay: r.all_day,
      startDate: r.start_date, startTime: r.all_day ? "" : r.start_time,
      endDate: r.end_date, endTime: r.all_day ? null : r.end_time,
      startsAt: new Date(r.starts_at).toISOString(), endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null,
      venue: r.venue, description: r.description,
      image: ref ? { ...ref, alt: r.image_alt || ref.alt } : null,
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  });
}

/** Published events that have not finished yet, soonest first. */
export async function getUpcomingEvents(limit = 60): Promise<PublicEvent[]> {
  if (!dbConfigured()) return [];
  try {
    return toEvents(await q<Row>(`SELECT ${COLS} FROM events e WHERE e.published AND ${END} >= now() ORDER BY e.starts_at, e.id LIMIT $1`, [limit]));
  } catch (err) {
    warn("upcoming", err);
    return [];
  }
}

/** The latest finished events, most recent first. */
export async function getPastEvents(limit = 6): Promise<PublicEvent[]> {
  if (!dbConfigured()) return [];
  try {
    return toEvents(await q<Row>(`SELECT ${COLS} FROM events e WHERE e.published AND ${END} < now() ORDER BY e.starts_at DESC, e.id DESC LIMIT $1`, [limit]));
  } catch (err) {
    warn("past", err);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<PublicEvent | null> {
  if (!dbConfigured() || !/^[a-z0-9-]{1,80}$/i.test(slug)) return null;
  try {
    const row = await one<Row>(`SELECT ${COLS} FROM events e WHERE e.published AND lower(e.slug) = lower($1)`, [slug]);
    return row ? (await toEvents([row]))[0] : null;
  } catch (err) {
    warn("by slug", err);
    return null;
  }
}

/** Slugs to pre-render at build time (recent and upcoming published events). */
export async function getEventSlugs(): Promise<string[]> {
  if (!dbConfigured()) return [];
  try {
    return (await q<{ slug: string }>(`SELECT slug FROM events WHERE published ORDER BY starts_at DESC LIMIT 200`)).map((r) => r.slug);
  } catch (err) {
    warn("slugs", err);
    return [];
  }
}

/**
 * The academic calendar for the current academic year: the year whose dates span today;
 * otherwise the year today falls in (Aug–Jul); otherwise the next year that starts;
 * otherwise the latest one.
 */
export async function getCurrentCalendar(): Promise<{ year: string | null; entries: CalendarEntry[] }> {
  if (!dbConfigured()) return { year: null, entries: [] };
  try {
    const today = todayPk();
    const years = await q<{ y: string; s: string; e: string }>(
      `SELECT academic_year AS y, to_char(min(start_date), 'YYYY-MM-DD') AS s,
              to_char(max(COALESCE(end_date, start_date)), 'YYYY-MM-DD') AS e
         FROM academic_calendar WHERE academic_year <> '' GROUP BY academic_year`,
    );
    if (!years.length) return { year: null, entries: [] };
    const byStart = [...years].sort((a, b) => a.s.localeCompare(b.s));
    const pick =
      byStart.find((y) => y.s <= today && today <= y.e) ??
      byStart.find((y) => y.y === academicYearOf(today)) ??
      byStart.find((y) => y.s > today) ??
      [...years].sort((a, b) => b.e.localeCompare(a.e))[0];
    const entries = await q<CalendarEntry>(
      `SELECT id::int AS id, title, kind, to_char(start_date, 'YYYY-MM-DD') AS start, to_char(end_date, 'YYYY-MM-DD') AS "end", notes
         FROM academic_calendar WHERE academic_year = $1
        ORDER BY start_date, end_date NULLS FIRST, id`,
      [pick.y],
    );
    return { year: pick.y, entries };
  } catch (err) {
    warn("calendar", err);
    return { year: null, entries: [] };
  }
}
