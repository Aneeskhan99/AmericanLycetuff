import { body, guard, json } from "@/lib/admin-route";
import { audit, tx } from "@/lib/db";
import { revalidatePaths } from "@/lib/revalidate";
import { readIds, STAFF } from "../../_shared";

/** POST /api/admin/downloads/categories/order { ids } — the order of the groups on /downloads. */
export const POST = guard(async ({ session, req }) => {
  const ids = readIds((await body(req)).ids);
  await tx(async (c) => {
    await c.query(`UPDATE download_categories d SET sort = o.i - 1 FROM unnest($1::bigint[]) WITH ORDINALITY AS o(id, i) WHERE d.id = o.id`, [ids]);
  });
  await audit(session.user.id, "download_category", null, "reorder", { count: ids.length });
  revalidatePaths(["/downloads"]);
  return json({ ok: true });
}, { roles: [...STAFF] });
