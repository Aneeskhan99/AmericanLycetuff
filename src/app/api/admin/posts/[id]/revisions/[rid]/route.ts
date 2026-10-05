import { guard, HttpError, json } from "@/lib/admin-route";
import { one } from "@/lib/db";
import { ALL_ROLES, loadPost } from "@/lib/posts";
import { id } from "@/lib/validate";

/** GET /api/admin/posts/:id/revisions/:rid — one revision (title, excerpt, body) to restore into the editor. */
export const GET = guard(
  async ({ session, params }) => {
    const post = await loadPost(session, id(params.id, "post"));
    const rev = await one(`SELECT id, title, excerpt, content, saved_at FROM post_revisions WHERE id = $1 AND post_id = $2`, [id(params.rid, "revision"), post.id]);
    if (!rev) throw new HttpError(404, "That revision was not found.");
    return json({ revision: rev });
  },
  { roles: ALL_ROLES },
);
