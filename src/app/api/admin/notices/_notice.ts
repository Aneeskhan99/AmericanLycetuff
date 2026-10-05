import "server-only";
import { HttpError } from "@/lib/admin-route";
import { bool, str } from "@/lib/validate";
import { dateStr, linkStr, mediaId, PK_TODAY } from "../events/_lib";

export const STATUSES = ["live", "scheduled", "expired", "hidden"] as const;

export const STATUS_SQL = `(CASE WHEN NOT n.published THEN 'hidden'
  WHEN n.start_date > ${PK_TODAY} THEN 'scheduled'
  WHEN n.end_date IS NOT NULL AND n.end_date < ${PK_TODAY} THEN 'expired'
  ELSE 'live' END)`;

export const NOTICE_COLS = `n.id::int AS id, n.title, n.body, n.link_url, n.pinned_home, n.published,
  to_char(n.start_date, 'YYYY-MM-DD') AS start_date, to_char(n.end_date, 'YYYY-MM-DD') AS end_date,
  n.attachment_media_id::int AS attachment_media_id, m.original_name AS attachment_name, m.path AS attachment_path,
  ${STATUS_SQL} AS status, n.created_at, n.updated_at`;

/** The pinned notice the announcement bar shows today (same rule as the header: newest start first). */
export const BAR_NOTICE_SQL = `SELECT id::int AS id FROM notices
  WHERE pinned_home AND published AND start_date <= ${PK_TODAY} AND (end_date IS NULL OR end_date >= ${PK_TODAY})
  ORDER BY start_date DESC, id DESC LIMIT 1`;

export async function parseNotice(b: Record<string, unknown>) {
  const start = dateStr(b.startDate, "Start date", true)!;
  const end = dateStr(b.endDate, "End date");
  if (end && end < start) throw new HttpError(422, "The end date cannot be before the start date.");
  return {
    title: str(b.title, { required: true, max: 200, label: "Title" }),
    body: str(b.body, { max: 1000, label: "Text" }),
    link: linkStr(b.link, "Link"),
    start, end,
    attachment: await mediaId(b.attachmentId, "document", "Attachment"),
    pinned: bool(b.pinned),
    published: b.published === undefined ? true : bool(b.published),
  };
}
