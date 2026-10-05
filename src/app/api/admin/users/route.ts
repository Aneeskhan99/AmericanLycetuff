import { hashPassword, isRole, PASSWORD_MIN, ROLES } from "@/lib/auth";
import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, one, q } from "@/lib/db";
import { bool, email, int, str, USERNAME_RE } from "@/lib/validate";

const PAGE_SIZE = 20;

/** GET /api/admin/users?search=&role=&status=&page= — administrators only. */
export const GET = guard(
  async ({ req }) => {
    const u = new URL(req.url);
    const search = (u.searchParams.get("search") ?? "").trim().slice(0, 80);
    const role = u.searchParams.get("role") ?? "";
    const status = u.searchParams.get("status") ?? "";
    const page = int(u.searchParams.get("page"), { min: 1, max: 10_000, fallback: 1 });

    const where: string[] = [];
    const params: unknown[] = [];
    if (search) {
      params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
      where.push(`(username ILIKE $${params.length} OR name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (isRole(role)) {
      params.push(role);
      where.push(`role = $${params.length}`);
    }
    if (status === "active") where.push("NOT disabled");
    if (status === "disabled") where.push("disabled");
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM users ${w}`, params))?.n ?? 0;
    params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    const rows = await q(
      `SELECT id, username, name, email, role, disabled, must_change_password, last_login_at, created_at
         FROM users ${w}
        ORDER BY disabled, lower(name)
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return json({ rows, total, page, pageSize: PAGE_SIZE, roles: ROLES });
  },
  { roles: ["administrator"] },
);

/** POST /api/admin/users  { username, name, email, role, password } — new user must change the password at first sign-in. */
export const POST = guard(
  async ({ session, req }) => {
    const b = await body(req);
    const username = str(b.username, { required: true, max: 40, label: "Username" }).toLowerCase();
    if (!USERNAME_RE.test(username)) throw new HttpError(422, "Username: 3–40 characters, letters, numbers, dot, dash or underscore.");
    const name = str(b.name, { required: true, max: 120, label: "Full name" });
    const mail = email(b.email, { label: "Email" });
    if (!isRole(b.role)) throw new HttpError(422, "Choose a role.");
    const password = typeof b.password === "string" ? b.password : "";
    if (password.length < PASSWORD_MIN) throw new HttpError(422, `Password must be at least ${PASSWORD_MIN} characters.`);
    const mustChange = b.mustChange === undefined ? true : bool(b.mustChange);

    const exists = await one(`SELECT 1 FROM users WHERE lower(username) = $1`, [username]);
    if (exists) throw new HttpError(422, "That username is already taken.");

    const row = await one<{ id: number }>(
      `INSERT INTO users (username, name, email, role, password_hash, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [username, name, mail, b.role, await hashPassword(password), mustChange],
    );
    await audit(session.user.id, "user", row!.id, "create", { username, name, email: mail, role: b.role });
    return json({ ok: true, id: row!.id }, 201);
  },
  { roles: ["administrator"] },
);
