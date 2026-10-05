"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { Button, Card, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, PageHeader, SearchBox, Select, Textarea, Toolbar } from "@/components/admin/ui";
import { academicYearOf, fmtRange, KIND_LABEL, MONTHS_LONG, todayPk, weekday, ymd } from "@/components/site/events/format";

type Kind = "term" | "holiday" | "exam" | "other";
type Entry = { id: number; title: string; kind: Kind; start_date: string; end_date: string | null; academic_year: string; notes: string };
type ListRes = { rows: Entry[]; total: number; years: string[] };

const KINDS: Kind[] = ["term", "holiday", "exam", "other"];
/** Same colours as the public calendar legend. */
const KIND_STYLE: Record<Kind, { dot: string; badge: string }> = {
  term: { dot: "bg-[#1a2d59]", badge: "bg-[#eff4ff] text-[#1a2d59] ring-[#1a2d59]/20" },
  holiday: { dot: "bg-[#d31245]", badge: "bg-[#fff1f3] text-[#c01048] ring-[#d31245]/20" },
  exam: { dot: "bg-[#f0c400]", badge: "bg-[#fefbe8] text-[#854a0e] ring-[#f0c400]/40" },
  other: { dot: "bg-[#98a2b3]", badge: "bg-[#f2f4f7] text-[#344054] ring-[#98a2b3]/30" },
};

