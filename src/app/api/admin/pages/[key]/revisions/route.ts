import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import { labelOf } from "@/components/admin/pages/patch";
import { pageOr404, PAGE_ROLES } from "../../_lib";

/** GET /api/admin/pages/:key/revisions — every publish of this page, newest first (max 100). */
export const GET = guard(
  async ({ params }) => {
    const page = pageOr404(params.key);
    const rows = await q<{ id: string; changed: string[]; note: string; published_at: string; by_name: string | null; fields: number }>(
      `SELECT r.id, r.changed, r.note, r.published_at, u.name AS by_name,
              (SELECT count(*) FROM jsonb_object_keys(r.content))::int AS fields
         FROM page_content_revisions r LEFT JOIN users u ON u.id = r.published_by
        WHERE r.key = $1
        ORDER BY r.published_at DESC, r.id DESC
        LIMIT 100`,
      [page.key],
    );
    return json({
      rows: rows.map((r) => ({
        id: Number(r.id),
        publishedAt: r.published_at,
        publishedBy: r.by_name,
        note: r.note,
        customised: r.fields,
        changed: (Array.isArray(r.changed) ? r.changed : []).map((path) => ({ path, label: labelOf(page, path) })),
      })),
    });
  },
  { roles: PAGE_ROLES },
);
