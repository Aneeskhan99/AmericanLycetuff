import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, tx } from "@/lib/db";
import { mediaIdsIn, type Patch } from "@/lib/content";
import { setMediaUsage } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { changedPaths, knownOnly } from "@/components/admin/pages/patch";
import { lockRow, pageOr404, PAGE_ROLES, state } from "../../_lib";

/**
 * POST /api/admin/pages/:key/publish  { rev? }
 * Makes the draft live: published = draft, draft cleared, a revision recorded,
 * media usage updated and the page's public paths re-rendered.
 */
export const POST = guard(
  async ({ session, req, params }) => {
    const page = pageOr404(params.key);
    const b = await body(req);
    let next: Patch = {};
    let changed: string[] = [];
    await tx(async (c) => {
      const row = await lockRow(c, page.key, b.rev);
      if (row.draft === null) throw new HttpError(409, "There are no unpublished changes to publish.");
      next = knownOnly(page, row.draft);
      changed = changedPaths(page, knownOnly(page, row.published), next);
      await c.query(
        `UPDATE page_content SET published = $2::jsonb, draft = NULL, published_at = now(), published_by = $3 WHERE key = $1`,
        [page.key, JSON.stringify(next), session.user.id],
      );
      await c.query(
        `INSERT INTO page_content_revisions (key, content, changed, published_by) VALUES ($1, $2::jsonb, $3::jsonb, $4)`,
        [page.key, JSON.stringify(next), JSON.stringify(changed), session.user.id],
      );
    });
    await setMediaUsage("page", page.key, "content", mediaIdsIn(next));
    await audit(session.user.id, "page", page.key, "publish", { changed });
    revalidatePaths(page.revalidate ?? [page.path]);
    return json({ ...(await state(page)), changed });
  },
  { roles: PAGE_ROLES },
);
