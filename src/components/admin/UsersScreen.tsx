"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, ROLE_LABEL, useAdmin, type Role } from "./AdminProvider";
import { Badge, Button, Card, ConfirmDialog, Dialog, Empty, Field, fmtDate, Input, PageHeader, Pagination, SearchBox, Select, Table } from "./ui";

type Row = {
  id: number; username: string; name: string; email: string; role: Role;
  disabled: boolean; must_change_password: boolean; last_login_at: string | null; created_at: string;
};
type RoleInfo = { id: Role; label: string; blurb: string };
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number; roles: RoleInfo[] };
type Activity = { action: string; entity: string; created_at: string; by_name: string | null };

/** A readable temporary password, e.g. "maple-river-4821". */
function suggestPassword() {
  const words = ["maple", "river", "cedar", "falcon", "harbor", "meadow", "summit", "willow", "copper", "lantern", "orchid", "pebble", "canyon", "breeze"];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `${pick()}-${pick()}-${n}`;
}

const ACTIONS: Record<string, string> = {
  login: "Signed in", logout: "Signed out", create: "Account created", update: "Details changed",
  disable: "Account disabled", enable: "Account re-enabled", reset_password: "Password reset by an administrator",
  change_own_password: "Changed own password", update_own_details: "Updated own details",
};

