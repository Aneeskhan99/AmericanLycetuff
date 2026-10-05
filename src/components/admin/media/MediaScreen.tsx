"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { fileSize, thumbUrl, type PickedMedia } from "../MediaPicker";
import { Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, fmtDate, Input, PageHeader, SearchBox, Select, Table, Toolbar } from "../ui";
import { ACCEPT, DropZone, UploadList, useUploader } from "./upload";

type Row = {
  id: number; path: string; original_name: string; mime: string; kind: "image" | "document"; size: number;
  width: number | null; height: number | null; alt: string; title: string; created_at: string;
  uses: number; uploader: string | null; ref: PickedMedia;
};
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number };
type Usage = { entity: string; entity_id: string; field: string };

const PAGE_SIZE = 40;
const ext = (name: string) => (name.split(".").pop() ?? "").toUpperCase();

/** Human label + admin link for a media_usage row. */
function usageLabel(u: Usage): { text: string; href?: string } {
  const field = u.field ? ` (${u.field.replace(/[._]/g, " ")})` : "";
  switch (u.entity) {
    case "faculty": return { text: `Faculty & staff profile #${u.entity_id}${field}`, href: "/admin/faculty" };
    case "album": return { text: `Gallery album #${u.entity_id}${field}`, href: `/admin/gallery/${u.entity_id}` };
    case "download": return { text: `Download #${u.entity_id}${field}`, href: "/admin/downloads" };
    case "page": return { text: `Page “${u.entity_id}”${field}`, href: `/admin/pages/${encodeURIComponent(u.entity_id)}` };
    case "post": return { text: `News post #${u.entity_id}${field}`, href: `/admin/news/${u.entity_id}` };
    case "event": return { text: `Event #${u.entity_id}${field}`, href: `/admin/events/${u.entity_id}` };
    case "settings": return { text: `Site settings${field}`, href: "/admin/settings" };
    default: return { text: `${u.entity} ${u.entity_id}${field}` };
  }
}

