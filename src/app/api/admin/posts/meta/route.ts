import { guard, json } from "@/lib/admin-route";
import { q } from "@/lib/db";
import { ALL_ROLES, isStaff } from "@/lib/posts";

/** GET /api/admin/posts/meta — categories and (for editors/admins) the people who can be set as author. */
export const GET = guard(
  async ({ session }) => {
    const categories = await q(`SELECT id::int AS id, name, slug FROM categories ORDER BY sort, lower(name)`);
    const users = isStaff(session)
      ? await q(
          `SELECT id::int AS id, name, role, disabled FROM users
            WHERE NOT disabled OR id IN (SELECT author_id FROM posts WHERE author_id IS NOT NULL)
            ORDER BY disabled, lower(name)`,
        )
      : [{ id: session.user.id, name: session.user.name, role: session.user.role, disabled: false }];
    return json({ categories, users });
  },
  { roles: ALL_ROLES },
);
