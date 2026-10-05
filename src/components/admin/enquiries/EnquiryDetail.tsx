"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ENQUIRY_STATUSES, FORM_LABEL, STATUS_LABEL, type EnquiryForm, type EnquiryStatus } from "@/lib/enquiry-options";
import { useAdmin } from "../AdminProvider";
import { Button, Card, ConfirmDialog, ErrorNote, fmtDate, Select, Textarea } from "../ui";
import { StatusBadge, statusDot } from "./shared";

type Enquiry = {
  id: number; form: EnquiryForm; status: EnquiryStatus; campus_id: number | null; campus_name: string | null;
  name: string; phone: string; email: string; child_name: string; grade: string; topic: string; message: string;
  data: Record<string, string>; assigned_to: number | null; assigned_name: string | null; read_at: string | null;
  source_page: string; referrer: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_term: string; utm_content: string;
  email_status: string; created_at: string; updated_at: string;
};
type Activity = { id: number; kind: string; body: string; detail: Record<string, unknown>; created_at: string; by_name: string | null };
type Staff = { id: number; name: string; hasEmail: boolean };
type DetailRes = { enquiry: Enquiry; activity: Activity[]; staff: Staff[] };

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#eaecf0] px-5 py-3">
        <h2 className="text-[14px] font-semibold text-[#101828]">{title}</h2>
        {aside}
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-[180px_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-[13px] text-[#667085]">{k}</dt>
          <dd className="-mt-2 break-words text-[#101828] sm:mt-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function emailTone(s: string) {
  if (!s) return "text-[#667085]";
  if (s === "sent") return "text-[#027a48]";
  if (s.startsWith("failed")) return "text-[#b42318]";
  return "text-[#b54708]";
}

function emailText(s: string) {
  if (!s) return "Pending";
  if (s === "sent") return "Sent to the school";
  if (s === "skipped (no SMTP)") return "Not sent: email (SMTP) is not set up on the server";
  if (s === "skipped (no recipients)") return "Not sent: no notification addresses in Settings";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const KIND_ICON: Record<string, string> = {
  note: "M4 4h16v12H5.2L4 17.2V4z",
  status: "M5 12l4 4L19 6",
  assign: "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  email: "M4 6h16v12H4zM4 7l8 6 8-6",
};

export default function EnquiryDetail({ id }: { id: number }) {
  const { api, toast, user } = useAdmin();
  const router = useRouter();
  const [data, setData] = useState<DetailRes | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<DetailRes>(`/api/admin/enquiries/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, id]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const patch = async (what: string, body: Record<string, unknown>, ok: string) => {
    setBusy(what);
    try {
      const res = await api<{ enquiry: Enquiry; activity: Activity[]; mail: string | null }>(`/api/admin/enquiries/${id}`, { method: "PATCH", body });
      setData((d) => (d ? { ...d, enquiry: res.enquiry, activity: res.activity } : d));
      if (res.mail && res.mail !== "sent") toast(`${ok}. The email was not sent (${res.mail}).`, "error");
      else toast(res.mail === "sent" ? `${ok} and emailed` : ok);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    setNoteError("");
    if (!note.trim()) return setNoteError("Write a note first.");
    setBusy("note");
    try {
      const res = await api<{ note: Activity }>(`/api/admin/enquiries/${id}/notes`, { body: { body: note } });
      setData((d) => (d ? { ...d, activity: [res.note, ...d.activity] } : d));
      setNote("");
      toast("Note added");
    } catch (err) {
      setNoteError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await api(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      toast("Enquiry deleted");
      router.push("/admin/enquiries");
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(null);
    }
  };

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/admin/enquiries"))}
      className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#475467] hover:text-[#101828]"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
      All enquiries
    </button>
  );

  if (error) {
    return (
      <>
        <Link href="/admin/enquiries" className="mb-3 inline-block text-[13px] font-medium text-[#475467] hover:underline">← All enquiries</Link>
        <Card><div className="p-6"><ErrorNote>{error}</ErrorNote></div></Card>
      </>
    );
  }
  if (!data) return <p className="py-14 text-center text-[14px] text-[#667085]">Loading…</p>;

  const e = data.enquiry;
  const d = e.data ?? {};
  const isAdmin = user.role === "administrator";
  const digits = e.phone.replace(/\D/g, "");
  const waNumber = digits.startsWith("0") ? `92${digits.slice(1)}` : digits;

  const details: [string, ReactNode][] = [
    [e.form === "contact" ? "Name" : "Parent / guardian", e.name],
    ["Phone", <a key="p" href={`tel:${e.phone.replace(/[^\d+]/g, "")}`} className="text-[#1a2d59] underline">{e.phone}</a>],
    ["Email", e.email ? <a key="m" href={`mailto:${e.email}`} className="text-[#1a2d59] underline">{e.email}</a> : <span className="text-[#98a2b3]">Not given</span>],
  ];
  if (e.form !== "contact") {
    details.push(
      ["Preferred contact time", d.preferredContactTime || <span key="t" className="text-[#98a2b3]">Not given</span>],
      ["Child's name", e.child_name || <span key="c" className="text-[#98a2b3]">Not given</span>],
      ["Grade applying for", e.grade || <span key="g" className="text-[#98a2b3]">Not given</span>],
      ["Pathway of interest", d.pathway || <span key="w" className="text-[#98a2b3]">Not given</span>],
      ["Campus visit", d.campusVisit === "Yes" || e.form === "visit" ? "Yes, wants to book a visit" : "No"],
    );
  } else {
    details.push(["Enquiring about", e.topic || "—"]);
  }
  details.push(["Campus", e.campus_name ?? <span key="cp" className="text-[#98a2b3]">—</span>]);
  details.push(["Message", e.message ? <span key="msg" className="whitespace-pre-wrap">{e.message}</span> : <span key="nm" className="text-[#98a2b3]">No message</span>]);

  const utm = [e.utm_source, e.utm_medium, e.utm_campaign, e.utm_term, e.utm_content].some(Boolean);
  const source: [string, ReactNode][] = [
    ["Form page", e.source_page || "—"],
    ["Landing page", d.landingPage || "—"],
    ["Referrer", e.referrer ? <span key="r" className="break-all">{e.referrer}</span> : "Direct / none"],
  ];
  if (utm) {
    source.push(
      ["UTM source", e.utm_source || "—"],
      ["UTM medium", e.utm_medium || "—"],
      ["UTM campaign", e.utm_campaign || "—"],
      ["UTM term", e.utm_term || "—"],
      ["UTM content", e.utm_content || "—"],
    );
  } else {
    source.push(["UTM tags", <span key="u" className="text-[#98a2b3]">None</span>]);
  }
  source.push(["School notification", <span key="es" className={emailTone(e.email_status)}>{emailText(e.email_status)}</span>]);

  const assignedStaff = data.staff.find((s) => s.id === Number(e.assigned_to));

  return (
    <>
      {back}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#101828]">{e.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#667085]">
            <span className="font-medium text-[#344054]">{FORM_LABEL[e.form]}</span>
            <span aria-hidden>·</span>
            <span>Received {fmtDate(e.created_at)}</span>
            <StatusBadge status={e.status} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">Call</a>
          {waNumber.length >= 10 && (
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">WhatsApp</a>
          )}
          {e.email && (
            <a href={`mailto:${e.email}`} className="inline-flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">Email</a>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Submitted details"><Rows rows={details} /></Section>
          <Section title="Source"><Rows rows={source} /></Section>

          <Section title="Notes & activity" aside={<span className="text-[12px] text-[#667085]">Internal only, never shown to the family</span>}>
            <form onSubmit={addNote} className="flex flex-col gap-2">
              <label htmlFor="enq-note" className="sr-only">Add a note</label>
              <Textarea
                id="enq-note"
                value={note}
                onChange={(ev) => setNote(ev.target.value)}
                placeholder="Add a note, e.g. called the father, will visit on Monday at 10 AM"
                maxLength={4000}
              />
              <ErrorNote>{noteError}</ErrorNote>
              <div className="flex justify-end">
                <Button type="submit" size="sm" busy={busy === "note"}>Add note</Button>
              </div>
            </form>

            <ol className="mt-5 flex flex-col gap-4">
              {data.activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${a.kind === "note" ? "bg-[#eff4ff] text-[#1a2d59]" : "bg-[#f2f4f7] text-[#667085]"}`}>
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d={KIND_ICON[a.kind] ?? KIND_ICON.note} /></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    {a.kind === "note" ? (
                      <div className="rounded-lg border border-[#eaecf0] bg-[#fcfcfd] px-3 py-2 text-[14px] text-[#101828]">
                        <p className="whitespace-pre-wrap break-words">{a.body}</p>
                      </div>
                    ) : (
                      <p className="text-[14px] text-[#344054]">{a.body}</p>
                    )}
                    <p className="mt-1 text-[12px] text-[#98a2b3]">
                      {a.kind === "note" ? "Note" : a.kind === "email" ? "Email" : a.kind === "status" ? "Status" : "Assignment"}
                      {a.by_name ? ` by ${a.by_name}` : a.kind === "email" ? " (automatic)" : ""} · {fmtDate(a.created_at)}
                    </p>
                  </div>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085]">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                </span>
                <div>
                  <p className="text-[14px] text-[#344054]">Received from the website ({FORM_LABEL[e.form].toLowerCase()})</p>
                  <p className="mt-1 text-[12px] text-[#98a2b3]">{fmtDate(e.created_at)}</p>
                </div>
              </li>
            </ol>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Status">
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Status">
              {ENQUIRY_STATUSES.map((s) => {
                const on = e.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={Boolean(busy)}
                    onClick={() => !on && patch("status", { status: s }, `Marked as ${STATUS_LABEL[s].toLowerCase()}`)}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-[14px] transition-colors disabled:cursor-wait ${
                      on ? "border-[#1a2d59] bg-[#eff4ff] font-medium text-[#101828]" : "border-[#eaecf0] text-[#344054] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <span aria-hidden className={`size-2.5 rounded-full ${statusDot[s]}`} />
                    {STATUS_LABEL[s]}
                    {on && <span className="ml-auto text-[12px] text-[#1a2d59]">Current</span>}
                    {busy === "status" && !on && <span className="sr-only">Saving</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-[#667085]">New → Contacted → Visit booked → Enrolled, or Closed.</p>
          </Section>

          <Section title="Assigned to">
            <Select
              aria-label="Assign to a staff member"
              value={e.assigned_to ? String(e.assigned_to) : ""}
              disabled={Boolean(busy)}
              onChange={(ev) => patch("assign", { assignedTo: ev.target.value ? Number(ev.target.value) : null }, ev.target.value ? "Assigned" : "Unassigned")}
            >
              <option value="">Unassigned</option>
              {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.hasEmail ? "" : " (no email)"}</option>)}
            </Select>
            <p className="mt-2 text-[12px] text-[#667085]">
              {assignedStaff && !assignedStaff.hasEmail
                ? `${assignedStaff.name} has no email on their account, so they were not emailed.`
                : "The staff member is emailed the enquiry details and a link to this page."}
            </p>
          </Section>

          <Section title="More">
            <div className="flex flex-col items-start gap-2">
              <Button tone="secondary" size="sm" disabled={Boolean(busy)} onClick={async () => {
                await patch("unread", { unread: true }, "Marked as unread");
                router.push("/admin/enquiries");
              }}>
                Mark as unread
              </Button>
              {isAdmin && (
                <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(true)}>Delete enquiry</Button>
              )}
              <p className="text-[12px] text-[#98a2b3]">Last updated {fmtDate(e.updated_at)}</p>
            </div>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        title="Delete this enquiry?"
        message={<>The enquiry from <strong>{e.name}</strong>, with its notes and history, will be deleted permanently. This cannot be undone.</>}
        confirmLabel="Delete enquiry"
        busy={busy === "delete"}
        onConfirm={remove}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}
