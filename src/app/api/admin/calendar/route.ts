import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { likeTerm, revalidateCalendar, STAFF } from "../events/_lib";
import { ENTRY_COLS, KINDS, parseEntry, type Kind } from "./_entry";

const MAX_ROWS = 1000;

/**
 * GET /api/admin/calendar?year=&kind=&search=
 * Returns every matching entry (date order) so the screen can group them by academic
 * year and month; a school year has a few dozen entries, so no paging is needed.
 */
export const GET = guard(
  async ({ req }) => {
    const u = new URL(req.url);
    const year = (u.searchParams.get("year") ?? "").trim().slice(0, 7);
    const kind = u.searchParams.get("kind") ?? "";
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);

    const where: string[] = [];
    const params: unknown[] = [];
    if (year) {
      params.push(year);
      where.push(`academic_year = $${params.length}`);
    }
    if (KINDS.includes(kind as Kind)) {
      params.push(kind);
      where.push(`kind = $${params.length}`);
    }
    if (search) {
      params.push(likeTerm(search));
      where.push(`(title ILIKE $${params.length} OR notes ILIKE $${params.length})`);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(MAX_ROWS);
    const rows = await q(
      `SELECT ${ENTRY_COLS} FROM academic_calendar ${w}
        ORDER BY academic_year DESC, start_date ASC, end_date ASC NULLS FIRST, id ASC
        LIMIT $${params.length}`,
      params,
    );
    const years = (await q<{ y: string }>(
      `SELECT DISTINCT academic_year AS y FROM academic_calendar WHERE academic_year <> '' ORDER BY 1 DESC`,
    )).map((r) => r.y);
    return json({ rows, total: rows.length, years });
  },
  { roles: STAFF },
);

/** POST /api/admin/calendar — add an entry. */
export const POST = guard(
  async ({ session, req }) => {
    const e = parseEntry(await body(req));
    const row = await one<{ id: number }>(
      `INSERT INTO academic_calendar (title, kind, start_date, end_date, academic_year, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::int AS id`,
      [e.title, e.kind, e.start, e.end, e.year, e.notes],
    );
    await audit(session.user.id, "academic_calendar", row!.id, "create", { title: e.title, kind: e.kind, start: e.start, year: e.year });
    revalidateCalendar();
    return json({ ok: true, id: row!.id }, 201);
  },
  { roles: STAFF },
);
