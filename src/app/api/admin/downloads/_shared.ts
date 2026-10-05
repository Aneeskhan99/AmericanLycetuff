/** Shared helpers for the downloads admin API (not a route). */
import "server-only";
import { HttpError } from "@/lib/admin-route";
import { one } from "@/lib/db";
import { toRef, type MediaRow } from "@/lib/media";
import { oneOf, str } from "@/lib/validate";

export const STAFF = ["administrator", "editor"] as const;
export const VISIBILITY = ["public", "hidden"] as const;

/** The stored spelling of a category, adding it to the list when it is new. */
export async function ensureCategory(name: string): Promise<string> {
  const hit = await one<{ name: string }>(`SELECT name FROM download_categories WHERE lower(name) = lower($1)`, [name]);
  if (hit) return hit.name;
  await one(
    `INSERT INTO download_categories (name, sort) VALUES ($1, (SELECT COALESCE(max(sort), -1) + 1 FROM download_categories))
     ON CONFLICT DO NOTHING RETURNING id`,
    [name],
  );
  return name;
}

export async function readDownload(b: Record<string, unknown>) {
  const title = str(b.title, { required: true, max: 160, label: "Title" });
  const category = await ensureCategory(str(b.category, { required: true, max: 60, label: "Category" }));
  const visibility = oneOf(b.visibility ?? "public", VISIBILITY, "Visibility");
  const n = Number(b.mediaId);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(422, "Choose or upload the file.");
  if (!(await one(`SELECT 1 FROM media WHERE id = $1`, [n]))) throw new HttpError(422, "The chosen file was not found in the media library.");
  return { title, category, visibility, mediaId: n };
}

export type DownloadRow = {
  id: string; title: string; category: string; visibility: "public" | "hidden"; sort: number; updated_at: string; file: MediaRow;
};
export const SELECT = `SELECT d.id, d.title, d.category, d.visibility, d.sort, d.updated_at, row_to_json(m) AS file
                         FROM downloads d JOIN media m ON m.id = d.media_id`;
export const toClient = (r: DownloadRow) => {
  const f = toRef({ ...r.file, id: Number(r.file.id), size: Number(r.file.size) });
  return {
    id: Number(r.id), title: r.title, category: r.category, visibility: r.visibility, sort: r.sort, updated_at: r.updated_at,
    file: { id: f.id, url: f.url, name: f.name, size: f.size, mime: f.mime, kind: f.kind, srcSet: f.srcSet, alt: f.alt, width: f.width, height: f.height },
  };
};
export const NOT_FOUND = "This download was not found. It may have been deleted.";

export function readIds(ids: unknown): number[] {
  if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || !ids.every((x) => Number.isInteger(x) && x > 0) || new Set(ids).size !== ids.length) {
    throw new HttpError(422, "The new order could not be read. Reload the page and try again.");
  }
  return ids as number[];
}
