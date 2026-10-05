import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { deleteMediaFiles, toRef, type MediaRow } from "@/lib/media";
import { id, str } from "@/lib/validate";

/** GET /api/admin/media/:id — the item plus where it is used. */
export const GET = guard(async ({ params }) => {
  const mediaId = id(params.id);
  const row = await one<MediaRow>(`SELECT * FROM media WHERE id = $1`, [mediaId]);
  if (!row) throw new HttpError(404, "File not found.");
  const usage = await q(`SELECT entity, entity_id, field FROM media_usage WHERE media_id = $1 ORDER BY entity, entity_id`, [mediaId]);
  return json({ media: { ...row, ref: toRef(row) }, usage });
});

/** PATCH /api/admin/media/:id  { alt?, title? } */
export const PATCH = guard(async ({ session, req, params }) => {
  const mediaId = id(params.id);
  const b = await body(req);
  const row = await one<MediaRow>(`SELECT * FROM media WHERE id = $1`, [mediaId]);
  if (!row) throw new HttpError(404, "File not found.");
  const alt = b.alt !== undefined ? str(b.alt, { max: 300, label: "Alt text" }) : row.alt;
  const title = b.title !== undefined ? str(b.title, { max: 200, label: "Title" }) : row.title;
  await q(`UPDATE media SET alt = $1, title = $2 WHERE id = $3`, [alt, title, mediaId]);
  await audit(session.user.id, "media", mediaId, "update", { alt, title });
  return json({ ok: true });
});

/** DELETE /api/admin/media/:id — refused while anything still uses the file. */
export const DELETE = guard(async ({ session, params }) => {
  const mediaId = id(params.id);
  const row = await one<MediaRow>(`SELECT * FROM media WHERE id = $1`, [mediaId]);
  if (!row) throw new HttpError(404, "File not found.");
  const uses = await q<{ entity: string; entity_id: string }>(`SELECT entity, entity_id FROM media_usage WHERE media_id = $1`, [mediaId]);
  const downloads = await one<{ n: number }>(`SELECT count(*)::int AS n FROM downloads WHERE media_id = $1`, [mediaId]);
  if (uses.length || (downloads?.n ?? 0) > 0) {
    throw new HttpError(409, `This file is still used (${uses.map((u) => `${u.entity} ${u.entity_id}`).join(", ") || "downloads"}). Remove it there first.`);
  }
  await q(`DELETE FROM media WHERE id = $1`, [mediaId]);
  await deleteMediaFiles(row);
  await audit(session.user.id, "media", mediaId, "delete", { name: row.original_name });
  return json({ ok: true });
});
