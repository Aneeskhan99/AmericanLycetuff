import { body, guard, json } from "@/lib/admin-route";
import { one, q } from "@/lib/db";
import { ALL_ROLES, isStaff, savePost, STATE_SQL } from "@/lib/posts";
import { int } from "@/lib/validate";

const PAGE_SIZE = 20;

/**
 * GET /api/admin/posts?search=&status=&category=&author=&page=
 * Authors only ever see their own posts.
 */
export const GET = guard(
  async ({ session, req }) => {
    const u = new URL(req.url);
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
    const status = u.searchParams.get("status") ?? "";
    const category = int(u.searchParams.get("category"), { min: 0, fallback: 0 });
    const author = int(u.searchParams.get("author"), { min: 0, fallback: 0 });
    const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

    const where: string[] = [];
    const params: unknown[] = [];
    const add = (sql: (n: number) => string, v: unknown) => {
      params.push(v);
      where.push(sql(params.length));
    };
    if (!isStaff(session)) add((n) => `p.author_id = $${n}`, session.user.id);
    else if (author) add((n) => `p.author_id = $${n}`, author);
    if (search) add((n) => `(p.title ILIKE $${n} OR p.slug ILIKE $${n} OR p.excerpt ILIKE $${n})`, `%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    if (status === "draft" || status === "scheduled" || status === "published") add((n) => `${STATE_SQL} = $${n}`, status);
    if (category) add((n) => `EXISTS (SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id AND pc.category_id = $${n})`, category);
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM posts p ${w}`, params))?.n ?? 0;
    params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    const rows = await q(
      `SELECT p.id, p.title, p.slug, p.status, ${STATE_SQL} AS state, p.published_at, p.updated_at, p.author_id,
              u.name AS author_name,
              COALESCE((SELECT json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.sort, c.name)
                          FROM post_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.post_id = p.id), '[]'::json) AS categories
         FROM posts p LEFT JOIN users u ON u.id = p.author_id
         ${w}
        ORDER BY CASE WHEN p.status = 'draft' THEN 0 ELSE 1 END, COALESCE(p.published_at, p.updated_at) DESC, p.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const out = rows.map((r) => ({ ...r, id: Number(r.id), author_id: r.author_id === null ? null : Number(r.author_id) }));
    return json({ rows: out, total, page, pageSize: PAGE_SIZE });
  },
  { roles: ALL_ROLES },
);

/** POST /api/admin/posts — create (body as for PATCH /api/admin/posts/[id]). */
export const POST = guard(
  async ({ session, req }) => {
    const result = await savePost(session, null, await body(req));
    return json(result, 201);
  },
  { roles: ALL_ROLES },
);
