import "server-only";
import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { HttpError } from "@/lib/admin-route";
import type { Role, Session } from "@/lib/auth";
import { audit, one, q, tx } from "@/lib/db";
import { clearMediaUsage, getMediaRefs, setMediaUsage } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { bool, id as idOf, oneOf, str } from "@/lib/validate";

/**
 * News & Blog: server-side rules shared by the /api/admin/posts endpoints.
 *
 *  - Body is Tiptap JSON, cleaned by sanitizeDoc() on every save: only the node
 *    types and marks the editor offers survive, links must be http(s)/mailto/relative,
 *    images must come from the media library.
 *  - Status: 'draft' | 'scheduled' | 'published'. A post is live when
 *    status <> 'draft' AND published_at <= now(), so scheduled posts go live by themselves.
 *  - Authors may only create and edit their OWN DRAFTS. Publishing, scheduling and
 *    editing a live post are for editors and administrators (enforced here).
 */

export const STAFF: Role[] = ["administrator", "editor"];
export const ALL_ROLES: Role[] = ["administrator", "editor", "author"];
export const isStaff = (s: Session) => STAFF.includes(s.user.role);
export const REVISIONS_KEPT = 30;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["page", "category", "feed", "rss"]);

/** SQL for the state shown in the admin (a scheduled post whose time has passed is "published"). */
export const STATE_SQL = `CASE WHEN p.status = 'draft' THEN 'draft' WHEN p.published_at > now() THEN 'scheduled' ELSE 'published' END`;

export function slugify(s: string) {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
}

// ====================================================================== Tiptap JSON
export type DocMark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = { type: string; attrs?: Record<string, unknown>; content?: DocNode[]; marks?: DocMark[]; text?: string };

const MAX_JSON = 600_000;
const MAX_DEPTH = 16;
const MAX_TEXT = 20_000;

/** http(s), mailto, site-relative ("/x", not "//x") and "#anchor" links only. Returns null when unsafe. */
export function safeHref(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > 2000 || /[\u0000-\u001f\u007f\s\\]/.test(s)) return null;
  if (s.startsWith("/")) return s.startsWith("//") ? null : s;
  if (s.startsWith("#")) return s;
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:" ? s : null;
    } catch {
      return null;
    }
  }
  return null;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function cleanMarks(v: unknown): DocMark[] {
  const out: DocMark[] = [];
  for (const m of arr(v)) {
    if (!isObj(m) || typeof m.type !== "string" || out.some((x) => x.type === m.type)) continue;
    if (m.type === "bold" || m.type === "italic") out.push({ type: m.type });
    else if (m.type === "link") {
      const href = safeHref(isObj(m.attrs) ? m.attrs.href : null);
      if (href) out.push({ type: "link", attrs: { href } });
    }
  }
  return out;
}

function inline(nodes: unknown[], depth: number): DocNode[] {
  const out: DocNode[] = [];
  if (depth > MAX_DEPTH) return out;
  for (const n of nodes) {
    if (!isObj(n)) continue;
    if (n.type === "text") {
      if (typeof n.text !== "string" || !n.text) continue;
      const marks = cleanMarks(n.marks);
      out.push({ type: "text", text: n.text.slice(0, MAX_TEXT), ...(marks.length ? { marks } : {}) });
    } else if (n.type === "hardBreak") out.push({ type: "hardBreak" });
    else if (Array.isArray(n.content)) out.push(...inline(n.content, depth + 1)); // unknown inline wrapper: keep its text
  }
  return out;
}

function listItems(nodes: unknown[], depth: number): DocNode[] {
  const out: DocNode[] = [];
  for (const n of nodes) {
    if (!isObj(n)) continue;
    const inner = blocks(n.type === "listItem" ? arr(n.content) : [n], depth + 1);
    if (!inner.length) continue;
    if (inner[0].type !== "paragraph") inner.unshift({ type: "paragraph" });
    out.push({ type: "listItem", content: inner });
  }
  return out;
}

