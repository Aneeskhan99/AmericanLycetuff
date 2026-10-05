"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useAdmin, type AdminUser } from "../AdminProvider";
import { ImageInput } from "../MediaPicker";
import { Badge, Button, Card, ConfirmDialog, Dialog, Empty, ErrorNote, Field, fmtDate, Input, Select, slugify, Textarea } from "../ui";
import RichEditor from "./RichEditor";
import TagInput from "./TagInput";
import { STATE_LABEL, STATE_TONE, type EditorPost, type Meta, type PostState, type SaveResult, type TiptapJSON } from "./types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AUTOSAVE_MS = 3000;
const EMPTY_DOC: TiptapJSON = { type: "doc", content: [{ type: "paragraph" }] };

type Form = {
  title: string; slug: string; slugAuto: boolean; excerpt: string; content: TiptapJSON;
  featured: { id: number; url: string; alt: string } | null; categoryIds: number[]; tags: string[];
  authorId: number | null; publishedAt: string; // datetime-local value (browser time)
};
type Stored = { status: PostState; state: PostState; slug: string; publishedAt: string | null };

/** ISO → "2026-10-06T14:30" in the browser's time zone (for <input type="datetime-local">). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function initialForm(post: EditorPost | null, me: AdminUser): Form {
  if (!post) {
    return { title: "", slug: "", slugAuto: true, excerpt: "", content: EMPTY_DOC, featured: null, categoryIds: [], tags: [], authorId: me.id, publishedAt: "" };
  }
  const content = post.content?.type === "doc" && post.content.content?.length ? post.content : EMPTY_DOC;
  return {
    title: post.title,
    slug: post.slug,
    // Keep following the title only while the post has never gone live and the slug was never hand-edited.
    slugAuto: post.status === "draft" && (post.slug === slugify(post.title) || /^untitled(-\d+)?$/.test(post.slug)),
    excerpt: post.excerpt,
    content,
    featured: post.featured,
    categoryIds: post.categoryIds,
    tags: post.tags,
    authorId: post.authorId,
    publishedAt: toLocalInput(post.publishedAt),
  };
}

/** Loads the post (or starts a new one) and the categories/users, then shows the form. */
export default function PostEditor({ postId }: { postId: number | null }) {
  const { api } = useAdmin();
  const [post, setPost] = useState<EditorPost | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([api<Meta>("/api/admin/posts/meta"), postId ? api<{ post: EditorPost }>(`/api/admin/posts/${postId}`) : Promise.resolve(null)])
      .then(([m, p]) => {
        if (!live) return;
        setMeta(m);
        if (p) setPost(p.post);
      })
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [api, postId]);

  if (error) {
    return (
      <Card>
        <Empty title="This post could not be opened">
          <p>{error}</p>
          <Link href="/admin/news" className="mt-3 inline-block text-[#1a2d59] underline">Back to all posts</Link>
        </Empty>
      </Card>
    );
  }
  if (!meta || (postId && !post)) return <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>;
  return <PostForm key={post?.id ?? "new"} post={post} meta={meta} />;
}

