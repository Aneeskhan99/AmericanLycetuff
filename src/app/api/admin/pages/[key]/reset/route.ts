import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, tx } from "@/lib/db";
import { fieldAt, knownOnly } from "@/components/admin/pages/patch";
import { lockRow, pageOr404, PAGE_ROLES, state, writeDraft } from "../../_lib";

/**
 * POST /api/admin/pages/:key/reset  { field?: "section.field", rev? }
 * Puts one field (or, without `field`, the whole page) back to the code default
 * in the draft. Nothing changes on the live site until the draft is published.
 */
export const POST = guard(
  async ({ session, req, params }) => {
    const page = pageOr404(params.key);
    const b = await body(req);
    const field = b.field === undefined || b.field === null || b.field === "" ? null : b.field;
    if (field !== null && (typeof field !== "string" || !fieldAt(page, field))) throw new HttpError(422, "Unknown field.");
    await tx(async (c) => {
      const row = await lockRow(c, page.key, b.rev);
      const published = knownOnly(page, row.published);
      const draft = row.draft ? knownOnly(page, row.draft) : { ...published };
      if (field) delete draft[field];
      await writeDraft(c, page.key, field ? draft : {}, published, session.user.id);
    });
    await audit(session.user.id, "page", page.key, field ? "reset_field" : "reset_page", field ? { field } : {});
    return json(await state(page));
  },
  { roles: PAGE_ROLES },
);
