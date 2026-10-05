import "server-only";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { one, q } from "@/lib/db";

/**
 * Admin login and sessions on node:crypto alone (same approach as the RTI admin).
 *
 * Passwords: scrypt with a per-user salt, stored as scrypt$N$r$p$salt$hash.
 *   scripts/db-setup.mjs writes the first one with the same numbers.
 * Sessions: cookie = "<uuid>.<secret>.<hmac>". The database keeps only a SHA-256 of
 *   the secret; the HMAC (ADMIN_SESSION_SECRET) rejects forged cookies before any query.
 *   Changing ADMIN_SESSION_SECRET signs everybody out.
 * CSRF: each session has a random token; the admin app sends it back in the
 *   x-csrf-token header on every change, and the Origin must be this site.
 */

type ScryptOpts = { N: number; r: number; p: number; maxmem: number };
const scrypt = promisify(_scrypt) as unknown as (pw: string, salt: Buffer, len: number, o: ScryptOpts) => Promise<Buffer>;

const N = 16384, R = 8, P = 1, KEYLEN = 64;
export const SESSION_COOKIE = "als_admin_session";
const SESSION_DAYS = 14;

export type Role = "administrator" | "editor" | "author";
export type AdminUser = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: Role;
  must_change_password: boolean;
};
export type Session = { id: string; csrf: string; user: AdminUser };

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "administrator", label: "Administrator", blurb: "Everything, including users and settings." },
  { id: "editor", label: "Editor", blurb: "All content: pages, news, events, enquiries, gallery and more." },
  { id: "author", label: "Author", blurb: "Writes their own news posts. Cannot publish." },
];
export const isRole = (r: unknown): r is Role => ROLES.some((x) => x.id === r);

export const PASSWORD_MIN = 10;

// ------------------------------------------------------------------ passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** A dummy hash so a login for an unknown username takes as long as a real one. */
let dummyHash: Promise<string> | null = null;
export const slowFail = async (password: string) => {
  dummyHash ??= hashPassword(randomBytes(12).toString("hex"));
  await verifyPassword(password, await dummyHash);
  return false;
};

// ------------------------------------------------------------------ helpers
function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET is missing or too short. Run `npm run db:setup`.");
  return s;
}
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local").slice(0, 64);
}

// ------------------------------------------------------------------ rate limiting
const WINDOW_MIN = 15;
const MAX_PER_USERNAME = 5;
const MAX_PER_IP = 20;

/** Returns null when allowed, or the minutes to wait. */
export async function loginBlocked(username: string, ip: string): Promise<number | null> {
  const row = await one<{ by_user: number; by_ip: number; oldest_user: Date | null; oldest_ip: Date | null }>(
    `SELECT
       count(*) FILTER (WHERE lower(username) = lower($1))::int AS by_user,
       count(*) FILTER (WHERE ip = $2)::int AS by_ip,
       min(attempted_at) FILTER (WHERE lower(username) = lower($1)) AS oldest_user,
       min(attempted_at) FILTER (WHERE ip = $2) AS oldest_ip
     FROM login_attempts
     WHERE NOT success AND attempted_at > now() - make_interval(mins => $3)`,
    [username, ip, WINDOW_MIN],
  );
  if (!row) return null;
  const oldest = row.by_user >= MAX_PER_USERNAME ? row.oldest_user : row.by_ip >= MAX_PER_IP ? row.oldest_ip : null;
  if (!oldest) return null;
  const waitMs = new Date(oldest).getTime() + WINDOW_MIN * 60_000 - Date.now();
  return Math.max(1, Math.ceil(waitMs / 60_000));
}

export async function recordAttempt(username: string, ip: string, success: boolean) {
  await q(`INSERT INTO login_attempts (username, ip, success) VALUES ($1, $2, $3)`, [username.slice(0, 80), ip, success]);
  if (success) {
    // A successful login clears this username's recent failures.
    await q(`DELETE FROM login_attempts WHERE lower(username) = lower($1) AND NOT success`, [username]);
  }
  // Keep the table small.
  await q(`DELETE FROM login_attempts WHERE attempted_at < now() - interval '2 days'`);
}

// ------------------------------------------------------------------ sessions
export async function createSession(userId: number): Promise<void> {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(24).toString("base64url");
  const h = await headers();
  await q(
    `INSERT INTO sessions (id, user_id, token_hash, csrf_token, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(days => $7))`,
    [id, userId, sha256(token), csrf, await clientIp(), (h.get("user-agent") ?? "").slice(0, 300), SESSION_DAYS],
  );
  await q(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
  await q(`DELETE FROM sessions WHERE expires_at < now()`);
  const payload = `${id}.${token}`;
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.ADMIN_INSECURE_COOKIE !== "true",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** The signed-in session, or null. Disabled users are treated as signed out. */
export async function currentSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, token, mac] = parts;
  if (!safeEqual(sign(`${id}.${token}`), mac)) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = await one<AdminUser & { token_hash: string; csrf_token: string; disabled: boolean; user_id: number }>(
    `SELECT s.token_hash, s.csrf_token, u.id, u.username, u.email, u.name, u.role, u.must_change_password, u.disabled
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [id],
  );
  if (!row || row.disabled || !safeEqual(row.token_hash, sha256(token))) return null;
  // Touch at most once a minute.
  await q(`UPDATE sessions SET last_seen = now() WHERE id = $1 AND last_seen < now() - interval '1 minute'`, [id]);
  return {
    id,
    csrf: row.csrf_token,
    user: {
      id: Number(row.id),
      username: row.username,
      email: row.email,
      name: row.name,
      role: row.role,
      must_change_password: row.must_change_password,
    },
  };
}

export async function destroySession(): Promise<void> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = raw?.split(".")[0];
  if (id && /^[0-9a-f-]{36}$/i.test(id)) await q(`DELETE FROM sessions WHERE id = $1`, [id]);
  (await cookies()).delete(SESSION_COOKIE);
}

/** Signs a user out everywhere (used when a password is reset or the account disabled). */
export async function endAllSessions(userId: number, exceptSessionId?: string) {
  await q(`DELETE FROM sessions WHERE user_id = $1 AND ($2::uuid IS NULL OR id <> $2::uuid)`, [userId, exceptSessionId ?? null]);
}

/** Origin must be this site (or absent, e.g. curl in dev), and the CSRF header must match. */
export async function csrfOk(req: Request, session: Session): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    try {
      if (new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  const token = req.headers.get("x-csrf-token") ?? "";
  return safeEqual(token, session.csrf);
}

/** For server-rendered admin pages: the session, or a redirect to the login screen. */
export async function requireSession(roles?: Role[]): Promise<Session> {
  const s = await currentSession();
  if (!s) redirect("/admin/login");
  if (roles && !roles.includes(s.user.role)) notFound();
  return s;
}
