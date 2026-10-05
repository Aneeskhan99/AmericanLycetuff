"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { ImageInput } from "@/components/admin/MediaPicker";
import {
  Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, PageHeader, Pagination, SearchBox, slugify, Table, Textarea, Toolbar,
} from "@/components/admin/ui";
import { eventWhen, todayPk } from "@/components/site/events/format";

type Row = {
  id: number; title: string; slug: string; all_day: boolean; venue: string; published: boolean;
  start_date: string; start_time: string; end_date: string | null; end_time: string | null;
};
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number; counts: { upcoming: number; past: number } };
type Tab = "upcoming" | "past";
type Img = { id: number; url: string; alt: string } | null;
type Full = Row & { description: string; image: Img };

const when = (r: Pick<Row, "start_date" | "start_time" | "end_date" | "end_time" | "all_day">) =>
  eventWhen({ startDate: r.start_date, startTime: r.start_time, endDate: r.end_date, endTime: r.end_time, allDay: r.all_day });

export default function EventsScreen() {
  const { api, toast } = useAdmin();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: number | null; key: number } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/events?${new URLSearchParams({ tab, search, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, tab, search, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const duplicate = async (r: Row) => {
    try {
      const d = await api<{ id: number }>(`/api/admin/events/${r.id}/duplicate`, { method: "POST" });
      toast("Copied as an unpublished draft. Check the dates and publish when ready.");
      void load();
      setEditing({ id: d.id, key: Date.now() });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/events/${deleting.id}`, { method: "DELETE" });
      toast(`“${deleting.title}” deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (t: Tab, label: string, n?: number) => (
    <button
      type="button"
      onClick={() => { setTab(t); setPage(1); }}
      aria-pressed={tab === t}
      className={`h-9 rounded-md px-3 text-[14px] font-medium ${tab === t ? "bg-white text-[#101828] shadow-sm" : "text-[#667085] hover:text-[#101828]"}`}
    >
      {label}{n !== undefined && <span className="ml-1.5 text-[12px] text-[#98a2b3]">{n}</span>}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Events"
        description="Events shown on the Events & Calendar page. Dates and times are Pakistan time."
        actions={<Button onClick={() => setEditing({ id: null, key: Date.now() })}>Add event</Button>}
      />

      <Card>
        <Toolbar>
          <div className="inline-flex w-fit rounded-lg bg-[#f2f4f7] p-1" role="group" aria-label="Show">
            {tabBtn("upcoming", "Upcoming", data?.counts.upcoming)}
            {tabBtn("past", "Past", data?.counts.past)}
          </div>
          <div className="sm:ml-auto">
            <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search title or venue" />
          </div>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          search ? (
            <Empty title="No events found">Try a different search.</Empty>
          ) : tab === "upcoming" ? (
            <Empty title="No upcoming events">Add an event and it will appear on the Events page.</Empty>
          ) : (
            <Empty title="No past events yet" />
          )
        ) : (
          <Table
            head={
              <>
                <th>Event</th>
                <th>When</th>
                <th>Venue</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {data?.rows.map((r) => {
              const w = when(r);
              return (
                <tr key={r.id} data-testid="event-row">
                  <td className="min-w-[200px]">
                    <button type="button" onClick={() => setEditing({ id: r.id, key: Date.now() })} className="text-left font-medium text-[#101828] hover:underline">
                      {r.title}
                    </button>
                    <div className="font-mono text-[12px] text-[#667085]">/events/{r.slug}</div>
                  </td>
                  <td className="whitespace-nowrap text-[13px]">
                    <div className="text-[#101828]">{w.date}</div>
                    <div className="text-[#667085]">{w.time}</div>
                  </td>
                  <td className="text-[13px]">{r.venue || <span className="text-[#98a2b3]">—</span>}</td>
                  <td>{r.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button tone="ghost" size="sm" onClick={() => setEditing({ id: r.id, key: Date.now() })}>Edit</Button>
                      <Button tone="ghost" size="sm" onClick={() => duplicate(r)}>Duplicate</Button>
                      {r.published && (
                        <a href={`/events/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[#344054] hover:bg-[#f2f4f7]">
                          View
                        </a>
                      )}
                      <Button tone="ghost" size="sm" onClick={() => setDeleting(r)} className="text-[#b42318]">Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && (
        <EventDialog
          key={editing.key}
          id={editing.id}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); void load(); }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this event?"
        message={<><strong>{deleting?.title}</strong> will be removed from the website. This cannot be undone.</>}
        confirmLabel="Delete event"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ editor
type Form = {
  title: string; slug: string; allDay: boolean; startDate: string; startTime: string; endDate: string; endTime: string;
  venue: string; description: string; image: Img; published: boolean;
};

const blank = (): Form => ({
  title: "", slug: "", allDay: false, startDate: todayPk(), startTime: "09:00", endDate: "", endTime: "",
  venue: "", description: "", image: null, published: true,
});

function EventDialog({ id, onClose, onDone }: { id: number | null; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState<Form>(blank);
  const [slugTouched, setSlugTouched] = useState(id !== null);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id === null) return;
    api<{ event: Full }>(`/api/admin/events/${id}`)
      .then(({ event: e }) => {
        setF({
          title: e.title, slug: e.slug, allDay: e.all_day, startDate: e.start_date, startTime: e.all_day ? "09:00" : e.start_time,
          endDate: e.end_date ?? "", endTime: e.all_day ? "" : e.end_time ?? "", venue: e.venue, description: e.description,
          image: e.image, published: e.published,
        });
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id, api]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Title is required.");
    if (!f.startDate) return setError("Start date is required.");
    if (!f.allDay && !f.startTime) return setError("Start time is required (or tick All day).");
    if (!f.allDay && f.endDate && !f.endTime) return setError("Add an end time, or clear the end date.");
    const start = `${f.startDate}T${f.allDay ? "00:00" : f.startTime}`;
    const end = f.allDay ? (f.endDate ? `${f.endDate}T00:00` : "") : f.endTime ? `${f.endDate || f.startDate}T${f.endTime}` : "";
    if (end && end < start) return setError(f.allDay ? "The end date cannot be before the start date." : "The event cannot end before it starts.");

    setBusy(true);
    try {
      const payload = {
        ...f,
        slug: f.slug || slugify(f.title),
        startTime: f.allDay ? "" : f.startTime,
        endTime: f.allDay ? "" : f.endTime,
        image: f.image ? { id: f.image.id, alt: f.image.alt } : null,
      };
      if (id === null) await api("/api/admin/events", { body: payload });
      else await api(`/api/admin/events/${id}`, { method: "PATCH", body: payload });
      toast(id === null ? "Event added" : "Event saved");
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
      title={id === null ? "Add event" : "Edit event"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="event-form" busy={busy} disabled={loading}>{id === null ? "Add event" : "Save changes"}</Button>
        </>
      }
    >
      {loading ? (
        <p className="py-10 text-center text-[14px] text-[#667085]">Loading…</p>
      ) : (
        <form id="event-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Title" htmlFor="ev-title" required>
            <Input
              id="ev-title"
              value={f.title}
              maxLength={200}
              autoFocus
              onChange={(e) => setF((x) => ({ ...x, title: e.target.value, slug: slugTouched ? x.slug : slugify(e.target.value) }))}
            />
          </Field>
          <Field label="Slug (web address)" htmlFor="ev-slug" hint={<>The page will be at <span className="font-mono">/events/{f.slug || slugify(f.title) || "…"}</span>. Must be unique.</>}>
            <Input
              id="ev-slug"
              value={f.slug}
              maxLength={80}
              spellCheck={false}
              autoCapitalize="none"
              className="font-mono"
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
              onBlur={() => set("slug", slugify(f.slug))}
            />
          </Field>

          <Checkbox label="All-day event" hint="No start or end time; can span several days." checked={f.allDay} onChange={(v) => set("allDay", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="ev-sd" required>
              <Input id="ev-sd" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            {!f.allDay && (
              <Field label="Start time (PKT)" htmlFor="ev-st" required>
                <Input id="ev-st" type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </Field>
            )}
            <Field label="End date" htmlFor="ev-ed" hint={f.allDay ? "Leave empty for a one-day event." : "Leave empty if it ends the same day."}>
              <Input id="ev-ed" type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
            {!f.allDay && (
              <Field label="End time (PKT)" htmlFor="ev-et" hint="Optional.">
                <Input id="ev-et" type="time" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </Field>
            )}
          </div>

          <Field label="Venue" htmlFor="ev-venue" hint="e.g. Main Hall, Swabi campus">
            <Input id="ev-venue" value={f.venue} maxLength={200} onChange={(e) => set("venue", e.target.value)} />
          </Field>
          <ImageInput value={f.image} onChange={(v) => set("image", v)} label="Image (optional)" />
          <Field label="Description" htmlFor="ev-desc" hint="Plain text. Line breaks are kept; leave an empty line between paragraphs.">
            <Textarea id="ev-desc" rows={8} value={f.description} maxLength={10000} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Checkbox label="Published" hint="Unticked events are saved as drafts and not shown on the website." checked={f.published} onChange={(v) => set("published", v)} />
          <ErrorNote>{error}</ErrorNote>
        </form>
      )}
    </Dialog>
  );
}
