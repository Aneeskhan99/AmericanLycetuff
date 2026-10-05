import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { setMediaUsage } from "@/lib/media";
import { int } from "@/lib/validate";
import { assertSlugFree, EVENT_COLS, EVENT_END_SQL, parseEvent, slugError } from "./_event";
import { likeTerm, PAGE_SIZE, revalidateEvents, STAFF } from "./_lib";

/** GET /api/admin/events?tab=upcoming|past&search=&page= */
export const GET = guard(
  async ({ req }) => {
    const u = new URL(req.url);
    const tab = u.searchParams.get("tab") === "past" ? "past" : "upcoming";
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
    const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

    const params: unknown[] = [];
    let w = "TRUE";
    if (search) {
      params.push(likeTerm(search));
      w = `(e.title ILIKE $1 OR e.venue ILIKE $1 OR e.slug ILIKE $1)`;
    }
    const counts = (await one<{ upcoming: number; past: number }>(
      `SELECT count(*) FILTER (WHERE ${EVENT_END_SQL} >= now())::int AS upcoming,
              count(*) FILTER (WHERE ${EVENT_END_SQL} < now())::int AS past
         FROM events e WHERE ${w}`,
      params,
    ))!;
    const tabWhere = tab === "upcoming" ? `${EVENT_END_SQL} >= now()` : `${EVENT_END_SQL} < now()`;
    const order = tab === "upcoming" ? "e.starts_at ASC, e.id ASC" : "e.starts_at DESC, e.id DESC";
    params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    const rows = await q(
      `SELECT ${EVENT_COLS} FROM events e
        WHERE ${w} AND ${tabWhere}
        ORDER BY ${order}
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return json({ rows, total: tab === "upcoming" ? counts.upcoming : counts.past, counts, page, pageSize: PAGE_SIZE, tab });
  },
  { roles: STAFF },
);

/** POST /api/admin/events — create. */
export const POST = guard(
  async ({ session, req }) => {
    const ev = await parseEvent(await body(req));
    await assertSlugFree(ev.slug);
    const row = await one<{ id: number }>(
      `INSERT INTO events (title, slug, starts_at, ends_at, all_day, venue, description, media_id, image_alt, published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id::int AS id`,
      [ev.title, ev.slug, ev.startsAt, ev.endsAt, ev.allDay, ev.venue, ev.description, ev.mediaId, ev.imageAlt, ev.published, session.user.id],
    ).catch(slugError);
    await setMediaUsage("event", row!.id, "image", [ev.mediaId]);
    await audit(session.user.id, "event", row!.id, "create", { title: ev.title, slug: ev.slug, published: ev.published });
    revalidateEvents();
    return json({ ok: true, id: row!.id, slug: ev.slug }, 201);
  },
  { roles: STAFF },
);
