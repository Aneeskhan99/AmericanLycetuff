import { guard } from "@/lib/admin-route";
import { audit, q } from "@/lib/db";
import { csvDate, csvResponse, enquiryFilter, FORM_LABEL, STATUS_LABEL } from "@/lib/enquiries";
import type { EnquiryForm, EnquiryStatus } from "@/lib/enquiry-options";

const MAX_ROWS = 10_000;

/** GET /api/admin/enquiries/export?<same filters as the list> — CSV download of the current filter. */
export const GET = guard(
  async ({ session, req }) => {
    const sp = new URL(req.url).searchParams;
    const f = enquiryFilter(sp);
    const rows = await q<{
      id: string; created_at: string; form: EnquiryForm; status: EnquiryStatus; campus_name: string | null; name: string;
      phone: string; email: string; child_name: string; grade: string; topic: string; message: string;
      data: Record<string, string>; assigned_name: string | null; read_at: string | null; source_page: string; referrer: string;
      utm_source: string; utm_medium: string; utm_campaign: string; utm_term: string; utm_content: string; email_status: string;
    }>(
      `SELECT e.id, e.created_at, e.form, e.status, c.name AS campus_name, e.name, e.phone, e.email, e.child_name, e.grade,
              e.topic, e.message, e.data, u.name AS assigned_name, e.read_at, e.source_page, e.referrer,
              e.utm_source, e.utm_medium, e.utm_campaign, e.utm_term, e.utm_content, e.email_status
         FROM enquiries e
         LEFT JOIN users u ON u.id = e.assigned_to
         LEFT JOIN campuses c ON c.id = e.campus_id
         ${f.where}
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT ${MAX_ROWS}`,
      f.params,
    );
    await audit(session.user.id, "enquiry", null, "export", { rows: rows.length, filter: Object.fromEntries(sp) });

    const header = [
      "ID", "Received (PKT)", "Form", "Status", "Campus", "Name", "Phone", "Email", "Child's name", "Grade", "Pathway",
      "Preferred contact time", "Campus visit", "Topic", "Message", "Assigned to", "Read", "Page", "Landing page", "Referrer",
      "UTM source", "UTM medium", "UTM campaign", "UTM term", "UTM content", "Email status",
    ];
    const out = rows.map((r) => [
      r.id, csvDate(r.created_at), FORM_LABEL[r.form] ?? r.form, STATUS_LABEL[r.status] ?? r.status, r.campus_name ?? "",
      r.name, r.phone, r.email, r.child_name, r.grade, r.data?.pathway ?? "", r.data?.preferredContactTime ?? "",
      r.form === "contact" ? "" : r.data?.campusVisit ?? "", r.topic, r.message, r.assigned_name ?? "", r.read_at ? "Yes" : "No",
      r.source_page, r.data?.landingPage ?? "", r.referrer, r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term, r.utm_content,
      r.email_status,
    ]);
    const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
    return csvResponse(`enquiries-${stamp}.csv`, header, out);
  },
  { roles: ["administrator", "editor"] },
);
