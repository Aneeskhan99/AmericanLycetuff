import "server-only";
import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/auth";
import { HttpError } from "@/lib/admin-route";
import { one } from "@/lib/db";
import { revalidatePaths } from "@/lib/revalidate";

/**
 * Shared helpers for the Events, Academic calendar and Notices admin endpoints.
 * All dates and times typed in the admin are Pakistan time (PKT, UTC+5, no DST).
 */
export const STAFF: Role[] = ["administrator", "editor"];
export const PK_OFFSET = "+05:00";
export const PAGE_SIZE = 20;

/** Today's date in Pakistan, as SQL. */
export const PK_TODAY = `(now() AT TIME ZONE 'Asia/Karachi')::date`;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** A real calendar date "YYYY-MM-DD" (or null when empty and not required). */
export function dateStr(v: unknown, label: string, required = false): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw new HttpError(422, `${label} is required.`);
    return null;
  }
  const m = DATE_RE.exec(s);
  if (!m) throw new HttpError(422, `${label} is not a valid date.`);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[1] < 2000 || +m[1] > 2100) {
    throw new HttpError(422, `${label} is not a valid date.`);
  }
  return s;
}

/** "HH:MM" 24-hour (or null when empty and not required). */
export function timeStr(v: unknown, label: string, required = false): string | null {
  const s = typeof v === "string" ? v.trim().slice(0, 5) : "";
  if (!s) {
    if (required) throw new HttpError(422, `${label} is required.`);
    return null;
  }
  if (!TIME_RE.test(s)) throw new HttpError(422, `${label} is not a valid time.`);
  return s;
}

/** Turns "Sports Day 2026!" into "sports-day-2026". */
export function slugify(s: string) {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Optional link: an internal path ("/admissions") or an http(s) URL. */
export function linkStr(v: unknown, label: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  if (s.length > 500) throw new HttpError(422, `${label} must be 500 characters or fewer.`);
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* fall through */
  }
  throw new HttpError(422, `${label} must start with / (a page on this site) or https://`);
}

/** Checks a media id exists and is of the right kind; null when empty. */
export async function mediaId(v: unknown, kind: "image" | "document", label: string): Promise<number | null> {
  if (v === null || v === undefined || v === "" || v === 0) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(422, `${label} is not valid.`);
  const row = await one<{ kind: string }>(`SELECT kind FROM media WHERE id = $1`, [n]);
  if (!row) throw new HttpError(422, `${label} is no longer in the media library. Choose it again.`);
  if (row.kind !== kind) throw new HttpError(422, kind === "image" ? `${label} must be an image.` : `${label} must be a document (PDF).`);
  return n;
}

/** Escapes a search term for ILIKE. */
export const likeTerm = (s: string) => `%${s.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;

/** True when a Postgres error is a unique violation. */
export const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === "23505";

// ------------------------------------------------------------------ revalidation
export function revalidateEvents() {
  revalidatePaths(["/events", "/events/[slug]", "/"]);
  // Also the .ics downloads under /events/[slug]/ics.
  try {
    revalidatePath("/events/[slug]", "layout");
  } catch (err) {
    console.error("[revalidate] /events/[slug] layout", err);
  }
}
export const revalidateCalendar = () => revalidatePaths(["/events"]);
export const revalidateNotices = () => revalidatePaths(["layout:/", "/notices"]);