export default function UsersScreen() {
  const { api, toast, user: me } = useAdmin();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [resetting, setResetting] = useState<Row | null>(null);
  const [toggling, setToggling] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ search, role, status, page: String(page) });
    try {
      setData(await api<ListRes>(`/api/admin/users?${p}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, role, status, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const roles = data?.roles ?? [
    { id: "administrator", label: "Administrator", blurb: "" },
    { id: "editor", label: "Editor", blurb: "" },
    { id: "author", label: "Author", blurb: "" },
  ];

  const toggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${toggling.id}`, { method: "PATCH", body: { disabled: !toggling.disabled } });
      toast(toggling.disabled ? `${toggling.name} can sign in again` : `${toggling.name} has been disabled and signed out`);
      setToggling(null);
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
        title="Users"
        description="Who can sign in to the admin, and what they can do."
        actions={<Button onClick={() => setAdding(true)}>Add user</Button>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-[#eaecf0] p-4 sm:flex-row sm:items-center">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, username or email" />
          <div className="flex gap-2">
            <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role" className="sm:w-44">
              <option value="">All roles</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-36">
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </Select>
          </div>
        </div>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          <Empty title="No users found">Try a different search or filter.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {data?.rows.map((u) => (
              <tr key={u.id} className={u.disabled ? "text-[#98a2b3]" : ""}>
                <td>
                  <button type="button" onClick={() => setEditing(u)} className="text-left font-medium text-[#101828] hover:underline">
                    {u.name}
                  </button>
                  {u.id === me.id && <span className="ml-2 text-[12px] text-[#667085]">(you)</span>}
                  <div className="text-[12px] text-[#667085]">{u.email || "No email"}</div>
                </td>
                <td className="font-mono text-[13px]">{u.username}</td>
                <td><Badge tone={u.role === "administrator" ? "blue" : "gray"}>{ROLE_LABEL[u.role]}</Badge></td>
                <td>
                  {u.disabled ? <Badge tone="red">Disabled</Badge> : u.must_change_password ? <Badge tone="amber">Must set password</Badge> : <Badge tone="green">Active</Badge>}
                </td>
                <td className="whitespace-nowrap text-[13px]">{u.last_login_at ? fmtDate(u.last_login_at) : "Never"}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" onClick={() => setEditing(u)}>Edit</Button>
                    {u.id !== me.id && (
                      <>
                        <Button tone="ghost" size="sm" onClick={() => setResetting(u)}>Reset password</Button>
                        <Button tone="ghost" size="sm" onClick={() => setToggling(u)} className={u.disabled ? "" : "text-[#b42318]"}>
                          {u.disabled ? "Enable" : "Disable"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      {adding && <AddUserDialog roles={roles} onClose={() => setAdding(false)} onDone={() => { setAdding(false); void load(); }} />}
      {editing && <EditUserDialog key={editing.id} row={editing} roles={roles} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load(); }} />}
      {resetting && <ResetPasswordDialog key={resetting.id} row={resetting} onClose={() => setResetting(null)} />}
      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.disabled ? "Enable this user?" : "Disable this user?"}
        message={
          toggling?.disabled
            ? <><strong>{toggling?.name}</strong> will be able to sign in again.</>
            : <><strong>{toggling?.name}</strong> will be signed out everywhere and will not be able to sign in. Their work stays in place, and you can enable them again later.</>
        }
        confirmLabel={toggling?.disabled ? "Enable" : "Disable user"}
        tone={toggling?.disabled ? "primary" : "danger"}
        busy={busy}
        onConfirm={toggle}
        onCancel={() => setToggling(null)}
      />
    </>
  );
}

// ------------------------------------------------------------------ add
function AddUserDialog({ roles, onClose, onDone }: { roles: RoleInfo[]; onClose: () => void; onDone: () => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => ({ name: "", username: "", email: "", role: "editor" as Role, password: suggestPassword() }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/admin/users", { body: f });
      toast(`${f.name} added. Share the temporary password with them; they will choose their own at first sign-in.`);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the user.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-user" busy={busy}>Add user</Button>
        </>
      }
    >
      <form id="add-user" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Full name" htmlFor="u-name" required>
          <Input id="u-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" htmlFor="u-username" required hint="Letters, numbers, dot, dash or underscore.">
            <Input id="u-username" value={f.username} autoCapitalize="none" spellCheck={false}
              onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") })} />
          </Field>
          <Field label="Email" htmlFor="u-email" hint="Used for enquiry assignment emails.">
            <Input id="u-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
        </div>
        <RolePicker roles={roles} value={f.role} onChange={(role) => setF({ ...f, role })} />
        <Field label="Temporary password" htmlFor="u-pass" required hint="They will be asked to choose their own password when they first sign in.">
          <div className="flex gap-2">
            <Input id="u-pass" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="font-mono" />
            <Button tone="secondary" type="button" onClick={() => setF({ ...f, password: suggestPassword() })}>New</Button>
          </div>
        </Field>
        {error && <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
      </form>
    </Dialog>
  );
}

function RolePicker({ roles, value, onChange, disabled }: { roles: RoleInfo[]; value: Role; onChange: (r: Role) => void; disabled?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1.5 text-[13px] font-medium text-[#344054]">Role</legend>
      {roles.map((r) => (
        <label key={r.id} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${value === r.id ? "border-[#1a2d59] bg-[#eff4ff]" : "border-[#d0d5dd]"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
          <input type="radio" name="role" value={r.id} checked={value === r.id} onChange={() => onChange(r.id)} className="mt-0.5 accent-[#1a2d59]" />
          <span>
            <span className="block text-[14px] font-medium">{r.label}</span>
            {r.blurb && <span className="block text-[12px] text-[#667085]">{r.blurb}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// ------------------------------------------------------------------ edit
function EditUserDialog({ row, roles, onClose, onDone }: { row: Row; roles: RoleInfo[]; onClose: () => void; onDone: () => void }) {
  const { api, toast, user: me } = useAdmin();
  const [f, setF] = useState({ name: row.name, email: row.email, role: row.role });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ activity: Activity[] }>(`/api/admin/users/${row.id}`).then((d) => setActivity(d.activity)).catch(() => {});
  }, [row.id, api]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(`/api/admin/users/${row.id}`, { method: "PATCH", body: f });
      toast("Saved");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const self = row.id === me.id;
  return (
    <Dialog
      open
      title={`Edit ${row.name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-user" busy={busy}>Save changes</Button>
        </>
      }
    >
      {(
        <div className="grid gap-6 md:grid-cols-[1fr_240px]">
          <form id="edit-user" onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label="Username" htmlFor="e-username" hint="Usernames cannot be changed.">
              <Input id="e-username" value={row.username} disabled className="font-mono" />
            </Field>
            <Field label="Full name" htmlFor="e-name" required>
              <Input id="e-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="e-email">
              <Input id="e-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Field>
            <RolePicker roles={roles} value={f.role} onChange={(role) => setF({ ...f, role })} disabled={self} />
            {self && <p className="text-[12px] text-[#667085]">You cannot change your own role.</p>}
            {error && <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
          </form>
          <div>
            <p className="mb-2 text-[13px] font-medium text-[#344054]">History</p>
            <ul className="flex flex-col gap-2 text-[12px]">
              <li className="text-[#667085]">Created {fmtDate(row.created_at)}</li>
              {activity.map((a, i) => (
                <li key={i} className="border-l-2 border-[#eaecf0] pl-2">
                  <span className="block text-[#344054]">{ACTIONS[a.action] ?? a.action.replace(/_/g, " ")}{a.entity !== "user" ? ` (${a.entity})` : ""}</span>
                  <span className="text-[#98a2b3]">{fmtDate(a.created_at)}{a.by_name ? ` · ${a.by_name}` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ reset password
function ResetPasswordDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const { api, toast } = useAdmin();
  const [password, setPassword] = useState(suggestPassword);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/users/${row.id}/password`, { body: { password } });
      toast(`Password reset. ${row.name} has been signed out and must choose a new password at next sign-in.`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title={`Reset password for ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="reset-pass" busy={busy}>Reset password</Button>
        </>
      }
    >
      <form id="reset-pass" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <p className="text-[14px] text-[#475467]">
          This signs {row.name} out everywhere. Give them the temporary password below; they will be asked to choose their own when they sign in.
        </p>
        <Field label="Temporary password" htmlFor="r-pass" required>
          <div className="flex gap-2">
            <Input id="r-pass" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
            <Button tone="secondary" type="button" onClick={() => setPassword(suggestPassword())}>New</Button>
          </div>
        </Field>
        {error && <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{error}</p>}
      </form>
    </Dialog>
  );
}
