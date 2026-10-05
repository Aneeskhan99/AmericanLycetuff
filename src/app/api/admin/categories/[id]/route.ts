import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { readCategory, revalidateNews, STAFF } from "@/lib/posts";
import { bool, id } from "@/lib/validate";

type Cat = { id: number; name: string; slug: string };

/** PATCH /api/admin/categories/:id { name, slug } — rename (changing the slug changes its page address). */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const cid = id(params.id, "category");
    const old = await one<Cat>(`SELECT id, name, slug FROM categories WHERE id = $1`, [cid]);
    if (!old) throw new HttpError(404, "That category was not found.");
    const { name, slug } = await readCategory(await body(req), cid);
    await q(`UPDATE categories SET name = $1, slug = $2 WHERE id = $3`, [name, slug, cid]);
    await audit(session.user.id, "category", cid, "update", { from: { name: old.name, slug: old.slug }, to: { name, slug } });
    revalidateNews([], [old.slug, slug]);
    return json({ ok: true });
  },
  { roles: STAFF },
);

/**
 * DELETE /api/admin/categories/:id  { force?: true }
 * A category that posts still use is only deleted with force (the posts simply lose it); otherwise 409.
 */
export const DELETE = guard(
  async ({ session, req, params }) => {
    const cid = id(params.id, "category");
    const old = await one<Cat & { posts: number }>(
      `SELECT c.id, c.name, c.slug, (SELECT count(*)::int FROM post_categories WHERE category_id = c.id) AS posts FROM categories c WHERE c.id = $1`,
      [cid],
    );
    if (!old) throw new HttpError(404, "That category was not found.");
    const force = bool((await body(req)).force);
    if (old.posts > 0 && !force) {
      return json({ error: `“${old.name}” is used by ${old.posts} post${old.posts === 1 ? "" : "s"}.`, inUse: old.posts }, 409);
    }
    await q(`DELETE FROM categories WHERE id = $1`, [cid]);
    await audit(session.user.id, "category", cid, "delete", { name: old.name, slug: old.slug, posts: old.posts });
    revalidateNews([], [old.slug]);
    return json({ ok: true });
  },
  { roles: STAFF },
);
