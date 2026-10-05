import { body, guard, HttpError, json } from "@/lib/admin-route";
import { tx } from "@/lib/db";
import { normalisePatch } from "@/components/admin/pages/patch";
import { lockRow, pageOr404, PAGE_ROLES, state, writeDraft } from "../../_lib";

/**
 * PUT /api/admin/pages/:key/draft  { patch, rev? }
 * Saves the complete intended patch as the draft (autosave). Values equal to the
 * code default are dropped, so removing a key = "reset to default".
 * `rev` (from the last response) makes a save fail with 409 if someone else
 * changed the page in between.
 */
export const PUT = guard(
  async ({ session, req, params }) => {
    const page = pageOr404(params.key);
    const b = await body(req);
    let patch;
    try {
      patch = normalisePatch(page, b.patch);
    } catch (e) {
      throw new HttpError(422, (e as Error).message);
    }
    await tx(async (c) => {
      const row = await lockRow(c, page.key, b.rev);
      await writeDraft(c, page.key, patch, row.published, session.user.id);
    });
    return json(await state(page));
  },
  { roles: PAGE_ROLES },
);
