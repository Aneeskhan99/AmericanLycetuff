"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminProvider";
import { Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, Table, Textarea } from "../ui";

type Campus = {
  id: number; name: string; slug: string; address: string; phone: string; email: string; map_url: string;
  sort: number; active: boolean; enquiries: number;
};

/** Campuses: used to tag enquiries (the first active campus is the default for the website forms). */
export default function CampusesCard() {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<Campus[] | null>(null);
  const [editing, setEditing] = useState<Campus | "new" | null>(null);
  const [deleting, setDeleting] = useState<Campus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await api<{ rows: Campus[] }>("/api/admin/campuses")).rows);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [api, toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/campuses/${deleting.id}`, { method: "DELETE" });
      toast(`${deleting.name} deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const firstActive = rows?.find((r) => r.active);

  return (
    <section id="campuses" className="scroll-mt-20">
      <Card>
        <div className="flex flex-col gap-3 border-b border-[#eaecf0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#101828]">Campuses</h2>
            <p className="mt-0.5 text-[13px] text-[#667085]">Website enquiries are filed under the first active campus in this list.</p>
          </div>
          <Button size="sm" onClick={() => setEditing("new")}>Add campus</Button>
        </div>
        {!rows ? (
          <p className="px-6 py-10 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty title="No campuses">Add the school&apos;s campus so enquiries can be filed under it.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Campus</th>
                <th>Contact</th>
                <th>Order</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {rows.map((c) => (
              <tr key={c.id} className={c.active ? "" : "text-[#98a2b3]"}>
                <td>
                  <span className="font-medium">{c.name}</span>
                  {firstActive?.id === c.id && <span className="ml-2 text-[12px] text-[#667085]">(default)</span>}
                  <div className="max-w-[320px] text-[12px] text-[#667085]">{c.address}</div>
                </td>
                <td className="text-[13px]">
                  <div>{c.phone || "—"}</div>
                  <div className="text-[#667085]">{c.email}</div>
                </td>
                <td className="text-[13px]">{c.sort}</td>
                <td>{c.active ? <Badge tone="green">Active</Badge> : <Badge>Hidden</Badge>}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(c)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {editing && (
        <CampusDialog
          key={editing === "new" ? "new" : editing.id}
          row={editing === "new" ? null : editing}
          nextSort={(rows?.reduce((m, r) => Math.max(m, r.sort), -1) ?? -1) + 1}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); void load(); }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this campus?"
        message={
          <>
            <strong>{deleting?.name}</strong> will be deleted.
            {deleting && deleting.enquiries > 0 && <> Its {deleting.enquiries} enquir{deleting.enquiries === 1 ? "y" : "ies"} will be kept, without a campus.</>}
            {" "}To keep it but stop using it, edit it and untick Active instead.
          </>
        }
        confirmLabel="Delete campus"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

function CampusDialog({ row, nextSort, onClose, onDone }: { row: Campus | null; nextSort: number; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => ({
    name: row?.name ?? "", address: row?.address ?? "", phone: row?.phone ?? "", email: row?.email ?? "",
    mapUrl: row?.map_url ?? "", active: row?.active ?? true, sort: String(row?.sort ?? nextSort),
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { ...f, sort: Number(f.sort) || 0 };
      if (row) await api(`/api/admin/campuses/${row.id}`, { method: "PATCH", body });
      else await api("/api/admin/campuses", { body });
      toast(row ? "Campus saved" : "Campus added");
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
      title={row ? `Edit ${row.name}` : "Add campus"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="campus-form" busy={busy}>{row ? "Save" : "Add campus"}</Button>
        </>
      }
    >
      <form id="campus-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Campus name" htmlFor="cp-name" required>
          <Input id="cp-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Address" htmlFor="cp-addr">
          <Textarea id="cp-addr" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="min-h-[64px]" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="cp-phone"><Input id="cp-phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email" htmlFor="cp-email"><Input id="cp-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        <Field label="Google Maps link" htmlFor="cp-map"><Input id="cp-map" type="url" value={f.mapUrl} onChange={(e) => setF({ ...f, mapUrl: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order" htmlFor="cp-sort" hint="Lower numbers come first."><Input id="cp-sort" type="number" min={0} max={9999} value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} /></Field>
          <div className="pt-7"><Checkbox label="Active" hint="Inactive campuses are kept but not used." checked={f.active} onChange={(active) => setF({ ...f, active })} /></div>
        </div>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}
