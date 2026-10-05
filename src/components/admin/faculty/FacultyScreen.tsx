"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminProvider";
import { ImageInput, thumbUrl } from "../MediaPicker";
import { ReorderList, Thumb, type ReorderItem } from "../media/Reorder";
import { Badge, Button, Card, Checkbox, ConfirmDialog, Dialog, Empty, ErrorNote, Field, Input, PageHeader, Pagination, SearchBox, Select, Table, Textarea, Toolbar } from "../ui";

type Photo = { id: number; url: string; alt: string; srcSet: string };
type Person = {
  id: number; name: string; designation: string; department: string; qualifications: string; bio: string;
  published: boolean; sort: number; updated_at: string; photo: Photo | null;
};
type ListRes = { rows: Person[]; total: number; page: number; pageSize: number; departments: string[] };

export default function FacultyScreen() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Person | "new" | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [reordering, setReordering] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<ListRes>(`/api/admin/faculty?${new URLSearchParams({ search, department, status, page: String(page) })}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, department, status, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/faculty/${deleting.id}`, { method: "DELETE" });
      toast(`${deleting.name} removed`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const filtered = Boolean(search || department || status);

  return (
    <>
      <PageHeader
        title="Faculty & staff"
        description="The people listed on the Faculty & Staff page, grouped by department in the order set here."
        actions={
          <>
            <Button tone="secondary" onClick={() => setReordering(true)} disabled={!data}>Reorder</Button>
            <Button onClick={() => setEditing("new")}>Add person</Button>
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, role or qualification" />
          <div className="flex gap-2">
            <Select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} aria-label="Filter by department" className="sm:w-52">
              <option value="">All departments</option>
              {data?.departments.map((d) => <option key={d} value={d}>{d}</option>)}
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
          <Empty title={filtered ? "Nobody matches" : "No faculty or staff yet"}>
            {filtered ? "Try a different search or filter." : <Button className="mt-3" onClick={() => setEditing("new")}>Add the first person</Button>}
          </Empty>
        ) : (
          <Table head={<><th>Name</th><th>Department</th><th>Qualifications</th><th>Status</th><th className="text-right">Actions</th></>}>
            {data?.rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <button type="button" onClick={() => setEditing(p)} className="flex items-center gap-3 text-left">
                    <Thumb src={p.photo ? thumbUrl(p.photo) : null} label={p.name} round />
                    <span>
                      <span className="block font-medium text-[#101828] hover:underline">{p.name}</span>
                      <span className="block text-[12px] text-[#667085]">{p.designation || "No designation"}</span>
                    </span>
                  </button>
                </td>
                <td className="text-[13px]">{p.department || <span className="text-[#98a2b3]">None</span>}</td>
                <td className="max-w-[260px] truncate text-[13px] text-[#475467]">{p.qualifications}</td>
                <td>{p.published ? <Badge tone="green">Published</Badge> : <Badge>Hidden</Badge>}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing(p)}>Edit</Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(p)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {editing && (
        <PersonDialog
          key={editing === "new" ? "new" : editing.id}
          person={editing === "new" ? null : editing}
          departments={data?.departments ?? []}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); void load(); }}
        />
      )}
      {reordering && <ReorderDialog onClose={() => setReordering(false)} onDone={() => { setReordering(false); void load(); }} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this person?"
        message={<><strong>{deleting?.name}</strong> will be removed from the Faculty & Staff page. Their photo stays in the media library. This cannot be undone; to take them off the page for now, edit them and untick “Published” instead.</>}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ add / edit
function PersonDialog({ person, departments, onClose, onDone }: { person: Person | null; departments: string[]; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => ({
    name: person?.name ?? "",
    designation: person?.designation ?? "",
    department: person?.department ?? "",
    qualifications: person?.qualifications ?? "",
    bio: person?.bio ?? "",
    published: person?.published ?? true,
    photo: person?.photo ? { id: person.photo.id, url: person.photo.url, alt: person.photo.alt } : null as { id: number; url: string; alt: string } | null,
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.name.trim()) return setError("Name is required.");
    setBusy(true);
    try {
      const payload = {
        name: f.name, designation: f.designation, department: f.department, qualifications: f.qualifications, bio: f.bio,
        published: f.published, mediaId: f.photo?.id ?? null, ...(f.photo ? { photoAlt: f.photo.alt } : {}),
      };
      if (person) await api(`/api/admin/faculty/${person.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/faculty", { body: payload });
      toast(person ? "Saved" : `${f.name.trim()} added`);
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
      title={person ? `Edit ${person.name}` : "Add person"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="faculty-form" busy={busy}>{person ? "Save changes" : "Add person"}</Button>
        </>
      }
    >
      <form id="faculty-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <ImageInput label="Photo" value={f.photo} onChange={(photo) => setF({ ...f, photo })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fa-name" required>
            <Input id="fa-name" value={f.name} maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus={!person} />
          </Field>
          <Field label="Designation" htmlFor="fa-designation" hint="For example Principal, Science Teacher, Admin Officer.">
            <Input id="fa-designation" value={f.designation} maxLength={120} onChange={(e) => setF({ ...f, designation: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" htmlFor="fa-department" hint="Pick an existing one or type a new one. People are grouped by it.">
            <Input id="fa-department" list="fa-departments" value={f.department} maxLength={80} onChange={(e) => setF({ ...f, department: e.target.value })} />
            <datalist id="fa-departments">{departments.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="Qualifications" htmlFor="fa-qual" hint="For example MSc Physics, B.Ed.">
            <Input id="fa-qual" value={f.qualifications} maxLength={300} onChange={(e) => setF({ ...f, qualifications: e.target.value })} />
          </Field>
        </div>
        <Field label="Short bio" htmlFor="fa-bio" hint={`${f.bio.length}/600 characters. One or two sentences.`}>
          <Textarea id="fa-bio" value={f.bio} maxLength={600} rows={3} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        </Field>
        <Checkbox label="Published" hint="Show this person on the Faculty & Staff page." checked={f.published} onChange={(published) => setF({ ...f, published })} />
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}

// ------------------------------------------------------------------ reorder
function ReorderDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [items, setItems] = useState<ReorderItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<ListRes>("/api/admin/faculty?all=1")
      .then((d) => setItems(d.rows.map((p) => ({
        id: p.id,
        title: p.name,
        sub: [p.designation, p.department].filter(Boolean).join(" · ") + (p.published ? "" : " (hidden)"),
        thumb: <Thumb src={p.photo ? thumbUrl(p.photo) : null} label={p.name} round />,
      }))))
      .catch((e) => setError((e as Error).message));
  }, [api]);

  const save = async () => {
    if (!items) return;
    setBusy(true);
    try {
      await api("/api/admin/faculty/order", { body: { ids: items.map((i) => i.id) } });
      toast("Order saved");
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      wide
      title="Reorder faculty & staff"
      onClose={onClose}
      footer={<><Button tone="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!items} onClick={save}>Save order</Button></>}
    >
      <p className="mb-3 text-[13px] text-[#667085]">Drag the handle or use the arrows. Departments appear on the page in the order of their first person.</p>
      {items ? <ReorderList items={items} onChange={setItems} /> : <p className="text-[14px] text-[#667085]">Loading…</p>}
      <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>
    </Dialog>
  );
}
