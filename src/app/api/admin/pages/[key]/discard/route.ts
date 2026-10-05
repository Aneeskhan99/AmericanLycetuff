import { body, guard, json } from "@/lib/admin-route";
import { audit, tx } from "@/lib/db";
import { lockRow, pageOr404, PAGE_ROLES, state } from "../../_lib";

/** POST /api/admin/pages/:key/discard  { rev? } — throws away the draft; the live page is untouched. */
export const POST = guard(
  async ({ session, req, params }) => {
    const page = pageOr404(params.key);
    const b = await body(req);
    let had = false;
    await tx(async (c) => {
      const row = await lockRow(c, page.key, b.rev);
      had = row.draft !== null;
      await c.query(`UPDATE page_content SET draft = NULL, draft_updated_at = now(), draft_updated_by = $2 WHERE key = $1`, [page.key, session.user.id]);
    });
    if (had) await audit(session.user.id, "page", page.key, "discard_draft");
    return json(await state(page));
  },
  { roles: PAGE_ROLES },
);