export default function MediaScreen() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [unused, setUnused] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Row | null>(null);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ search, page: String(p), pageSize: String(PAGE_SIZE), ...(kind ? { kind } : {}), ...(unused ? { unused: "1" } : {}) });
      const d = await api<ListRes>(`/api/admin/media?${qs}`);
      setRows((cur) => (append ? [...cur, ...d.rows.filter((r) => !cur.some((c) => c.id === r.id))] : d.rows));
      setTotal(d.total);
      setPage(p);
      setLoaded(true);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, kind, unused]);

  useEffect(() => {
    const t = setTimeout(() => void load(1, false), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const uploader = useUploader({
    onDone: (media) => {
      toast(`${media.length} file${media.length === 1 ? "" : "s"} uploaded`);
      void load(1, false);
    },
  });

  return (
    <>
      <PageHeader
        title="Media library"
        description="Every image and document uploaded to the site. Files that are in use cannot be deleted."
      />

      <div className="mb-4 flex flex-col gap-3">
        <DropZone
          accept={ACCEPT.any}
          label="Drag images or documents here to upload"
          hint="JPG, PNG, WebP or GIF up to 15 MB; PDF, Word, Excel or PowerPoint up to 25 MB. Up to 30 at a time."
          busy={uploader.busy}
          onFiles={(f) => void uploader.add(f.slice(0, 30))}
        />
        <UploadList items={uploader.items} onClear={uploader.clear} />
      </div>

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search name, alt text or title" />
          <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type" className="sm:w-40">
            <option value="">All files</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
          </Select>
          <Checkbox label="Unused only" checked={unused} onChange={setUnused} />
          <div className="flex gap-1 sm:ml-auto" role="group" aria-label="View">
            <Button tone={view === "grid" ? "primary" : "secondary"} size="sm" aria-pressed={view === "grid"} onClick={() => setView("grid")}>Grid</Button>
            <Button tone={view === "list" ? "primary" : "secondary"} size="sm" aria-pressed={view === "list"} onClick={() => setView("list")}>List</Button>
          </div>
        </Toolbar>

        {!loaded && loading ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty title={search || kind || unused ? "No files match" : "No files yet"}>
            {search || kind || unused ? "Try a different search or filter." : "Upload images and documents above."}
          </Empty>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-label="Files">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="group block w-full overflow-hidden rounded-lg border border-[#eaecf0] text-left hover:border-[#98a2b3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2d59]"
                >
                  <span className="relative flex aspect-square items-center justify-center bg-[#f2f4f7]">
                    {r.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl(r.ref)} alt={r.alt} className="absolute inset-0 size-full object-cover" loading="lazy" />
                    ) : (
                      <span className="rounded bg-white px-2 py-1 text-[12px] font-semibold text-[#b42318]">{ext(r.original_name)}</span>
                    )}
                    {r.uses === 0 && <span className="absolute left-1.5 top-1.5"><Badge tone="amber">Unused</Badge></span>}
                  </span>
                  <span className="block truncate px-2 pt-1.5 text-[12px] font-medium text-[#344054]">{r.original_name}</span>
                  <span className="block px-2 pb-1.5 text-[11px] text-[#98a2b3]">{fileSize(r.size)}{r.width ? ` · ${r.width}×${r.height}` : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Table head={<><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Used</th><th className="text-right">Actions</th></>}>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button type="button" onClick={() => setOpen(r)} className="flex items-center gap-3 text-left">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f2f4f7]">
                      {r.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl(r.ref)} alt="" className="size-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-[10px] font-semibold text-[#b42318]">{ext(r.original_name)}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[280px] truncate font-medium text-[#101828] hover:underline">{r.original_name}</span>
                      <span className="block max-w-[280px] truncate text-[12px] text-[#667085]">{r.alt || (r.kind === "image" ? "No alt text" : r.title)}</span>
                    </span>
                  </button>
                </td>
                <td className="text-[13px]">{r.kind === "image" ? `Image${r.width ? ` · ${r.width}×${r.height}` : ""}` : ext(r.original_name)}</td>
                <td className="whitespace-nowrap text-[13px]">{fileSize(r.size)}</td>
                <td className="whitespace-nowrap text-[13px]">{fmtDate(r.created_at)}<div className="text-[12px] text-[#667085]">{r.uploader ?? "Unknown"}</div></td>
                <td>{r.uses ? <Badge tone="blue">{r.uses} place{r.uses === 1 ? "" : "s"}</Badge> : <Badge tone="amber">Unused</Badge>}</td>
                <td className="text-right"><Button tone="ghost" size="sm" onClick={() => setOpen(r)}>Details</Button></td>
              </tr>
            ))}
          </Table>
        )}

        {rows.length > 0 && (
          <div className="flex flex-col items-center gap-2 border-t border-[#eaecf0] px-4 py-3 text-[13px] text-[#667085] sm:flex-row sm:justify-between">
            <span>Showing {rows.length} of {total}</span>
            {rows.length < total && <Button tone="secondary" size="sm" busy={loading} onClick={() => load(page + 1, true)}>Load more</Button>}
          </div>
        )}
      </Card>

      {open && (
        <MediaDetail
          key={open.id}
          row={open}
          onClose={() => setOpen(null)}
          onSaved={(alt, title) => {
            setRows((list) => list.map((r) => (r.id === open.id ? { ...r, alt, title } : r)));
          }}
          onDeleted={() => {
            setOpen(null);
            setRows((list) => list.filter((r) => r.id !== open.id));
            setTotal((t) => Math.max(0, t - 1));
          }}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------ detail
function MediaDetail({ row, onClose, onSaved, onDeleted }: { row: Row; onClose: () => void; onSaved: (alt: string, title: string) => void; onDeleted: () => void }) {
  const { api, toast } = useAdmin();
  const [alt, setAlt] = useState(row.alt);
  const [title, setTitle] = useState(row.title);
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<{ usage: Usage[] }>(`/api/admin/media/${row.id}`)
      .then((d) => setUsage(d.usage))
      .catch((e) => setError((e as Error).message));
  }, [api, row.id]);

  const absUrl = typeof window === "undefined" ? row.ref.url : new URL(row.ref.url, window.location.origin).toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absUrl);
      toast("Link copied");
    } catch {
      window.prompt("Copy this link:", absUrl);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/media/${row.id}`, { method: "PATCH", body: { alt, title } });
      onSaved(alt.trim(), title.trim());
      toast("Saved");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api(`/api/admin/media/${row.id}`, { method: "DELETE" });
      toast(`${row.original_name} deleted`);
      setConfirming(false);
      onDeleted();
    } catch (e) {
      setConfirming(false);
      setError(`${(e as Error).message}`);
      api<{ usage: Usage[] }>(`/api/admin/media/${row.id}`).then((d) => setUsage(d.usage)).catch(() => {});
    } finally {
      setDeleting(false);
    }
  };

  const used = (usage?.length ?? row.uses) > 0;

  return (
    <>
      <Dialog
        open
        wide
        title="File details"
        onClose={onClose}
        footer={
          <>
            <Button tone="danger" className="mr-auto" disabled={used || usage === null} onClick={() => setConfirming(true)}>Delete</Button>
            <Button tone="secondary" onClick={onClose}>Close</Button>
            <Button busy={busy} onClick={save}>Save changes</Button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-3">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[#eaecf0] bg-[#f9fafb]">
              {row.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.ref.url} srcSet={row.ref.srcSet || undefined} sizes="280px" alt={row.alt} className="absolute inset-0 size-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded bg-white px-3 py-2 text-[18px] font-semibold text-[#b42318] shadow-sm">{ext(row.original_name)}</span>
                  <a href={row.ref.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#1a2d59] underline">Open file</a>
                </span>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-[#667085]">File</dt><dd className="break-all text-[#101828]">{row.original_name}</dd>
              <dt className="text-[#667085]">Type</dt><dd>{row.mime}</dd>
              <dt className="text-[#667085]">Size</dt><dd>{fileSize(row.size)}</dd>
              {row.width && <><dt className="text-[#667085]">Dimensions</dt><dd>{row.width} × {row.height} px</dd></>}
              <dt className="text-[#667085]">Uploaded</dt><dd>{fmtDate(row.created_at)}</dd>
              <dt className="text-[#667085]">By</dt><dd>{row.uploader ?? "Unknown"}</dd>
            </dl>
          </div>

          <div className="flex flex-col gap-4">
            {row.kind === "image" && (
              <Field label="Alt text" htmlFor="m-alt" hint="Describe the image for people who cannot see it. Used wherever the image appears.">
                <Input id="m-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
              </Field>
            )}
            <Field label="Title" htmlFor="m-title" hint="For your own reference in the library.">
              <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </Field>
            <Field label="Link to this file" htmlFor="m-url">
              <div className="flex gap-2">
                <Input id="m-url" value={absUrl} readOnly onFocus={(e) => e.target.select()} className="font-mono text-[12px]" />
                <Button type="button" tone="secondary" onClick={copy}>Copy</Button>
              </div>
            </Field>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-[#344054]">Where it is used</p>
              {usage === null ? (
                <p className="text-[13px] text-[#667085]">Checking…</p>
              ) : usage.length === 0 ? (
                <p className="text-[13px] text-[#667085]">Not used anywhere. You can delete it safely.</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-1 text-[13px]" data-testid="media-usage">
                    {usage.map((u, i) => {
                      const l = usageLabel(u);
                      return (
                        <li key={i} className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-[#1a2d59]" aria-hidden />
                          {l.href ? <Link href={l.href} className="text-[#1a2d59] underline-offset-2 hover:underline">{l.text}</Link> : l.text}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 rounded-md bg-[#fffaeb] px-3 py-2 text-[12px] text-[#b54708]">
                    This file can’t be deleted while it is in use, because those pages would show a broken image or link.
                    Remove or replace it in the places above first, then delete it here.
                  </p>
                </>
              )}
            </div>
            <ErrorNote>{error}</ErrorNote>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        title="Delete this file?"
        message={<><strong>{row.original_name}</strong> will be removed from the library and the server. This cannot be undone.</>}
        confirmLabel="Delete file"
        busy={deleting}
        onConfirm={del}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