function blocks(nodes: unknown[], depth: number): DocNode[] {
  const out: DocNode[] = [];
  if (depth > MAX_DEPTH) return out;
  let run: DocNode[] = [];
  const flush = () => {
    if (run.length) out.push({ type: "paragraph", content: run });
    run = [];
  };
  for (const n of nodes) {
    if (!isObj(n) || typeof n.type !== "string") continue;
    const attrs = isObj(n.attrs) ? n.attrs : {};
    switch (n.type) {
      case "paragraph": {
        flush();
        const content = inline(arr(n.content), depth + 1);
        out.push(content.length ? { type: "paragraph", content } : { type: "paragraph" });
        break;
      }
      case "heading": {
        flush();
        const level = Number(attrs.level) <= 2 ? 2 : 3;
        const content = inline(arr(n.content), depth + 1);
        out.push({ type: "heading", attrs: { level }, ...(content.length ? { content } : {}) });
        break;
      }
      case "bulletList":
      case "orderedList": {
        flush();
        const items = listItems(arr(n.content), depth + 1);
        if (!items.length) break;
        const start = Number.parseInt(String(attrs.start ?? 1), 10);
        out.push({
          type: n.type,
          ...(n.type === "orderedList" ? { attrs: { start: Number.isFinite(start) && start > 0 && start < 10000 ? start : 1 } } : {}),
          content: items,
        });
        break;
      }
      case "blockquote": {
        flush();
        const inner = blocks(arr(n.content), depth + 1);
        if (inner.length) out.push({ type: "blockquote", content: inner });
        break;
      }
      case "image": {
        flush();
        const src = typeof attrs.src === "string" ? attrs.src.trim() : "";
        if (!src.startsWith("/media/") || src.length > 1000) break;
        out.push({ type: "image", attrs: { src, alt: typeof attrs.alt === "string" ? attrs.alt.slice(0, 300) : "" } });
        break;
      }
      case "text":
      case "hardBreak":
        run.push(...inline([n], depth + 1));
        break;
      default:
        // Unknown node (pasted code block, table…): keep what is inside it.
        if (Array.isArray(n.content)) {
          flush();
          out.push(...blocks(n.content, depth + 1));
        }
    }
  }
  flush();
  return out;
}

