import { guard, json } from "@/lib/admin-route";

/** GET /api/admin/session — who is signed in, plus the CSRF token the admin app sends back. */
export const GET = guard(async ({ session }) => json({ user: session.user, csrf: session.csrf }));
