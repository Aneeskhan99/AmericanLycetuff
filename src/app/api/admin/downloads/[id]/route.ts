import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { clearMediaUsage, deleteMediaFiles, setMediaUsage, type MediaRow } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { id } from "@/lib/validate";
import { NOT_FOUND, readDownload, SELECT, STAFF, toClient, type DownloadRow } from "../_shared";

/** GET /api/admin/downloads/:id */
export const GET = guard(async ({ params }) => {
  const row = await one<DownloadRow>(`${SELECT} WHERE d.id = $1`, [id(params.id)]);
  if (!row) throw new HttpError(404, NOT_FOUND);
  return json({ row: toClient(row) });
}, { roles: [...STAFF] });

/** PATCH /api/admin/downloads/:id — full update, or just { visibility }. */
export const PATCH = guard(async ({ session, req, params }) => {
  const did = id(params.id);
  const b = await body(req);
  const cur = await one<{ title: string; category: string; media_id: string; visibility: string }>(`SELECT * FROM downloads WHERE id = $1`, [did]);
  if (!cur) throw new HttpError(404, NOT_FOUND);
  const d = await readDownload(b.title === undefined ? { title: cur.title, category: cur.category, mediaId: Number(cur.media_id), visibility: cur.visibility, ...b } : b);
  const categoryChanged = d.category.toLowerCase() !== cur.category.toLowerCase();
  await one(
    `UPDATE downloads SET title = $1, category = $2, media_id = $3, visibility = $4, updated_at = now(),
            sort = CASE WHEN $6 THEN (SELECT COALESCE(max(sort), -1) + 1 FROM downloads WHERE lower(category) = lower($2)) ELSE sort END
      WHERE id = $5 RETURNING id`,
    [d.title, d.category, d.mediaId, d.visibility, did, categoryChanged],
  );
  await setMediaUsage("download", did, "file", [d.mediaId]);
  await audit(session.user.id, "download", did, "update", { title: d.title, category: d.category, visibility: d.visibility });
  revalidatePaths(["/downloads"]);
  return json({ ok: true });
}, { roles: [...STAFF] });

/**
 * DELETE /api/admin/downloads/:id[?deleteFile=1] — removes the download. With deleteFile=1 the
 * file is also deleted from the media library, but only if nothing else uses it.
 */
export const DELETE = guard(async ({ session, req, params }) => {
  const did = id(params.id);
  const row = await one<{ title: string; media_id: string }>(`DELETE FROM downloads WHERE id = $1 RETURNING title, media_id`, [did]);
  if (!row) throw new HttpError(404, NOT_FOUND);
  await clearMediaUsage("download", did);
  let fileDeleted = false;
  if (new URL(req.url).searchParams.get("deleteFile") === "1") {
    const mid = Number(row.media_id);
    const used = await one(
      `SELECT 1 WHERE EXISTS (SELECT 1 FROM media_usage WHERE media_id = $1) OR EXISTS (SELECT 1 FROM downloads WHERE media_id = $1)`,
      [mid],
    );
    if (!used) {
      const m = await one<MediaRow>(`DELETE FROM media WHERE id = $1 RETURNING *`, [mid]);
      if (m) {
        await deleteMediaFiles(m);
        await audit(session.user.id, "media", mid, "delete", { name: m.original_name, via: "download" });
        fileDeleted = true;
      }
    }
  }
  await audit(session.user.id, "download", did, "delete", { title: row.title, fileDeleted });
  revalidatePaths(["/downloads"]);
  return json({ ok: true, fileDeleted });
}, { roles: [...STAFF] });
