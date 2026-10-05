import "server-only";
import { draftMode } from "next/headers";
import { applyPatch, defaultsOf, type PageContent, type PageDef, type Patch } from "@/lib/content";
import { dbConfigured, one } from "@/lib/db";

/**
 * Content for a public page: published patch merged over the code defaults.
 * In Preview (draft mode, switched on from the admin) the draft is merged too.
 * Never throws: without a database the code defaults are returned, so the
 * site always builds.
 */
export async function getPageContent<P extends PageDef>(page: P): Promise<PageContent<P>> {
  if (!dbConfigured()) return defaultsOf(page);
  let preview = false;
  try {
    preview = (await draftMode()).isEnabled;
  } catch {
    preview = false;
  }
  try {
    const row = await one<{ published: Patch; draft: Patch | null }>(`SELECT published, draft FROM page_content WHERE key = $1`, [page.key]);
    if (!row) return defaultsOf(page);
    // The draft is the complete intended patch (it starts as a copy of published), so use it as is.
    return applyPatch(page, preview && row.draft ? row.draft : row.published);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[content] ${page.key}: using defaults (${(err as Error).message})`);
    return defaultsOf(page);
  }
}
