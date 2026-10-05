import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { int } from "@/lib/validate";
import { ALBUM_SELECT, albumToClient, readAlbum, STAFF, syncAlbum, type AlbumRow } from "./_shared";

const PAGE_SIZE = 20;

/** GET /api/admin/albums?search=&category=&status=&page=  (all=1: every album, for reordering) */
export const GET = guard(async ({ req }) => {
  const u = new URL(req.url);
  const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
  const category = (u.searchParams.get("category") ?? "").trim().slice(0, 40);
  const status = u.searchParams.get("status");
  const all = u.searchParams.get("all") === "1";
  const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    where.push(`(a.title ILIKE $${params.length} OR a.slug ILIKE $${params.length} OR a.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category === "none" ? "" : category);
    where.push(`a.category = $${params.length}`);
  }
  if (status === "published" || status === "hidden") where.push(status === "published" ? "a.published" : "NOT a.published");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM gallery_albums a ${w}`, params))!.n;
  const pageSize = all ? 1000 : PAGE_SIZE;
  params.push(pageSize, all ? 0 : (page - 1) * PAGE_SIZE);
  const rows = await q<AlbumRow>(
    `${ALBUM_SELECT} ${w} ORDER BY a.sort, a.event_date DESC NULLS LAST, a.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return json({ rows: rows.map(albumToClient), total, page: all ? 1 : page, pageSize });
}, { roles: [...STAFF] });

/** POST /api/admin/albums — new album (first in the list). */
export const POST = guard(async ({ session, req }) => {
  const a = await readAlbum(await body(req));
  const row = await one<{ id: string }>(
    `INSERT INTO gallery_albums (title, slug, description, category, cover_media_id, event_date, published, sort)
     VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(min(sort), 1) - 1 FROM gallery_albums)) RETURNING id`,
    [a.title, a.slug, a.description, a.category, a.coverMediaId, a.eventDate, a.published],
  );
  const id = Number(row!.id);
  await syncAlbum(id);
  await audit(session.user.id, "album", id, "create", { title: a.title, slug: a.slug });
  return json({ ok: true, id, slug: a.slug }, 201);
}, { roles: [...STAFF] });
