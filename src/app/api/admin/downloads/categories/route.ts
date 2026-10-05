import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { str } from "@/lib/validate";
import { STAFF } from "../_shared";

/** GET /api/admin/downloads/categories — the editable category list with how many files each has. */
export const GET = guard(async () => {
  const rows = await q<{ id: string; name: string; count: number }>(
    `SELECT c.id, c.name, (SELECT count(*)::int FROM downloads d WHERE lower(d.category) = lower(c.name)) AS count
       FROM download_categories c ORDER BY c.sort, c.name`,
  );
  return json({ rows: rows.map((r) => ({ id: Number(r.id), name: r.name, count: r.count })) });
}, { roles: [...STAFF] });

/** POST /api/admin/downloads/categories { name } */
export const POST = guard(async ({ session, req }) => {
  const name = str((await body(req)).name, { required: true, max: 60, label: "Category name" });
  if (await one(`SELECT 1 FROM download_categories WHERE lower(name) = lower($1)`, [name])) throw new HttpError(422, `“${name}” is already in the list.`);
  const row = await one<{ id: string }>(
    `INSERT INTO download_categories (name, sort) VALUES ($1, (SELECT COALESCE(max(sort), -1) + 1 FROM download_categories)) RETURNING id`,
    [name],
  );
  await audit(session.user.id, "download_category", row!.id, "create", { name });
  return json({ ok: true, id: Number(row!.id) }, 201);
}, { roles: [...STAFF] });
