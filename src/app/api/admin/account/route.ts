import { guard, json, body } from "@/lib/admin-route";
import { audit, q } from "@/lib/db";
import { email, str } from "@/lib/validate";

/** PATCH /api/admin/account  { name, email } — your own details. */
export const PATCH = guard(async ({ session, req }) => {
  const b = await body(req);
  const name = str(b.name, { required: true, max: 120, label: "Name" });
  const mail = email(b.email, { label: "Email" });
  await q(`UPDATE users SET name = $1, email = $2, updated_at = now() WHERE id = $3`, [name, mail, session.user.id]);
  await audit(session.user.id, "user", session.user.id, "update_own_details", { name, email: mail });
  return json({ ok: true });
});
