"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ENQUIRY_STATUSES, FORM_LABEL, STATUS_LABEL, type EnquiryForm, type EnquiryStatus } from "@/lib/enquiry-options";
import { useAdmin } from "../AdminProvider";
import { Button, Card, Empty, fmtDate, Input, PageHeader, Pagination, SearchBox, Select, Table, Toolbar } from "../ui";
import { FormLabel, linkButton, StatusBadge, statusDot } from "./shared";

type Row = {
  id: number; form: EnquiryForm; status: EnquiryStatus; name: string; phone: string; email: string; child_name: string;
  grade: string; created_at: string; read_at: string | null; assigned_to: number | null; assigned_name: string | null; campus_name: string | null;
};
type ListRes = {
  rows: Row[]; total: number; page: number; pageSize: number;
  counts: Partial<Record<EnquiryStatus, { total: number; unread: number }>>;
  campuses: { id: number; name: string; active: boolean }[];
  staff: { id: number; name: string }[];
  grades: string[];
};

const FILTER_KEYS = ["search", "form", "campus", "grade", "status", "assigned", "from", "to", "unread"] as const;
type Filters = Record<(typeof FILTER_KEYS)[number], string>;

function filtersFrom(sp: URLSearchParams): Filters {
  const f = {} as Filters;
  for (const k of FILTER_KEYS) f[k] = sp.get(k) ?? "";
  return f;
}

export default function EnquiriesScreen() {
  const { api, toast } = useAdmin();
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => filtersFrom(new URLSearchParams(sp.toString())));
  const [page, setPage] = useState(() => Math.max(1, Number(sp.get("page")) || 1));
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) if (filters[k]) p.set(k, filters[k]);
    return p;
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams(query);
    if (page > 1) p.set("page", String(page));
    // Keep the filter in the address bar so "back" from an enquiry returns to the same list.
    window.history.replaceState(null, "", p.size ? `?${p}` : window.location.pathname);
    try {
      setData(await api<ListRes>(`/api/admin/enquiries?${p}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, query, page]);

  useEffect(() => {
    const t = setTimeout(load, filters.search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, filters.search]);

  const set = (k: keyof Filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };
  const filtered = FILTER_KEYS.some((k) => k !== "status" && filters[k]);
  const clear = () => {
    setFilters((f) => ({ ...filtersFrom(new URLSearchParams()), status: f.status }));
    setPage(1);
  };

  const counts = data?.counts ?? {};
  const all = ENQUIRY_STATUSES.reduce((n, s) => n + (counts[s]?.total ?? 0), 0);
  const allUnread = ENQUIRY_STATUSES.reduce((n, s) => n + (counts[s]?.unread ?? 0), 0);
  const tabs: { id: string; label: string; n: number; unread: number }[] = [
    { id: "", label: "All", n: all, unread: allUnread },
    ...ENQUIRY_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s], n: counts[s]?.total ?? 0, unread: counts[s]?.unread ?? 0 })),
  ];

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Admission enquiries, campus visit requests and contact messages from the website."
        actions={
          <a href={`/api/admin/enquiries/export?${query}`} className={linkButton} download>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3v12M7 10l5 5 5-5M4 19h16" /></svg>
            Export CSV
          </a>
        }
      />

      <div role="tablist" aria-label="Filter by status" className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => {
          const on = filters.status === t.id;
          return (
            <button
              key={t.id || "all"}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => set("status", t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                on ? "border-[#1a2d59] bg-[#1a2d59] text-white" : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f2f4f7]"
              }`}
            >
              {t.id && <span aria-hidden className={`size-2 rounded-full ${statusDot[t.id as EnquiryStatus]} ${on ? "ring-2 ring-white/70" : ""}`} />}
              {t.label}
              <span className={`rounded-full px-1.5 text-[12px] ${on ? "bg-white/20" : "bg-[#f2f4f7] text-[#475467]"}`}>{t.n}</span>
              {t.unread > 0 && <span className={`text-[11px] ${on ? "text-white/80" : "text-[#d31245]"}`}>{t.unread} unread</span>}
            </button>
          );
        })}
      </div>

      <Card>
        <Toolbar>
          <SearchBox value={filters.search} onChange={(v) => set("search", v)} placeholder="Search name, phone, email or child" />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select value={filters.form} onChange={(e) => set("form", e.target.value)} aria-label="Filter by form" className="sm:w-44">
              <option value="">All forms</option>
              {(Object.keys(FORM_LABEL) as EnquiryForm[]).map((f) => <option key={f} value={f}>{FORM_LABEL[f]}</option>)}
            </Select>
            {data && data.campuses.length > 1 && (
              <Select value={filters.campus} onChange={(e) => set("campus", e.target.value)} aria-label="Filter by campus" className="sm:w-44">
                <option value="">All campuses</option>
                {data.campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="none">No campus</option>
              </Select>
            )}
            <Select value={filters.grade} onChange={(e) => set("grade", e.target.value)} aria-label="Filter by grade" className="sm:w-36">
              <option value="">All grades</option>
              {(data?.grades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
              <option value="none">No grade given</option>
            </Select>
            <Select value={filters.assigned} onChange={(e) => set("assigned", e.target.value)} aria-label="Filter by assigned staff" className="sm:w-44">
              <option value="">Anyone</option>
              <option value="none">Unassigned</option>
              {(data?.staff ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[13px] text-[#475467]">
              From
              <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} className="w-[150px]" aria-label="Received from" />
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-[#475467]">
              to
              <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} className="w-[150px]" aria-label="Received to" />
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#475467]">
              <input type="checkbox" checked={filters.unread === "1"} onChange={(e) => set("unread", e.target.checked ? "1" : "")} className="size-4 accent-[#1a2d59]" />
              Unread only
            </label>
            {filtered && <Button tone="ghost" size="sm" onClick={clear}>Clear filters</Button>}
          </div>
        </Toolbar>

        {loading && !data ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : data && data.rows.length === 0 ? (
          filtered || filters.status ? (
            <Empty title="No enquiries match">Try a different search or filter.</Empty>
          ) : (
            <Empty title="No enquiries yet">Submissions from the Enquire Now and Contact Us forms will appear here.</Empty>
          )
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            <Table
              head={
                <>
                  <th>Received</th>
                  <th>Name</th>
                  <th>Form</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                </>
              }
            >
              {data?.rows.map((r) => {
                const unread = !r.read_at;
                const href = `/admin/enquiries/${r.id}`;
                return (
                  <tr
                    key={r.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) return;
                      router.push(href);
                    }}
                    className={`cursor-pointer hover:bg-[#f9fafb] ${unread ? "bg-[#f8faff]" : ""}`}
                  >
                    <td className={`whitespace-nowrap text-[13px] ${unread ? "font-semibold text-[#101828]" : "text-[#475467]"}`}>
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="min-w-[200px]">
                      <Link href={href} className={`flex items-center gap-2 hover:underline ${unread ? "font-semibold text-[#101828]" : "text-[#1d2939]"}`}>
                        {unread && <span className="size-2 shrink-0 rounded-full bg-[#d31245]" aria-label="Unread" />}
                        {r.name}
                      </Link>
                      <div className="text-[12px] text-[#667085]">
                        {r.phone}
                        {r.child_name ? ` · child: ${r.child_name}` : ""}
                      </div>
                    </td>
                    <td><FormLabel form={r.form} /></td>
                    <td className="whitespace-nowrap text-[13px]">{r.grade || <span className="text-[#98a2b3]">—</span>}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="whitespace-nowrap text-[13px]">{r.assigned_name ?? <span className="text-[#98a2b3]">Unassigned</span>}</td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
