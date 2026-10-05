import { endAllSessions, isRole } from "@/lib/auth";
import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { bool, email, id, str } from "@/lib/validate";

type UserRow = { id: number; username: string; name: string; email: string; role: string; disabled: boolean };

async function activeAdmins(exceptId: number) {
  return (await one<{ n: number }>(
    `SELECT count(*)::int AS n FROM users WHERE role = 'administrator' AND NOT disabled AND id <> $1`,
    [exceptId],
  ))!.n;
}

/** GET /api/admin/users/:id — details plus the latest activity. */
export const GET = guard(
  async ({ params }) => {
    const userId = id(params.id);
    const user = await one(
      `SELECT id, username, name, email, role, disabled, must_change_password, last_login_at, created_at, updated_at
         FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new HttpError(404, "User not found.");
    const activity = await q(
      `SELECT a.action, a.entity, a.entity_id, a.created_at, a.detail, u.name AS by_name
         FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
        WHERE (a.entity = 'user' AND a.entity_id = $1) OR a.user_id = $2
        ORDER BY a.created_at DESC LIMIT 25`,
      [String(userId), userId],
    );
    return json({ user, activity });
  },
  { roles: ["administrator"] },
);

/** PATCH /api/admin/users/:id  { name?, email?, role?, disabled? } */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const userId = id(params.id);
    const before = await one<UserRow>(`SELECT id, username, name, email, role, disabled FROM users WHERE id = $1`, [userId]);
    if (!before) throw new HttpError(404, "User not found.");
    const b = await body(req);

    const next = {
      name: b.name !== undefined ? str(b.name, { required: true, max: 120, label: "Full name" }) : before.name,
      email: b.email !== undefined ? email(b.email, { label: "Email" }) : before.email,
      role: b.role !== undefined ? (isRole(b.role) ? b.role : (() => { throw new HttpError(422, "Choose a role."); })()) : before.role,
      disabled: b.disabled !== undefined ? bool(b.disabled) : before.disabled,
    };

    const self = userId === session.user.id;
    if (self && next.disabled) throw new HttpError(422, "You cannot disable your own account.");
    if (self && next.role !== "administrator") throw new HttpError(422, "You cannot remove your own administrator role.");
    const losingAdmin = before.role === "administrator" && !before.disabled && (next.role !== "administrator" || next.disabled);
    if (losingAdmin && (await activeAdmins(userId)) === 0) {
      throw new HttpError(422, "There must always be at least one active administrator.");
    }

    await q(`UPDATE users SET name = $1, email = $2, role = $3, disabled = $4, updated_at = now() WHERE id = $5`, [
      next.name, next.email, next.role, next.disabled, userId,
    ]);
    if (next.disabled && !before.disabled) await endAllSessions(userId);

    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of ["name", "email", "role", "disabled"] as const) {
      if (before[k] !== next[k]) changed[k] = { from: before[k], to: next[k] };
    }
    if (Object.keys(changed).length) {
      const action = changed.disabled ? (next.disabled ? "disable" : "enable") : "update";
      await audit(session.user.id, "user", userId, action, changed);
    }
    return json({ ok: true });
  },
  { roles: ["administrator"] },
);
