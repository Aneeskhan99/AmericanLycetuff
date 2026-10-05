import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q, tx } from "@/lib/db";
import { ALL_ROLES, readCategory, revalidateNews, STAFF } from "@/lib/posts";
import { id } from "@/lib/validate";

/** GET /api/admin/categories — all categories in display order, with how many posts use each. */
export const GET = guard(
  async () => {
    const rows = await q(
      `SELECT c.id::int AS id, c.name, c.slug, c.sort, count(pc.post_id)::int AS posts
         FROM categories c LEFT JOIN post_categories pc ON pc.category_id = c.id
        GROUP BY c.id ORDER BY c.sort, lower(c.name)`,
    );
    return json({ rows });
  },
  { roles: ALL_ROLES },
);

/** POST /api/admin/categories { name, slug? } */
export const POST = guard(
  async ({ session, req }) => {
    const { name, slug } = await readCategory(await body(req), null);
    const row = await one<{ id: number }>(
      `INSERT INTO categories (name, slug, sort) VALUES ($1, $2, COALESCE((SELECT max(sort) + 1 FROM categories), 0)) RETURNING id`,
      [name, slug],
    );
    await audit(session.user.id, "category", row!.id, "create", { name, slug });
    revalidateNews([], [slug]);
    return json({ ok: true, id: row!.id }, 201);
  },
  { roles: STAFF },
);

/** PUT /api/admin/categories { order: [id, id, …] } — saves the display order. */
export const PUT = guard(
  async ({ session, req }) => {
    const b = await body(req);
    const order = (Array.isArray(b.order) ? b.order : []).map((x) => id(x, "category"));
    if (!order.length || order.length > 200 || new Set(order).size !== order.length) throw new HttpError(422, "Invalid order.");
    await tx(async (c) => {
      for (const [i, cid] of order.entries()) await c.query(`UPDATE categories SET sort = $1 WHERE id = $2`, [i, cid]);
    });
    await audit(session.user.id, "category", null, "reorder", { order });
    revalidateNews([], []);
    return json({ ok: true });
  },
  { roles: STAFF },
);
