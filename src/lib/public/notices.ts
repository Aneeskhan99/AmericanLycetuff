import "server-only";
import { dbConfigured, q } from "@/lib/db";
import { getMediaRefs, mediaUrl, type MediaRef } from "@/lib/media";

/**
 * Notices for the announcement bar at the top of every page.
 * Pinned, published notices whose end date has not passed (Pakistan time), newest
 * start date first. The header picks the one that is live *today* in the browser,
 * so a static page never shows an expired notice or one that has not started yet.
 */
export type BarNotice = { id: number; title: string; href: string; start: string; end: string | null };

const PK_TODAY = `(now() AT TIME ZONE 'Asia/Karachi')::date`;

export async function getBarNotices(): Promise<BarNotice[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = await q<{ id: number; title: string; link_url: string; start: string; end: string | null; path: string | null }>(
      `SELECT n.id::int AS id, n.title, n.link_url, to_char(n.start_date, 'YYYY-MM-DD') AS start,
              to_char(n.end_date, 'YYYY-MM-DD') AS "end", m.path
         FROM notices n LEFT JOIN media m ON m.id = n.attachment_media_id
        WHERE n.pinned_home AND n.published AND (n.end_date IS NULL OR n.end_date >= ${PK_TODAY})
        ORDER BY n.start_date DESC, n.id DESC
        LIMIT 20`,
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      href: r.link_url || (r.path ? mediaUrl(r.path) : "/notices"),
      start: r.start,
      end: r.end,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[notices] bar: ${(err as Error).message}`);
    return [];
  }
}

// ------------------------------------------------------------------ /notices page
export type PublicNotice = {
  id: number; title: string; body: string; link: string; start: string; end: string | null; pinned: boolean;
  attachment: MediaRef | null;
};

type NoticeRow = { id: number; title: string; body: string; link_url: string; start: string; end: string | null; pinned_home: boolean; attachment_media_id: number | null };

async function withAttachments(rows: NoticeRow[]): Promise<PublicNotice[]> {
  const refs = await getMediaRefs(rows.map((r) => r.attachment_media_id));
  return rows.map((r) => ({
    id: r.id, title: r.title, body: r.body, link: r.link_url, start: r.start, end: r.end, pinned: r.pinned_home,
    attachment: (r.attachment_media_id && refs.get(r.attachment_media_id)) || null,
  }));
}

const COLS = `id::int AS id, title, body, link_url, to_char(start_date, 'YYYY-MM-DD') AS start, to_char(end_date, 'YYYY-MM-DD') AS "end",
  pinned_home, attachment_media_id::int AS attachment_media_id`;

/** Live notices (started, not ended) and those that ended in the last 60 days. Never throws. */
export async function getNotices(): Promise<{ live: PublicNotice[]; expired: PublicNotice[] }> {
  if (!dbConfigured()) return { live: [], expired: [] };
  try {
    const [live, expired] = await Promise.all([
      q<NoticeRow>(
        `SELECT ${COLS} FROM notices
          WHERE published AND start_date <= ${PK_TODAY} AND (end_date IS NULL OR end_date >= ${PK_TODAY})
          ORDER BY pinned_home DESC, start_date DESC, id DESC LIMIT 100`,
      ),
      q<NoticeRow>(
        `SELECT ${COLS} FROM notices
          WHERE published AND end_date < ${PK_TODAY} AND end_date >= ${PK_TODAY} - 60
          ORDER BY end_date DESC, id DESC LIMIT 20`,
      ),
    ]);
    return { live: await withAttachments(live), expired: await withAttachments(expired) };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[notices] list: ${(err as Error).message}`);
    return { live: [], expired: [] };
  }
}
