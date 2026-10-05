import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { one, q } from "@/lib/db";

/**
 * Media library storage.
 *
 * Files live in MEDIA_DIR, OUTSIDE the code folder, so a redeploy never touches
 * them. Default: a folder named "AmericanLycetuff-media" next to the project.
 * They are served at /media/<path> by src/app/media/[...path]/route.ts (or by
 * Nginx directly in production; see README).
 *
 * Images are re-encoded on upload: EXIF rotation applied, metadata stripped,
 * main file capped at 2400px wide (WebP), plus sm/md/lg WebP variants for srcset.
 * GIFs are kept as they are (animation). SVG is refused (it can carry scripts).
 */

export type MediaKind = "image" | "document";
export type MediaVariant = { path: string; width: number; height: number };
export type MediaRow = {
  id: number;
  path: string;
  original_name: string;
  mime: string;
  kind: MediaKind;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  title: string;
  variants: Record<string, MediaVariant>;
  uploaded_by: number | null;
  created_at: string;
};

/** What public pages need to render a media item. */
export type MediaRef = {
  id: number;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  srcSet: string;
  mime: string;
  kind: MediaKind;
  name: string;
  size: number;
};

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const DOC_MAX_BYTES = 25 * 1024 * 1024;
const MAIN_MAX_WIDTH = 2400;
const VARIANTS: Record<string, number> = { sm: 480, md: 1024, lg: 1600 };

const DOC_TYPES: Record<string, { ext: string; magic?: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  "application/msword": { ext: "doc" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: [0x50, 0x4b] },
  "application/vnd.ms-excel": { ext: "xls" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", magic: [0x50, 0x4b] },
  "application/vnd.ms-powerpoint": { ext: "ppt" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "pptx", magic: [0x50, 0x4b] },
};
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export function mediaDir(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "..", "AmericanLycetuff-media"));
}

export const mediaUrl = (p: string) => `/media/${p.split("/").map(encodeURIComponent).join("/")}`;

export class UploadError extends Error {}

function slugify(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || "file"
  );
}