function KindBadge({ kind }: { kind: Kind }) {
  const s = KIND_STYLE[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${s.badge}`}>
      <span aria-hidden className={`size-2 rounded-full ${s.dot}`} />
      {KIND_LABEL[kind]}
    </span>
  );
}

export default function CalendarScreen() {
  const { api, toast } = useAdmin();
  const [year, setYear] = useState("");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ entry: Entry | null; key: number } | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/calendar?${new URLSearchParams({ year, kind, search })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, year, kind, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  /** academic year → month ("2026-08") → entries */
  const groups = useMemo(() => {
    const out: { year: string; months: { key: string; label: string; rows: Entry[] }[] }[] = [];
    for (const r of data?.rows ?? []) {
      const y = r.academic_year || "No academic year";
      let g = out.find((x) => x.year === y);
      if (!g) out.push((g = { year: y, months: [] }));
      const { y: yy, m } = ymd(r.start_date);
      const key = r.start_date.slice(0, 7);
      let mg = g.months.find((x) => x.key === key);
      if (!mg) g.months.push((mg = { key, label: `${MONTHS_LONG[m - 1]} ${yy}`, rows: [] }));
      mg.rows.push(r);
    }
    return out;
  }, [data]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/calendar/${deleting.id}`, { method: "DELETE" });
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
        title="Academic calendar"
        description="Terms, holidays and exams. The current academic year is shown on the Events & Calendar page."
        actions={<Button onClick={() => setEditing({ entry: null, key: Date.now() })}>Add date</Button>}
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search title or notes" />
          <div className="flex gap-2">
            <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by academic year" className="sm:w-40">
              <option value="">All years</option>
              {data?.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type" className="sm:w-36">
              <option value="">All types</option>
              {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </Select>
          </div>
          <ul className="flex flex-wrap gap-2 sm:ml-auto" aria-label="Colour key">
            {KINDS.map((k) => <li key={k}><KindBadge kind={k} /></li>)}
          </ul>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : groups.length === 0 ? (
          year || kind || search ? (
            <Empty title="Nothing matches">Try a different year, type or search.</Empty>
          ) : (
            <Empty title="No dates yet">Add the term dates, holidays and exams for the academic year.</Empty>
          )
        ) : (
          <div className="divide-y divide-[#eaecf0]">
            {groups.map((g) => (
              <section key={g.year} aria-label={`Academic year ${g.year}`} className="p-4 sm:p-5" data-testid="cal-year">
                <h2 className="text-[16px] font-semibold text-[#101828]">
                  {g.year}
                  <span className="ml-2 text-[13px] font-normal text-[#667085]">{((n) => `${n} ${n === 1 ? "date" : "dates"}`)(g.months.reduce((n, m) => n + m.rows.length, 0))}</span>
                </h2>
                {g.months.map((m) => (
                  <div key={m.key} className="mt-4" data-testid="cal-month">
                    <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[#667085]">{m.label}</h3>
                    <ul className="overflow-hidden rounded-lg border border-[#eaecf0]">
                      {m.rows.map((r) => (
                        <li key={r.id} className="flex flex-col gap-2 border-b border-[#f2f4f7] px-3 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4" data-testid="cal-entry">
                          <span className={`hidden h-9 w-1 shrink-0 rounded-full sm:block ${KIND_STYLE[r.kind].dot}`} aria-hidden />
                          <div className="w-full shrink-0 text-[13px] sm:w-48">
                            <div className="font-medium text-[#101828]">{fmtRange(r.start_date, r.end_date)}</div>
                            <div className="text-[#667085]">{r.end_date ? `${weekday(r.start_date)} – ${weekday(r.end_date)}` : weekday(r.start_date)}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => setEditing({ entry: r, key: Date.now() })} className="text-left text-[14px] font-medium text-[#101828] hover:underline">
                                {r.title}
                              </button>
                              <KindBadge kind={r.kind} />
                            </div>
                            {r.notes && <p className="mt-0.5 text-[13px] text-[#667085]">{r.notes}</p>}
                          </div>
                          <div className="flex gap-1 sm:justify-end">
                            <Button tone="ghost" size="sm" onClick={() => setEditing({ entry: r, key: Date.now() })}>Edit</Button>
                            <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(r)}>Delete</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <EntryDialog
          key={editing.key}
          entry={editing.entry}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); void load(); }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this date?"
        message={<><strong>{deleting?.title}</strong> will be removed from the academic calendar. This cannot be undone.</>}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ editor
function EntryDialog({ entry, onClose, onDone }: { entry: Entry | null; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => {
    const start = entry?.start_date ?? todayPk();
    return {
      title: entry?.title ?? "", kind: entry?.kind ?? ("term" as Kind), startDate: start, endDate: entry?.end_date ?? "",
      academicYear: entry?.academic_year || academicYearOf(start), notes: entry?.notes ?? "",
    };
  });
  const [yearTouched, setYearTouched] = useState(Boolean(entry));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Title is required.");
    if (!f.startDate) return setError("Start date is required.");
    if (f.endDate && f.endDate < f.startDate) return setError("The end date cannot be before the start date.");
    if (!/^\d{4}-\d{2}$/.test(f.academicYear)) return setError("Academic year must look like 2026-27.");
    setBusy(true);
    try {
      if (entry) await api(`/api/admin/calendar/${entry.id}`, { method: "PATCH", body: f });
      else await api("/api/admin/calendar", { body: f });
      toast(entry ? "Saved" : "Date added");
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
      title={entry ? "Edit date" : "Add date"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cal-form" busy={busy}>{entry ? "Save changes" : "Add date"}</Button>
        </>
      }
    >
      <form id="cal-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Title" htmlFor="cal-title" required>
          <Input id="cal-title" value={f.title} maxLength={200} autoFocus placeholder="e.g. Winter break" onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Type" htmlFor="cal-kind" required>
          <Select id="cal-kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Kind })}>
            {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="cal-sd" required>
            <Input
              id="cal-sd"
              type="date"
              value={f.startDate}
              onChange={(e) => setF({ ...f, startDate: e.target.value, academicYear: yearTouched || !e.target.value ? f.academicYear : academicYearOf(e.target.value) })}
            />
          </Field>
          <Field label="End date" htmlFor="cal-ed" hint="Leave empty for a single day.">
            <Input id="cal-ed" type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Academic year" htmlFor="cal-year" required hint="Format 2026-27. Suggested from the start date (years start in August).">
          <Input id="cal-year" value={f.academicYear} maxLength={7} placeholder="2026-27" onChange={(e) => { setYearTouched(true); setF({ ...f, academicYear: e.target.value.trim() }); }} />
        </Field>
        <Field label="Notes" htmlFor="cal-notes" hint="Optional, shown under the title on the website.">
          <Textarea id="cal-notes" rows={3} value={f.notes} maxLength={1000} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}
