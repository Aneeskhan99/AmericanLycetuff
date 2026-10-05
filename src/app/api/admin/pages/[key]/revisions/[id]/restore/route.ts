import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, tx } from "@/lib/db";
import type { Patch } from "@/lib/content";
import { id } from "@/lib/validate";
import { knownOnly } from "@/components/admin/pages/patch";
import { lockRow, pageOr404, PAGE_ROLES, state, writeDraft } from "../../../../_lib";

/**
 * POST /api/admin/pages/:key/revisions/:id/restore  { rev? }
 * Copies an earlier published version into the draft. It goes live only when published.
 */
export const POST = guard(
  async ({ session, req, params }) => {
    const page = pageOr404(params.key);
    const revId = id(params.id, "revision");
    const b = await body(req);
    const rev = await one<{ content: Patch; published_at: string }>(
      `SELECT content, published_at FROM page_content_revisions WHERE id = $1 AND key = $2`,
      [revId, page.key],
    );
    if (!rev) throw new HttpError(404, "That version no longer exists.");
    await tx(async (c) => {
      const row = await lockRow(c, page.key, b.rev);
      await writeDraft(c, page.key, knownOnly(page, rev.content), knownOnly(page, row.published), session.user.id);
    });
    await audit(session.user.id, "page", page.key, "restore_revision", { revision: revId });
    return json(await state(page));
  },
  { roles: PAGE_ROLES },
);
