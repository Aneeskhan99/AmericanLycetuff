import { guard, HttpError, json } from "@/lib/admin-route";
import { audit, one } from "@/lib/db";
import { setMediaUsage } from "@/lib/media";
import { id } from "@/lib/validate";
import { revalidateEvents, STAFF } from "../../_lib";

/** POST /api/admin/events/:id/duplicate — copies an event as an unpublished draft with a free slug. */
export const POST = guard(
  async ({ session, params }) => {
    const srcId = id(params.id);
    const src = await one<{ title: string; slug: string; media_id: number | null }>(
      `SELECT title, slug, media_id::int AS media_id FROM events WHERE id = $1`,
      [srcId],
    );
    if (!src) throw new HttpError(404, "Event not found. It may have been deleted.");

    const base = `${src.slug.replace(/-copy(-\d+)?$/, "").slice(0, 70)}-copy`;
    let slug = base;
    for (let n = 2; await one(`SELECT 1 FROM events WHERE lower(slug) = lower($1)`, [slug]); n++) slug = `${base}-${n}`;
    const title = `${src.title} (copy)`.slice(0, 200);

    const row = await one<{ id: number }>(
      `INSERT INTO events (title, slug, starts_at, ends_at, all_day, venue, description, media_id, image_alt, published, created_by)
       SELECT $2, $3, starts_at, ends_at, all_day, venue, description, media_id, image_alt, false, $4
         FROM events WHERE id = $1
       RETURNING id::int AS id`,
      [srcId, title, slug, session.user.id],
    );
    await setMediaUsage("event", row!.id, "image", [src.media_id]);
    await audit(session.user.id, "event", row!.id, "duplicate", { from: srcId, title, slug });
    revalidateEvents();
    return json({ ok: true, id: row!.id, slug }, 201);
  },
  { roles: STAFF },
);
