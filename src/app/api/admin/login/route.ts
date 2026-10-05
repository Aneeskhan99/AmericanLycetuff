import { clientIp, createSession, loginBlocked, recordAttempt, slowFail, verifyPassword } from "@/lib/auth";
import { audit, one } from "@/lib/db";
import { body, json } from "@/lib/admin-route";

/** POST /api/admin/login  { username, password } — rate limited (5 failures per username / 20 per IP per 15 min). */
export async function POST(req: Request) {
  // Same-origin only (login CSRF).
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && (() => { try { return new URL(origin).host !== host; } catch { return true; } })()) {
    return json({ error: "Security check failed." }, 403);
  }

  const b = await body(req);
  const username = typeof b.username === "string" ? b.username.trim().toLowerCase().slice(0, 80) : "";
  const password = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  if (!username || !password) return json({ error: "Enter your username and password." }, 422);

  try {
    const ip = await clientIp();
    const wait = await loginBlocked(username, ip);
    if (wait) return json({ error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` }, 429);

    const user = await one<{ id: number; password_hash: string; disabled: boolean }>(
      `SELECT id, password_hash, disabled FROM users WHERE lower(username) = $1`,
      [username],
    );
    const ok = user && !user.disabled ? await verifyPassword(password, user.password_hash) : await slowFail(password);
    await recordAttempt(username, ip, Boolean(ok));
    if (!ok || !user) return json({ error: "That username and password do not match." }, 401);

    await createSession(Number(user.id));
    await audit(Number(user.id), "user", user.id, "login", { ip });
    return json({ ok: true });
  } catch (err) {
    console.error("[login]", err);
    return json({ error: (err as Error).message.includes("DATABASE_URL") || (err as Error).message.includes("ADMIN_SESSION_SECRET")
      ? (err as Error).message
      : "Could not sign in right now. Is the database running?" }, 500);
  }
}
