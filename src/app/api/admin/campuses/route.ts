import { body, guard, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { campusInput } from "@/lib/enquiries";

const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "campus";

/** GET /api/admin/campuses — all campuses with how many enquiries each has. */
export const GET = guard(
  async () => {
    const rows = await q(
      `SELECT c.id, c.name, c.slug, c.address, c.phone, c.email, c.map_url, c.sort, c.active,
              (SELECT count(*)::int FROM enquiries e WHERE e.campus_id = c.id) AS enquiries
         FROM campuses c ORDER BY c.sort, c.id`,
    );
    return json({ rows });
  },
  { roles: ["administrator"] },
);

/** POST /api/admin/campuses  { name, address, phone, email, mapUrl, active, sort } */
export const POST = guard(
  async ({ session, req }) => {
    const c = campusInput(await body(req));
    const base = slugify(c.name);
    let slug = base;
    for (let i = 2; await one(`SELECT 1 FROM campuses WHERE slug = $1`, [slug]); i++) slug = `${base}-${i}`;
    const row = await one<{ id: string }>(
      `INSERT INTO campuses (name, slug, address, phone, email, map_url, active, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [c.name, slug, c.address, c.phone, c.email, c.mapUrl, c.active, c.sort],
    );
    await audit(session.user.id, "campus", row!.id, "create", { ...c, slug });
    return json({ ok: true, id: Number(row!.id) }, 201);
  },
  { roles: ["administrator"] },
);
