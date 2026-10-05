import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { clearMediaUsage, type MediaRow } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { id } from "@/lib/validate";
import { ALBUM_SELECT, albumToClient, mini, NOT_FOUND, readAlbum, STAFF, syncAlbum, type AlbumRow } from "../_shared";

/** GET /api/admin/albums/:id — the album and its photos in order. */
export const GET = guard(async ({ params }) => {
  const aid = id(params.id);
  const row = await one<AlbumRow>(`${ALBUM_SELECT} WHERE a.id = $1`, [aid]);
  if (!row) throw new HttpError(404, NOT_FOUND);
  const photos = await q<{ id: string; caption: string; sort: number; media: MediaRow }>(
    `SELECT p.id, p.caption, p.sort, row_to_json(m) AS media FROM gallery_photos p JOIN media m ON m.id = p.media_id
      WHERE p.album_id = $1 ORDER BY p.sort, p.id`,
    [aid],
  );
  return json({
    album: albumToClient(row),
    photos: photos.map((p) => ({ id: Number(p.id), caption: p.caption, media: mini(p.media)! })),
  });
}, { roles: [...STAFF] });

/** PATCH /api/admin/albums/:id — details (same body as POST), or just { coverMediaId } to set the cover. */
export const PATCH = guard(async ({ session, req, params }) => {
  const aid = id(params.id);
  const b = await body(req);
  const cur = await one<AlbumRow>(`${ALBUM_SELECT} WHERE a.id = $1`, [aid]);
  if (!cur) throw new HttpError(404, NOT_FOUND);
  const merged = b.title === undefined
    ? { title: cur.title, slug: cur.slug, description: cur.description, category: cur.category, eventDate: cur.event_date, published: cur.published, coverMediaId: cur.cover_media_id, ...b }
    : b;
  const a = await readAlbum(merged, aid);
  await q(
    `UPDATE gallery_albums SET title = $1, slug = $2, description = $3, category = $4, cover_media_id = $5, event_date = $6,
            published = $7, updated_at = now() WHERE id = $8`,
    [a.title, a.slug, a.description, a.category, a.coverMediaId, a.eventDate, a.published, aid],
  );
  await syncAlbum(aid);
  await audit(session.user.id, "album", aid, b.title === undefined ? "set_cover" : "update", { title: a.title, slug: a.slug, published: a.published });
  return json({ ok: true, slug: a.slug });
}, { roles: [...STAFF] });

/** DELETE /api/admin/albums/:id — removes the album and its photo list; the images stay in the media library. */
export const DELETE = guard(async ({ session, params }) => {
  const aid = id(params.id);
  const row = await one<{ title: string }>(`DELETE FROM gallery_albums WHERE id = $1 RETURNING title`, [aid]);
  if (!row) throw new HttpError(404, NOT_FOUND);
  await clearMediaUsage("album", aid);
  await audit(session.user.id, "album", aid, "delete", { title: row.title });
  revalidatePaths(["/gallery", "/gallery/[slug]"]);
  return json({ ok: true });
}, { roles: [...STAFF] });
