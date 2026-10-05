"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { thumbUrl } from "../MediaPicker";
import { ReorderList, Thumb, type ReorderItem } from "../media/Reorder";
import { Badge, Button, Card, ConfirmDialog, Dialog, Empty, ErrorNote, PageHeader, Pagination, SearchBox, Select, Table, Toolbar } from "../ui";
import AlbumDialog, { CATEGORIES, categoryLabel, type Album } from "./AlbumDialog";

type ListRes = { rows: Album[]; total: number; page: number; pageSize: number };

export function fmtDay(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function AlbumsScreen() {
  const { api, toast } = useAdmin();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Album | "new" | null>(null);
  const [deleting, setDeleting] = useState<Album | null>(null);
  const [reordering, setReordering] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/albums?${new URLSearchParams({ search, category, status, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, category, status, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/albums/${deleting.id}`, { method: "DELETE" });
      toast(`“${deleting.title}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const filtered = Boolean(search || category || status);

  return (
    <>
      <PageHeader
        title="Gallery albums"
        description={<>Albums appear on the <Link href="/gallery#albums" target="_blank" className="underline">Gallery page</Link>, and their photos join the matching category tab. The designed photos at the top of the page are edited in Pages → Gallery.</>}
        actions={
          <>
            <Button tone="secondary" onClick={() => setReordering(true)} disabled={!data}>Reorder</Button>
            <Button onClick={() => setEditing("new")}>New album</Button>
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search albums" />
          <div className="flex gap-2">
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category" className="sm:w-52">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="none">No category</option>
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-36">
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </Select>
          </div>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          <Empty title={filtered ? "No albums match" : "No albums yet"}>
            {filtered ? "Try a different search or filter." : <Button className="mt-3" onClick={() => setEditing("new")}>Create the first album</Button>}
          </Empty>
        ) : (
          <Table head={<><th>Album</th><th>Category</th><th>Date</th><th>Photos</th><th>Status</th><th className="text-right">Actions</th></>}>
            {data?.rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/gallery/${a.id}`} className="flex items-center gap-3">
                    <Thumb src={a.cover ? thumbUrl(a.cover) : null} label={a.title} />
                    <span>
                      <span className="block font-medium text-[#101828] hover:underline">{a.title}</span>
                      <span className="block font-mono text-[12px] text-[#667085]">/gallery/{a.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="text-[13px]">{categoryLabel(a.category) || <span className="text-[#98a2b3]">None</span>}</td>
                <td className="whitespace-nowrap text-[13px]">{fmtDay(a.event_date) || <span className="text-[#98a2b3]">No date</span>}</td>
                <td className="text-[13px] tabular-nums">{a.count}</td>
                <td>
                  {!a.published ? <Badge>Hidden</Badge> : a.count === 0 ? <Badge tone="amber">No photos yet</Badge> : <Badge tone="green">Published</Badge>}
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => router.push(`/admin/gallery/${a.id}`)}>Photos</Button>
                    <Button tone="ghost" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(a)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && (
        <AlbumDialog
          key={editing === "new" ? "new" : editing.id}
          album={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={(id) => {
            const wasNew = editing === "new";
            setEditing(null);
            if (wasNew) router.push(`/admin/gallery/${id}`);
            else void load();
          }}
        />
      )}
      {reordering && <ReorderAlbums onClose={() => setReordering(false)} onDone={() => { setReordering(false); void load(); }} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this album?"
        message={<>
          <strong>{deleting?.title}</strong> and its list of {deleting?.count ?? 0} photo{deleting?.count === 1 ? "" : "s"} will be removed from the gallery.
          The images themselves stay in the media library (delete them there if no longer needed). This cannot be undone.
        </>}
        confirmLabel="Delete album"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function ReorderAlbums({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [items, setItems] = useState<ReorderItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<ListRes>("/api/admin/albums?all=1")
      .then((d) => setItems(d.rows.map((a) => ({
        id: a.id, title: a.title,
        sub: [categoryLabel(a.category), fmtDay(a.event_date), `${a.count} photos`, a.published ? "" : "hidden"].filter(Boolean).join(" · "),
        thumb: <Thumb src={a.cover ? thumbUrl(a.cover) : null} label={a.title} />,
      }))))
      .catch((e) => setError((e as Error).message));
  }, [api]);

  const save = async () => {
    if (!items) return;
    setBusy(true);
    try {
      await api("/api/admin/albums/order", { body: { ids: items.map((i) => i.id) } });
      toast("Order saved");
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open wide title="Reorder albums" onClose={onClose} footer={<><Button tone="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!items?.length} onClick={save}>Save order</Button></>}>
      <p className="mb-3 text-[13px] text-[#667085]">The order of the albums on the gallery page. Drag the handle or use the arrows.</p>
      {items ? items.length ? <ReorderList items={items} onChange={setItems} /> : <p className="text-[14px] text-[#667085]">No albums yet.</p> : <p className="text-[14px] text-[#667085]">Loading…</p>}
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Dialog>
  );
}
