"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { Badge, Button, Card, ConfirmDialog, Empty, fmtDate, PageHeader, Pagination, SearchBox, Select, Table, Toolbar } from "../ui";
import { linkButton } from "../enquiries/shared";

type Row = { id: number; email: string; name: string; status: "subscribed" | "unsubscribed"; source_page: string; created_at: string; unsubscribed_at: string | null };
type ListRes = { rows: Row[]; total: number; page: number; pageSize: number; counts: Partial<Record<Row["status"], number>> };

export default function SubscribersScreen() {
  const { api, toast } = useAdmin();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ search, status, page: String(page) });
    try {
      setData(await api<ListRes>(`/api/admin/subscribers?${p}`));
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

  const toggle = async (r: Row) => {
    setBusyId(r.id);
    const next = r.status === "subscribed" ? "unsubscribed" : "subscribed";
    try {
      await api(`/api/admin/subscribers/${r.id}`, { method: "PATCH", body: { status: next } });
      toast(next === "subscribed" ? `${r.email} subscribed again` : `${r.email} unsubscribed`);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await api(`/api/admin/subscribers/${deleting.id}`, { method: "DELETE" });
      toast(`${deleting.email} deleted`);
      setDeleting(null);
      void load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const exportQuery = new URLSearchParams({ ...(search ? { search } : {}), ...(status ? { status } : {}) });
  const subscribed = data?.counts.subscribed ?? 0;
  const unsubscribed = data?.counts.unsubscribed ?? 0;

  return (
    <>
      <PageHeader
        title="Subscribers"
        description={
          data ? `${subscribed} subscribed${unsubscribed ? `, ${unsubscribed} unsubscribed` : ""}. People who signed up with the newsletter form in the site footer.` : "People who signed up with the newsletter form in the site footer."
        }
        actions={
          <a href={`/api/admin/subscribers/export?${exportQuery}`} className={linkButton} download>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3v12M7 10l5 5 5-5M4 19h16" /></svg>
            Export CSV
          </a>
        }
      />

      <Card>
        <Toolbar>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search email" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="sm:w-48">
            <option value="">Any status</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </Select>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          search || status ? <Empty title="No subscribers match">Try a different search or filter.</Empty> : <Empty title="No subscribers yet">Sign-ups from the footer newsletter form will appear here.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Email</th>
                <th>Signed up</th>
                <th>Status</th>
                <th>Page</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {data?.rows.map((r) => (
              <tr key={r.id} className={r.status === "unsubscribed" ? "text-[#98a2b3]" : ""}>
                <td className="font-medium">
                  <a href={`mailto:${r.email}`} className={`hover:underline ${r.status === "unsubscribed" ? "" : "text-[#101828]"}`}>{r.email}</a>
                  {r.name && <div className="text-[12px] font-normal text-[#667085]">{r.name}</div>}
                </td>
                <td className="whitespace-nowrap text-[13px]">{fmtDate(r.created_at)}</td>
                <td>
                  {r.status === "subscribed" ? (
                    <Badge tone="green">Subscribed</Badge>
                  ) : (
                    <span title={r.unsubscribed_at ? `Unsubscribed ${fmtDate(r.unsubscribed_at)}` : undefined}><Badge tone="gray">Unsubscribed</Badge></span>
                  )}
                </td>
                <td className="text-[13px]">{r.source_page || "—"}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button tone="ghost" size="sm" busy={busyId === r.id && !deleting} onClick={() => toggle(r)}>
                      {r.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
                    </Button>
                    <Button tone="ghost" size="sm" className="text-[#b42318]" onClick={() => setDeleting(r)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this subscriber?"
        message={<><strong>{deleting?.email}</strong> will be removed from the list completely. To keep a record that they opted out, unsubscribe them instead.</>}
        confirmLabel="Delete"
        busy={Boolean(deleting) && busyId === deleting?.id}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
