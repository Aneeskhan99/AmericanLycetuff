import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, tx } from "@/lib/db";
import { revalidatePaths } from "@/lib/revalidate";
import { STAFF } from "../_shared";

/** POST /api/admin/faculty/order { ids: [3, 1, 2, …] } — sort follows the array. */
export const POST = guard(async ({ session, req }) => {
  const ids = (await body(req)).ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || !ids.every((x) => Number.isInteger(x) && x > 0) || new Set(ids).size !== ids.length) {
    throw new HttpError(422, "The new order could not be read. Reload the page and try again.");
  }
  await tx(async (c) => {
    await c.query(`UPDATE faculty f SET sort = o.i - 1 FROM unnest($1::bigint[]) WITH ORDINALITY AS o(id, i) WHERE f.id = o.id`, [ids]);
  });
  await audit(session.user.id, "faculty", null, "reorder", { count: ids.length });
  revalidatePaths(["/faculty"]);
  return json({ ok: true });
}, { roles: [...STAFF] });