async function writeIn(rel: string, data: Buffer) {
  const full = path.join(mediaDir(), rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

/** Validates, processes and stores one uploaded file, then records it in the media table. */
export async function saveUpload(file: File, userId: number | null, alt = ""): Promise<MediaRow> {
  const type = (file.type || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const base = `${slugify(file.name)}-${randomBytes(3).toString("hex")}`;

  if (IMAGE_TYPES.has(type)) {
    if (buf.length > IMAGE_MAX_BYTES) throw new UploadError(`${file.name}: images must be 15 MB or smaller.`);
    let meta: Metadata;
    try {
      meta = await sharp(buf).metadata();
    } catch {
      throw new UploadError(`${file.name} is not a readable image.`);
    }
    if (!meta.format || !["jpeg", "png", "webp", "gif", "avif", "heif"].includes(meta.format)) {
      throw new UploadError(`${file.name} is not a supported image type.`);
    }

    // Animated GIFs stay as they are.
    if (meta.format === "gif") {
      const rel = `${dir}/${base}.gif`;
      await writeIn(rel, buf);
      return insertRow({ path: rel, file, mime: "image/gif", kind: "image", size: buf.length, width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null, alt, variants: {}, userId });
    }

    const main = await sharp(buf).rotate().resize({ width: MAIN_MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const rel = `${dir}/${base}.webp`;
    await writeIn(rel, main.data);
    const variants: Record<string, MediaVariant> = {};
    for (const [name, width] of Object.entries(VARIANTS)) {
      if (main.info.width <= width) continue;
      const v = await sharp(main.data).resize({ width }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      const vrel = `${dir}/${base}-${name}.webp`;
      await writeIn(vrel, v.data);
      variants[name] = { path: vrel, width: v.info.width, height: v.info.height };
    }
    return insertRow({ path: rel, file, mime: "image/webp", kind: "image", size: main.data.length, width: main.info.width, height: main.info.height, alt, variants, userId });
  }

  const doc = DOC_TYPES[type];
  if (!doc) throw new UploadError(`${file.name}: only images (JPG, PNG, WebP, GIF) and documents (PDF, Word, Excel, PowerPoint) can be uploaded.`);
  if (buf.length > DOC_MAX_BYTES) throw new UploadError(`${file.name}: documents must be 25 MB or smaller.`);
  if (doc.magic && !doc.magic.every((b, i) => buf[i] === b)) throw new UploadError(`${file.name} does not look like a real ${doc.ext.toUpperCase()} file.`);
  const rel = `${dir}/${base}.${doc.ext}`;
  await writeIn(rel, buf);
  return insertRow({ path: rel, file, mime: type, kind: "document", size: buf.length, width: null, height: null, alt, variants: {}, userId });
}

async function insertRow(r: {
  path: string; file: File; mime: string; kind: MediaKind; size: number; width: number | null; height: number | null;
  alt: string; variants: Record<string, MediaVariant>; userId: number | null;
}): Promise<MediaRow> {
  const row = await one<MediaRow>(
    `INSERT INTO media (path, original_name, mime, kind, size, width, height, alt, title, variants, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [r.path, r.file.name.slice(0, 200), r.mime, r.kind, r.size, r.width, r.height, r.alt.slice(0, 300),
      r.file.name.replace(/\.[^.]+$/, "").slice(0, 200), JSON.stringify(r.variants), r.userId],
  );
  return normalise(row!);
}

function normalise(r: MediaRow): MediaRow {
  return { ...r, id: Number(r.id), size: Number(r.size) };
}

/** Removes the files of a media row (main + variants). The caller deletes the row. */
export async function deleteMediaFiles(row: Pick<MediaRow, "path" | "variants">) {
  const root = mediaDir();
  for (const rel of [row.path, ...Object.values(row.variants ?? {}).map((v) => v.path)]) {
    const full = path.join(root, rel);
    if (full.startsWith(root + path.sep)) await rm(full, { force: true });
  }
}

export function toRef(r: MediaRow): MediaRef {
  const variants = Object.values(r.variants ?? {}).sort((a, b) => a.width - b.width);
  const srcSet = r.kind === "image" && variants.length
    ? [...variants.map((v) => `${mediaUrl(v.path)} ${v.width}w`), ...(r.width ? [`${mediaUrl(r.path)} ${r.width}w`] : [])].join(", ")
    : "";
  return {
    id: Number(r.id), url: mediaUrl(r.path), alt: r.alt, width: r.width, height: r.height, srcSet,
    mime: r.mime, kind: r.kind, name: r.original_name, size: Number(r.size),
  };
}

/** Loads media by id for rendering (public pages call this at build/revalidate time). */
export async function getMediaRefs(ids: (number | null | undefined)[]): Promise<Map<number, MediaRef>> {
  const clean = [...new Set(ids.filter((x): x is number => Number.isInteger(x) && (x as number) > 0))];
  if (!clean.length) return new Map();
  const rows = await q<MediaRow>(`SELECT * FROM media WHERE id = ANY($1::bigint[])`, [clean]);
  return new Map(rows.map((r) => [Number(r.id), toRef(normalise(r))]));
}

/**
 * Records which media items an entity uses in one field, replacing what was there.
 * Call it every time the entity is saved. entity examples: 'post', 'event', 'page', 'faculty'.
 */
export async function setMediaUsage(entity: string, entityId: string | number, field: string, ids: (number | null | undefined)[]) {
  const clean = [...new Set(ids.filter((x): x is number => Number.isInteger(x) && (x as number) > 0))];
  await q(`DELETE FROM media_usage WHERE entity = $1 AND entity_id = $2 AND field = $3`, [entity, String(entityId), field]);
  if (clean.length) {
    await q(
      `INSERT INTO media_usage (media_id, entity, entity_id, field)
       SELECT m.id, $2, $3, $4 FROM media m WHERE m.id = ANY($1::bigint[])
       ON CONFLICT DO NOTHING`,
      [clean, entity, String(entityId), field],
    );
  }
}

/** Removes every usage record of an entity (call when the entity is deleted). */
export async function clearMediaUsage(entity: string, entityId: string | number) {
  await q(`DELETE FROM media_usage WHERE entity = $1 AND entity_id = $2`, [entity, String(entityId)]);
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
