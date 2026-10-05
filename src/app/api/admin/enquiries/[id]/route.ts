import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q, tx } from "@/lib/db";
import { activeStaff, loadEnquiry, notifyAssignee } from "@/lib/enquiries";
import { ENQUIRY_STATUSES, STATUS_LABEL, type EnquiryStatus } from "@/lib/enquiry-options";
import { bool, id, oneOf } from "@/lib/validate";

const STAFF = ["administrator", "editor"] as const;

async function activity(enquiryId: number) {
  return q(
    `SELECT a.id, a.kind, a.body, a.detail, a.created_at, u.name AS by_name
       FROM enquiry_activity a LEFT JOIN users u ON u.id = a.user_id
      WHERE a.enquiry_id = $1
      ORDER BY a.created_at DESC, a.id DESC`,
    [enquiryId],
  );
}

/** GET /api/admin/enquiries/:id — everything about one enquiry. Opening it marks it read. */
export const GET = guard(
  async ({ params }) => {
    const enquiryId = id(params.id);
    await q(`UPDATE enquiries SET read_at = now() WHERE id = $1 AND read_at IS NULL`, [enquiryId]);
    const enquiry = await loadEnquiry(enquiryId);
    if (!enquiry) throw new HttpError(404, "This enquiry no longer exists.");
    const staff = await activeStaff();
    return json({
      enquiry,
      activity: await activity(enquiryId),
      staff: staff.map((s) => ({ id: Number(s.id), name: s.name, hasEmail: Boolean(s.email) })),
    });
  },
  { roles: [...STAFF] },
);

/**
 * PATCH /api/admin/enquiries/:id  { status?, assignedTo? (user id | null), unread? }
 * Status changes and assignments are written to the activity history; a new
 * assignee is emailed the enquiry summary at their account email.
 */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const enquiryId = id(params.id);
    const b = await body(req);
    const current = await one<{ status: EnquiryStatus; assigned_to: string | null }>(
      `SELECT status, assigned_to FROM enquiries WHERE id = $1`,
      [enquiryId],
    );
    if (!current) throw new HttpError(404, "This enquiry no longer exists.");

    const changes: Record<string, unknown> = {};
    let newAssignee: { id: number; name: string; email: string } | null = null;
    let unassigned = false;

    await tx(async (c) => {
      if (b.status !== undefined) {
        const status = oneOf(b.status, ENQUIRY_STATUSES, "Status");
        if (status !== current.status) {
          await c.query(`UPDATE enquiries SET status = $2, updated_at = now() WHERE id = $1`, [enquiryId, status]);
          await c.query(
            `INSERT INTO enquiry_activity (enquiry_id, user_id, kind, body, detail) VALUES ($1, $2, 'status', $3, $4)`,
            [enquiryId, session.user.id, `Status changed to ${STATUS_LABEL[status]}`, JSON.stringify({ from: current.status, to: status })],
          );
          changes.status = { from: current.status, to: status };
        }
      }

      if (b.assignedTo !== undefined) {
        const before = current.assigned_to === null ? null : Number(current.assigned_to);
        let target: number | null = null;
        if (b.assignedTo !== null && b.assignedTo !== "") {
          target = id(b.assignedTo, "staff member");
          const staff = (await activeStaff()).find((s) => Number(s.id) === target);
          if (!staff) throw new HttpError(422, "Choose an active administrator or editor.");
          newAssignee = { id: target, name: staff.name, email: staff.email };
        }
        if (target !== before) {
          await c.query(`UPDATE enquiries SET assigned_to = $2, updated_at = now() WHERE id = $1`, [enquiryId, target]);
          await c.query(
            `INSERT INTO enquiry_activity (enquiry_id, user_id, kind, body, detail) VALUES ($1, $2, 'assign', $3, $4)`,
            [
              enquiryId,
              session.user.id,
              newAssignee ? `Assigned to ${(newAssignee as { name: string }).name}` : "Unassigned",
              JSON.stringify({ from: before, to: target }),
            ],
          );
          changes.assigned_to = { from: before, to: target };
          unassigned = !newAssignee;
        } else {
          newAssignee = null; // no change: no email
        }
      }

      if (b.unread !== undefined) {
        await c.query(`UPDATE enquiries SET read_at = ${bool(b.unread) ? "NULL" : "COALESCE(read_at, now())"} WHERE id = $1`, [enquiryId]);
      }
    });

    if (Object.keys(changes).length) await audit(session.user.id, "enquiry", enquiryId, "update", changes);

    let mail: string | null = null;
    const assignee = newAssignee as { id: number; name: string; email: string } | null;
    if (assignee) {
      if (!assignee.email) {
        mail = "skipped (no email on account)";
      } else {
        const e = await loadEnquiry(enquiryId);
        mail = e ? await notifyAssignee(e, assignee.email, session.user.name) : "skipped";
      }
      await q(
        `INSERT INTO enquiry_activity (enquiry_id, user_id, kind, body, detail) VALUES ($1, $2, 'email', $3, $4)`,
        [
          enquiryId,
          session.user.id,
          mail === "sent" ? `Assignment emailed to ${assignee.name} (${assignee.email})` : `Assignment email to ${assignee.name} ${mail}`,
          JSON.stringify({ to: assignee.email, status: mail }),
        ],
      );
    }

    return json({ ok: true, mail, unassigned, enquiry: await loadEnquiry(enquiryId), activity: await activity(enquiryId) });
  },
  { roles: [...STAFF] },
);

/** DELETE /api/admin/enquiries/:id — administrators only. */
export const DELETE = guard(
  async ({ session, params }) => {
    const enquiryId = id(params.id);
    const row = await one<{ name: string; form: string; created_at: string }>(
      `DELETE FROM enquiries WHERE id = $1 RETURNING name, form, created_at`,
      [enquiryId],
    );
    if (!row) throw new HttpError(404, "This enquiry no longer exists.");
    await audit(session.user.id, "enquiry", enquiryId, "delete", { name: row.name, form: row.form, received: row.created_at });
    return json({ ok: true });
  },
  { roles: ["administrator"] },
);
