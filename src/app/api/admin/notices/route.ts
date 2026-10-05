import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { mediaUrl, setMediaUsage } from "@/lib/media";
import { int } from "@/lib/validate";
import { likeTerm, PAGE_SIZE, revalidateNotices, STAFF } from "../events/_lib";
import { BAR_NOTICE_SQL, NOTICE_COLS, parseNotice, STATUS_SQL, STATUSES } from "./_notice";

/** GET /api/admin/notices?search=&status=&page= — pinned first, then newest start date first. */
export const GET = guard(
  async ({ req }) => {
    const u = new URL(req.url);
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
    const status = u.searchParams.get("status") ?? "";
    const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

    const where: string[] = [];
    const params: unknown[] = [];
    if (search) {
      params.push(likeTerm(search));
      where.push(`(n.title ILIKE $${params.length} OR n.body ILIKE $${params.length})`);
    }
    if ((STATUSES as readonly string[]).includes(status)) {
      params.push(status);
      where.push(`${STATUS_SQL} = $${params.length}`);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM notices n ${w}`, params))?.n ?? 0;
    params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    const rows = await q<{ attachment_path: string | null }>(
      `SELECT ${NOTICE_COLS} FROM notices n LEFT JOIN media m ON m.id = n.attachment_media_id
        ${w}
        ORDER BY n.pinned_home DESC, n.start_date DESC, n.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const bar = await one<{ id: number }>(BAR_NOTICE_SQL);
    return json({
      rows: rows.map(({ attachment_path, ...r }) => ({ ...r, attachment_url: attachment_path ? mediaUrl(attachment_path) : null })),
      total, page, pageSize: PAGE_SIZE, barId: bar?.id ?? null,
    });
  },
  { roles: STAFF },
);

/** POST /api/admin/notices — add a notice. */
export const POST = guard(
  async ({ session, req }) => {
    const n = await parseNotice(await body(req));
    const row = await one<{ id: number }>(
      `INSERT INTO notices (title, body, link_url, start_date, end_date, attachment_media_id, pinned_home, published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id::int AS id`,
      [n.title, n.body, n.link, n.start, n.end, n.attachment, n.pinned, n.published, session.user.id],
    );
    await setMediaUsage("notice", row!.id, "attachment", [n.attachment]);
    await audit(session.user.id, "notice", row!.id, "create", { title: n.title, pinned: n.pinned, published: n.published, start: n.start, end: n.end });
    revalidateNotices();
    return json({ ok: true, id: row!.id }, 201);
  },
  { roles: STAFF },
);