/** Validates and cleans a Tiptap document. Throws 422 when it is not a document at all. */
export function sanitizeDoc(v: unknown): DocNode {
  if (!isObj(v) || v.type !== "doc") throw new HttpError(422, "The post body is not valid. Reload the editor and try again.");
  if (JSON.stringify(v).length > MAX_JSON) throw new HttpError(422, "The post body is too long.");
  const content = blocks(arr(v.content), 0);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Walks every node of a document. */
export function walk(doc: DocNode | null | undefined, fn: (n: DocNode) => void) {
  if (!doc) return;
  fn(doc);
  for (const c of doc.content ?? []) walk(c, fn);
}

/** Plain text of a document (for excerpts and meta descriptions). */
export function docText(doc: DocNode | null | undefined, max = 400): string {
  const parts: string[] = [];
  let len = 0;
  const visit = (n: DocNode) => {
    if (len > max) return;
    if (n.type === "text" && n.text) {
      parts.push(n.text);
      len += n.text.length;
    } else if (n.type === "hardBreak") parts.push(" ");
    for (const c of n.content ?? []) visit(c);
    if (["paragraph", "heading", "listItem", "blockquote"].includes(n.type)) parts.push(" ");
  };
  if (doc) visit(doc);
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function excerptOf(excerpt: string, doc: DocNode | null | undefined, max = 180) {
  if (excerpt.trim()) return excerpt.trim();
  const t = docText(doc, max + 40);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** /media/2026/10/a%20b.webp → 2026/10/a b.webp */
function mediaPathOf(src: string): string | null {
  if (!src.startsWith("/media/")) return null;
  try {
    return src.slice(7).split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

/**
 * Checks every body image against the media library: unknown images are dropped,
 * known ones get their media id (used for usage tracking and responsive rendering).
 */
async function resolveBodyImages(doc: DocNode): Promise<{ doc: DocNode; ids: number[] }> {
  const paths = new Set<string>();
  walk(doc, (n) => {
    if (n.type === "image") {
      const p = mediaPathOf(String(n.attrs?.src ?? ""));
      if (p) paths.add(p);
    }
  });
  const byPath = new Map<string, number>();
  if (paths.size) {
    const rows = await q<{ id: number; path: string }>(`SELECT id, path FROM media WHERE kind = 'image' AND path = ANY($1::text[])`, [[...paths]]);
    rows.forEach((r) => byPath.set(r.path, Number(r.id)));
  }
  const ids: number[] = [];
  const fix = (nodes: DocNode[] | undefined): DocNode[] | undefined => {
    if (!nodes) return nodes;
    const out: DocNode[] = [];
    for (const n of nodes) {
      if (n.type === "image") {
        const mid = byPath.get(mediaPathOf(String(n.attrs?.src ?? "")) ?? "");
        if (!mid) continue;
        ids.push(mid);
        out.push({ ...n, attrs: { ...n.attrs, mediaId: mid } });
      } else out.push(n.content ? { ...n, content: fix(n.content) } : n);
    }
    return out;
  };
  const content = fix(doc.content) ?? [];
  return { doc: { type: "doc", content: content.length ? content : [{ type: "paragraph" }] }, ids };
}

// ====================================================================== access
export type PostRow = {
  id: number; title: string; slug: string; excerpt: string; content: DocNode; featured_media_id: number | null; featured_alt: string;
  author_id: number | null; status: "draft" | "scheduled" | "published"; published_at: string | null; autosaved_at: string | null;
  created_at: string; updated_at: string; updated_by: number | null;
};

/** Loads a post the session may see (authors: only their own). 404 otherwise. */
export async function loadPost(session: Session, postId: number): Promise<PostRow> {
  const row = await one<PostRow>(`SELECT * FROM posts WHERE id = $1`, [postId]);
  if (!row || (!isStaff(session) && Number(row.author_id) !== session.user.id)) throw new HttpError(404, "That post was not found.");
  return { ...row, id: Number(row.id), author_id: row.author_id === null ? null : Number(row.author_id), featured_media_id: row.featured_media_id === null ? null : Number(row.featured_media_id) };
}

/** Can this session change this post at all (authors: own drafts only)? */
export function canEdit(session: Session, row: Pick<PostRow, "author_id" | "status">) {
  if (isStaff(session)) return true;
  return Number(row.author_id) === session.user.id && row.status === "draft";
}

// ====================================================================== save
type Intent = "draft" | "publish";
export type SaveResult = { id: number; slug: string; status: PostRow["status"]; state: "draft" | "scheduled" | "published"; publishedAt: string | null; savedAt: string };

type Parsed = {
  title: string; slug: string; slugAuto: boolean; excerpt: string; content: DocNode; featuredId: number | null; featuredAlt: string;
  categoryIds: number[]; tags: string[]; authorId: number | null; publishedAt: Date | null; intent: Intent; autosave: boolean;
};

function parse(b: Record<string, unknown>): Parsed {
  const title = str(b.title, { max: 200, label: "Title" });
  const slugAuto = bool(b.slugAuto);
  const slug = str(b.slug, { max: 80, label: "Slug" }).toLowerCase();
  if (!slugAuto) {
    if (!slug) throw new HttpError(422, "Slug is required.");
    if (!SLUG_RE.test(slug)) throw new HttpError(422, "Slug: use lowercase letters, numbers and single dashes only (e.g. sports-day-2026).");
    if (RESERVED_SLUGS.has(slug)) throw new HttpError(422, `“${slug}” cannot be used as a slug. Please choose another.`);
  }
  const excerpt = str(b.excerpt, { max: 400, label: "Excerpt" });
  const content = sanitizeDoc(b.content ?? { type: "doc", content: [] });
  const featuredId = b.featuredId === null || b.featuredId === undefined || b.featuredId === "" ? null : idOf(b.featuredId, "featured image");
  const featuredAlt = str(b.featuredAlt, { max: 300, label: "Featured image alt text" });

  const rawCats = arr(b.categoryIds);
  if (rawCats.length > 10) throw new HttpError(422, "Choose at most 10 categories.");
  const categoryIds = [...new Set(rawCats.map((c) => idOf(c, "category")))];

  const rawTags = arr(b.tags);
  if (rawTags.length > 20) throw new HttpError(422, "Use at most 20 tags.");
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of rawTags) {
    const name = str(t, { max: 40, label: "Tag" }).replace(/\s+/g, " ");
    if (!name || !slugify(name) || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    tags.push(name);
  }

  const authorId = b.authorId === null || b.authorId === undefined || b.authorId === "" ? null : idOf(b.authorId, "author");
  let publishedAt: Date | null = null;
  if (b.publishedAt !== null && b.publishedAt !== undefined && b.publishedAt !== "") {
    const d = new Date(String(b.publishedAt));
    if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) throw new HttpError(422, "Publish date is not a valid date.");
    publishedAt = d;
  }
  const intent = oneOf(b.status ?? "draft", ["draft", "publish"] as const, "Status");
  return { title, slug, slugAuto, excerpt, content, featuredId, featuredAlt, categoryIds, tags, authorId, publishedAt, intent, autosave: bool(b.autosave) };
}

async function uniqueSlug(c: PoolClient, wanted: string, auto: boolean, postId: number | null): Promise<string> {
  const taken = async (s: string) =>
    (await c.query(`SELECT title FROM posts WHERE lower(slug) = $1 AND ($2::bigint IS NULL OR id <> $2)`, [s, postId])).rows[0] as { title: string } | undefined;
  if (!auto) {
    const t = await taken(wanted);
    if (t) throw new HttpError(422, `The slug “${wanted}” is already used by “${t.title || "another post"}”. Choose a different slug.`);
    return wanted;
  }
  const base = (wanted || "untitled").slice(0, 72).replace(/-+$/, "");
  for (let n = 1; n < 200; n++) {
    const s = n === 1 ? base : `${base}-${n}`;
    if (!RESERVED_SLUGS.has(s) && !(await taken(s))) return s;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function tagIds(c: PoolClient, names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const found = (await c.query(`SELECT id FROM tags WHERE slug = $1 OR lower(name) = lower($2) LIMIT 1`, [slug, name])).rows[0];
    if (found) ids.push(Number(found.id));
    else {
      const r = (await c.query(`INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id`, [name, slug])).rows[0];
      ids.push(Number(r.id));
    }
  }
  return [...new Set(ids)];
}

async function categorySlugs(postId: number): Promise<string[]> {
  return (await q<{ slug: string }>(`SELECT c.slug FROM post_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.post_id = $1`, [postId])).map((r) => r.slug);
}

/** Marks the public news pages that show this post as stale. */
export function revalidateNews(slugs: string[], catSlugs: string[]) {
  revalidatePaths(["/news", "/news/[slug]", ...slugs.map((s) => `/news/${s}`), ...catSlugs.map((s) => `/news/category/${s}`), "/news/category/[slug]", "/"]);
  for (const p of ["/news/page/[n]", "/news/category/[slug]/page/[n]"]) {
    try {
      revalidatePath(p, "page");
    } catch (err) {
      console.error("[revalidate]", p, err);
    }
  }
}

/** Creates (postId null) or updates a post. All role rules are enforced here. */
export async function savePost(session: Session, postId: number | null, b: Record<string, unknown>): Promise<SaveResult> {
  const p = parse(b);
  const staff = isStaff(session);
  const me = session.user.id;

  if (!staff && p.intent === "publish") {
    throw new HttpError(403, "Authors cannot publish or schedule posts. Save it as a draft and ask an editor to publish it.");
  }

  const old = postId ? await loadPost(session, postId) : null;
  if (old && !canEdit(session, old)) throw new HttpError(403, "This post is live. Only an editor or administrator can change it.");
  if (old && p.autosave && old.status !== "draft") throw new HttpError(409, "Live posts are not autosaved. Use Update to save your changes.");

  // Author: authors are always themselves; staff may pick any active user (default: keep / me).
  let authorId: number | null = staff ? (p.authorId ?? old?.author_id ?? me) : me;
  if (staff && authorId !== null && authorId !== old?.author_id) {
    const u = await one(`SELECT 1 FROM users WHERE id = $1 AND NOT disabled`, [authorId]);
    if (!u) throw new HttpError(422, "Choose an active user as the author.");
  }
  if (!staff) authorId = me;

  if (p.categoryIds.length) {
    const n = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM categories WHERE id = ANY($1::bigint[])`, [p.categoryIds]))?.n ?? 0;
    if (n !== p.categoryIds.length) throw new HttpError(422, "One of the categories no longer exists. Reload the page.");
  }
  if (p.featuredId) {
    const m = await one(`SELECT 1 FROM media WHERE id = $1 AND kind = 'image'`, [p.featuredId]);
    if (!m) throw new HttpError(422, "The featured image is no longer in the media library.");
  }

  // Status
  let status: PostRow["status"] = "draft";
  let publishedAt = p.publishedAt;
  if (p.intent === "publish") {
    if (!p.title) throw new HttpError(422, "Add a title before publishing.");
    publishedAt ??= new Date();
    status = publishedAt.getTime() > Date.now() ? "scheduled" : "published";
  }

  const { doc, ids: bodyMediaIds } = await resolveBodyImages(p.content);
  const oldCats = old ? await categorySlugs(old.id) : [];
  const revision = !p.autosave;

  const saved = await tx(async (c) => {
    const slug = await uniqueSlug(c, p.slugAuto ? slugify(p.slug || p.title) : p.slug, p.slugAuto, old?.id ?? null);
    const vals = [p.title, slug, p.excerpt, JSON.stringify(doc), p.featuredId, p.featuredAlt, authorId, status, publishedAt, me];
    let row: { id: number; updated_at: string; published_at: string | null };
    try {
      row = old
        ? (
            await c.query(
              `UPDATE posts SET title = $1, slug = $2, excerpt = $3, content = $4, featured_media_id = $5, featured_alt = $6, author_id = $7,
                      status = $8, published_at = $9, updated_by = $10, updated_at = now(),
                      autosaved_at = CASE WHEN $12 THEN now() ELSE autosaved_at END
                WHERE id = $11 RETURNING id, updated_at, published_at`,
              [...vals, old.id, p.autosave],
            )
          ).rows[0]
        : (
            await c.query(
              `INSERT INTO posts (title, slug, excerpt, content, featured_media_id, featured_alt, author_id, status, published_at, updated_by, autosaved_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $11 THEN now() END) RETURNING id, updated_at, published_at`,
              [...vals, p.autosave],
            )
          ).rows[0];
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new HttpError(422, "That slug is already used by another post.");
      throw e;
    }
    const id = Number(row.id);
    await c.query(`DELETE FROM post_categories WHERE post_id = $1`, [id]);
    if (p.categoryIds.length) {
      await c.query(`INSERT INTO post_categories (post_id, category_id) SELECT $1, unnest($2::bigint[])`, [id, p.categoryIds]);
    }
    const tIds = await tagIds(c, p.tags);
    await c.query(`DELETE FROM post_tags WHERE post_id = $1`, [id]);
    if (tIds.length) await c.query(`INSERT INTO post_tags (post_id, tag_id) SELECT $1, unnest($2::bigint[])`, [id, tIds]);
    if (revision) {
      await c.query(`INSERT INTO post_revisions (post_id, title, content, excerpt, saved_by) VALUES ($1, $2, $3, $4, $5)`, [id, p.title, JSON.stringify(doc), p.excerpt, me]);
      await c.query(
        `DELETE FROM post_revisions WHERE post_id = $1 AND id NOT IN (SELECT id FROM post_revisions WHERE post_id = $1 ORDER BY saved_at DESC, id DESC LIMIT $2)`,
        [id, REVISIONS_KEPT],
      );
    }
    return { id, slug, updatedAt: row.updated_at as unknown as Date, publishedAt: row.published_at as unknown as Date | null };
  });

  await setMediaUsage("post", saved.id, "featured", [p.featuredId]);
  await setMediaUsage("post", saved.id, "body", bodyMediaIds);

  const wasLive = !!old && old.status !== "draft";
  const isLive = status !== "draft";
  if (!p.autosave) {
    const action = !old ? "create" : isLive && !wasLive ? (status === "scheduled" ? "schedule" : "publish") : !isLive && wasLive ? "unpublish" : "update";
    await audit(me, "post", saved.id, action, { title: p.title, slug: saved.slug, status });
  }
  if (wasLive || isLive) revalidateNews([old?.slug, saved.slug].filter((s): s is string => !!s), [...oldCats, ...(await categorySlugs(saved.id))]);

  const pub = saved.publishedAt ? new Date(saved.publishedAt) : null;
  return {
    id: saved.id,
    slug: saved.slug,
    status,
    state: status === "draft" ? "draft" : pub && pub.getTime() > Date.now() ? "scheduled" : "published",
    publishedAt: pub ? pub.toISOString() : null,
    savedAt: new Date(saved.updatedAt).toISOString(),
  };
}

/** Deletes a post (authors: their own drafts only). */
export async function deletePost(session: Session, postId: number) {
  const old = await loadPost(session, postId);
  if (!canEdit(session, old)) throw new HttpError(403, "Only an editor or administrator can delete a live post.");
  const cats = await categorySlugs(old.id);
  await q(`DELETE FROM posts WHERE id = $1`, [old.id]);
  await clearMediaUsage("post", old.id);
  await audit(session.user.id, "post", old.id, "delete", { title: old.title, slug: old.slug });
  if (old.status !== "draft") revalidateNews([old.slug], cats);
}

/** Everything the editor screen needs for one post. */
export async function postForEditor(session: Session, postId: number) {
  const row = await loadPost(session, postId);
  const [cats, tags, author, refs, revCount] = await Promise.all([
    q<{ id: number }>(`SELECT category_id AS id FROM post_categories WHERE post_id = $1`, [row.id]),
    q<{ name: string }>(`SELECT t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = $1 ORDER BY lower(t.name)`, [row.id]),
    row.author_id ? one<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [row.author_id]) : null,
    getMediaRefs([row.featured_media_id]),
    one<{ n: number }>(`SELECT count(*)::int AS n FROM post_revisions WHERE post_id = $1`, [row.id]),
  ]);
  const ref = row.featured_media_id ? refs.get(row.featured_media_id) : undefined;
  const pub = row.published_at ? new Date(row.published_at) : null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featured: ref ? { id: ref.id, url: ref.url, alt: row.featured_alt || ref.alt } : null,
    categoryIds: cats.map((c) => Number(c.id)),
    tags: tags.map((t) => t.name),
    authorId: row.author_id,
    authorName: author?.name ?? "",
    status: row.status,
    state: row.status === "draft" ? "draft" : pub && pub.getTime() > Date.now() ? "scheduled" : "published",
    publishedAt: pub ? pub.toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
    autosavedAt: row.autosaved_at ? new Date(row.autosaved_at).toISOString() : null,
    revisions: revCount?.n ?? 0,
    canEdit: canEdit(session, row),
    canPublish: isStaff(session),
  };
}

// ====================================================================== categories
/** Validates a category's name and slug (unique). */
export async function readCategory(b: Record<string, unknown>, selfId: number | null) {
  const name = str(b.name, { required: true, max: 60, label: "Name" });
  const slug = (str(b.slug, { max: 60, label: "Slug" }) || slugify(name)).toLowerCase();
  if (!slug || !SLUG_RE.test(slug)) throw new HttpError(422, "Slug: use lowercase letters, numbers and single dashes only.");
  if (slug === "page") throw new HttpError(422, "“page” cannot be used as a slug.");
  const clash = await one<{ name: string }>(`SELECT name FROM categories WHERE (slug = $1 OR lower(name) = lower($2)) AND ($3::bigint IS NULL OR id <> $3)`, [slug, name, selfId]);
  if (clash) throw new HttpError(422, `“${clash.name}” already uses that name or slug.`);
  return { name, slug };
}
