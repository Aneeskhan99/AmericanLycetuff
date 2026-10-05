import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { revalidateNews, slugify, STAFF } from "@/lib/posts";
import { id, str } from "@/lib/validate";

/** PATCH /api/admin/tags/:id { name } */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const tid = id(params.id, "tag");
    const old = await one<{ name: string }>(`SELECT name FROM tags WHERE id = $1`, [tid]);
    if (!old) throw new HttpError(404, "That tag was not found.");
    const name = str((await body(req)).name, { required: true, max: 40, label: "Name" }).replace(/\s+/g, " ");
    const slug = slugify(name);
    if (!slug) throw new HttpError(422, "The name needs at least one letter or number.");
    const clash = await one<{ name: string }>(`SELECT name FROM tags WHERE (slug = $1 OR lower(name) = lower($2)) AND id <> $3`, [slug, name, tid]);
    if (clash) throw new HttpError(422, `The tag “${clash.name}” already exists.`);
    await q(`UPDATE tags SET name = $1, slug = $2 WHERE id = $3`, [name, slug, tid]);
    await audit(session.user.id, "tag", tid, "update", { from: old.name, to: name });
    revalidateNews([], []);
    return json({ ok: true });
  },
  { roles: STAFF },
);

/** DELETE /api/admin/tags/:id — removes the tag from every post. */
export const DELETE = guard(
  async ({ session, params }) => {
    const tid = id(params.id, "tag");
    const old = await one<{ name: string }>(`DELETE FROM tags WHERE id = $1 RETURNING name`, [tid]);
    if (!old) throw new HttpError(404, "That tag was not found.");
    await audit(session.user.id, "tag", tid, "delete", { name: old.name });
    revalidateNews([], []);
    return json({ ok: true });
  },
  { roles: STAFF },
);
