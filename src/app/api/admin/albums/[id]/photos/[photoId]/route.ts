import { guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { id } from "@/lib/validate";
import { STAFF, syncAlbum } from "../../../_shared";

/** DELETE /api/admin/albums/:id/photos/:photoId — takes the photo out of the album (the image stays in the media library). */
export const DELETE = guard(async ({ session, params }) => {
  const aid = id(params.id);
  const pid = id(params.photoId, "photo");
  const row = await one<{ media_id: string }>(`DELETE FROM gallery_photos WHERE id = $1 AND album_id = $2 RETURNING media_id`, [pid, aid]);
  if (!row) throw new HttpError(404, "This photo is no longer in the album.");
  // If it was the cover, fall back to the first photo.
  await q(`UPDATE gallery_albums SET cover_media_id = NULL, updated_at = now() WHERE id = $1 AND cover_media_id = $2`, [aid, row.media_id]);
  await q(`UPDATE gallery_albums SET updated_at = now() WHERE id = $1`, [aid]);
  await syncAlbum(aid);
  await audit(session.user.id, "album", aid, "remove_photo", { media_id: Number(row.media_id) });
  return json({ ok: true });
}, { roles: [...STAFF] });
