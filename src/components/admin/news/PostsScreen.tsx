"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { Badge, Button, Card, ConfirmDialog, Empty, fmtDate, PageHeader, Pagination, SearchBox, Select, Table, Toolbar } from "../ui";
import { STATE_LABEL, STATE_TONE, type Meta, type PostState } from "./types";

type Row = {
  id: number; title: string; slug: string; status: PostState; state: PostState; published_at: string | null; updated_at: string;
  author_id: number | null; author_name: string | null; categories: { id: number; name: string }[];
};
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number };

export default function PostsScreen() {
  const { api, toast, user } = useAdmin();
  const staff = user.role !== "author";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Meta>("/api/admin/posts/meta").then(setMeta).catch((e) => toast((e as Error).message, "error"));
  }, [api, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ search, status, category, author, page: String(page) });
    try {
      setData(await api<ListRes>(`/api/admin/posts?${p}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, status, category, author, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/posts/${deleting.id}`, { method: "DELETE" });
      toast(`“${deleting.title || "Untitled"}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const canDelete = (r: Row) => staff || (r.author_id === user.id && r.status === "draft");
  const filtered = Boolean(search || status || category || author);

  return (
    <>
      <PageHeader
        title="News & Blog"
        description={staff ? "Write, schedule and publish school news." : "Write news posts. An editor publishes them for you."}
        actions={
          <>
            {staff && (
              <Link href="/admin/news/categories" className="inline-flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">
                Categories &amp; tags
              </Link>
            )}
            <Link href="/admin/news/new" className="inline-flex h-10 items-center rounded-md bg-[#1a2d59] px-4 text-[14px] font-medium text-white hover:bg-[#13224a]">
              New post
            </Link>
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search title, slug or excerpt" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-36">
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </Select>
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category" className="sm:w-44">
              <option value="">All categories</option>
              {meta?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {staff && (
              <Select value={author} onChange={(e) => { setAuthor(e.target.value); setPage(1); }} aria-label="Filter by author" className="col-span-2 sm:w-44">
                <option value="">All authors</option>
                {meta?.users.map((u) => <option key={u.id} value={u.id}>{u.name}{u.disabled ? " (disabled)" : ""}</option>)}
              </Select>
            )}
          </div>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          filtered ? (
            <Empty title="No posts found">Try a different search or filter.</Empty>
          ) : (
            <Empty title="No posts yet">
              <p>Write the first news post for the website.</p>
              <Link href="/admin/news/new" className="mt-4 inline-flex h-10 items-center rounded-md bg-[#1a2d59] px-4 text-[14px] font-medium text-white hover:bg-[#13224a]">New post</Link>
            </Empty>
          )
        ) : (
          <Table
            head={
              <>
                <th>Title</th>
                <th>Author</th>
                <th>Categories</th>
                <th>Status</th>
                <th>Publish date</th>
                <th>Updated</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {data?.rows.map((r) => (
              <tr key={r.id}>
                <td className="max-w-[340px]">
                  <Link href={`/admin/news/${r.id}`} className="font-medium text-[#101828] hover:underline">
                    {r.title || <span className="italic text-[#98a2b3]">Untitled</span>}
                  </Link>
                  <div className="truncate font-mono text-[12px] text-[#667085]">/news/{r.slug}</div>
                </td>
                <td className="whitespace-nowrap text-[13px]">{r.author_name ?? "—"}</td>
                <td className="text-[13px]">{r.categories.length ? r.categories.map((c) => c.name).join(", ") : <span className="text-[#98a2b3]">—</span>}</td>
                <td><Badge tone={STATE_TONE[r.state]}>{STATE_LABEL[r.state]}</Badge></td>
                <td className="whitespace-nowrap text-[13px]">{r.published_at ? fmtDate(r.published_at) : <span className="text-[#98a2b3]">—</span>}</td>
                <td className="whitespace-nowrap text-[13px]">{fmtDate(r.updated_at)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/news/${r.id}`} className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[#344054] hover:bg-[#f2f4f7]">
                      {staff || r.status === "draft" ? "Edit" : "View"}
                    </Link>
                    {r.state === "published" && (
                      <a href={`/news/${r.slug}`} target="_blank" rel="noopener noreferrer" className="relative inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[#344054] hover:bg-[#f2f4f7]">
                        Open<span className="sr-only"> on the website (new tab)</span>
                      </a>
                    )}
                    {canDelete(r) && (
                      <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(r)}>Delete</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this post?"
        message={
          <>
            <strong>{deleting?.title || "Untitled"}</strong> will be deleted permanently, with its saved revisions.
            {deleting && deleting.state !== "draft" && " It will disappear from the website straight away."}
          </>
        }
        confirmLabel="Delete post"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
