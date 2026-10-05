import { guard, json } from "@/lib/admin-route";
import { pageOr404, PAGE_ROLES, state } from "../_lib";

/** GET /api/admin/pages/:key — the page definition (with code defaults), published and draft patches. */
export const GET = guard(
  async ({ params }) => {
    const page = pageOr404(params.key);
    return json({
      page: { key: page.key, title: page.title, path: page.path, sections: page.sections },
      ...(await state(page)),
    });
  },
  { roles: PAGE_ROLES },
);
