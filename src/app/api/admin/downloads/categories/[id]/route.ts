import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, tx } from "@/lib/db";
import { revalidatePaths } from "@/lib/revalidate";
import { id, str } from "@/lib/validate";
import { STAFF } from "../../_shared";

/** PATCH /api/admin/downloads/categories/:id { name } — renames it everywhere. */
export const PATCH = guard(async ({ session, req, params }) => {
  const cid = id(params.id);
  const name = str((await body(req)).name, { required: true, max: 60, label: "Category name" });
  const cur = await one<{ name: string }>(`SELECT name FROM download_categories WHERE id = $1`, [cid]);
  if (!cur) throw new HttpError(404, "This category was not found.");
  if (await one(`SELECT 1 FROM download_categories WHERE lower(name) = lower($1) AND id <> $2`, [name, cid])) {
    throw new HttpError(422, `“${name}” is already in the list.`);
  }
  await tx(async (c) => {
    await c.query(`UPDATE download_categories SET name = $1 WHERE id = $2`, [name, cid]);
    await c.query(`UPDATE downloads SET category = $1, updated_at = now() WHERE lower(category) = lower($2)`, [name, cur.name]);
  });
  await audit(session.user.id, "download_category", cid, "rename", { from: cur.name, to: name });
  revalidatePaths(["/downloads"]);
  return json({ ok: true });
}, { roles: [...STAFF] });

/** DELETE /api/admin/downloads/categories/:id — only when no download uses it. */
export const DELETE = guard(async ({ session, params }) => {
  const cid = id(params.id);
  const cur = await one<{ name: string }>(`SELECT name FROM download_categories WHERE id = $1`, [cid]);
  if (!cur) throw new HttpError(404, "This category was not found.");
  const used = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM downloads WHERE lower(category) = lower($1)`, [cur.name]))!.n;
  if (used) throw new HttpError(409, `“${cur.name}” still has ${used} file${used === 1 ? "" : "s"}. Move or delete them first.`);
  await one(`DELETE FROM download_categories WHERE id = $1 RETURNING id`, [cid]);
  await audit(session.user.id, "download_category", cid, "delete", { name: cur.name });
  return json({ ok: true });
}, { roles: [...STAFF] });
