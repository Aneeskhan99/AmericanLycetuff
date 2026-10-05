import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q, tx } from "@/lib/db";
import { id, str } from "@/lib/validate";
import { NOT_FOUND, STAFF, syncAlbum } from "../../_shared";

const MAX_PHOTOS = 500;

/** POST /api/admin/albums/:id/photos { mediaIds: [..] } — adds images to the end (ones already in the album are skipped). */
export const POST = guard(async ({ session, req, params }) => {
  const aid = id(params.id);
  if (!(await one(`SELECT 1 FROM gallery_albums WHERE id = $1`, [aid]))) throw new HttpError(404, NOT_FOUND);
  const raw = (await body(req)).mediaIds;
  if (!Array.isArray(raw) || !raw.length || raw.length > 100 || !raw.every((x) => Number.isInteger(x) && x > 0)) {
    throw new HttpError(422, "Choose between 1 and 100 images.");
  }
  const ids = [...new Set(raw as number[])];
  const images = await q<{ id: string }>(`SELECT id FROM media WHERE id = ANY($1::bigint[]) AND kind = 'image'`, [ids]);
  const ok = new Set(images.map((r) => Number(r.id)));
  if (ok.size !== ids.length) throw new HttpError(422, "Only images can be added to an album.");
  const count = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM gallery_photos WHERE album_id = $1`, [aid]))!.n;
  if (count + ids.length > MAX_PHOTOS) throw new HttpError(422, `An album can hold up to ${MAX_PHOTOS} photos.`);
  const added = await q<{ id: string }>(
    `INSERT INTO gallery_photos (album_id, media_id, sort)
     SELECT $1, x.id, (SELECT COALESCE(max(sort), -1) FROM gallery_photos WHERE album_id = $1) + x.i
       FROM unnest($2::bigint[]) WITH ORDINALITY AS x(id, i)
      WHERE NOT EXISTS (SELECT 1 FROM gallery_photos g WHERE g.album_id = $1 AND g.media_id = x.id)
     RETURNING id`,
    [aid, ids],
  );
  await q(`UPDATE gallery_albums SET updated_at = now() WHERE id = $1`, [aid]);
  await syncAlbum(aid);
  await audit(session.user.id, "album", aid, "add_photos", { added: added.length, skipped: ids.length - added.length });
  return json({ ok: true, added: added.length, skipped: ids.length - added.length }, 201);
}, { roles: [...STAFF] });

/** PUT /api/admin/albums/:id/photos { photos: [{ id, caption }, …] } — saves the order and every caption. */
export const PUT = guard(async ({ session, req, params }) => {
  const aid = id(params.id);
  const raw = (await body(req)).photos;
  if (!Array.isArray(raw) || raw.length > MAX_PHOTOS) throw new HttpError(422, "The photo list could not be read.");
  const list = raw.map((p, i) => {
    const o = (p ?? {}) as Record<string, unknown>;
    return { id: id(o.id, "photo"), caption: str(o.caption, { max: 300, label: `Caption of photo ${i + 1}` }) };
  });
  const existing = await q<{ id: string }>(`SELECT id FROM gallery_photos WHERE album_id = $1`, [aid]);
  const have = new Set(existing.map((r) => Number(r.id)));
  if (list.length !== have.size || !list.every((p) => have.has(p.id)) || new Set(list.map((p) => p.id)).size !== list.length) {
    throw new HttpError(409, "The album changed in the meantime. Reload the page and try again.");
  }
  await tx(async (c) => {
    for (const [i, p] of list.entries()) {
      await c.query(`UPDATE gallery_photos SET sort = $1, caption = $2 WHERE id = $3 AND album_id = $4`, [i, p.caption, p.id, aid]);
    }
    await c.query(`UPDATE gallery_albums SET updated_at = now() WHERE id = $1`, [aid]);
  });
  await syncAlbum(aid);
  await audit(session.user.id, "album", aid, "update_photos", { count: list.length });
  return json({ ok: true });
}, { roles: [...STAFF] });
