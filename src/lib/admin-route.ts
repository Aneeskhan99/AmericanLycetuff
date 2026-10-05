import "server-only";
import { NextResponse } from "next/server";
import { csrfOk, currentSession, type Role, type Session } from "@/lib/auth";

/**
 * Every /api/admin endpoint goes through guard(): one place that checks
 *   1. the session (401 if signed out or disabled),
 *   2. the role (403),
 *   3. CSRF on anything that is not GET/HEAD (403),
 *   4. a forced password change (only the account endpoints work until it is done).
 */
export type Ctx = { session: Session; req: Request; params: Record<string, string> };
type Handler = (ctx: Ctx) => Promise<Response>;
type RouteCtx = { params: Promise<Record<string, string>> };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

export function guard(handler: Handler, opts: { roles?: Role[] } = {}) {
  return async (req: Request, routeCtx?: RouteCtx): Promise<Response> => {
    let session: Session | null = null;
    try {
      session = await currentSession();
    } catch (err) {
      return json({ error: (err as Error).message, setup: true }, 500);
    }
    if (!session) return json({ error: "You are signed out. Please sign in again." }, 401);
    if (opts.roles && !opts.roles.includes(session.user.role)) {
      return json({ error: "Your account does not have access to this." }, 403);
    }
    const writing = req.method !== "GET" && req.method !== "HEAD";
    if (writing && !(await csrfOk(req, session))) {
      return json({ error: "Security check failed. Reload the page and try again." }, 403);
    }
    const path = new URL(req.url).pathname;
    if (session.user.must_change_password && !/^\/api\/admin\/(session|account|logout)(\/|$)/.test(path)) {
      return json({ error: "Please set a new password first.", mustChangePassword: true }, 403);
    }
    try {
      const params = routeCtx ? await routeCtx.params : {};
      return await handler({ session, req, params });
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error("[admin]", err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/** Reads a JSON body; {} when empty or invalid. */
export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
