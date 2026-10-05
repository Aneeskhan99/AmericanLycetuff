"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminProvider";
import MediaPicker, { fileSize } from "../MediaPicker";
import { move, ReorderList, type ReorderItem } from "../media/Reorder";
import { ACCEPT, UploadList, useUploader } from "../media/upload";
import { Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, fmtDate, Input, PageHeader, Pagination, SearchBox, Select, Table, Toolbar } from "../ui";

type FileRef = { id: number; url: string; name: string; size: number; mime: string; kind: "image" | "document" };
type Row = { id: number; title: string; category: string; visibility: "public" | "hidden"; sort: number; updated_at: string; file: FileRef };
type Category = { id: number; name: string; count: number };
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number; categories: Category[] };

const ext = (name: string) => (name.split(".").pop() ?? "").toUpperCase();

function FileIcon({ name }: { name: string }) {
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fef3f2] text-[11px] font-semibold text-[#b42318]">{ext(name).slice(0, 4)}</span>;
}

export default function DownloadsScreen() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteFile, setDeleteFile] = useState(false);
  const [managing, setManaging] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/downloads?${new URLSearchParams({ search, category, visibility, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, category, visibility, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const toggle = async (r: Row) => {
    try {
      await api(`/api/admin/downloads/${r.id}`, { method: "PATCH", body: { visibility: r.visibility === "public" ? "hidden" : "public" } });
      toast(r.visibility === "public" ? `“${r.title}” is now hidden` : `“${r.title}” is now public`);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const r = await api<{ fileDeleted: boolean }>(`/api/admin/downloads/${deleting.id}${deleteFile ? "?deleteFile=1" : ""}`, { method: "DELETE" });
      toast(deleteFile && !r.fileDeleted ? "Download removed. The file is used elsewhere, so it was kept in the media library." : "Download removed");
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const categories = data?.categories ?? [];
  const filtered = Boolean(search || category || visibility);

  return (
    <>
      <PageHeader
        title="Downloads"
        description="Forms and documents parents can download from the Downloads page, grouped by category."
        actions={
          <>
            <Button tone="secondary" onClick={() => setManaging(true)}>Categories</Button>
            <Button tone="secondary" onClick={() => setReordering(true)} disabled={!data?.total && !filtered}>Reorder</Button>
            <Button onClick={() => setEditing("new")}>Add download</Button>
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search title or file name" />
          <div className="flex gap-2">
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category" className="sm:w-48">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
            <Select value={visibility} onChange={(e) => { setVisibility(e.target.value); setPage(1); }} aria-label="Filter by visibility" className="sm:w-40">
              <option value="">Any visibility</option>
              <option value="public">Public</option>
              <option value="hidden">Hidden</option>
            </Select>
          </div>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          <Empty title={filtered ? "No downloads match" : "No downloads yet"}>
            {filtered ? "Try a different search or filter." : <Button className="mt-3" onClick={() => setEditing("new")}>Add the first download</Button>}
          </Empty>
        ) : (
          <Table head={<><th>Title</th><th>Category</th><th>File</th><th>Visibility</th><th>Updated</th><th className="text-right">Actions</th></>}>
            {data?.rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button type="button" onClick={() => setEditing(r)} className="flex items-center gap-3 text-left">
                    <FileIcon name={r.file.name} />
                    <span className="font-medium text-[#101828] hover:underline">{r.title}</span>
                  </button>
                </td>
                <td className="text-[13px]">{r.category}</td>
                <td className="text-[13px]">
                  <a href={r.file.url} target="_blank" rel="noopener noreferrer" className="block max-w-[220px] truncate text-[#1a2d59] hover:underline">{r.file.name}</a>
                  <span className="text-[12px] text-[#667085]">{fileSize(r.file.size)}</span>
                </td>
                <td>{r.visibility === "public" ? <Badge tone="green">Public</Badge> : <Badge>Hidden</Badge>}</td>
                <td className="whitespace-nowrap text-[13px]">{fmtDate(r.updated_at)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing(r)}>Edit</Button>
                    <Button tone="ghost" size="sm" onClick={() => toggle(r)}>{r.visibility === "public" ? "Hide" : "Make public"}</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => { setDeleteFile(false); setDeleting(r); }}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && (
        <DownloadDialog
          key={editing === "new" ? "new" : editing.id}
          row={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); void load(); }}
        />
      )}
      {managing && <CategoriesDialog onClose={() => { setManaging(false); void load(); }} />}
      {reordering && <ReorderDialog categories={categories} initial={category} onClose={() => setReordering(false)} onDone={() => { setReordering(false); void load(); }} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this download?"
        message={
          <div className="flex flex-col gap-3">
            <p><strong>{deleting?.title}</strong> will be removed from the Downloads page. This cannot be undone; to take it off the page for now, use “Hide” instead.</p>
            <Checkbox
              label="Also delete the file from the media library"
              hint="Only if nothing else uses it. Otherwise it is kept."
              checked={deleteFile}
              onChange={setDeleteFile}
            />
          </div>
        }
        confirmLabel="Delete"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ add / edit
function DownloadDialog({ row, categories, onClose, onDone }: { row: Row | null; categories: Category[]; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const names = categories.map((c) => c.name);
  const [f, setF] = useState(() => ({
    title: row?.title ?? "",
    category: row?.category ?? names[0] ?? "Other",
    visibility: row?.visibility ?? ("public" as "public" | "hidden"),
    file: (row?.file ?? null) as FileRef | null,
  }));
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const uploader = useUploader({
    kind: "document",
    onDone: ([m]) => {
      if (!m) return;
      setF((v) => ({ ...v, file: m, title: v.title || m.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }));
    },
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const category = addingCategory ? newCategory.trim() : f.category;
    if (!f.title.trim()) return setError("Title is required.");
    if (!category) return setError("Choose or type a category.");
    if (!f.file) return setError("Choose or upload the file.");
    setBusy(true);
    try {
      const payload = { title: f.title, category, visibility: f.visibility, mediaId: f.file.id };
      if (row) await api(`/api/admin/downloads/${row.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/downloads", { body: payload });
      toast(row ? "Saved" : "Download added");
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
      wide
      title={row ? "Edit download" : "Add download"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="download-form" busy={busy} disabled={uploader.busy}>{row ? "Save changes" : "Add download"}</Button>
        </>
      }
    >
      <form id="download-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#344054]">File <span className="text-[#d31245]">*</span></span>
          <div className="flex flex-col gap-3 rounded-lg border border-[#eaecf0] bg-[#f9fafb] p-3 sm:flex-row sm:items-center">
            {f.file ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <FileIcon name={f.file.name} />
                <span className="min-w-0">
                  <a href={f.file.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-medium text-[#1a2d59] hover:underline">{f.file.name}</a>
                  <span className="text-[12px] text-[#667085]">{fileSize(f.file.size)}</span>
                </span>
              </div>
            ) : (
              <span className="flex-1 text-[13px] text-[#667085]">No file chosen. PDF, Word, Excel or PowerPoint, up to 25 MB.</span>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-[#d0d5dd] bg-white px-3 text-[13px] font-medium text-[#1d2939] hover:bg-[#f2f4f7] focus-within:outline-2 focus-within:outline-[#1a2d59]">
                Upload
                <input
                  type="file"
                  accept={ACCEPT.document}
                  className="sr-only"
                  data-testid="download-upload"
                  onChange={(e) => { void uploader.add(Array.from(e.target.files ?? []).slice(0, 1)); e.target.value = ""; }}
                />
              </label>
              <Button type="button" tone="secondary" size="sm" onClick={() => setPicking(true)}>{f.file ? "Replace from library" : "Choose from library"}</Button>
            </div>
          </div>
          <UploadList items={uploader.items} onClear={uploader.clear} />
        </div>

        <Field label="Title" htmlFor="dl-title" required hint="As parents will see it, for example “Fee structure 2026–27”.">
          <Input id="dl-title" value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>

        <Field label="Category" htmlFor="dl-cat" required>
          {addingCategory ? (
            <div className="flex gap-2">
              <Input id="dl-cat" value={newCategory} maxLength={60} placeholder="New category name" onChange={(e) => setNewCategory(e.target.value)} autoFocus />
              <Button type="button" tone="secondary" onClick={() => setAddingCategory(false)}>Cancel</Button>
            </div>
          ) : (
            <Select
              id="dl-cat"
              value={f.category}
              onChange={(e) => (e.target.value === "__new" ? setAddingCategory(true) : setF({ ...f, category: e.target.value }))}
            >
              {!names.some((n) => n.toLowerCase() === f.category.toLowerCase()) && <option value={f.category}>{f.category}</option>}
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
              <option value="__new">+ New category…</option>
            </Select>
          )}
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-[#344054]">Visibility</legend>
          {([["public", "Public", "Listed on the Downloads page."], ["hidden", "Hidden", "Kept here, not shown on the site."]] as const).map(([v, label, hint]) => (
            <label key={v} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${f.visibility === v ? "border-[#1a2d59] bg-[#eff4ff]" : "border-[#d0d5dd]"}`}>
              <input type="radio" name="visibility" value={v} checked={f.visibility === v} onChange={() => setF({ ...f, visibility: v })} className="mt-0.5 accent-[#1a2d59]" />
              <span><span className="block text-[14px] font-medium">{label}</span><span className="block text-[12px] text-[#667085]">{hint}</span></span>
            </label>
          ))}
        </fieldset>
        <ErrorNote>{error}</ErrorNote>
      </form>
      <MediaPicker
        open={picking}
        kind="document"
        onClose={() => setPicking(false)}
        onPick={([m]) => {
          setPicking(false);
          if (m) setF((v) => ({ ...v, file: m, title: v.title || m.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }));
        }}
      />
    </Dialog>
  );
}

// ------------------------------------------------------------------ categories
function CategoriesDialog({ onClose }: { onClose: () => void }) {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<Category[] | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await api<{ rows: Category[] }>("/api/admin/downloads/categories")).rows);
      setOrderDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      toast(ok);
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open wide title="Download categories" onClose={onClose} footer={<Button tone="secondary" onClick={onClose}>Done</Button>}>
      <p className="mb-3 text-[13px] text-[#667085]">The groups on the Downloads page, in this order. A category can only be deleted when no file uses it.</p>
      {!rows ? (
        <p className="text-[14px] text-[#667085]">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-1.5" data-testid="category-list">
          {rows.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eaecf0] px-3 py-2">
              {renaming?.id === c.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => { e.preventDefault(); void run(() => api(`/api/admin/downloads/categories/${c.id}`, { method: "PATCH", body: { name: renaming.name } }), "Category renamed").then((ok) => ok && setRenaming(null)); }}
                >
                  <Input value={renaming.name} maxLength={60} onChange={(e) => setRenaming({ id: c.id, name: e.target.value })} aria-label="Category name" autoFocus className="h-8" />
                  <Button type="submit" size="sm" busy={busy}>Save</Button>
                  <Button type="button" tone="ghost" size="sm" onClick={() => setRenaming(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-[14px] font-medium">{c.name}</span>
                  <span className="text-[12px] text-[#667085]">{c.count} file{c.count === 1 ? "" : "s"}</span>
                  <Button tone="ghost" size="sm" disabled={i === 0} aria-label={`Move ${c.name} up`} onClick={() => { setRows(move(rows, i, i - 1)); setOrderDirty(true); }}>↑</Button>
                  <Button tone="ghost" size="sm" disabled={i === rows.length - 1} aria-label={`Move ${c.name} down`} onClick={() => { setRows(move(rows, i, i + 1)); setOrderDirty(true); }}>↓</Button>
                  <Button tone="ghost" size="sm" onClick={() => setRenaming({ id: c.id, name: c.name })}>Rename</Button>
                  <Button
                    tone="ghost"
                    size="sm"
                    className="text-[#b42318]"
                    disabled={c.count > 0 || busy}
                    title={c.count > 0 ? "Move or delete its files first" : undefined}
                    onClick={() => void run(() => api(`/api/admin/downloads/categories/${c.id}`, { method: "DELETE" }), `“${c.name}” deleted`)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {orderDirty && rows && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" busy={busy} onClick={() => void run(() => api("/api/admin/downloads/categories/order", { body: { ids: rows.map((r) => r.id) } }), "Order saved")}>Save order</Button>
        </div>
      )}
      <form
        className="mt-4 flex gap-2 border-t border-[#eaecf0] pt-4"
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) void run(() => api("/api/admin/downloads/categories", { body: { name } }), "Category added").then((ok) => ok && setName("")); }}
      >
        <Input value={name} maxLength={60} placeholder="New category, e.g. Holiday homework" onChange={(e) => setName(e.target.value)} aria-label="New category name" />
        <Button type="submit" busy={busy} disabled={!name.trim()}>Add</Button>
      </form>
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ reorder
function ReorderDialog({ categories, initial, onClose, onDone }: { categories: Category[]; initial: string; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const usable = categories.filter((c) => c.count > 0);
  const [category, setCategory] = useState(initial && usable.some((c) => c.name === initial) ? initial : usable[0]?.name ?? "");
  const [items, setItems] = useState<ReorderItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category) return;
    let live = true;
    api<ListRes>(`/api/admin/downloads?all=1&category=${encodeURIComponent(category)}`)
      .then((d) => live && setItems(d.rows.map((r) => ({ id: r.id, title: r.title, sub: `${r.file.name}${r.visibility === "hidden" ? " · hidden" : ""}`, thumb: <FileIcon name={r.file.name} /> }))))
      .catch((e) => setError((e as Error).message));
    return () => { live = false; };
  }, [api, category]);

  const save = async () => {
    if (!items) return;
    setBusy(true);
    try {
      await api("/api/admin/downloads/order", { body: { ids: items.map((i) => i.id) } });
      toast("Order saved");
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open wide title="Reorder downloads" onClose={onClose} footer={<><Button tone="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!items?.length} onClick={save}>Save order</Button></>}>
      {usable.length === 0 ? (
        <p className="text-[14px] text-[#667085]">Add some downloads first.</p>
      ) : (
        <>
          <Field label="Category" htmlFor="ro-cat" hint="Files are ordered inside their category. To order the categories, use Categories.">
            <Select id="ro-cat" value={category} onChange={(e) => { setItems(null); setCategory(e.target.value); }}>
              {usable.map((c) => <option key={c.id} value={c.name}>{c.name} ({c.count})</option>)}
            </Select>
          </Field>
          <div className="mt-4">{items ? <ReorderList items={items} onChange={setItems} /> : <p className="text-[14px] text-[#667085]">Loading…</p>}</div>
        </>
      )}
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Dialog>
  );
}
