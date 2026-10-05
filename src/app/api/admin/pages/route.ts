import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import type { Patch } from "@/lib/content";
import { PAGES } from "@/content";
import { fieldCount, knownOnly, deepEqual } from "@/components/admin/pages/patch";
import { PAGE_ROLES } from "./_lib";

type Row = {
  key: string; draft: Patch | null; published: Patch;
  draft_updated_at: string | null; draft_updated_by_name: string | null;
  published_at: string | null; published_by_name: string | null;
};

/** GET /api/admin/pages — every editable page, in the order of PAGES, with its status. */
export const GET = guard(
  async () => {
    const rows = await q<Row>(
      `SELECT pc.key, pc.draft, pc.published, pc.draft_updated_at, pc.published_at,
              du.name AS draft_updated_by_name, pu.name AS published_by_name
         FROM page_content pc
         LEFT JOIN users du ON du.id = pc.draft_updated_by
         LEFT JOIN users pu ON pu.id = pc.published_by`,
    );
    const byKey = new Map(rows.map((r) => [r.key, r]));
    const pages = PAGES.map((p) => {
      const r = byKey.get(p.key);
      const published = knownOnly(p, r?.published);
      const draft = r?.draft ? knownOnly(p, r.draft) : null;
      return {
        key: p.key,
        title: p.title,
        path: p.path,
        sections: Object.keys(p.sections).length,
        fields: fieldCount(p),
        customised: Object.keys(published).length,
        hasDraft: draft !== null && !deepEqual(draft, published),
        publishedAt: r?.published_at ?? null,
        publishedBy: r?.published_by_name ?? null,
        draftUpdatedAt: r?.draft_updated_at ?? null,
        draftUpdatedBy: r?.draft_updated_by_name ?? null,
      };
    });
    return json({ rows: pages, total: pages.length });
  },
  { roles: PAGE_ROLES },
);
