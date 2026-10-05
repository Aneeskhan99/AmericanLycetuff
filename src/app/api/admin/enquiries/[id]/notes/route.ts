import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { id, str } from "@/lib/validate";

/** POST /api/admin/enquiries/:id/notes  { body } — adds an internal note (never shown to the family). */
export const POST = guard(
  async ({ session, req, params }) => {
    const enquiryId = id(params.id);
    const b = await body(req);
    const text = str(b.body, { required: true, max: 4000, label: "Note" });
    const exists = await one(`SELECT 1 FROM enquiries WHERE id = $1`, [enquiryId]);
    if (!exists) throw new HttpError(404, "This enquiry no longer exists.");
    const note = await one(
      `WITH ins AS (
         INSERT INTO enquiry_activity (enquiry_id, user_id, kind, body) VALUES ($1, $2, 'note', $3)
         RETURNING id, kind, body, detail, created_at, user_id
       ) SELECT ins.id, ins.kind, ins.body, ins.detail, ins.created_at, u.name AS by_name FROM ins LEFT JOIN users u ON u.id = ins.user_id`,
      [enquiryId, session.user.id, text],
    );
    await q(`UPDATE enquiries SET updated_at = now() WHERE id = $1`, [enquiryId]);
    await audit(session.user.id, "enquiry", enquiryId, "note", { length: text.length });
    return json({ ok: true, note }, 201);
  },
  { roles: ["administrator", "editor"] },
);
