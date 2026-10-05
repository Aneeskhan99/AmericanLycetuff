import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Re-renders only the public pages a change affects. Pages stay static; this just
 * tells Next.js to rebuild them on the next visit. "layout:/" means every page
 * (for things in the shared header/footer, like settings or the announcement bar).
 */
export function revalidatePaths(paths: string[]) {
  for (const p of new Set(paths)) {
    try {
      if (p === "layout:/") revalidatePath("/", "layout");
      else if (p.endsWith("/[slug]")) revalidatePath(p, "page");
      else revalidatePath(p);
    } catch (err) {
      console.error("[revalidate]", p, err);
    }
  }
}
