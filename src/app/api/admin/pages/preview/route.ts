import { draftMode } from "next/headers";
import { guard } from "@/lib/admin-route";
import { pageOr404, PAGE_ROLES } from "../_lib";

/**
 * GET /api/admin/pages/preview?key=home[&edit=1]
 * Turns on Next.js draft mode for this browser (signed-in staff only) and opens
 * the page, which then shows the saved draft. The redirect target comes from the
 * page definition, never from the query string. edit=1 is used by the visual
 * editor's frame: it adds ?als-edit=1 so the page loads the click-to-edit bridge.
 */
export const GET = guard(
  async ({ req }) => {
    const params = new URL(req.url).searchParams;
    const page = pageOr404(params.get("key") ?? undefined);
    (await draftMode()).enable();
    const location = params.get("edit") === "1" ? `${page.path}?als-edit=1` : page.path;
    return new Response(null, { status: 307, headers: { Location: location, "Cache-Control": "no-store" } });
  },
  { roles: PAGE_ROLES },
);
