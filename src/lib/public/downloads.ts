import "server-only";
import { dbConfigured, q } from "@/lib/db";
import { toRef, type MediaRef, type MediaRow } from "@/lib/media";

/** Public downloads for /downloads, grouped by category in the admin's category order (never throws). */
export type DownloadItem = { id: number; title: string; category: string; file: MediaRef; updatedAt: string };
export type DownloadGroup = { category: string; items: DownloadItem[] };

export async function getDownloadGroups(): Promise<DownloadGroup[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = await q<{ id: string; title: string; category: string; updated_at: string; file: MediaRow }>(
      `SELECT d.id, d.title, d.category, d.updated_at, row_to_json(m) AS file
         FROM downloads d
         JOIN media m ON m.id = d.media_id
         LEFT JOIN download_categories c ON lower(c.name) = lower(d.category)
        WHERE d.visibility = 'public'
        ORDER BY COALESCE(c.sort, 10000), lower(d.category), d.sort, d.title, d.id`,
    );
    const groups = new Map<string, DownloadGroup>();
    for (const r of rows) {
      const category = r.category.trim() || "Other";
      const key = category.toLowerCase();
      if (!groups.has(key)) groups.set(key, { category, items: [] });
      groups.get(key)!.items.push({
        id: Number(r.id), title: r.title, category, updatedAt: r.updated_at,
        file: toRef({ ...r.file, id: Number(r.file.id), size: Number(r.file.size) }),
      });
    }
    return [...groups.values()];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[downloads] ${(err as Error).message}`);
    return [];
  }
}
