import "server-only";
import { cache } from "react";
import { isCategoryId, type CategoryId, type GalleryPhoto, type ImageMeta } from "@/components/gallery/photos";
import { mediaIdsIn } from "@/lib/content";
import { getPageContent } from "@/lib/content-server";
import { dbConfigured, q } from "@/lib/db";
import { getMediaRefs, toRef, type MediaRef, type MediaRow } from "@/lib/media";
import { galleryPage } from "@/content/gallery";

/**
 * Gallery data for the public pages: page content (+ sizes of any uploaded
 * images it uses) and published albums. Every function catches DB errors and
 * returns empty results, so the site builds without a database.
 */

const warn = (what: string, err: unknown) => {
  if (process.env.NODE_ENV !== "production") console.warn(`[gallery] ${what}: ${(err as Error).message}`);
};

/** Page content plus width/height/srcset of every media-library image it references. */
export async function getGalleryContent() {
  const content = await getPageContent(galleryPage);
  const meta: ImageMeta = {};
  try {
    const refs = await getMediaRefs(mediaIdsIn(content));
    for (const r of refs.values()) {
      if (r.kind === "image") meta[r.url] = { width: r.width ?? 1600, height: r.height ?? 1067, srcSet: r.srcSet };
    }
  } catch (err) {
    warn("media sizes", err);
  }
  return { content, meta };
}

export type AlbumCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: CategoryId | "";
  eventDate: string | null;
  count: number;
  cover: MediaRef | null;
};

type AlbumRow = {
  id: string; slug: string; title: string; description: string; category: string; event_date: string | null;
  count: number; cover: MediaRow | null;
};

const ALBUM_SELECT = `
  SELECT a.id, a.slug, a.title, a.description, a.category, to_char(a.event_date, 'YYYY-MM-DD') AS event_date,
         (SELECT count(*)::int FROM gallery_photos p WHERE p.album_id = a.id) AS count,
         (SELECT row_to_json(m) FROM media m
           WHERE m.id = COALESCE(a.cover_media_id,
                 (SELECT p.media_id FROM gallery_photos p WHERE p.album_id = a.id ORDER BY p.sort, p.id LIMIT 1))) AS cover
    FROM gallery_albums a
   WHERE a.published`;
const ALBUM_ORDER = `ORDER BY a.sort, a.event_date DESC NULLS LAST, a.id DESC`;

const toCard = (r: AlbumRow): AlbumCard => ({
  id: Number(r.id),
  slug: r.slug,
  title: r.title,
  description: r.description,
  category: isCategoryId(r.category) ? r.category : "",
  eventDate: r.event_date,
  count: r.count,
  cover: r.cover ? toRef({ ...r.cover, id: Number(r.cover.id), size: Number(r.cover.size) }) : null,
});

/** Published albums that have at least one photo, in admin order. */
export async function getAlbums(): Promise<AlbumCard[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = await q<AlbumRow>(`${ALBUM_SELECT} AND EXISTS (SELECT 1 FROM gallery_photos p WHERE p.album_id = a.id) ${ALBUM_ORDER}`);
    return rows.map(toCard);
  } catch (err) {
    warn("albums", err);
    return [];
  }
}

export async function getAlbumSlugs(): Promise<string[]> {
  return (await getAlbums()).map((a) => a.slug);
}

export type AlbumPhoto = { id: number; caption: string; media: MediaRef };

/** One published album with its photos, or null. */
export const getAlbum = cache(async (slug: string): Promise<(AlbumCard & { photos: AlbumPhoto[] }) | null> => {
  if (!dbConfigured() || !slug || slug.length > 120) return null;
  try {
    const rows = await q<AlbumRow>(`${ALBUM_SELECT} AND lower(a.slug) = lower($1)`, [slug]);
    if (!rows[0]) return null;
    const album = toCard(rows[0]);
    const photos = await q<MediaRow & { photo_id: string; caption: string }>(
      `SELECT m.*, p.id AS photo_id, p.caption FROM gallery_photos p JOIN media m ON m.id = p.media_id
        WHERE p.album_id = $1 AND m.kind = 'image' ORDER BY p.sort, p.id`,
      [album.id],
    );
    return {
      ...album,
      photos: photos.map((r) => ({ id: Number(r.photo_id), caption: r.caption, media: toRef({ ...r, id: Number(r.id), size: Number(r.size) }) })),
    };
  } catch (err) {
    warn(`album ${slug}`, err);
    return null;
  }
});

/** A media-library image as a lightbox photo. */
export function mediaPhoto(id: string, media: MediaRef, extra: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id,
    src: media.url,
    srcSet: media.srcSet,
    alt: media.alt,
    width: media.width ?? 1600,
    height: media.height ?? 1067,
    categories: [],
    ...extra,
  };
}

/** Photos of published albums that have a category: they join that filter tab on /gallery. */
export async function getAlbumTabPhotos(): Promise<GalleryPhoto[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = await q<MediaRow & { photo_id: string; caption: string; category: string; title: string }>(
      `SELECT m.*, p.id AS photo_id, p.caption, a.category, a.title
         FROM gallery_photos p
         JOIN gallery_albums a ON a.id = p.album_id
         JOIN media m ON m.id = p.media_id
        WHERE a.published AND a.category <> '' AND m.kind = 'image'
        ORDER BY a.sort, a.event_date DESC NULLS LAST, a.id DESC, p.sort, p.id`,
    );
    return rows
      .filter((r) => isCategoryId(r.category))
      .map((r) => {
        const ref = toRef({ ...r, id: Number(r.id), size: Number(r.size) });
        return mediaPhoto(`album-photo-${r.photo_id}`, ref, {
          alt: ref.alt || r.caption || r.title,
          caption: r.caption,
          categories: [r.category as CategoryId],
        });
      });
  } catch (err) {
    warn("album photos", err);
    return [];
  }
}
