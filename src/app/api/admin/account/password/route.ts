import { endAllSessions, hashPassword, PASSWORD_MIN, verifyPassword } from "@/lib/auth";
import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";

/** POST /api/admin/account/password  { current, next } — change your own password. Signs out your other devices. */
export const POST = guard(async ({ session, req }) => {
  const b = await body(req);
  const current = typeof b.current === "string" ? b.current : "";
  const next = typeof b.next === "string" ? b.next : "";
  if (next.length < PASSWORD_MIN) throw new HttpError(422, `New password must be at least ${PASSWORD_MIN} characters.`);
  if (next.length > 200) throw new HttpError(422, "New password is too long.");
  const row = await one<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = $1`, [session.user.id]);
  if (!row || !(await verifyPassword(current, row.password_hash))) throw new HttpError(422, "Your current password is not correct.");
  if (await verifyPassword(next, row.password_hash)) throw new HttpError(422, "Choose a password different from the current one.");
  await q(`UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2`, [
    await hashPassword(next),
    session.user.id,
  ]);
  await endAllSessions(session.user.id, session.id);
  await audit(session.user.id, "user", session.user.id, "change_own_password");
  return json({ ok: true });
});
