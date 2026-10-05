import { endAllSessions, hashPassword, PASSWORD_MIN } from "@/lib/auth";
import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { id } from "@/lib/validate";

/**
 * POST /api/admin/users/:id/password  { password }
 * Sets a temporary password, signs the user out everywhere, and makes them choose
 * a new one at their next sign-in.
 */
export const POST = guard(
  async ({ session, req, params }) => {
    const userId = id(params.id);
    if (userId === session.user.id) throw new HttpError(422, "Use My account to change your own password.");
    const b = await body(req);
    const password = typeof b.password === "string" ? b.password : "";
    if (password.length < PASSWORD_MIN) throw new HttpError(422, `Password must be at least ${PASSWORD_MIN} characters.`);
    const user = await one(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (!user) throw new HttpError(404, "User not found.");
    await q(`UPDATE users SET password_hash = $1, must_change_password = true, updated_at = now() WHERE id = $2`, [
      await hashPassword(password),
      userId,
    ]);
    await endAllSessions(userId);
    await audit(session.user.id, "user", userId, "reset_password");
    return json({ ok: true });
  },
  { roles: ["administrator"] },
);
