import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import { ALL_ROLES, loadPost } from "@/lib/posts";
import { id } from "@/lib/validate";

/** GET /api/admin/posts/:id/revisions — the last 30 manual saves (newest first). */
export const GET = guard(
  async ({ session, params }) => {
    const post = await loadPost(session, id(params.id, "post"));
    const rows = await q(
      `SELECT r.id::int AS id, r.title, r.saved_at, u.name AS saved_by_name
         FROM post_revisions r LEFT JOIN users u ON u.id = r.saved_by
        WHERE r.post_id = $1 ORDER BY r.saved_at DESC, r.id DESC LIMIT 30`,
      [post.id],
    );
    return json({ rows });
  },
  { roles: ALL_ROLES },
);
