import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { clearMediaUsage } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { id } from "@/lib/validate";
import { afterSave, readFaculty, SELECT, STAFF, toClient } from "../_shared";

/** GET /api/admin/faculty/:id */
export const GET = guard(async ({ params }) => {
  const row = await one(`${SELECT} WHERE f.id = $1`, [id(params.id)]);
  if (!row) throw new HttpError(404, "This person was not found. They may have been deleted.");
  return json({ row: toClient(row as Parameters<typeof toClient>[0]) });
}, { roles: [...STAFF] });

/** PATCH /api/admin/faculty/:id — full update (same body as POST). */
export const PATCH = guard(async ({ session, req, params }) => {
  const fid = id(params.id);
  const f = await readFaculty(await body(req));
  const row = await one(
    `UPDATE faculty SET name = $1, designation = $2, department = $3, qualifications = $4, bio = $5, media_id = $6,
            published = $7, updated_at = now() WHERE id = $8 RETURNING id`,
    [f.name, f.designation, f.department, f.qualifications, f.bio, f.mediaId, f.published, fid],
  );
  if (!row) throw new HttpError(404, "This person was not found. They may have been deleted.");
  await afterSave(fid, f);
  await audit(session.user.id, "faculty", fid, "update", { name: f.name, published: f.published });
  return json({ ok: true });
}, { roles: [...STAFF] });

/** DELETE /api/admin/faculty/:id — the photo stays in the media library. */
export const DELETE = guard(async ({ session, params }) => {
  const fid = id(params.id);
  const row = await one<{ name: string }>(`DELETE FROM faculty WHERE id = $1 RETURNING name`, [fid]);
  if (!row) throw new HttpError(404, "This person was not found. They may have been deleted.");
  await clearMediaUsage("faculty", fid);
  await audit(session.user.id, "faculty", fid, "delete", { name: row.name });
  revalidatePaths(["/faculty"]);
  return json({ ok: true });
}, { roles: [...STAFF] });

