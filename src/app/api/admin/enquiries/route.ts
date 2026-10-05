import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import { activeStaff, enquiryFilter } from "@/lib/enquiries";
import { GRADES } from "@/lib/enquiry-options";
import { int } from "@/lib/validate";

const PAGE_SIZE = 20;

/**
 * GET /api/admin/enquiries?search=&form=&campus=&grade=&status=&assigned=&from=&to=&unread=&page=
 * Rows for the current filter, counts per status (for the tabs, ignoring the
 * status filter), and the choices for the filter dropdowns.
 */
export const GET = guard(
  async ({ req }) => {
    const sp = new URL(req.url).searchParams;
    const page = int(sp.get("page"), { min: 1, max: 10_000, fallback: 1 });

    const f = enquiryFilter(sp);
    const counts = enquiryFilter(sp, { skipStatus: true });

    const [totalRow] = await q<{ n: number }>(`SELECT count(*)::int AS n FROM enquiries e ${f.where}`, f.params);
    const rows = await q(
      `SELECT e.id, e.form, e.status, e.name, e.phone, e.email, e.child_name, e.grade, e.created_at, e.read_at,
              e.assigned_to, u.name AS assigned_name, c.name AS campus_name
         FROM enquiries e
         LEFT JOIN users u ON u.id = e.assigned_to
         LEFT JOIN campuses c ON c.id = e.campus_id
         ${f.where}
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT $${f.params.length + 1} OFFSET $${f.params.length + 2}`,
      [...f.params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    const statusCounts = await q<{ status: string; n: number; unread: number }>(
      `SELECT e.status, count(*)::int AS n, count(*) FILTER (WHERE e.read_at IS NULL)::int AS unread
         FROM enquiries e ${counts.where} GROUP BY e.status`,
      counts.params,
    );
    const [campuses, staff] = await Promise.all([
      q<{ id: string; name: string; active: boolean }>(`SELECT id, name, active FROM campuses ORDER BY sort, id`),
      activeStaff(),
    ]);

    return json({
      rows,
      total: totalRow?.n ?? 0,
      page,
      pageSize: PAGE_SIZE,
      counts: Object.fromEntries(statusCounts.map((r) => [r.status, { total: r.n, unread: r.unread }])),
      campuses: campuses.map((c) => ({ id: Number(c.id), name: c.name, active: c.active })),
      staff: staff.map((s) => ({ id: Number(s.id), name: s.name })),
      grades: GRADES,
    });
  },
  { roles: ["administrator", "editor"] },
);
