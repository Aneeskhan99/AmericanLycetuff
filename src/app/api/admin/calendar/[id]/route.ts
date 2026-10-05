import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { id } from "@/lib/validate";
import { revalidateCalendar, STAFF } from "../../events/_lib";
import { ENTRY_COLS, parseEntry } from "../_entry";

/** GET /api/admin/calendar/:id */
export const GET = guard(
  async ({ params }) => {
    const row = await one(`SELECT ${ENTRY_COLS} FROM academic_calendar WHERE id = $1`, [id(params.id)]);
    if (!row) throw new HttpError(404, "Calendar entry not found. It may have been deleted.");
    return json({ entry: row });
  },
  { roles: STAFF },
);

/** PATCH /api/admin/calendar/:id — full save from the editor. */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const entryId = id(params.id);
    const e = parseEntry(await body(req));
    const row = await one(
      `UPDATE academic_calendar SET title = $2, kind = $3, start_date = $4, end_date = $5, academic_year = $6, notes = $7, updated_at = now()
        WHERE id = $1 RETURNING id`,
      [entryId, e.title, e.kind, e.start, e.end, e.year, e.notes],
    );
    if (!row) throw new HttpError(404, "Calendar entry not found. It may have been deleted.");
    await audit(session.user.id, "academic_calendar", entryId, "update", { title: e.title, kind: e.kind, start: e.start, year: e.year });
    revalidateCalendar();
    return json({ ok: true });
  },
  { roles: STAFF },
);

/** DELETE /api/admin/calendar/:id */
export const DELETE = guard(
  async ({ session, params }) => {
    const entryId = id(params.id);
    const row = await one<{ title: string }>(`DELETE FROM academic_calendar WHERE id = $1 RETURNING title`, [entryId]);
    if (!row) throw new HttpError(404, "Calendar entry not found. It may have been deleted already.");
    await audit(session.user.id, "academic_calendar", entryId, "delete", { title: row.title });
    revalidateCalendar();
    return json({ ok: true });
  },
  { roles: STAFF },
);
