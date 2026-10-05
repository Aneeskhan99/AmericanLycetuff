import { destroySession } from "@/lib/auth";
import { guard, json } from "@/lib/admin-route";
import { audit } from "@/lib/db";

/** POST /api/admin/logout */
export const POST = guard(async ({ session }) => {
  await audit(session.user.id, "user", session.user.id, "logout");
  await destroySession();
  return json({ ok: true });
});
