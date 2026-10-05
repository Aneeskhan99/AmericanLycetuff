import { HttpError } from "@/lib/admin-route";

/**
 * Tiny server-side validators. Each throws HttpError(422) with a message the admin
 * screen can show next to the form, so every endpoint validates the same way.
 */
type Opts = { required?: boolean; max?: number; min?: number; label: string };

export function str(v: unknown, { required = false, max = 500, min = 0, label }: Opts): string {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  if (required && !s) throw new HttpError(422, `${label} is required.`);
  if (s && s.length < min) throw new HttpError(422, `${label} must be at least ${min} characters.`);
  if (s.length > max) throw new HttpError(422, `${label} must be ${max} characters or fewer.`);
  return s;
}

export function email(v: unknown, opts: Omit<Opts, "max">): string {
  const s = str(v, { ...opts, max: 254 });
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new HttpError(422, `${opts.label} is not a valid email address.`);
  return s.toLowerCase();
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], label: string): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) throw new HttpError(422, `${label} is not valid.`);
  return v as T;
}

export function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1" || v === "on";
}

export function int(v: unknown, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback }: { min?: number; max?: number; fallback: number }): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function id(v: unknown, label = "id"): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Invalid ${label}.`);
  return n;
}

export const USERNAME_RE = /^[a-z0-9._-]{3,40}$/;
