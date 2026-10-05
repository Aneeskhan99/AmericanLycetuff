import "server-only";
import type { PoolClient } from "pg";
import type { Role } from "@/lib/auth";
import { HttpError } from "@/lib/admin-route";
import type { PageDef, Patch } from "@/lib/content";
import { one } from "@/lib/db";
import { pageByKey } from "@/content";
import { deepEqual, knownOnly } from "@/components/admin/pages/patch";

/** Shared by the Admin → Pages API routes. */
export const PAGE_ROLES: Role[] = ["administrator", "editor"];

export function pageOr404(key: string | undefined): PageDef {
  const page = key && /^[a-z0-9_-]{1,60}$/i.test(key) ? pageByKey(key) : undefined;
  if (!page) throw new HttpError(404, "That page does not exist.");
  return page;
}

export type Row = {
  key: string;
  draft: Patch | null;
  published: Patch;
  draft_updated_at: string | null;
  draft_updated_by_name: string | null;
  published_at: string | null;
  published_by_name: string | null;
  rev: string;
};

/** The stored row plus the names of who last edited / published (null when never saved). */
export async function loadRow(key: string): Promise<Row | null> {
  return one<Row>(
    `SELECT pc.key, pc.draft, pc.published, pc.draft_updated_at, pc.published_at,
            du.name AS draft_updated_by_name, pu.name AS published_by_name,
            coalesce(pc.draft_updated_at::text, '-') || '|' || coalesce(pc.published_at::text, '-') AS rev
       FROM page_content pc
       LEFT JOIN users du ON du.id = pc.draft_updated_by
       LEFT JOIN users pu ON pu.id = pc.published_by
      WHERE pc.key = $1`,
    [key],
  );
}

/** What the editor needs to show a page's state (patches are filtered to fields that still exist). */
export function stateOf(page: PageDef, row: Row | null) {
  const published = knownOnly(page, row?.published);
  const draft = row?.draft ? knownOnly(page, row.draft) : null;
  return {
    published,
    draft,
    hasDraft: draft !== null && !deepEqual(draft, published),
    meta: {
      rev: row?.rev ?? "new",
      publishedAt: row?.published_at ?? null,
      publishedBy: row?.published_by_name ?? null,
      draftUpdatedAt: row?.draft_updated_at ?? null,
      draftUpdatedBy: row?.draft_updated_by_name ?? null,
    },
  };
}

export async function state(page: PageDef) {
  return stateOf(page, await loadRow(page.key));
}

type Locked = { draft: Patch | null; published: Patch; rev: string };

/**
 * Inside a transaction: makes sure the row exists and locks it.
 * If `expectRev` is given and someone else changed the page meanwhile, throws 409.
 */
export async function lockRow(c: PoolClient, key: string, expectRev?: unknown): Promise<Locked> {
  await c.query(`INSERT INTO page_content (key) VALUES ($1) ON CONFLICT (key) DO NOTHING`, [key]);
  const { rows } = await c.query<Locked & { by_name: string | null }>(
    `SELECT pc.draft, pc.published,
            coalesce(pc.draft_updated_at::text, '-') || '|' || coalesce(pc.published_at::text, '-') AS rev,
            u.name AS by_name
       FROM page_content pc LEFT JOIN users u ON u.id = coalesce(pc.draft_updated_by, pc.published_by)
      WHERE pc.key = $1 FOR UPDATE OF pc`,
    [key],
  );
  const row = rows[0];
  // A brand-new row has rev "-|-", which the client knows as "new".
  const current = row.rev === "-|-" ? "new" : row.rev;
  if (typeof expectRev === "string" && expectRev && expectRev !== current) {
    throw new HttpError(
      409,
      `${row.by_name ?? "Someone"} changed this page while you were editing. Reload the page to see the latest version (your last few edits may need to be made again).`,
    );
  }
  return { draft: row.draft, published: row.published ?? {}, rev: current };
}

/** Stores a draft. A draft identical to what is live is stored as "no draft". */
export async function writeDraft(c: PoolClient, key: string, draft: Patch, published: Patch, userId: number) {
  const value = deepEqual(draft, published) ? null : JSON.stringify(draft);
  await c.query(`UPDATE page_content SET draft = $2::jsonb, draft_updated_at = now(), draft_updated_by = $3 WHERE key = $1`, [key, value, userId]);
}
