import "server-only";
import { HttpError } from "@/lib/admin-route";
import { one } from "@/lib/db";
import { getMediaRefs } from "@/lib/media";
import { bool, str } from "@/lib/validate";
import { dateStr, isUniqueViolation, mediaId, PK_OFFSET, slugify, SLUG_RE, timeStr } from "./_lib";

/** Columns every events query returns, with dates/times converted to Pakistan time. */
export const EVENT_COLS = `
  e.id::int AS id, e.title, e.slug, e.all_day, e.venue, e.published, e.media_id::int AS media_id, e.image_alt,
  e.starts_at, e.ends_at,
  to_char(e.starts_at AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') AS start_date,
  to_char(e.starts_at AT TIME ZONE 'Asia/Karachi', 'HH24:MI') AS start_time,
  to_char(e.ends_at AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') AS end_date,
  to_char(e.ends_at AT TIME ZONE 'Asia/Karachi', 'HH24:MI') AS end_time,
  e.created_at, e.updated_at`;

/** When an event is over: end (or start) time; all-day events last until the end of their last day. */
export const EVENT_END_SQL = `(CASE WHEN e.all_day THEN COALESCE(e.ends_at, e.starts_at) + interval '1 day' ELSE COALESCE(e.ends_at, e.starts_at) END)`;

export type EventInput = {
  title: string; slug: string; startsAt: string; endsAt: string | null; allDay: boolean;
  venue: string; description: string; mediaId: number | null; imageAlt: string; published: boolean;
};

/** Validates the editor's form. Times are PKT; end must not be before start. */
export async function parseEvent(b: Record<string, unknown>): Promise<EventInput> {
  const title = str(b.title, { required: true, max: 200, label: "Title" });
  const rawSlug = str(b.slug, { max: 80, label: "Slug" }).toLowerCase();
  const slug = rawSlug || slugify(title);
  if (!slug) throw new HttpError(422, "Add a slug (letters and numbers), e.g. sports-day-2026.");
  if (!SLUG_RE.test(slug)) throw new HttpError(422, "Slug: lowercase letters, numbers and single dashes only, e.g. sports-day-2026.");

  const allDay = bool(b.allDay);
  const startDate = dateStr(b.startDate, "Start date", true)!;
  const startTime = allDay ? "00:00" : timeStr(b.startTime, "Start time", true)!;
  let endDate = dateStr(b.endDate, "End date");
  const endTime = allDay ? null : timeStr(b.endTime, "End time");
  let endsAt: string | null = null;
  if (allDay) {
    if (endDate) endsAt = `${endDate}T00:00:00${PK_OFFSET}`;
  } else if (endDate || endTime) {
    endDate ??= startDate;
    if (!endTime) throw new HttpError(422, "Add an end time, or clear the end date.");
    endsAt = `${endDate}T${endTime}:00${PK_OFFSET}`;
  }
  const startsAt = `${startDate}T${startTime}:00${PK_OFFSET}`;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    throw new HttpError(422, allDay ? "The end date cannot be before the start date." : "The event cannot end before it starts.");
  }

  const image = (b.image ?? null) as { id?: unknown; alt?: unknown } | null;
  const mid = image && typeof image === "object" ? await mediaId(image.id, "image", "Image") : null;
  const imageAlt = mid ? str(image?.alt, { max: 300, label: "Image description" }) : "";

  return {
    title, slug, startsAt, endsAt, allDay,
    venue: str(b.venue, { max: 200, label: "Venue" }),
    description: str(b.description, { max: 10000, label: "Description" }),
    mediaId: mid, imageAlt,
    published: b.published === undefined ? true : bool(b.published),
  };
}

export async function assertSlugFree(slug: string, exceptId = 0) {
  const taken = await one(`SELECT 1 FROM events WHERE lower(slug) = lower($1) AND id <> $2`, [slug, exceptId]);
  if (taken) throw new HttpError(422, `The slug "${slug}" is already used by another event. Choose a different one.`);
}

export function slugError(e: unknown): never {
  if (isUniqueViolation(e)) throw new HttpError(422, "That slug is already used by another event. Choose a different one.");
  throw e;
}

/** One event for the editor, including its image for the picker preview. */
export async function loadEvent(id: number) {
  const row = await one<Record<string, unknown> & { media_id: number | null; image_alt: string }>(
    `SELECT ${EVENT_COLS}, e.description FROM events e WHERE e.id = $1`,
    [id],
  );
  if (!row) return null;
  const refs = await getMediaRefs([row.media_id]);
  const ref = row.media_id ? refs.get(row.media_id) : undefined;
  return { ...row, image: ref ? { id: ref.id, url: ref.url, alt: row.image_alt || ref.alt } : null };
}
