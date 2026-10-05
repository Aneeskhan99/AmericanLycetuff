import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { clearMediaUsage, setMediaUsage } from "@/lib/media";
import { id } from "@/lib/validate";
import { assertSlugFree, loadEvent, parseEvent, slugError } from "../_event";
import { revalidateEvents, STAFF } from "../_lib";

/** GET /api/admin/events/:id */
export const GET = guard(
  async ({ params }) => {
    const ev = await loadEvent(id(params.id));
    if (!ev) throw new HttpError(404, "Event not found. It may have been deleted.");
    return json({ event: ev });
  },
  { roles: STAFF },
);

/** PATCH /api/admin/events/:id — full save from the editor. */
export const PATCH = guard(
  async ({ session, req, params }) => {
    const eventId = id(params.id);
    const before = await one<{ slug: string }>(`SELECT slug FROM events WHERE id = $1`, [eventId]);
    if (!before) throw new HttpError(404, "Event not found. It may have been deleted.");
    const ev = await parseEvent(await body(req));
    await assertSlugFree(ev.slug, eventId);
    await one(
      `UPDATE events SET title = $2, slug = $3, starts_at = $4, ends_at = $5, all_day = $6, venue = $7, description = $8,
              media_id = $9, image_alt = $10, published = $11, updated_at = now()
        WHERE id = $1`,
      [eventId, ev.title, ev.slug, ev.startsAt, ev.endsAt, ev.allDay, ev.venue, ev.description, ev.mediaId, ev.imageAlt, ev.published],
    ).catch(slugError);
    await setMediaUsage("event", eventId, "image", [ev.mediaId]);
    await audit(session.user.id, "event", eventId, "update", {
      title: ev.title, slug: ev.slug, published: ev.published, ...(before.slug !== ev.slug ? { previousSlug: before.slug } : {}),
    });
    revalidateEvents();
    return json({ ok: true, id: eventId, slug: ev.slug });
  },
  { roles: STAFF },
);

/** DELETE /api/admin/events/:id */
export const DELETE = guard(
  async ({ session, params }) => {
    const eventId = id(params.id);
    const row = await one<{ title: string; slug: string }>(`DELETE FROM events WHERE id = $1 RETURNING title, slug`, [eventId]);
    if (!row) throw new HttpError(404, "Event not found. It may have been deleted already.");
    await clearMediaUsage("event", eventId);
    await audit(session.user.id, "event", eventId, "delete", { title: row.title, slug: row.slug });
    revalidateEvents();
    return json({ ok: true });
  },
  { roles: STAFF },
);
