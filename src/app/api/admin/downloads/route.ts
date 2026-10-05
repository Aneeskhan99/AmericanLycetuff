import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { setMediaUsage } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { int } from "@/lib/validate";
import { readDownload, SELECT, STAFF, toClient, type DownloadRow } from "./_shared";

const PAGE_SIZE = 20;

/** GET /api/admin/downloads?search=&category=&visibility=&page=  (all=1: every row) — plus the category list. */
export const GET = guard(async ({ req }) => {
  const u = new URL(req.url);
  const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
  const category = (u.searchParams.get("category") ?? "").trim().slice(0, 60);
  const visibility = u.searchParams.get("visibility");
  const all = u.searchParams.get("all") === "1";
  const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    where.push(`(d.title ILIKE $${params.length} OR m.original_name ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`lower(d.category) = lower($${params.length})`);
  }
  if (visibility === "public" || visibility === "hidden") {
    params.push(visibility);
    where.push(`d.visibility = $${params.length}`);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM downloads d JOIN media m ON m.id = d.media_id ${w}`, params))!.n;
  const pageSize = all ? 1000 : PAGE_SIZE;
  params.push(pageSize, all ? 0 : (page - 1) * PAGE_SIZE);
  const rows = await q<DownloadRow>(
    `${SELECT} LEFT JOIN download_categories c ON lower(c.name) = lower(d.category) ${w}
      ORDER BY COALESCE(c.sort, 10000), lower(d.category), d.sort, d.title, d.id LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const categories = await q<{ id: string; name: string; sort: number; count: number }>(
    `SELECT c.id, c.name, c.sort, (SELECT count(*)::int FROM downloads d WHERE lower(d.category) = lower(c.name)) AS count
       FROM download_categories c ORDER BY c.sort, c.name`,
  );
  return json({
    rows: rows.map(toClient), total, page: all ? 1 : page, pageSize,
    categories: categories.map((c) => ({ id: Number(c.id), name: c.name, count: c.count })),
  });
}, { roles: [...STAFF] });

/** POST /api/admin/downloads { title, category, mediaId, visibility } */
export const POST = guard(async ({ session, req }) => {
  const d = await readDownload(await body(req));
  const row = await one<{ id: string }>(
    `INSERT INTO downloads (title, category, media_id, visibility, sort)
     VALUES ($1, $2, $3, $4, (SELECT COALESCE(max(sort), -1) + 1 FROM downloads WHERE lower(category) = lower($2))) RETURNING id`,
    [d.title, d.category, d.mediaId, d.visibility],
  );
  const id = Number(row!.id);
  await setMediaUsage("download", id, "file", [d.mediaId]);
  await audit(session.user.id, "download", id, "create", { title: d.title, category: d.category, visibility: d.visibility });
  revalidatePaths(["/downloads"]);
  return json({ ok: true, id }, 201);
}, { roles: [...STAFF] });
