import { draftMode } from "next/headers";
import { guard } from "@/lib/admin-route";
import { pageOr404, PAGE_ROLES } from "../_lib";

/**
 * GET /api/admin/pages/preview?key=home
 * Turns on Next.js draft mode for this browser (signed-in staff only) and opens
 * the page, which then shows the saved draft. The redirect target comes from the
 * page definition, never from the query string.
 */
export const GET = guard(
  async ({ req }) => {
    const page = pageOr404(new URL(req.url).searchParams.get("key") ?? undefined);
    (await draftMode()).enable();
    return new Response(null, { status: 307, headers: { Location: page.path, "Cache-Control": "no-store" } });
  },
  { roles: PAGE_ROLES },
);
