/** Shared helpers for the gallery albums admin API (not a route). */
import "server-only";
import { CATEGORY_IDS } from "@/components/gallery/photos";
import { HttpError } from "@/lib/admin-route";
import { one, q } from "@/lib/db";
import { setMediaUsage, toRef, type MediaRow } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { bool, str } from "@/lib/validate";

export const STAFF = ["administrator", "editor"] as const;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export async function slugTaken(slug: string, exceptId?: number) {
  return Boolean(await one(`SELECT 1 FROM gallery_albums WHERE lower(slug) = lower($1) AND ($2::bigint IS NULL OR id <> $2)`, [slug, exceptId ?? null]));
}

/** Validates an album body. slugAuto: the slug was generated from the title, so a clash gets "-2", "-3"… */
export async function readAlbum(b: Record<string, unknown>, exceptId?: number) {
  const title = str(b.title, { required: true, max: 140, label: "Title" });
  let slug = str(b.slug, { max: 80, label: "Web address" }).toLowerCase() || slugify(title);
  if (!slug) slug = "album";
  if (!SLUG_RE.test(slug)) throw new HttpError(422, "The web address can only use lowercase letters, numbers and single dashes (for example sports-day-2026).");
  if (await slugTaken(slug, exceptId)) {
    if (b.slugAuto !== true) throw new HttpError(422, `Another album already uses the web address “${slug}”. Choose a different one.`);
    const base = slug.slice(0, 74);
    let n = 2;
    while (await slugTaken(`${base}-${n}`, exceptId)) n++;
    slug = `${base}-${n}`;
  }
  const category = typeof b.category === "string" ? b.category : "";
  if (category && !CATEGORY_IDS.includes(category as never)) throw new HttpError(422, "Category is not valid.");
  let eventDate: string | null = null;
  if (typeof b.eventDate === "string" && b.eventDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.eventDate) || Number.isNaN(Date.parse(b.eventDate))) throw new HttpError(422, "Event date is not a valid date.");
    eventDate = b.eventDate;
  }
  let coverMediaId: number | null = null;
  if (b.coverMediaId !== null && b.coverMediaId !== undefined && b.coverMediaId !== "") {
    coverMediaId = await imageId(b.coverMediaId, "The cover image was not found in the media library.");
  }
  return {
    title, slug, category, eventDate, coverMediaId,
    description: str(b.description, { max: 600, label: "Description" }),
    published: b.published === undefined ? true : bool(b.published),
  };
}

/** An id of an image in the media library, or a 422. */
export async function imageId(v: unknown, message = "That image was not found in the media library.") {
  const n = Number(v);
  const m = Number.isInteger(n) && n > 0 ? await one<{ kind: string }>(`SELECT kind FROM media WHERE id = $1`, [n]) : null;
  if (!m || m.kind !== "image") throw new HttpError(422, message);
  return n;
}

/** Records what the album uses (cover + every photo) and refreshes the public gallery. */
export async function syncAlbum(albumId: number) {
  const a = await one<{ cover_media_id: string | null }>(`SELECT cover_media_id FROM gallery_albums WHERE id = $1`, [albumId]);
  const photos = await q<{ media_id: string }>(`SELECT media_id FROM gallery_photos WHERE album_id = $1`, [albumId]);
  await setMediaUsage("album", albumId, "cover", [a?.cover_media_id ? Number(a.cover_media_id) : null]);
  await setMediaUsage("album", albumId, "photos", photos.map((p) => Number(p.media_id)));
  revalidatePaths(["/gallery", "/gallery/[slug]"]);
}

export const mini = (m: MediaRow | null) => {
  if (!m) return null;
  const r = toRef({ ...m, id: Number(m.id), size: Number(m.size) });
  return { id: r.id, url: r.url, alt: r.alt, srcSet: r.srcSet, width: r.width, height: r.height, name: r.name };
};

export type AlbumRow = {
  id: string; title: string; slug: string; description: string; category: string; event_date: string | null;
  cover_media_id: string | null; sort: number; published: boolean; updated_at: string; count: number; cover: MediaRow | null;
};
export const ALBUM_SELECT = `
  SELECT a.id, a.title, a.slug, a.description, a.category, to_char(a.event_date, 'YYYY-MM-DD') AS event_date,
         a.cover_media_id, a.sort, a.published, a.updated_at,
         (SELECT count(*)::int FROM gallery_photos p WHERE p.album_id = a.id) AS count,
         (SELECT row_to_json(m) FROM media m WHERE m.id = COALESCE(a.cover_media_id,
            (SELECT p.media_id FROM gallery_photos p WHERE p.album_id = a.id ORDER BY p.sort, p.id LIMIT 1))) AS cover
    FROM gallery_albums a`;
export const albumToClient = (r: AlbumRow) => ({
  id: Number(r.id), title: r.title, slug: r.slug, description: r.description, category: r.category, event_date: r.event_date,
  cover_media_id: r.cover_media_id ? Number(r.cover_media_id) : null, sort: r.sort, published: r.published,
  updated_at: r.updated_at, count: r.count, cover: mini(r.cover),
});

export const NOT_FOUND = "This album was not found. It may have been deleted.";
