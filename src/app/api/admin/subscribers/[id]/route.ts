import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { id, oneOf } from "@/lib/validate";

/** PATCH /api/admin/subscribers/:id  { status: "subscribed" | "unsubscribed" } */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const subId = id(params.id);
    const b = await body(req);
    const status = oneOf(b.status, ["subscribed", "unsubscribed"] as const, "Status");
    const row = await one<{ email: string }>(
      `UPDATE subscribers SET status = $2, unsubscribed_at = CASE WHEN $2 = 'unsubscribed' THEN now() ELSE NULL END
        WHERE id = $1 RETURNING email`,
      [subId, status],
    );
    if (!row) throw new HttpError(404, "Subscriber not found.");
    await audit(session.user.id, "subscriber", subId, status === "subscribed" ? "resubscribe" : "unsubscribe", { email: row.email });
    return json({ ok: true });
  },
  { roles: ["administrator", "editor"] },
);

/** DELETE /api/admin/subscribers/:id — removes the address completely. */
export const DELETE = guard(
  async ({ session, params }) => {
    const subId = id(params.id);
    const row = await one<{ email: string }>(`DELETE FROM subscribers WHERE id = $1 RETURNING email`, [subId]);
    if (!row) throw new HttpError(404, "Subscriber not found.");
    await audit(session.user.id, "subscriber", subId, "delete", { email: row.email });
    return json({ ok: true });
  },
  { roles: ["administrator", "editor"] },
);
