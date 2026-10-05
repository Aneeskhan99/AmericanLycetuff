import { guard } from "@/lib/admin-route";
import { audit, q } from "@/lib/db";
import { csvDate, csvResponse, subscriberFilter } from "@/lib/enquiries";

/** GET /api/admin/subscribers/export?search=&status= — CSV of the current filter. */
export const GET = guard(
  async ({ session, req }) => {
    const sp = new URL(req.url).searchParams;
    const f = subscriberFilter(sp);
    const rows = await q<{ email: string; name: string; status: string; source_page: string; created_at: string; unsubscribed_at: string | null }>(
      `SELECT email, name, status, source_page, created_at, unsubscribed_at FROM subscribers ${f.where}
        ORDER BY created_at DESC, id DESC LIMIT 50000`,
      f.params,
    );
    await audit(session.user.id, "subscriber", null, "export", { rows: rows.length });
    const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
    return csvResponse(
      `subscribers-${stamp}.csv`,
      ["Email", "Name", "Status", "Signed up (PKT)", "Unsubscribed (PKT)", "Page"],
      rows.map((r) => [r.email, r.name, r.status, csvDate(r.created_at), csvDate(r.unsubscribed_at), r.source_page]),
    );
  },
  { roles: ["administrator", "editor"] },
);
