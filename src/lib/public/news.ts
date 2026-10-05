import "server-only";
import { dbConfigured, one, q } from "@/lib/db";
import { getMediaRefs, type MediaRef } from "@/lib/media";
import { excerptOf, walk, type DocNode } from "@/lib/posts";

/**
 * News & Blog for the public pages. A post is visible when
 * status <> 'draft' AND published_at <= now(); the pages re-render every 5 minutes,
 * so scheduled posts appear by themselves. Every function catches errors and
 * returns empty results, so `next build` works without a database.
 */
export const NEWS_PAGE_SIZE = 12;
const VISIBLE = `p.status <> 'draft' AND p.published_at IS NOT NULL AND p.published_at <= now()`;

export type NewsCategory = { id: number; name: string; slug: string; posts: number };
export type PostCard = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  image: MediaRef | null;
  imageAlt: string;
  categories: { name: string; slug: string }[];
};
export type PostFull = PostCard & {
  content: DocNode;
  authorName: string;
  tags: { name: string; slug: string }[];
  /** Media used in the body, by id (for responsive images). */
  bodyMedia: Record<number, MediaRef>;
  updatedAt: string;
};

type Row = {
  id: number; slug: string; title: string; excerpt: string; content: DocNode; published_at: Date; updated_at: Date;
  featured_media_id: number | null; featured_alt: string; author_name: string | null;
  categories: { name: string; slug: string }[];
};

const CARD_COLS = `p.id, p.slug, p.title, p.excerpt, p.content, p.published_at, p.updated_at, p.featured_media_id, p.featured_alt,
  COALESCE((SELECT json_agg(json_build_object('name', c.name, 'slug', c.slug) ORDER BY c.sort, c.name)
              FROM post_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.post_id = p.id), '[]'::json) AS categories`;

async function toCards(rows: Row[]): Promise<PostCard[]> {
  const refs = await getMediaRefs(rows.map((r) => (r.featured_media_id === null ? null : Number(r.featured_media_id))));
  return rows.map((r) => {
    const image = r.featured_media_id ? refs.get(Number(r.featured_media_id)) ?? null : null;
    return {
      id: Number(r.id),
      slug: r.slug,
      title: r.title,
      excerpt: excerptOf(r.excerpt, r.content),
      publishedAt: new Date(r.published_at).toISOString(),
      image,
      imageAlt: r.featured_alt || image?.alt || "",
      categories: r.categories ?? [],
    };
  });
}

async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!dbConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[news] ${(err as Error).message}`);
    return fallback;
  }
}

/** Categories that have at least one visible post, in the admin's order. */
export function getNewsCategories(): Promise<NewsCategory[]> {
  return safe([], async () => {
    const rows = await q<NewsCategory>(
      `SELECT c.id, c.name, c.slug, count(p.id)::int AS posts
         FROM categories c
         JOIN post_categories pc ON pc.category_id = c.id
         JOIN posts p ON p.id = pc.post_id AND ${VISIBLE}
        GROUP BY c.id ORDER BY c.sort, lower(c.name)`,
    );
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  });
}

/** One page of visible posts, newest first (optionally in one category). */
export function getPosts(page = 1, categorySlug?: string): Promise<{ posts: PostCard[]; total: number; pages: number }> {
  return safe({ posts: [], total: 0, pages: 0 }, async () => {
    const params: unknown[] = [];
    let w = VISIBLE;
    if (categorySlug) {
      params.push(categorySlug);
      w += ` AND EXISTS (SELECT 1 FROM post_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.post_id = p.id AND c.slug = $1)`;
    }
    const total = (await one<{ n: number }>(`SELECT count(*)::int AS n FROM posts p WHERE ${w}`, params))?.n ?? 0;
    params.push(NEWS_PAGE_SIZE, (Math.max(1, page) - 1) * NEWS_PAGE_SIZE);
    const rows = await q<Row>(
      `SELECT ${CARD_COLS} FROM posts p WHERE ${w}
        ORDER BY p.published_at DESC, p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { posts: await toCards(rows), total, pages: Math.ceil(total / NEWS_PAGE_SIZE) };
  });
}

export function getCategory(slug: string): Promise<{ id: number; name: string; slug: string } | null> {
  return safe(null, async () => {
    const r = await one<{ id: number; name: string; slug: string }>(`SELECT id, name, slug FROM categories WHERE slug = $1`, [slug]);
    return r ? { ...r, id: Number(r.id) } : null;
  });
}

/** A visible post by slug, with everything the post page renders. */
export function getPost(slug: string): Promise<PostFull | null> {
  return safe(null, async () => {
    const r = await one<Row>(
      `SELECT ${CARD_COLS}, u.name AS author_name FROM posts p LEFT JOIN users u ON u.id = p.author_id
        WHERE lower(p.slug) = lower($1) AND ${VISIBLE}`,
      [slug],
    );
    if (!r) return null;
    const [card] = await toCards([r]);
    const tags = await q<{ name: string; slug: string }>(
      `SELECT t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = $1 ORDER BY lower(t.name)`,
      [r.id],
    );
    const ids: number[] = [];
    walk(r.content, (n) => {
      if (n.type === "image" && typeof n.attrs?.mediaId === "number") ids.push(n.attrs.mediaId);
    });
    const refs = await getMediaRefs(ids);
    return {
      ...card,
      content: r.content,
      authorName: r.author_name ?? "",
      tags,
      bodyMedia: Object.fromEntries(refs),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  });
}

/** Up to n other visible posts, preferring ones that share a category. */
export function getRelated(post: Pick<PostFull, "id" | "categories">, n = 3): Promise<PostCard[]> {
  return safe([], async () => {
    const rows = await q<Row>(
      `SELECT ${CARD_COLS},
              (SELECT count(*) FROM post_categories pc JOIN categories c ON c.id = pc.category_id
                WHERE pc.post_id = p.id AND c.slug = ANY($2::text[])) AS shared
         FROM posts p WHERE ${VISIBLE} AND p.id <> $1
        ORDER BY shared DESC, p.published_at DESC LIMIT $3`,
      [post.id, post.categories.map((c) => c.slug), n],
    );
    return toCards(rows);
  });
}

/** Slugs of visible posts (for generateStaticParams); [] when the database is unavailable. */
export function getPostSlugs(limit = 500): Promise<string[]> {
  return safe([], async () => (await q<{ slug: string }>(`SELECT p.slug FROM posts p WHERE ${VISIBLE} ORDER BY p.published_at DESC LIMIT $1`, [limit])).map((r) => r.slug));
}
