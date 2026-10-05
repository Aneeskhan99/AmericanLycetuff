import { guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { saveUpload, toRef, UploadError, type MediaRow } from "@/lib/media";
import { int } from "@/lib/validate";

const PAGE_SIZE = 40;

/** GET /api/admin/media?search=&kind=image|document&unused=1&page= */
export const GET = guard(async ({ req }) => {
  const u = new URL(req.url);
  const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
  const kind = u.searchParams.get("kind");
  const unused = u.searchParams.get("unused") === "1";
  const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });
  const pageSize = int(u.searchParams.get("pageSize"), { min: 1, max: 100, fallback: PAGE_SIZE });

  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    where.push(`(m.original_name ILIKE $${params.length} OR m.alt ILIKE $${params.length} OR m.title ILIKE $${params.length})`);
  }
  if (kind === "image" || kind === "document") {
    params.push(kind);
    where.push(`m.kind = $${params.length}`);
  }
  if (unused) where.push(`NOT EXISTS (SELECT 1 FROM media_usage x WHERE x.media_id = m.id)`);
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM media m ${w}`, params))!.n;
  params.push(pageSize, (page - 1) * pageSize);
  const rows = await q<MediaRow & { uses: number; uploader: string | null }>(
    `SELECT m.*, (SELECT count(*)::int FROM media_usage x WHERE x.media_id = m.id) AS uses, u.name AS uploader
       FROM media m LEFT JOIN users u ON u.id = m.uploaded_by ${w}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return json({
    rows: rows.map((r) => ({ ...r, id: Number(r.id), size: Number(r.size), ref: toRef(r) })),
    total, page, pageSize,
  });
});

/** POST /api/admin/media  multipart/form-data: files[] (one or many), alt (optional) */
export const POST = guard(async ({ session, req }) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Upload could not be read.");
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) throw new HttpError(422, "Choose at least one file.");
  if (files.length > 30) throw new HttpError(422, "Upload up to 30 files at a time.");
  const alt = typeof form.get("alt") === "string" ? String(form.get("alt")).trim() : "";

  const saved: ReturnType<typeof toRef>[] = [];
  const errors: string[] = [];
  for (const f of files) {
    try {
      const row = await saveUpload(f, session.user.id, alt);
      saved.push(toRef(row));
      await audit(session.user.id, "media", row.id, "upload", { name: row.original_name, size: row.size });
    } catch (e) {
      errors.push(e instanceof UploadError ? e.message : `${f.name}: upload failed.`);
      if (!(e instanceof UploadError)) console.error("[media upload]", e);
    }
  }
  if (!saved.length) throw new HttpError(422, errors.join(" "));
  return json({ ok: true, media: saved, errors }, 201);
});
