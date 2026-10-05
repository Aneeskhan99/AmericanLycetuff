import { draftMode } from "next/headers";

/** A same-site path ("/about", "/news/x?y"), or null. */
function safePath(p: string | null | undefined): string | null {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.includes("\\") || p.length > 500) return null;
  if (p.startsWith("/api/")) return null;
  return p;
}

/**
 * GET /api/preview/exit?path=/about
 * Turns draft mode off and goes back to the page (from ?path=, else the Referer
 * on this site, else the home page). Anyone may call it: it only clears the
 * visitor's own preview cookie.
 */
export async function GET(req: Request) {
  (await draftMode()).disable();
  const url = new URL(req.url);
  let target = safePath(url.searchParams.get("path"));
  if (!target) {
    const ref = req.headers.get("referer");
    try {
      const r = ref ? new URL(ref) : null;
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (r && r.host === host) target = safePath(r.pathname + r.search);
    } catch {
      target = null;
    }
  }
  return new Response(null, { status: 307, headers: { Location: target ?? "/", "Cache-Control": "no-store" } });
}
