import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { clearMediaUsage, mediaUrl, setMediaUsage } from "@/lib/media";
import { id } from "@/lib/validate";
import { revalidateNotices, STAFF } from "../../events/_lib";
import { NOTICE_COLS, parseNotice } from "../_notice";

/** GET /api/admin/notices/:id */
export const GET = guard(
  async ({ params }) => {
    const row = await one<{ attachment_path: string | null }>(
      `SELECT ${NOTICE_COLS} FROM notices n LEFT JOIN media m ON m.id = n.attachment_media_id WHERE n.id = $1`,
      [id(params.id)],
    );
    if (!row) throw new HttpError(404, "Notice not found. It may have been deleted.");
    const { attachment_path, ...rest } = row;
    return json({ notice: { ...rest, attachment_url: attachment_path ? mediaUrl(attachment_path) : null } });
  },
  { roles: STAFF },
);

/** PATCH /api/admin/notices/:id — full save from the editor. */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const noticeId = id(params.id);
    const n = await parseNotice(await body(req));
    const row = await one(
      `UPDATE notices SET title = $2, body = $3, link_url = $4, start_date = $5, end_date = $6, attachment_media_id = $7,
              pinned_home = $8, published = $9, updated_at = now()
        WHERE id = $1 RETURNING id`,
      [noticeId, n.title, n.body, n.link, n.start, n.end, n.attachment, n.pinned, n.published],
    );
    if (!row) throw new HttpError(404, "Notice not found. It may have been deleted.");
    await setMediaUsage("notice", noticeId, "attachment", [n.attachment]);
    await audit(session.user.id, "notice", noticeId, "update", { title: n.title, pinned: n.pinned, published: n.published, start: n.start, end: n.end });
    revalidateNotices();
    return json({ ok: true });
  },
  { roles: STAFF },
);

/** DELETE /api/admin/notices/:id */
export const DELETE = guard(
  async ({ session, params }) => {
    const noticeId = id(params.id);
    const row = await one<{ title: string }>(`DELETE FROM notices WHERE id = $1 RETURNING title`, [noticeId]);
    if (!row) throw new HttpError(404, "Notice not found. It may have been deleted already.");
    await clearMediaUsage("notice", noticeId);
    await audit(session.user.id, "notice", noticeId, "delete", { title: row.title });
    revalidateNotices();
    return json({ ok: true });
  },
  { roles: STAFF },
);
