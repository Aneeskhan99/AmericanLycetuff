import { body, guard, json } from "@/lib/admin-route";
import { ALL_ROLES, deletePost, postForEditor, savePost } from "@/lib/posts";
import { id } from "@/lib/validate";

/** GET /api/admin/posts/:id — the post for the editor (authors: own posts only). */
export const GET = guard(async ({ session, params }) => json({ post: await postForEditor(session, id(params.id, "post")) }), { roles: ALL_ROLES });

/**
 * PATCH /api/admin/posts/:id
 * { title, slug, slugAuto, excerpt, content (Tiptap JSON), featuredId, featuredAlt, categoryIds[], tags[] (names),
 *   authorId, publishedAt (ISO or null), status: "draft" | "publish", autosave }
 * Authors: own drafts only, and only status "draft" (403 otherwise).
 */
export const PATCH = guard(async ({ session, req, params }) => json(await savePost(session, id(params.id, "post"), await body(req))), { roles: ALL_ROLES });

/** DELETE /api/admin/posts/:id — authors: own drafts only. */
export const DELETE = guard(
  async ({ session, params }) => {
    await deletePost(session, id(params.id, "post"));
    return json({ ok: true });
  },
  { roles: ALL_ROLES },
);
