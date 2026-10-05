import "server-only";
import { HttpError } from "@/lib/admin-route";
import { oneOf, str } from "@/lib/validate";
import { dateStr } from "../events/_lib";

export const KINDS = ["term", "holiday", "exam", "other"] as const;
export type Kind = (typeof KINDS)[number];

export const ENTRY_COLS = `id::int AS id, title, kind,
  to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
  academic_year, notes, created_at, updated_at`;

/** "2026-27": a start year and the following year's last two digits. */
export function academicYear(v: unknown): string {
  const s = str(v, { required: true, max: 7, label: "Academic year" });
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m || (Number(m[1]) + 1) % 100 !== Number(m[2])) throw new HttpError(422, "Academic year must look like 2026-27.");
  return s;
}

export function parseEntry(b: Record<string, unknown>) {
  const title = str(b.title, { required: true, max: 200, label: "Title" });
  const kind = oneOf(b.kind, KINDS, "Type");
  const start = dateStr(b.startDate, "Start date", true)!;
  const end = dateStr(b.endDate, "End date");
  if (end && end < start) throw new HttpError(422, "The end date cannot be before the start date.");
  return {
    title, kind, start, end: end && end !== start ? end : null,
    year: academicYear(b.academicYear),
    notes: str(b.notes, { max: 1000, label: "Notes" }),
  };
}
