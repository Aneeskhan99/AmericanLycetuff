/** Shapes shared by the News & Blog admin screens (mirrors src/lib/posts.ts). */
export type PostState = "draft" | "scheduled" | "published";
export type Category = { id: number; name: string; slug: string; sort?: number; posts?: number };
export type UserOpt = { id: number; name: string; role: string; disabled: boolean };
export type Meta = { categories: Category[]; users: UserOpt[] };

export type TiptapJSON = { type: string; attrs?: Record<string, unknown>; content?: TiptapJSON[]; marks?: { type: string; attrs?: Record<string, unknown> }[]; text?: string };

export type EditorPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: TiptapJSON;
  featured: { id: number; url: string; alt: string } | null;
  categoryIds: number[];
  tags: string[];
  authorId: number | null;
  authorName: string;
  status: PostState;
  state: PostState;
  publishedAt: string | null;
  updatedAt: string;
  autosavedAt: string | null;
  revisions: number;
  canEdit: boolean;
  canPublish: boolean;
};

export type SaveResult = { id: number; slug: string; status: PostState; state: PostState; publishedAt: string | null; savedAt: string };

export const STATE_LABEL: Record<PostState, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published" };
export const STATE_TONE: Record<PostState, "gray" | "amber" | "green"> = { draft: "gray", scheduled: "amber", published: "green" };

/** http(s), mailto, site-relative and #anchor links only (the server checks again). */
export function safeHref(v: string): string | null {
  const s = v.trim();
  if (!s || s.length > 2000 || /[\u0000-\u001f\u007f\s\\]/.test(s)) return null;
  if (s.startsWith("/")) return s.startsWith("//") ? null : s;
  if (s.startsWith("#")) return s;
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(s)) return s;
  if (/^https?:\/\/[^/]+/i.test(s)) return s;
  if (/^www\.[^/\s]+\.[a-z]{2,}/i.test(s)) return `https://${s}`;
  return null;
}
