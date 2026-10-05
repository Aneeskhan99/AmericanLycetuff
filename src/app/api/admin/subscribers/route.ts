import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import { subscriberFilter } from "@/lib/enquiries";
import { int } from "@/lib/validate";

const PAGE_SIZE = 20;

/** GET /api/admin/subscribers?search=&status=&page= */
export const GET = guard(
  async ({ req }) => {
    const sp = new URL(req.url).searchParams;
    const page = int(sp.get("page"), { min: 1, max: 10_000, fallback: 1 });
    const f = subscriberFilter(sp);
    const [total] = await q<{ n: number }>(`SELECT count(*)::int AS n FROM subscribers ${f.where}`, f.params);
    const rows = await q(
      `SELECT id, email, name, status, source_page, created_at, unsubscribed_at FROM subscribers ${f.where}
        ORDER BY created_at DESC, id DESC LIMIT $${f.params.length + 1} OFFSET $${f.params.length + 2}`,
      [...f.params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    const counts = await q<{ status: string; n: number }>(`SELECT status, count(*)::int AS n FROM subscribers GROUP BY status`);
    return json({ rows, total: total?.n ?? 0, page, pageSize: PAGE_SIZE, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) });
  },
  { roles: ["administrator", "editor"] },
);
