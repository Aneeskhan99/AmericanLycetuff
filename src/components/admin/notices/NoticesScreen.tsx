"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import MediaPicker, { fileSize } from "@/components/admin/MediaPicker";
import {
  Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, PageHeader, Pagination, SearchBox, Select, Table, Textarea, Toolbar,
} from "@/components/admin/ui";
import { fmtDay, todayPk } from "@/components/site/events/format";

type Status = "live" | "scheduled" | "expired" | "hidden";
type Row = {
  id: number; title: string; body: string; link_url: string; pinned_home: boolean; published: boolean;
  start_date: string; end_date: string | null; attachment_media_id: number | null; attachment_name: string | null; attachment_url: string | null;
  status: Status;
};
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number; barId: number | null };
type Attachment = { id: number; name: string; url: string; size?: number } | null;

const STATUS: Record<Status, { label: string; tone: "green" | "blue" | "gray" | "amber" }> = {
  live: { label: "Live", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  expired: { label: "Expired", tone: "amber" },
  hidden: { label: "Hidden", tone: "gray" },
};

const dates = (r: Pick<Row, "start_date" | "end_date">) =>
  r.end_date ? `${fmtDay(r.start_date)} – ${fmtDay(r.end_date)}` : `From ${fmtDay(r.start_date)}`;

export default function NoticesScreen() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ row: Row | null; key: number } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/notices?${new URLSearchParams({ search, status, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, status, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/notices/${deleting.id}`, { method: "DELETE" });
      toast(`“${deleting.title}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notices"
        description="Short notices for parents, listed on the Notices page between their start and end dates."
        actions={<Button onClick={() => setEditing({ row: null, key: Date.now() })}>Add notice</Button>}
      />

      <p className="mb-4 rounded-lg border border-[#d1e0ff] bg-[#f5f8ff] px-4 py-3 text-[13px] text-[#1a2d59]">
        <strong>Announcement bar:</strong> only one pinned notice is shown at a time, at the top of every page: the live pinned notice
        with the most recent start date. Pinned notices are listed first below, newest start date first. When none is live, the
        default announcement from Settings is shown instead.
      </p>

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search notices" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-40">
            <option value="">Any status</option>
            {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </Select>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          search || status ? <Empty title="No notices found">Try a different search or status.</Empty> : <Empty title="No notices yet">Add a notice to tell parents about closures, deadlines and changes.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Notice</th>
                <th>Dates</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {data?.rows.map((r) => (
              <tr key={r.id} data-testid="notice-row">
                <td className="max-w-[420px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setEditing({ row: r, key: Date.now() })} className="text-left font-medium text-[#101828] hover:underline">
                      {r.title}
                    </button>
                    {r.pinned_home && (data.barId === r.id ? <Badge tone="blue">Pinned · in the bar now</Badge> : <Badge>Pinned</Badge>)}
                  </div>
                  {r.body && <div className="line-clamp-1 text-[12px] text-[#667085]">{r.body}</div>}
                  {r.attachment_name && <div className="text-[12px] text-[#667085]">Attachment: {r.attachment_name}</div>}
                </td>
                <td className="whitespace-nowrap text-[13px]">{dates(r)}</td>
                <td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing({ row: r, key: Date.now() })}>Edit</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(r)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && (
        <NoticeDialog key={editing.key} row={editing.row} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load(); }} />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this notice?"
        message={<><strong>{deleting?.title}</strong> will be removed from the website{deleting?.pinned_home ? " and the announcement bar" : ""}. This cannot be undone.</>}
        confirmLabel="Delete notice"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ editor
function NoticeDialog({ row, onClose, onDone }: { row: Row | null; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => ({
    title: row?.title ?? "", body: row?.body ?? "", link: row?.link_url ?? "",
    startDate: row?.start_date ?? todayPk(), endDate: row?.end_date ?? "",
    pinned: row?.pinned_home ?? false, published: row?.published ?? true,
  }));
  const [attachment, setAttachment] = useState<Attachment>(
    row?.attachment_media_id && row.attachment_url ? { id: row.attachment_media_id, name: row.attachment_name ?? "Attachment", url: row.attachment_url } : null,
  );
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Title is required.");
    if (!f.startDate) return setError("Start date is required.");
    if (f.endDate && f.endDate < f.startDate) return setError("The end date cannot be before the start date.");
    setBusy(true);
    try {
      const payload = { ...f, attachmentId: attachment?.id ?? null };
      if (row) await api(`/api/admin/notices/${row.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/notices", { body: payload });
      toast(row ? "Notice saved" : "Notice added");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open
        wide
        title={row ? "Edit notice" : "Add notice"}
        onClose={onClose}
        footer={
          <>
            <Button tone="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="notice-form" busy={busy}>{row ? "Save changes" : "Add notice"}</Button>
          </>
        }
      >
        <form id="notice-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Title" htmlFor="nt-title" required hint="Keep it short: pinned notices show this line in the announcement bar.">
            <Input id="nt-title" value={f.title} maxLength={200} autoFocus onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field label="Text" htmlFor="nt-body" hint="A sentence or two, shown on the Notices page.">
            <Textarea id="nt-body" rows={4} value={f.body} maxLength={1000} onChange={(e) => setF({ ...f, body: e.target.value })} />
          </Field>
          <Field label="Link (optional)" htmlFor="nt-link" hint="A page on this site (e.g. /admissions) or a full https:// address.">
            <Input id="nt-link" value={f.link} maxLength={500} spellCheck={false} autoCapitalize="none" onChange={(e) => setF({ ...f, link: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="nt-sd" required hint="Shown from this day (Pakistan time).">
              <Input id="nt-sd" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
            </Field>
            <Field label="End date" htmlFor="nt-ed" hint="Last day it is shown. Leave empty to keep it up.">
              <Input id="nt-ed" type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#344054]">Attachment (optional)</span>
            {attachment ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#eaecf0] bg-[#f9fafb] px-3 py-2">
                <span className="rounded bg-white px-2 py-1 text-[12px] font-semibold uppercase text-[#b42318]">{attachment.name.split(".").pop()}</span>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[14px] text-[#1a2d59] hover:underline">
                  {attachment.name}{attachment.size ? ` (${fileSize(attachment.size)})` : ""}
                </a>
                <Button type="button" tone="secondary" size="sm" onClick={() => setPicking(true)}>Replace</Button>
                <Button type="button" tone="ghost" size="sm" onClick={() => setAttachment(null)}>Remove</Button>
              </div>
            ) : (
              <div>
                <Button type="button" tone="secondary" size="sm" onClick={() => setPicking(true)}>Choose a PDF</Button>
              </div>
            )}
            <p className="text-[12px] text-[#667085]">Parents can download it from the Notices page. If there is no link, the announcement bar opens it.</p>
          </div>

          <Checkbox
            label="Pin to the announcement bar at the top of every page"
            hint="Only one pinned notice shows at a time: the live one with the most recent start date."
            checked={f.pinned}
            onChange={(v) => setF({ ...f, pinned: v })}
          />
          <Checkbox label="Published" hint="Unticked notices are hidden from the website." checked={f.published} onChange={(v) => setF({ ...f, published: v })} />
          <ErrorNote>{error}</ErrorNote>
        </form>
      </Dialog>
      <MediaPicker
        open={picking}
        kind="document"
        title="Choose a PDF"
        onClose={() => setPicking(false)}
        onPick={([m]) => {
          setPicking(false);
          if (m) setAttachment({ id: m.id, name: m.name, url: m.url, size: m.size });
        }}
      />
    </>
  );
}