// ====================================================================== form
function PostForm({ post, meta }: { post: EditorPost | null; meta: Meta }) {
  const { api, toast, user } = useAdmin();
  const router = useRouter();
  const staff = user.role !== "author";
  const [f, setF] = useState<Form>(() => initialForm(post, user));
  const [id, setId] = useState<number | null>(post?.id ?? null);
  const [stored, setStored] = useState<Stored>(() => ({ status: post?.status ?? "draft", state: post?.state ?? "draft", slug: post?.slug ?? "", publishedAt: post?.publishedAt ?? null }));
  const canEdit = post ? post.canEdit : true;
  const [rev, setRev] = useState(0);
  const [savedRev, setSavedRev] = useState(0);
  const [failedRev, setFailedRev] = useState(-1);
  const revRef = useRef(0);
  const [busy, setBusy] = useState<"" | "auto" | "draft" | "publish" | "unpublish">("");
  const savingRef = useRef(false);
  const [savedAt, setSavedAt] = useState<string | null>(post ? post.autosavedAt && post.autosavedAt > post.updatedAt ? post.autosavedAt : post.updatedAt : null);
  const [autoError, setAutoError] = useState("");
  const [error, setError] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [confirm, setConfirm] = useState<"" | "delete" | "unpublish">("");
  const [leaveTo, setLeaveTo] = useState("");
  const [showRevisions, setShowRevisions] = useState(false);

  const dirty = rev !== savedRev;
  const autosaveOn = canEdit && stored.status === "draft";
  const live = stored.status !== "draft";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);
  const futureDate = Boolean(f.publishedAt) && new Date(f.publishedAt).getTime() > now;

  const change = useCallback((patch: Partial<Form> | ((prev: Form) => Partial<Form>)) => {
    setF((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
    revRef.current += 1;
    setRev(revRef.current);
  }, []);
  const onBody = useCallback((content: TiptapJSON) => change({ content }), [change]);

  const slugError = !f.slugAuto && f.slug && !SLUG_RE.test(f.slug) ? "Use lowercase letters, numbers and single dashes (e.g. sports-day-2026)." : !f.slugAuto && !f.slug ? "A slug is required." : "";

  // ------------------------------------------------------------ save
  const save = useCallback(
    async (intent: "draft" | "publish", mode: "auto" | "draft" | "publish" | "unpublish"): Promise<boolean> => {
      if (savingRef.current) return false;
      savingRef.current = true;
      setBusy(mode);
      if (mode !== "auto") setError("");
      const startRev = revRef.current;
      const payload = {
        title: f.title,
        slug: f.slugAuto ? slugify(f.title) : f.slug,
        slugAuto: f.slugAuto,
        excerpt: f.excerpt,
        content: f.content,
        featuredId: f.featured?.id ?? null,
        featuredAlt: f.featured?.alt ?? "",
        categoryIds: f.categoryIds,
        tags: f.tags,
        authorId: f.authorId,
        publishedAt: fromLocalInput(f.publishedAt),
        status: intent,
        autosave: mode === "auto",
      };
      try {
        const res = id
          ? await api<SaveResult>(`/api/admin/posts/${id}`, { method: "PATCH", body: payload })
          : await api<SaveResult>("/api/admin/posts", { method: "POST", body: payload });
        if (!id) window.history.replaceState(null, "", `/admin/news/${res.id}`);
        setId(res.id);
        setStored({ status: res.status, state: res.state, slug: res.slug, publishedAt: res.publishedAt });
        setF((prev) => ({
          ...prev,
          slug: res.slug,
          slugAuto: res.status === "draft" ? prev.slugAuto : false,
          publishedAt: res.publishedAt ? toLocalInput(res.publishedAt) : prev.publishedAt,
        }));
        setSavedRev(startRev);
        setSavedAt(res.savedAt);
        setAutoError("");
        if (mode === "publish") toast(res.state === "scheduled" ? `Scheduled for ${fmtDate(res.publishedAt)}` : live ? "Post updated" : "Post published");
        else if (mode === "unpublish") toast("Post unpublished. It is a draft again.");
        else if (mode === "draft") toast("Draft saved");
        return true;
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Could not save. Check your connection and try again.";
        if (mode === "auto") {
          setAutoError(msg);
          setFailedRev(startRev);
        } else {
          setError(msg);
          toast(msg, "error");
        }
        return false;
      } finally {
        savingRef.current = false;
        setBusy("");
      }
    },
    [api, toast, f, id, live],
  );

  // Autosave drafts a few seconds after the last change.
  useEffect(() => {
    if (!autosaveOn || !dirty || busy || failedRev === rev || slugError) return;
    const t = setTimeout(() => void save("draft", "auto"), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [autosaveOn, dirty, busy, rev, failedRev, slugError, save]);

  // Warn before leaving with unsaved changes (tab close, reload, and links inside the admin).
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", onBefore);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBefore);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const remove = async () => {
    if (!id) return;
    setBusy("draft");
    try {
      await api(`/api/admin/posts/${id}`, { method: "DELETE" });
      toast("Post deleted");
      setSavedRev(revRef.current);
      router.push("/admin/news");
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy("");
      setConfirm("");
    }
  };

  const restore = (r: { title: string; excerpt: string; content: TiptapJSON }) => {
    change({ title: r.title, excerpt: r.excerpt, content: r.content?.content?.length ? r.content : EMPTY_DOC });
    setEditorKey((k) => k + 1);
    setShowRevisions(false);
    toast(live ? "Revision loaded. Click Update to put it live." : "Revision loaded into the editor.");
  };

  // ------------------------------------------------------------ status line
  let statusLine: React.ReactNode;
  if (busy) statusLine = <span className="text-[#667085]">Saving…</span>;
  else if (autoError && dirty) statusLine = <span className="text-[#b42318]">Not saved: {autoError}</span>;
  else if (dirty) statusLine = <span className="text-[#b54708]">{autosaveOn ? "Unsaved changes" : "Unsaved changes. Click Update to put them live."}</span>;
  else if (savedAt) statusLine = <span className="text-[#027a48]">Saved · {timeOnly(savedAt)}</span>;
  else statusLine = <span className="text-[#667085]">Not saved yet</span>;

  const publishLabel = live ? (futureDate ? "Update schedule" : "Update") : futureDate ? "Schedule" : "Publish";
  const ro = !canEdit;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/news" className="text-[13px] text-[#475467] hover:underline">← All posts</Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-[22px] font-semibold text-[#101828]">
            {id ? "Edit post" : "New post"}
            <Badge tone={STATE_TONE[stored.state]}>{STATE_LABEL[stored.state]}</Badge>
          </h1>
          <p className="mt-1 text-[13px]" aria-live="polite">{statusLine}</p>
        </div>
        {!ro && (
          <div className="flex flex-wrap gap-2">
            {live && staff && <Button tone="secondary" disabled={!!busy} onClick={() => setConfirm("unpublish")}>Unpublish</Button>}
            {!live && <Button tone="secondary" busy={busy === "draft"} disabled={!!busy || !!slugError} onClick={() => void save("draft", "draft")}>Save draft</Button>}
            {staff && <Button busy={busy === "publish"} disabled={!!busy || !!slugError} onClick={() => void save("publish", "publish")}>{publishLabel}</Button>}
          </div>
        )}
      </div>

      {ro && (
        <div className="mb-4 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-[14px] text-[#b54708]">
          This post is live, so only an editor or administrator can change it. Ask them if something needs updating.
        </div>
      )}
      {!staff && !ro && (
        <div className="mb-4 rounded-lg border border-[#d6e0f5] bg-[#eff4ff] px-4 py-3 text-[14px] text-[#1a2d59]">
          Your drafts save automatically. When the post is ready, let an editor know and they will publish it.
        </div>
      )}
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------------------------------------------------- main */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <Field label="Title" htmlFor="post-title" required>
              <Input
                id="post-title"
                value={f.title}
                disabled={ro}
                maxLength={200}
                placeholder="e.g. Students win the regional robotics championship"
                className="h-12 text-[18px] font-medium"
                onChange={(e) => {
                  const title = e.target.value;
                  change((prev) => ({ title, ...(prev.slugAuto ? { slug: slugify(title) } : {}) }));
                }}
              />
            </Field>
            <Field
              label="Slug (web address)"
              htmlFor="post-slug"
              error={slugError}
              hint={f.slugAuto ? "Follows the title until you edit it." : live ? "Changing the slug of a live post changes its web address; old links will stop working." : undefined}
            >
              <div className="flex items-stretch">
                <span className="flex items-center rounded-l-md border border-r-0 border-[#d0d5dd] bg-[#f9fafb] px-3 text-[14px] text-[#667085]">/news/</span>
                <Input
                  id="post-slug"
                  value={f.slug}
                  disabled={ro}
                  maxLength={80}
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="generated-from-the-title"
                  className="rounded-l-none font-mono text-[13px]"
                  aria-invalid={Boolean(slugError)}
                  onChange={(e) => change({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-"), slugAuto: false })}
                />
                {!f.slugAuto && !ro && !live && (
                  <Button type="button" tone="ghost" size="sm" className="ml-1 h-10 shrink-0" onClick={() => change((prev) => ({ slugAuto: true, slug: slugify(prev.title) }))}>
                    From title
                  </Button>
                )}
              </div>
            </Field>
          </Card>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">Body</span>
            <RichEditor key={editorKey} initial={f.content} onChange={onBody} editable={!ro} />
          </div>

          <Card className="p-4 sm:p-5">
            <Field label="Excerpt" htmlFor="post-excerpt" hint={`Shown on news cards and in search results. Leave empty to use the start of the post. ${f.excerpt.length}/400`}>
              <Textarea id="post-excerpt" value={f.excerpt} disabled={ro} maxLength={400} rows={3} onChange={(e) => change({ excerpt: e.target.value })} />
            </Field>
          </Card>
        </div>

        {/* ---------------------------------------------------------- sidebar */}
        <aside className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4 p-4">
            <h2 className="text-[15px] font-semibold text-[#101828]">Publishing</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-[#667085]">Status</dt>
              <dd>
                {stored.state === "draft" ? "Draft (not on the website)" : stored.state === "scheduled" ? `Scheduled for ${fmtDate(stored.publishedAt)}` : `Published ${fmtDate(stored.publishedAt)}`}
              </dd>
              {stored.state === "published" && (
                <>
                  <dt className="text-[#667085]">Live at</dt>
                  <dd className="min-w-0 truncate">
                    <a href={`/news/${stored.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#1a2d59] underline">/news/{stored.slug}</a>
                  </dd>
                </>
              )}
            </dl>
            <Field
              label="Publish date and time"
              htmlFor="post-date"
              hint={staff ? "Empty = publish now. A future date schedules the post; it appears on the website by itself." : "The date you would like it to go out. An editor publishes it."}
            >
              <div className="flex gap-2">
                <Input id="post-date" type="datetime-local" value={f.publishedAt} disabled={ro} onChange={(e) => change({ publishedAt: e.target.value })} />
                {f.publishedAt && !ro && (
                  <Button type="button" tone="ghost" size="sm" className="h-10 shrink-0" onClick={() => change({ publishedAt: "" })} aria-label="Clear the publish date">Clear</Button>
                )}
              </div>
            </Field>
            <Field label="Author" htmlFor="post-author">
              {staff ? (
                <Select id="post-author" value={f.authorId ?? ""} disabled={ro} onChange={(e) => change({ authorId: e.target.value ? Number(e.target.value) : null })}>
                  {f.authorId === null && <option value="">No author</option>}
                  {meta.users.map((u) => (
                    <option key={u.id} value={u.id} disabled={u.disabled && u.id !== f.authorId}>
                      {u.name}{u.disabled ? " (disabled)" : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="post-author" value={post?.authorName || user.name} disabled />
              )}
            </Field>
          </Card>

          <Card className="p-4">
            {ro ? (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[#344054]">Featured image</span>
                {f.featured ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.featured.url} alt={f.featured.alt} className="aspect-[16/10] w-full rounded-lg object-cover" />
                ) : (
                  <span className="text-[13px] text-[#667085]">None</span>
                )}
              </div>
            ) : (
              <ImageInput label="Featured image" value={f.featured} onChange={(v) => change({ featured: v })} />
            )}
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <fieldset disabled={ro}>
              <legend className="mb-2 text-[13px] font-medium text-[#344054]">Categories</legend>
              {meta.categories.length === 0 ? (
                <p className="text-[13px] text-[#667085]">No categories yet.</p>
              ) : (
                <ul className="flex max-h-60 flex-col gap-1.5 overflow-auto">
                  {meta.categories.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#344054]">
                        <input
                          type="checkbox"
                          className="size-4 accent-[#1a2d59]"
                          checked={f.categoryIds.includes(c.id)}
                          onChange={(e) => change((prev) => ({ categoryIds: e.target.checked ? [...prev.categoryIds, c.id] : prev.categoryIds.filter((x) => x !== c.id) }))}
                        />
                        {c.name}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">Tags</span>
              <TagInput value={f.tags} onChange={(tags) => change({ tags })} disabled={ro} />
            </div>
          </Card>

          {id && (
            <Card className="flex flex-col gap-2 p-4">
              <Button tone="secondary" size="sm" onClick={() => setShowRevisions(true)}>Revisions</Button>
              {(staff || (!live && canEdit)) && (
                <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setConfirm("delete")}>Delete post</Button>
              )}
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this post?"
        message={<><strong>{f.title || "Untitled"}</strong> and its revisions will be deleted permanently.{live && " It disappears from the website straight away."}</>}
        confirmLabel="Delete post"
        busy={busy === "draft"}
        onConfirm={remove}
        onCancel={() => setConfirm("")}
      />
      <ConfirmDialog
        open={confirm === "unpublish"}
        title="Unpublish this post?"
        message="It will be taken off the website and become a draft again. You can publish it again later."
        confirmLabel="Unpublish"
        busy={busy === "unpublish"}
        onConfirm={async () => {
          if (await save("draft", "unpublish")) setConfirm("");
        }}
        onCancel={() => setConfirm("")}
      />
      <ConfirmDialog
        open={Boolean(leaveTo)}
        title="Leave without saving?"
        message="You have changes that are not saved yet. If you leave now they will be lost."
        confirmLabel="Leave"
        onConfirm={() => {
          const to = leaveTo;
          setSavedRev(revRef.current);
          setLeaveTo("");
          router.push(to);
        }}
        onCancel={() => setLeaveTo("")}
      />
      {showRevisions && id && <RevisionsDialog postId={id} onClose={() => setShowRevisions(false)} onRestore={restore} canRestore={!ro} />}
    </>
  );
}

// ====================================================================== revisions
type RevRow = { id: number; title: string; saved_at: string; saved_by_name: string | null };

function RevisionsDialog({ postId, onClose, onRestore, canRestore }: {
  postId: number; onClose: () => void; onRestore: (r: { title: string; excerpt: string; content: TiptapJSON }) => void; canRestore: boolean;
}) {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<RevRow[] | null>(null);
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    api<{ rows: RevRow[] }>(`/api/admin/posts/${postId}/revisions`).then((d) => setRows(d.rows)).catch((e) => toast((e as Error).message, "error"));
  }, [api, postId, toast]);

  const pick = async (rid: number) => {
    setLoading(rid);
    try {
      const d = await api<{ revision: { title: string; excerpt: string; content: TiptapJSON } }>(`/api/admin/posts/${postId}/revisions/${rid}`);
      onRestore(d.revision);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open title="Revisions" onClose={onClose} footer={<Button tone="secondary" onClick={onClose}>Close</Button>}>
      <p className="mb-3 text-[13px] text-[#667085]">A copy is kept each time the post is saved by hand or published (the last 30). Loading one replaces the title, excerpt and body in the editor; nothing changes until you save.</p>
      {!rows ? (
        <p className="py-6 text-center text-[14px] text-[#667085]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[#667085]">No revisions yet. They are made when you click Save draft, Publish or Update.</p>
      ) : (
        <ul className="divide-y divide-[#f2f4f7]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#101828]">{r.title || "Untitled"}</p>
                <p className="text-[12px] text-[#667085]">{fmtDate(r.saved_at)}{r.saved_by_name ? ` · ${r.saved_by_name}` : ""}</p>
              </div>
              {canRestore && <Button tone="secondary" size="sm" busy={loading === r.id} onClick={() => pick(r.id)}>Load</Button>}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
