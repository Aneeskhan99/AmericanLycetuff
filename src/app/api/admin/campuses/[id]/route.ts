import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { campusInput } from "@/lib/enquiries";
import { id } from "@/lib/validate";

/** PATCH /api/admin/campuses/:id  { name, address, phone, email, mapUrl, active, sort } */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const campusId = id(params.id);
    const c = campusInput(await body(req));
    const row = await one(
      `UPDATE campuses SET name = $2, address = $3, phone = $4, email = $5, map_url = $6, active = $7, sort = $8
        WHERE id = $1 RETURNING id`,
      [campusId, c.name, c.address, c.phone, c.email, c.mapUrl, c.active, c.sort],
    );
    if (!row) throw new HttpError(404, "Campus not found.");
    await audit(session.user.id, "campus", campusId, "update", c);
    return json({ ok: true });
  },
  { roles: ["administrator"] },
);

/** DELETE /api/admin/campuses/:id — enquiries keep their details; their campus becomes blank. */
export const DELETE = guard(
  async ({ session, params }) => {
    const campusId = id(params.id);
    const row = await one<{ name: string }>(`DELETE FROM campuses WHERE id = $1 RETURNING name`, [campusId]);
    if (!row) throw new HttpError(404, "Campus not found.");
    await audit(session.user.id, "campus", campusId, "delete", { name: row.name });
    return json({ ok: true });
  },
  { roles: ["administrator"] },
);
