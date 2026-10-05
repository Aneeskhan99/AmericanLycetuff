"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminProvider";
import { Button, Card, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, PageHeader, Pagination, SearchBox, slugify, Table, Toolbar } from "../ui";

type Cat = { id: number; name: string; slug: string; sort: number; posts: number };
type Tag = { id: number; name: string; slug: string; posts: number };
type TagRes = { rows: Tag[]; total: number; page: number; pageSize: number };

export default function CategoriesScreen() {
  return (
    <>
      <PageHeader
        title="Categories & tags"
        description={<>Group news posts. Each category has its own page on the website (<span className="font-mono text-[13px]">/news/category/…</span>).</>}
        actions={
          <Link href="/admin/news" className="inline-flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">
            All posts
          </Link>
        }
      />
      <div className="flex flex-col gap-8">
        <Categories />
        <Tags />
      </div>
    </>
  );
}

// ====================================================================== categories
function Categories() {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<Cat[] | null>(null);
  const [editing, setEditing] = useState<Cat | "new" | null>(null);
  const [deleting, setDeleting] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await api<{ rows: Cat[] }>("/api/admin/categories")).rows);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [api, toast]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const move = async (i: number, dir: -1 | 1) => {
    if (!rows) return;
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    try {
      await api("/api/admin/categories", { method: "PUT", body: { order: next.map((r) => r.id) } });
      toast("Order saved");
    } catch (e) {
      toast((e as Error).message, "error");
      void load();
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/categories/${deleting.id}`, { method: "DELETE", body: { force: deleting.posts > 0 } });
      toast(`“${deleting.name}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="cats-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="cats-title" className="text-[17px] font-semibold text-[#101828]">Categories</h2>
          <p className="text-[13px] text-[#667085]">The order here is the order of the category links on the News page.</p>
        </div>
        <Button onClick={() => setEditing("new")}>Add category</Button>
      </div>
      <Card>
        {!rows ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty title="No categories yet">Add one to start grouping posts.</Empty>
        ) : (
          <Table
            head={
              <>
                <th className="w-[96px]">Order</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Posts</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {rows.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <div className="flex gap-1">
                    <Button tone="ghost" size="sm" className="px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${c.name} up`}>↑</Button>
                    <Button tone="ghost" size="sm" className="px-2" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${c.name} down`}>↓</Button>
                  </div>
                </td>
                <td className="font-medium text-[#101828]">{c.name}</td>
                <td className="font-mono text-[13px] text-[#475467]">{c.slug}</td>
                <td className="text-[13px]">{c.posts}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <a href={`/news/category/${c.slug}`} target="_blank" rel="noopener noreferrer" className="relative inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[#344054] hover:bg-[#f2f4f7]">
                      Open<span className="sr-only"> {c.name} on the website (new tab)</span>
                    </a>
                    <Button tone="ghost" size="sm" onClick={() => setEditing(c)}>Rename</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(c)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {editing && <CategoryDialog key={editing === "new" ? "new" : editing.id} row={editing === "new" ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load(); }} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this category?"
        message={
          deleting && deleting.posts > 0 ? (
            <>
              <strong>{deleting.name}</strong> is used by <strong>{deleting.posts} post{deleting.posts === 1 ? "" : "s"}</strong>. Those posts stay published but lose this category, and its page on the website will stop working.
            </>
          ) : (
            <><strong>{deleting?.name}</strong> is not used by any post. Its page on the website will stop working.</>
          )
        }
        confirmLabel={deleting && deleting.posts > 0 ? "Delete anyway" : "Delete category"}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

function CategoryDialog({ row, onClose, onDone }: { row: Cat | null; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [name, setName] = useState(row?.name ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(row));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { name, slug: slugTouched ? slug : slugify(name) };
      if (row) await api(`/api/admin/categories/${row.id}`, { method: "PATCH", body });
      else await api("/api/admin/categories", { body });
      toast(row ? "Category saved" : `“${name.trim()}” added`);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title={row ? `Rename ${row.name}` : "Add category"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cat-form" busy={busy}>{row ? "Save" : "Add category"}</Button>
        </>
      }
    >
      <form id="cat-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Name" htmlFor="cat-name" required>
          <Input id="cat-name" value={name} maxLength={60} autoFocus onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug" htmlFor="cat-slug" hint={row ? "Changing the slug changes the category page's web address." : "Used in the web address: /news/category/<slug>"}>
          <Input
            id="cat-slug"
            value={slugTouched ? slug : slugify(name)}
            maxLength={60}
            spellCheck={false}
            className="font-mono text-[13px]"
            onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); setSlugTouched(true); }}
          />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}

// ====================================================================== tags
function Tags() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TagRes | null>(null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<TagRes>(`/api/admin/tags?${new URLSearchParams({ search, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [api, toast, search, page]);
  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/tags/${deleting.id}`, { method: "DELETE" });
      toast(`Tag “${deleting.name}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="tags-title">
      <div className="mb-3">
        <h2 id="tags-title" className="text-[17px] font-semibold text-[#101828]">Tags</h2>
        <p className="text-[13px] text-[#667085]">Tags are created from the post editor. Rename or remove them here.</p>
      </div>
      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search tags" />
        </Toolbar>
        {!data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data.rows.length === 0 ? (
          <Empty title={search ? "No tags found" : "No tags yet"}>{search ? "Try a different search." : "Add tags to a post in the editor."}</Empty>
        ) : (
          <Table head={<><th>Name</th><th>Slug</th><th>Posts</th><th className="text-right">Actions</th></>}>
            {data.rows.map((t) => (
              <tr key={t.id}>
                <td className="font-medium text-[#101828]">{t.name}</td>
                <td className="font-mono text-[13px] text-[#475467]">{t.slug}</td>
                <td className="text-[13px]">{t.posts}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing(t)}>Rename</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(t)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && <TagDialog key={editing.id} row={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load(); }} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this tag?"
        message={<><strong>{deleting?.name}</strong> will be removed{deleting && deleting.posts > 0 ? ` from ${deleting.posts} post${deleting.posts === 1 ? "" : "s"}` : ""}. The posts themselves are not changed otherwise.</>}
        confirmLabel="Delete tag"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

function TagDialog({ row, onClose, onDone }: { row: Tag; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [name, setName] = useState(row.name);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(`/api/admin/tags/${row.id}`, { method: "PATCH", body: { name } });
      toast("Tag renamed");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title={`Rename tag ${row.name}`}
      onClose={onClose}
      footer={<><Button tone="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="tag-form" busy={busy}>Save</Button></>}
    >
      <form id="tag-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Name" htmlFor="tag-name" required>
          <Input id="tag-name" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}
