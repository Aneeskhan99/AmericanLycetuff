import { guard, json } from "@/lib/admin-route";
import { one, q } from "@/lib/db";
import { ALL_ROLES } from "@/lib/posts";
import { int } from "@/lib/validate";

/** GET /api/admin/tags?search=&page=&pageSize= — tags with post counts (also used for the editor's type-ahead). */
export const GET = guard(
  async ({ req }) => {
    const u = new URL(req.url);
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 40);
    const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });
    const pageSize = int(u.searchParams.get("pageSize"), { min: 1, max: 50, fallback: 20 });
    const params: unknown[] = [];
    let w = "";
    if (search) {
      params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
      w = `WHERE t.name ILIKE $1`;
    }
    const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM tags t ${w}`, params))?.n ?? 0;
    params.push(pageSize, (page - 1) * pageSize);
    const rows = await q(
      `SELECT t.id::int AS id, t.name, t.slug, (SELECT count(*)::int FROM post_tags pt WHERE pt.tag_id = t.id) AS posts
         FROM tags t ${w}
        ORDER BY lower(t.name) LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return json({ rows, total, page, pageSize });
  },
  { roles: ALL_ROLES },
);
