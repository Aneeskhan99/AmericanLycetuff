import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { int } from "@/lib/validate";
import { afterSave, readFaculty, SELECT, STAFF, toClient, type Row } from "./_shared";

const PAGE_SIZE = 20;

/** GET /api/admin/faculty?search=&department=&status=published|hidden&page=  (all=1: every row, for reordering) */
export const GET = guard(async ({ req }) => {
  const u = new URL(req.url);
  const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
  const department = (u.searchParams.get("department") ?? "").trim().slice(0, 80);
  const status = u.searchParams.get("status");
  const all = u.searchParams.get("all") === "1";
  const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    const n = params.length;
    where.push(`(f.name ILIKE $${n} OR f.designation ILIKE $${n} OR f.department ILIKE $${n} OR f.qualifications ILIKE $${n})`);
  }
  if (department) {
    params.push(department);
    where.push(`lower(f.department) = lower($${params.length})`);
  }
  if (status === "published" || status === "hidden") where.push(status === "published" ? "f.published" : "NOT f.published");
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM faculty f ${w}`, params))!.n;
  const pageSize = all ? 1000 : PAGE_SIZE;
  params.push(pageSize, all ? 0 : (page - 1) * PAGE_SIZE);
  const rows = await q<Row>(`${SELECT} ${w} ORDER BY f.sort, f.name, f.id LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const departments = await q<{ d: string }>(
    `SELECT min(trim(department)) AS d FROM faculty WHERE trim(department) <> '' GROUP BY lower(trim(department)) ORDER BY 1`,
  );
  return json({ rows: rows.map(toClient), total, page: all ? 1 : page, pageSize, departments: departments.map((d) => d.d) });
}, { roles: [...STAFF] });

/** POST /api/admin/faculty — add a person (goes to the end of the list). */
export const POST = guard(async ({ session, req }) => {
  const f = await readFaculty(await body(req));
  const row = await one<{ id: string }>(
    `INSERT INTO faculty (name, designation, department, qualifications, bio, media_id, published, sort)
     VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(max(sort), -1) + 1 FROM faculty)) RETURNING id`,
    [f.name, f.designation, f.department, f.qualifications, f.bio, f.mediaId, f.published],
  );
  const id = Number(row!.id);
  await afterSave(id, f);
  await audit(session.user.id, "faculty", id, "create", { name: f.name });
  return json({ ok: true, id }, 201);
}, { roles: [...STAFF] });
